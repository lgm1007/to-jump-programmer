/**
 * Kotlin 채점 하네스 생성기.
 *
 * Piston 의 kotlin 패키지(1.8.20, JDK 8)는 보낸 파일 이름에 .kt 를 붙여 `kotlinc *.kt -include-runtime -d code.jar`
 * 로 컴파일하고 `java -jar code.jar` 로 실행한다. jar 의 진입점은 최상위 main 함수 하나로 정해진다.
 *   [import 문] → [object TjHarness { 하네스 } + fun main()] → [사용자 코드(import·package 줄은 빈 줄로 대체)]
 * 사용자 코드의 줄 번호를 보존해 에러 메시지의 줄 번호를 되돌려 계산한다.
 *
 * Piston 과 같은 Kotlin 1.8 · JDK 8 에서 동작해야 하므로 하네스 코드는 그 범위의 문법·API 만 쓴다.
 * (생성 코드에 `$` 를 쓰지 않는다 — Kotlin 문자열 템플릿과 섞이지 않게)
 */
import type { Signature, TestCase, ValueType } from '@/content/types';

import type { GeneratedProgram } from './java-harness';
import { KOTLIN_TYPE } from './languages';
import { MARK_BEGIN, MARK_END } from './protocol';

const IMPORT_LINE = /^\s*((import\s+[\w.]+(\.\*)?(\s+as\s+\w+)?\s*;?\s*)+)(\/\/.*|\/\*.*\*\/\s*)?$/;
const PACKAGE_LINE = /^\s*package\s+[\w.]+\s*;?\s*$/;

/** Piston 에 보내는 파일 이름 (Piston 이 .kt 를 붙인다) */
export const KOTLIN_FILE_NAME = 'Main';

function kotlinString(s: string): string {
  let out = '"';
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (ch === '$') out += '\\$';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (code < 0x20 || code > 0x7e) {
      // Kotlin 은 Java 와 달리 \uXXXX 를 미리 해석하지 않으므로 줄 종결 문자도 그대로 이스케이프할 수 있다
      for (let i = 0; i < ch.length; i++) out += `\\u${ch.charCodeAt(i).toString(16).padStart(4, '0')}`;
    } else out += ch;
  }
  return `${out}"`;
}

function kotlinInt(v: unknown): string {
  const n = Math.trunc(Number(v));
  // 2147483648 은 Int 범위를 넘는 리터럴이라 단항 마이너스를 붙여도 Long 이 된다
  return n === -2147483648 ? 'Int.MIN_VALUE' : String(n);
}

function kotlinLong(v: unknown): string {
  const n = BigInt(Math.trunc(Number(v)));
  return n === -9223372036854775808n ? 'Long.MIN_VALUE' : `${n.toString()}L`;
}

