/**
 * Piston 호환 원격 실행 서버 클라이언트 (Java / Kotlin / C++).
 * https://github.com/engineer-man/piston — infra/runner 의 docker-compose 로 직접 호스팅할 수 있다.
 */
import type { Signature, SolveLanguage, TestCase } from '@/content/types';

import type { RawCaseOutput, RunRequest } from './core/types';
import { buildCppProgram, CPP_FILE_NAME, mapCppErrors } from './core/cpp-harness';
import { buildJavaProgram, JAVA_FILE_NAME, mapJavaErrors, type GeneratedProgram } from './core/java-harness';
import { buildKotlinProgram, KOTLIN_FILE_NAME, mapKotlinErrors } from './core/kotlin-harness';
import { SOLVE_LANGUAGE_MAP } from './core/languages';
import { parseHarnessOutput } from './core/protocol';

interface PistonStage {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  output: string;
}

interface PistonResponse {
  language?: string;
  version?: string;
  run?: PistonStage;
  compile?: PistonStage;
  message?: string;
}

export type RemoteOutcome =
  | { kind: 'compile-error'; message: string }
  | { kind: 'error'; message: string }
  | {
      kind: 'ok';
      outputs: RawCaseOutput[];
      /** 프로세스가 비정상 종료된 케이스 */
      crashed?: { index: number; message: string; timeout: boolean; stdout: string };
    };

type RemoteLanguage = Extract<SolveLanguage, 'java' | 'kotlin' | 'cpp'>;

interface RemoteSpec {
  fileName: string;
  /** 사용자 코드에 있으면 안 되는 진입점 */
  mainPattern: RegExp;
  mainMessage: string;
  build: (code: string, sig: Signature, tests: TestCase[]) => GeneratedProgram;
  mapErrors: (text: string, offset: number, userLines: number) => string;
  /** 응답 대기 시간 — 컴파일이 느린 언어는 길게 */
  timeoutMs: number;
}

