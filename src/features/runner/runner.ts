import { resultsMatch } from './core/compare';
import { SOLVE_LANGUAGE_MAP } from './core/languages';
import type { CaseResult, RawCaseOutput, RunRequest, RunResult } from './core/types';
import { runRemote } from './remote';
import { sandbox } from './sandbox/client';

export interface RunOptions {
  /** Piston 서버 주소 (Java/C++) */
  runnerUrl: string;
  onStatus?: (message: string) => void;
  /** 케이스 하나가 끝날 때마다 */
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

function buildCases(
  req: RunRequest,
  outputs: Map<number, RawCaseOutput>,
  extra: { timeoutIndex?: number | null; crashed?: { index: number; message: string; timeout: boolean; stdout: string } },
): CaseResult[] {
  return req.tests.map((t, index) => {
    const base = { index, input: t.input, expected: t.output, hidden: index >= req.visibleCount };
    const o = outputs.get(index);
    if (o) {
      if (!o.ok) {
        return { ...base, status: 'error', error: String(o.value), stdout: o.stdout, timeMs: o.timeMs };
      }
      const tooSlow = o.timeMs > req.timeLimitMs;
      const pass = resultsMatch(t.output, o.value, req.compare);
      return {
        ...base,
        status: tooSlow ? 'timeout' : pass ? 'pass' : 'fail',
        actual: o.value,
        stdout: o.stdout,
        timeMs: o.timeMs,
        error: tooSlow ? `제한 시간(${req.timeLimitMs / 1000}초)을 초과했습니다.` : undefined,
      };
    }
    if (extra.timeoutIndex === index) {
      return { ...base, status: 'timeout', stdout: '', error: `제한 시간(${req.timeLimitMs / 1000}초)을 초과했습니다. 무한 루프나 비효율적인 반복이 없는지 확인해주세요.` };
    }
    if (extra.crashed?.index === index) {
      return {
        ...base,
        status: extra.crashed.timeout ? 'timeout' : 'error',
        stdout: extra.crashed.stdout,
        error: extra.crashed.message,
      };
    }
    return { ...base, status: 'skipped', stdout: '', error: '이전 케이스에서 실행이 중단되어 채점하지 않았습니다.' };
  });
}

/** 사용자 코드를 채점한다. */
export async function runSolution(req: RunRequest, opts: RunOptions): Promise<RunResult> {
  const started = Date.now();
  const info = SOLVE_LANGUAGE_MAP[req.language];

  if (!info.local) {
    if (!opts.runnerUrl) {
      return {
        status: 'unavailable',
        message: `${info.label} 코드는 원격 실행 서버가 필요해요. 마이 › 설정에서 실행 서버 주소를 입력하면 바로 채점할 수 있어요.`,
        cases: [],
        elapsedMs: 0,
      };
    }
    opts.onStatus?.(`${info.label} 코드를 서버에서 컴파일하고 실행하는 중…`);
    const outcome = await runRemote(req, opts.runnerUrl, opts.signal);
    if (opts.signal?.aborted) return { status: 'cancelled', cases: [], elapsedMs: Date.now() - started };
    if (outcome.kind === 'compile-error') {
      return { status: 'compile-error', message: outcome.message, cases: [], elapsedMs: Date.now() - started };
    }
    if (outcome.kind === 'error') {
      return { status: 'internal-error', message: outcome.message, cases: [], elapsedMs: Date.now() - started };
    }
    const outputs = new Map(outcome.outputs.map((o) => [o.index, o]));
    return {
      status: 'ok',
      cases: buildCases(req, outputs, { crashed: outcome.crashed }),
      elapsedMs: Date.now() - started,
    };
  }

  const outputs = new Map<number, RawCaseOutput>();
  let compileError: string | null = null;
  let compileStdout = '';
  let timeoutIndex: number | null = null;

  const handle = sandbox.run(
    {
      language: req.language,
      code: req.code,
      tests: req.tests.map((t) => t.input),
      timeLimitMs: req.timeLimitMs,
    },
    (e) => {
      switch (e.type) {
        case 'status':
          opts.onStatus?.(e.message);
          break;
        case 'started':
          opts.onStatus?.('채점 중…');
          break;
        case 'case':
          outputs.set(e.index, { index: e.index, ok: e.ok, value: e.value, stdout: e.stdout, timeMs: e.timeMs });
          opts.onProgress?.(outputs.size, req.tests.length);
          break;
        case 'timeout':
          timeoutIndex = e.index;
          break;
        case 'compile-error':
          compileError = e.message;
          compileStdout = e.stdout ?? '';
          break;
      }
    },
  );
  opts.signal?.addEventListener('abort', handle.cancel);
  await handle.done;
  if (opts.signal?.aborted) return { status: 'cancelled', cases: [], elapsedMs: Date.now() - started };

  if (compileError !== null) {
    const message = compileStdout ? `${compileError}\n\n[출력]\n${compileStdout}` : compileError;
    return { status: 'compile-error', message, cases: [], elapsedMs: Date.now() - started };
  }
  return {
    status: 'ok',
    cases: buildCases(req, outputs, { timeoutIndex }),
    elapsedMs: Date.now() - started,
  };
}

export function summarize(result: RunResult): { passed: number; total: number; allPassed: boolean } {
  const total = result.cases.length;
  const passed = result.cases.filter((c) => c.status === 'pass').length;
  return { passed, total, allPassed: total > 0 && passed === total };
}
