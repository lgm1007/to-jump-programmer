/**
 * Java 채점 하네스 생성기.
 *
 * Piston(Java 15)은 `java Main.java`(단일 소스 파일 실행)로 실행하므로
 * main 메서드를 가진 Main 클래스가 파일의 첫 번째 클래스여야 한다.
 *   [import 문] → [public class Main { 하네스 }] → [사용자 코드(import 줄은 빈 줄로 대체)]
 * 사용자 코드의 줄 번호를 보존해 에러 메시지의 줄 번호를 되돌려 계산한다.
 */
import type { Signature, TestCase, ValueType } from '@/content/types';

import { JAVA_TYPE } from './languages';
import { MARK_BEGIN, MARK_END } from './protocol';

const IMPORT_LINE = /^\s*((import\s+(static\s+)?[\w.]+(\.\*)?\s*;\s*)+)(\/\/.*|\/\*.*\*\/\s*)?$/;
const PACKAGE_LINE = /^\s*package\s+[\w.]+\s*;\s*$/;

export const JAVA_FILE_NAME = 'Main';

function javaString(s: string): string {
  let out = '"';
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (code < 0x20) out += `\\${code.toString(8).padStart(3, '0')}`;
    else if (code > 0x7e) {
      // \uXXXX 는 줄 종결 문자가 아닌 비 ASCII 에만 사용 (UTF-16 코드 유닛 단위)
      for (let i = 0; i < ch.length; i++) out += `\\u${ch.charCodeAt(i).toString(16).padStart(4, '0')}`;
    } else out += ch;
  }
  return `${out}"`;
}

function javaInt(v: unknown): string {
  const n = Number(v);
  if (n === -2147483648) return '(-2147483647-1)';
  return String(Math.trunc(n));
}

function javaLong(v: unknown): string {
  const n = Math.trunc(Number(v));
  return `${BigInt(n).toString()}L`;
}

