/**
 * Piston 호환 원격 실행 서버 클라이언트 (Java / C++).
 * https://github.com/engineer-man/piston — infra/runner 의 docker-compose 로 직접 호스팅할 수 있다.
 */
import type { RawCaseOutput, RunRequest } from './core/types';
import { buildCppProgram, CPP_FILE_NAME, mapCppErrors } from './core/cpp-harness';
import { buildJavaProgram, JAVA_FILE_NAME, mapJavaErrors } from './core/java-harness';
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

export async function runRemote(req: RunRequest, baseUrl: string, signal?: AbortSignal): Promise<RemoteOutcome> {
  const isJava = req.language === 'java';
  const userCode = req.code;
  if (isJava && /static\s+void\s+main\s*\(/.test(userCode)) {
    return { kind: 'compile-error', message: 'main 메서드 없이 Solution 클래스의 solution 메서드만 작성해주세요.' };
  }
  if (!isJava && /\bint\s+main\s*\(/.test(userCode)) {
    return { kind: 'compile-error', message: 'main 함수 없이 solution 함수만 작성해주세요.' };
  }
  const program = isJava
    ? buildJavaProgram(userCode, req.signature, req.tests)
    : buildCppProgram(userCode, req.signature, req.tests);
  const userLines = userCode.split('\n').length;
  const mapErrors = (text: string) =>
    isJava ? mapJavaErrors(text, program.offset) : mapCppErrors(text, program.offset, userLines);

  const url = `${baseUrl.replace(/\/+$/, '')}/api/v2/execute`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  signal?.addEventListener('abort', () => controller.abort());

  let data: PistonResponse;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: isJava ? 'java' : 'c++',
        version: '*',
        files: [{ name: isJava ? JAVA_FILE_NAME : CPP_FILE_NAME, content: program.source }],
        stdin: '',
      }),
      signal: controller.signal,
    });
    data = (await res.json()) as PistonResponse;
    if (!res.ok) {
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
    const java = has('java');
    const cpp = has('c++') || has('cpp');
    if (java && cpp) return { ok: true, message: 'Java · C++ 실행 가능' };
    return {
      ok: java || cpp,
      message: `설치된 런타임: ${[java && 'Java', cpp && 'C++'].filter(Boolean).join(', ') || '없음'} (java, gcc 패키지를 설치하세요)`,
    };
  } catch (e) {
    return { ok: false, message: `연결 실패: ${String((e as Error)?.message ?? e)}` };
  }
}