const REMOTE: Record<RemoteLanguage, RemoteSpec> = {
  java: {
    fileName: JAVA_FILE_NAME,
    mainPattern: /static\s+void\s+main\s*\(/,
    mainMessage: 'main 메서드 없이 Solution 클래스의 solution 메서드만 작성해주세요.',
    build: buildJavaProgram,
    mapErrors: (text, offset) => mapJavaErrors(text, offset),
    timeoutMs: 60_000,
  },
  kotlin: {
    fileName: KOTLIN_FILE_NAME,
    mainPattern: /^\s*fun\s+main\s*\(/m,
    mainMessage: 'main 함수 없이 Solution 클래스의 solution 함수만 작성해주세요.',
    build: buildKotlinProgram,
    mapErrors: (text, offset) => mapKotlinErrors(text, offset),
    // kotlinc 는 JVM 을 띄워 컴파일하므로 Java · C++ 보다 오래 걸린다
    timeoutMs: 90_000,
  },
  cpp: {
    fileName: CPP_FILE_NAME,
    mainPattern: /\bint\s+main\s*\(/,
    mainMessage: 'main 함수 없이 solution 함수만 작성해주세요.',
    build: buildCppProgram,
    mapErrors: mapCppErrors,
    timeoutMs: 60_000,
  },
};

export async function runRemote(req: RunRequest, baseUrl: string, signal?: AbortSignal): Promise<RemoteOutcome> {
  if (!(req.language in REMOTE)) return { kind: 'error', message: `${req.language} 는 원격 실행을 지원하지 않습니다.` };
  const spec = REMOTE[req.language as RemoteLanguage];
  const userCode = req.code;
  if (spec.mainPattern.test(userCode)) return { kind: 'compile-error', message: spec.mainMessage };
  if (req.language === 'kotlin' && !/\bclass\s+Solution\b/.test(userCode)) {
    return { kind: 'compile-error', message: 'Solution 클래스 안에 solution 함수를 작성해주세요. (시작 코드의 class Solution { … } 형태)' };
  }
  const program = spec.build(userCode, req.signature, req.tests);
  const userLines = userCode.split('\n').length;
  const mapErrors = (text: string) => spec.mapErrors(text, program.offset, userLines);

  const url = `${baseUrl.replace(/\/+$/, '')}/api/v2/execute`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), spec.timeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  let data: PistonResponse;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: SOLVE_LANGUAGE_MAP[req.language].piston,
        version: '*',
        files: [{ name: spec.fileName, content: program.source }],
        stdin: '',
      }),
      signal: controller.signal,
    });
    data = (await res.json()) as PistonResponse;
    if (!res.ok) {
      // Piston 은 설치되지 않은 언어를 400 "<언어>-<버전> runtime is unknown" 으로 거절한다 (예: Kotlin 추가 전에 띄운 서버)
      if (/runtime is unknown/i.test(data.message ?? '')) {
        return {
          kind: 'error',
          message: `이 실행 서버에는 ${SOLVE_LANGUAGE_MAP[req.language].label} 실행 환경이 없어요. 다른 언어로 풀거나, 직접 운영하는 서버라면 infra/runner/install-runtimes.sh 를 다시 실행해주세요.`,
        };
      }
      return { kind: 'error', message: `실행 서버 오류 (${res.status}): ${data.message ?? '알 수 없는 오류'}` };
    }
  } catch (e) {
    const aborted = (e as Error)?.name === 'AbortError';
    return {
      kind: 'error',
      message: aborted
        ? '실행 서버 응답 시간이 초과되었습니다.'
        : `실행 서버에 연결할 수 없습니다. 설정의 서버 주소를 확인해주세요.\n(${String((e as Error)?.message ?? e)})`,
    };
  } finally {
    clearTimeout(timer);
  }

  if (data.message && !data.run) return { kind: 'error', message: `실행 서버 오류: ${data.message}` };
  if (data.compile && data.compile.code !== 0) {
    if (data.compile.signal === 'SIGKILL') {
      return { kind: 'error', message: '컴파일 시간이 초과되었습니다. 실행 서버가 바쁠 수 있으니 잠시 후 다시 시도해주세요.' };
    }
    return { kind: 'compile-error', message: mapErrors(data.compile.stderr || data.compile.output || '컴파일 실패').trim() };
  }
  const run = data.run;
  if (!run) return { kind: 'error', message: '실행 결과가 비어 있습니다.' };

  const parsed = parseHarnessOutput(run.stdout ?? '');
  // Java 단일 파일 실행은 컴파일 에러도 run 단계에서 발생한다
  if (parsed.outputs.length === 0 && parsed.crashedIndex === null && run.code !== 0) {
    const text = mapErrors(run.stderr || run.output || '');
    if (/error:|error\b/i.test(text)) return { kind: 'compile-error', message: text.trim() };
    return { kind: 'error', message: text.trim() || `실행 실패 (종료 코드 ${run.code})` };
  }
  let crashed: { index: number; message: string; timeout: boolean; stdout: string } | undefined;
  if (parsed.crashedIndex !== null) {
    const timeout = run.signal === 'SIGKILL';
    const stderr = mapErrors(run.stderr ?? '').trim();
    crashed = {
      index: parsed.crashedIndex,
      timeout,
      stdout: parsed.crashedStdout,
      message: timeout
        ? '시간 초과 또는 메모리 초과로 실행이 중단되었습니다.'
        : `런타임 에러로 프로그램이 종료되었습니다${run.signal ? ` (${run.signal})` : ''}.${stderr ? `\n${stderr}` : ''}`,
    };
  }
  return { kind: 'ok', outputs: parsed.outputs, crashed };
}

/** 서버 연결 확인 (설정 화면) */
export async function pingRemote(baseUrl: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/v2/runtimes`);
    if (!res.ok) return { ok: false, message: `응답 코드 ${res.status}` };
    const runtimes = (await res.json()) as { language: string; version: string; aliases: string[] }[];
    const has = (name: string) => runtimes.some((r) => r.language === name || r.aliases?.includes(name));
    const found = [
      { label: 'Java', pkg: 'java', ok: has('java') },
      { label: 'Kotlin', pkg: 'kotlin', ok: has('kotlin') },
      { label: 'C++', pkg: 'gcc', ok: has('c++') || has('cpp') },
    ];
    const missing = found.filter((f) => !f.ok);
    if (!missing.length) return { ok: true, message: 'Java · Kotlin · C++ 실행 가능' };
    const installed = found.filter((f) => f.ok).map((f) => f.label);
    return {
      ok: installed.length > 0,
      message: `설치된 런타임: ${installed.join(', ') || '없음'} (${missing.map((f) => f.pkg).join(', ')} 패키지를 설치하세요)`,
    };
  } catch (e) {
    return { ok: false, message: `연결 실패: ${String((e as Error)?.message ?? e)}` };
  }
}