function javaDouble(v: unknown): string {
  const s = String(Number(v));
  if (s === 'Infinity') return 'Double.POSITIVE_INFINITY';
  if (s === '-Infinity') return 'Double.NEGATIVE_INFINITY';
  if (s === 'NaN') return 'Double.NaN';
  return /[.eE]/.test(s) ? s : `${s}.0`;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

export function javaLiteral(v: unknown, t: ValueType): string {
  switch (t) {
    case 'int':
      return javaInt(v);
    case 'long':
      return javaLong(v);
    case 'double':
      return javaDouble(v);
    case 'bool':
      return v ? 'true' : 'false';
    case 'string':
      return javaString(String(v));
    case 'int[]':
      return `new int[]{${arr(v).map(javaInt).join(',')}}`;
    case 'long[]':
      return `new long[]{${arr(v).map(javaLong).join(',')}}`;
    case 'double[]':
      return `new double[]{${arr(v).map(javaDouble).join(',')}}`;
    case 'bool[]':
      return `new boolean[]{${arr(v).map((x) => (x ? 'true' : 'false')).join(',')}}`;
    case 'string[]':
      return `new String[]{${arr(v).map((x) => javaString(String(x))).join(',')}}`;
    case 'int[][]':
      return `new int[][]{${arr(v).map((row) => `{${arr(row).map(javaInt).join(',')}}`).join(',')}}`;
    case 'string[][]':
      return `new String[][]{${arr(v)
        .map((row) => `{${arr(row).map((x) => javaString(String(x))).join(',')}}`)
        .join(',')}}`;
  }
}

const HELPERS = String.raw`
    static String tjEsc(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        return sb.append('"').toString();
    }
    static String tjSer(int v) { return Integer.toString(v); }
    static String tjSer(long v) { return Long.toString(v); }
    static String tjSer(double v) { return (Double.isNaN(v) || Double.isInfinite(v)) ? "null" : Double.toString(v); }
    static String tjSer(boolean v) { return v ? "true" : "false"; }
    static String tjSer(char v) { return tjEsc(String.valueOf(v)); }
    static String tjSer(String v) { return v == null ? "null" : tjEsc(v); }
    static String tjSer(int[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(','); sb.append(v[i]); }
        return sb.append(']').toString();
    }
    static String tjSer(long[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(','); sb.append(v[i]); }
        return sb.append(']').toString();
    }
    static String tjSer(double[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(','); sb.append(tjSer(v[i])); }
        return sb.append(']').toString();
    }
    static String tjSer(boolean[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(','); sb.append(v[i] ? "true" : "false"); }
        return sb.append(']').toString();
    }
    static String tjSer(char[] v) { return v == null ? "null" : tjEsc(new String(v)); }
    static String tjSer(Object v) {
        if (v == null) return "null";
        if (v instanceof String) return tjEsc((String) v);
        if (v instanceof Character) return tjEsc(v.toString());
        if (v instanceof Boolean) return v.toString();
        if (v instanceof Double || v instanceof Float) return tjSer(((Number) v).doubleValue());
        if (v instanceof Number) return v.toString();
        if (v instanceof int[]) return tjSer((int[]) v);
        if (v instanceof long[]) return tjSer((long[]) v);
        if (v instanceof double[]) return tjSer((double[]) v);
        if (v instanceof boolean[]) return tjSer((boolean[]) v);
        if (v instanceof char[]) return tjSer((char[]) v);
        if (v instanceof Object[]) {
            Object[] a = (Object[]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); sb.append(tjSer(a[i])); }
            return sb.append(']').toString();
        }
        if (v instanceof Iterable) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object o : (Iterable<?>) v) { if (!first) sb.append(','); first = false; sb.append(tjSer(o)); }
            return sb.append(']').toString();
        }
        return tjEsc(v.toString());
    }
    static String tjDescribe(Throwable e) {
        StringBuilder sb = new StringBuilder(e.toString());
        int shown = 0;
        for (StackTraceElement el : e.getStackTrace()) {
            String cls = el.getClassName();
            if (cls.equals("Main") || cls.startsWith("java.") || cls.startsWith("jdk.") || cls.startsWith("sun.")) continue;
            int line = el.getLineNumber() - TJ_OFFSET;
            sb.append("\n    at ").append(cls).append('.').append(el.getMethodName());
            if (line > 0) sb.append(" (").append(line).append("번째 줄)");
            if (++shown >= 6) break;
        }
        return sb.toString();
    }
`;

export interface GeneratedProgram {
  source: string;
  /** 사용자 코드 1번째 줄이 생성 파일의 (offset + 1)번째 줄 */
  offset: number;
}

export function buildJavaProgram(userCode: string, sig: Signature, tests: TestCase[]): GeneratedProgram {
  const userLines = userCode.replace(/\r\n/g, '\n').split('\n');
  const imports: string[] = [];
  const body = userLines.map((line) => {
    if (IMPORT_LINE.test(line)) {
      imports.push(line.trim());
      return '';
    }
    if (PACKAGE_LINE.test(line)) return '';
    return line.replace(/\bpublic\s+(final\s+)?class\s+Solution\b/, 'class Solution');
  });

  const head: string[] = [
    ...imports,
    'import java.util.*;',
    'import java.util.function.*;',
    'import java.util.stream.*;',
    '',
    'public class Main {',
  ];

  const cases: string[] = tests.map((t, i) => {
    const decls = sig.params.map(
      (p, j) => `        ${JAVA_TYPE[p.type]} p${j} = ${javaLiteral(t.input[j], p.type)};`,
    );
    const args = sig.params.map((_, j) => `p${j}`).join(', ');
    return [
      `    static String tjCase${i}() throws Throwable {`,
      ...decls,
      `        return tjSer(new Solution().solution(${args}));`,
      '    }',
    ].join('\n');
  });

  const dispatch = [
    '    static String tjRun(int i) throws Throwable {',
    '        switch (i) {',
    ...tests.map((_, i) => `            case ${i}: return tjCase${i}();`),
    '            default: throw new IllegalStateException("unknown case");',
    '        }',
    '    }',
  ].join('\n');

  const main = [
    '    public static void main(String[] args) {',
    `        for (int i = 0; i < ${tests.length}; i++) {`,
    `            System.out.println("${MARK_BEGIN}" + i);`,
    '            System.out.flush();',
    '            long t0 = System.nanoTime();',
    '            String payload;',
    '            boolean ok;',
    '            try {',
    '                payload = tjRun(i);',
    '                ok = true;',
    '            } catch (Throwable e) {',
    '                payload = tjEsc(tjDescribe(e));',
    '                ok = false;',
    '            }',
    '            double ms = (System.nanoTime() - t0) / 1e6;',
    `            System.out.println("\\n${MARK_END}" + i + ":" + (ok ? "OK" : "ERR") + ":" + String.format(Locale.ROOT, "%.2f", ms) + ":" + payload);`,
    '            System.out.flush();',
    '        }',
    '    }',
  ].join('\n');

  // offset 상수는 자기 자신의 줄 수에 의존하므로 placeholder 로 두고 마지막에 채운다.
  const mainClass = [
    '    static final int TJ_OFFSET = __TJ_OFFSET__;',
    HELPERS,
    ...cases,
    dispatch,
    main,
    '}',
    '',
  ].join('\n');

  // prefix 는 개행으로 끝나므로 개행 개수 = 사용자 코드 앞의 줄 수
  const prefix = `${head.join('\n')}\n${mainClass}`;
  const offset = prefix.split('\n').length - 1;
  const source = `${prefix.replace('__TJ_OFFSET__', String(offset))}${body.join('\n')}\n`;
  return { source, offset };
}

/** javac/java 에러 메시지의 줄 번호를 사용자 코드 기준으로 바꾼다. */
export function mapJavaErrors(text: string, offset: number): string {
  return text.replace(/\b[\w.]*\.java:(\d+):/g, (_m, n: string) => {
    const line = Number(n) - offset;
    return line > 0 ? `${line}번째 줄:` : '채점 코드:';
  });
}