function kotlinDouble(v: unknown): string {
  const s = String(Number(v));
  if (s === 'Infinity') return 'Double.POSITIVE_INFINITY';
  if (s === '-Infinity') return 'Double.NEGATIVE_INFINITY';
  if (s === 'NaN') return 'Double.NaN';
  return /[.eE]/.test(s) ? s : `${s}.0`;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

const strings = (v: unknown) => `arrayOf<String>(${arr(v).map((x) => kotlinString(String(x))).join(', ')})`;

export function kotlinLiteral(v: unknown, t: ValueType): string {
  switch (t) {
    case 'int':
      return kotlinInt(v);
    case 'long':
      return kotlinLong(v);
    case 'double':
      return kotlinDouble(v);
    case 'bool':
      return v ? 'true' : 'false';
    case 'string':
      return kotlinString(String(v));
    case 'int[]':
      return `intArrayOf(${arr(v).map(kotlinInt).join(', ')})`;
    case 'long[]':
      return `longArrayOf(${arr(v).map(kotlinLong).join(', ')})`;
    case 'double[]':
      return `doubleArrayOf(${arr(v).map(kotlinDouble).join(', ')})`;
    case 'bool[]':
      return `booleanArrayOf(${arr(v).map((x) => (x ? 'true' : 'false')).join(', ')})`;
    case 'string[]':
      return strings(v);
    case 'int[][]':
      return `arrayOf<IntArray>(${arr(v).map((row) => `intArrayOf(${arr(row).map(kotlinInt).join(', ')})`).join(', ')})`;
    case 'string[][]':
      return `arrayOf<Array<String>>(${arr(v).map(strings).join(', ')})`;
  }
}

const HELPERS = String.raw`
    fun esc(s: String): String {
        val sb = StringBuilder("\"")
        for (c in s) {
            when (c) {
                '"' -> sb.append("\\\"")
                '\\' -> sb.append("\\\\")
                '\n' -> sb.append("\\n")
                '\r' -> sb.append("\\r")
                '\t' -> sb.append("\\t")
                else -> if (c < ' ') sb.append(String.format("\\u%04x", c.code)) else sb.append(c)
            }
        }
        return sb.append('"').toString()
    }

    fun ser(v: Any?): String = when (v) {
        null -> "null"
        is String -> esc(v)
        is Char -> esc(v.toString())
        is Boolean -> v.toString()
        is Double -> if (v.isNaN() || v.isInfinite()) "null" else v.toString()
        is Float -> ser(v.toDouble())
        is Number -> v.toString()
        is IntArray -> v.joinToString(",", "[", "]")
        is LongArray -> v.joinToString(",", "[", "]")
        is DoubleArray -> v.joinToString(",", "[", "]") { ser(it) }
        is BooleanArray -> v.joinToString(",", "[", "]")
        is CharArray -> esc(String(v))
        is Array<*> -> v.joinToString(",", "[", "]") { ser(it) }
        is Iterable<*> -> v.joinToString(",", "[", "]") { ser(it) }
        else -> esc(v.toString())
    }

    fun describe(e: Throwable): String {
        val sb = StringBuilder(e.toString())
        var shown = 0
        for (el in e.stackTrace) {
            val cls = el.className
            if (cls.startsWith("java.") || cls.startsWith("kotlin.") || cls.startsWith("jdk.") || cls.startsWith("sun.") || cls.startsWith("TjHarness")) continue
            // 하네스 코드와 인라인 함수가 만든 줄 번호(파일 길이를 넘는 값)는 보여주지 않는다
            val line = el.lineNumber - OFFSET
            if (line <= 0 || line > USER_LINES) continue
            sb.append("\n    at ").append(cls).append('.').append(el.methodName).append(" (").append(line).append("번째 줄)")
            shown++
            if (shown >= 6) break
        }
        return sb.toString()
    }
`;

export function buildKotlinProgram(userCode: string, sig: Signature, tests: TestCase[]): GeneratedProgram {
  const userLines = userCode.replace(/\r\n/g, '\n').split('\n');
  const imports: string[] = [];
  const body = userLines.map((line) => {
    if (IMPORT_LINE.test(line)) {
      imports.push(line.trim());
      return '';
    }
    if (PACKAGE_LINE.test(line)) return '';
    return line;
  });

  const cases = tests.map((t, i) => {
    const decls = sig.params.map(
      (p, j) => `        val p${j}: ${KOTLIN_TYPE[p.type]} = ${kotlinLiteral(t.input[j], p.type)}`,
    );
    const args = sig.params.map((_, j) => `p${j}`).join(', ');
    return [`    fun case${i}(): String {`, ...decls, `        return ser(Solution().solution(${args}))`, '    }'].join('\n');
  });

  const dispatch = [
    '    fun run(i: Int): String = when (i) {',
    ...tests.map((_, i) => `        ${i} -> case${i}()`),
    '        else -> throw IllegalStateException("unknown case")',
    '    }',
  ].join('\n');

  const runAll = [
    '    fun runAll() {',
    `        for (i in 0 until ${tests.length}) {`,
    `            println("${MARK_BEGIN}" + i)`,
    '            System.out.flush()',
    '            val t0 = System.nanoTime()',
    '            var payload: String',
    '            var ok: Boolean',
    '            try {',
    '                payload = run(i)',
    '                ok = true',
    '            } catch (e: Throwable) {',
    '                payload = esc(describe(e))',
    '                ok = false',
    '            }',
    '            val ms = (System.nanoTime() - t0) / 1e6',
    `            println("\\n${MARK_END}" + i + ":" + (if (ok) "OK" else "ERR") + ":" + String.format(java.util.Locale.ROOT, "%.2f", ms) + ":" + payload)`,
    '            System.out.flush()',
    '        }',
    '    }',
  ].join('\n');

  const harness = [
    'object TjHarness {',
    '    const val OFFSET = __TJ_OFFSET__',
    `    const val USER_LINES = ${userLines.length}`,
    HELPERS,
    ...cases,
    dispatch,
    runAll,
    '}',
    '',
    'fun main() {',
    '    TjHarness.runAll()',
    '}',
    '',
  ].join('\n');

  // prefix 는 개행으로 끝나므로 개행 개수 = 사용자 코드 앞의 줄 수
  const prefix = `${[...imports, ''].join('\n')}\n${harness}`;
  const offset = prefix.split('\n').length - 1;
  const source = `${prefix.replace('__TJ_OFFSET__', String(offset))}${body.join('\n')}\n`;
  return { source, offset };
}

const DIAGNOSTIC = /^(?:[^\s:]*\/)?[\w.-]+\.kt:\d+:\d+: (error|warning|info|exception):/;
const LOCATION = /(?:[^\s:]*\/)?[\w.-]+\.kt:(\d+):(\d+):/g;

/**
 * kotlinc 오류 메시지의 줄 번호를 사용자 코드 기준으로 바꾼다.
 * kotlinc 는 진단마다 "파일:줄:열: 종류: 메시지" 다음에 해당 소스 줄과 ^ 표시 줄을 출력한다. 경고 진단은 뺀다.
 */
export function mapKotlinErrors(text: string, offset: number): string {
  const groups: { kind: string | null; lines: string[] }[] = [];
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const m = DIAGNOSTIC.exec(line);
    if (m || groups.length === 0) groups.push({ kind: m?.[1] ?? null, lines: [line] });
    else groups[groups.length - 1].lines.push(line);
  }
  const kept = groups.filter((g) => g.kind !== 'warning' && g.kind !== 'info');
  const errors = kept.length && kept.some((g) => g.kind) ? kept : groups;
  let inHarness = false;
  const mapped = errors
    .map((g) => g.lines.join('\n'))
    .join('\n')
    .replace(LOCATION, (_m, n: string, col: string) => {
      const line = Number(n) - offset;
      if (line > 0) return `${line}번째 줄:${col}:`;
      inHarness = true;
      return '채점 코드:';
    })
    .trim();
  return inHarness
    ? `${mapped}\n\n채점 코드에서 난 오류는 대개 Solution 클래스나 solution 함수의 이름 · 파라미터 · 반환 타입이 문제와 다를 때 생겨요.`
    : mapped;
}
