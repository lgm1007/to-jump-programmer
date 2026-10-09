/**
 * 컴파일 언어(Java/C++) 하네스의 표준 출력 프로토콜.
 *
 *   @@TJ:BEGIN:<i>\n
 *   ...사용자 출력...
 *   \n@@TJ:END:<i>:<OK|ERR>:<ms>:<json>\n
 *
 * OK 이면 json 은 반환값, ERR 이면 에러 메시지 문자열(JSON 문자열).
 */
import type { RawCaseOutput } from './types';

export const MARK_BEGIN = '@@TJ:BEGIN:';
export const MARK_END = '@@TJ:END:';

const BEGIN_RE = /@@TJ:BEGIN:(\d+)\r?\n/g;
const END_RE = /@@TJ:END:(\d+):(OK|ERR):([\d.]+):(.*)/g;

/**
 * stdout 을 파싱해 케이스별 원시 결과를 만든다.
 * 프로세스가 중간에 죽은 경우 END 가 없는 케이스는 결과에 포함되지 않는다.
 * 마지막 BEGIN 이후 END 가 없으면 crashedIndex 로 알려준다.
 */
export function parseHarnessOutput(stdout: string): {
  outputs: RawCaseOutput[];
  crashedIndex: number | null;
  crashedStdout: string;
} {
  const outputs: RawCaseOutput[] = [];
  const begins: { index: number; start: number; contentStart: number }[] = [];
  BEGIN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BEGIN_RE.exec(stdout))) {
    begins.push({ index: Number(m[1]), start: m.index, contentStart: m.index + m[0].length });
  }
  const ends: { index: number; start: number; ok: boolean; ms: number; payload: string }[] = [];
  END_RE.lastIndex = 0;
  while ((m = END_RE.exec(stdout))) {
    ends.push({
      index: Number(m[1]),
      start: m.index,
      ok: m[2] === 'OK',
      ms: Number(m[3]),
      payload: m[4].replace(/\r$/, ''),
    });
  }

  const endByIndex = new Map(ends.map((e) => [e.index, e]));
  let crashedIndex: number | null = null;
  let crashedStdout = '';

  for (const b of begins) {
    const e = endByIndex.get(b.index);
    if (!e) {
      crashedIndex = b.index;
      crashedStdout = stdout.slice(b.contentStart).trim();
      continue;
    }
    let userOut = stdout.slice(b.contentStart, e.start);
    // 하네스가 END 앞에 붙이는 개행 1개 제거
    userOut = userOut.replace(/\r?\n$/, '');
    let value: unknown;
    try {
      value = JSON.parse(e.payload);
    } catch {
      value = e.ok ? e.payload : String(e.payload);
    }
    outputs.push({ index: b.index, ok: e.ok, value, stdout: userOut, timeMs: e.ms });
  }
  return { outputs, crashedIndex, crashedStdout };
}

/** JSON 문자열 이스케이프 (하네스와 동일한 규칙의 참조 구현) */
export function jsonEscape(s: string): string {
  return JSON.stringify(s);
}
