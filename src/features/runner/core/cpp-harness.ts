/**
 * C++ 채점 하네스 생성기 (C++17, g++/clang++ 호환).
 *   [표준 헤더 + using namespace std] → [사용자 코드] → [직렬화 헬퍼 + 테스트 + main]
 */
import type { Signature, TestCase, ValueType } from '@/content/types';

import { CPP_TYPE } from './languages';
import type { GeneratedProgram } from './java-harness';
import { MARK_BEGIN, MARK_END } from './protocol';

export const CPP_FILE_NAME = 'solution';

const HEADERS = [
  'algorithm',
  'array',
  'bitset',
  'chrono',
  'climits',
  'cmath',
  'cstdint',
  'cstdio',
  'cstdlib',
  'cstring',
  'deque',
  'functional',
  'iomanip',
  'iostream',
  'iterator',
  'list',
  'map',
  'numeric',
  'queue',
  'set',
  'sstream',
  'stack',
  'string',
  'tuple',
  'unordered_map',
  'unordered_set',
  'utility',
  'vector',
];

function cppString(s: string): string {
  let out = '"';
  for (const byte of new TextEncoder().encode(s)) {
    const ch = String.fromCharCode(byte);
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (ch === '?') out += '\\?'; // 트라이그래프 방지
    else if (byte < 0x20 || byte >= 0x7f) out += `\\${byte.toString(8).padStart(3, '0')}`;
    else out += ch;
  }
  return `string(${out}")`;
}

function cppInt(v: unknown): string {
  const n = Math.trunc(Number(v));
  if (n === -2147483648) return '(-2147483647-1)';
  return String(n);
}

function cppLong(v: unknown): string {
  const n = Math.trunc(Number(v));
  return `${BigInt(n).toString()}LL`;
}

function cppDouble(v: unknown): string {
  const s = String(Number(v));
  if (s === 'Infinity') return 'INFINITY';
  if (s === '-Infinity') return '(-INFINITY)';
  if (s === 'NaN') return 'NAN';
  return /[.eE]/.test(s) ? s : `${s}.0`;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

export function cppLiteral(v: unknown, t: ValueType): string {
  switch (t) {
    case 'int':
      return cppInt(v);
    case 'long':
      return cppLong(v);
    case 'double':
      return cppDouble(v);
    case 'bool':
      return v ? 'true' : 'false';
    case 'string':
      return cppString(String(v));
    case 'int[]':
      return `vector<int>{${arr(v).map(cppInt).join(',')}}`;
    case 'long[]':
      return `vector<long long>{${arr(v).map(cppLong).join(',')}}`;
    case 'double[]':
      return `vector<double>{${arr(v).map(cppDouble).join(',')}}`;
    case 'bool[]':
      return `vector<bool>{${arr(v).map((x) => (x ? 'true' : 'false')).join(',')}}`;
    case 'string[]':
      return `vector<string>{${arr(v).map((x) => cppString(String(x))).join(',')}}`;
    case 'int[][]':
      return `vector<vector<int>>{${arr(v)
        .map((row) => `vector<int>{${arr(row).map(cppInt).join(',')}}`)
        .join(',')}}`;
    case 'string[][]':
      return `vector<vector<string>>{${arr(v)
        .map((row) => `vector<string>{${arr(row).map((x) => cppString(String(x))).join(',')}}`)
        .join(',')}}`;
  }
}

const HELPERS = String.raw`
namespace tj {
string esc(const string& s) {
    string o = "\"";
    for (unsigned char c : s) {
        switch (c) {
            case '"': o += "\\\""; break;
            case '\\': o += "\\\\"; break;
            case '\n': o += "\\n"; break;
            case '\r': o += "\\r"; break;
            case '\t': o += "\\t"; break;
            default:
                if (c < 0x20) { char buf[8]; snprintf(buf, sizeof buf, "\\u%04x", (unsigned)c); o += buf; }
                else o += (char)c;
        }
    }
    return o + "\"";
}
string ser(int v) { return to_string(v); }
string ser(long v) { return to_string(v); }
string ser(long long v) { return to_string(v); }
string ser(unsigned v) { return to_string(v); }
string ser(unsigned long v) { return to_string(v); }
string ser(unsigned long long v) { return to_string(v); }
string ser(double v) {
    if (std::isnan(v) || std::isinf(v)) return "null";
    ostringstream os; os << setprecision(17) << v; return os.str();
}
string ser(bool v) { return v ? "true" : "false"; }
string ser(char v) { return esc(string(1, v)); }
string ser(const string& v) { return esc(v); }
string ser(const char* v) { return esc(string(v)); }
string ser(const vector<bool>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += v[i] ? "true" : "false"; }
    return s + "]";
}
template <class T> string ser(const vector<T>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += ser(v[i]); }
    return s + "]";
}
}
`;

export function buildCppProgram(userCode: string, sig: Signature, tests: TestCase[]): GeneratedProgram {
  const head = [...HEADERS.map((h) => `#include <${h}>`), 'using namespace std;', ''].join('\n') + '\n';
  const offset = head.split('\n').length - 1;
  const user = userCode.replace(/\r\n/g, '\n').replace(/\n*$/, '\n');

  const cases = tests.map((t, i) => {
    const decls = sig.params.map(
      (p, j) => `    ${CPP_TYPE[p.type]} p${j} = ${cppLiteral(t.input[j], p.type)};`,
    );
    const args = sig.params.map((_, j) => `p${j}`).join(', ');
    return [`static string tj_case_${i}() {`, ...decls, `    return tj::ser(solution(${args}));`, '}'].join('\n');
  });

  const dispatch = [
    'static string tj_run(int i) {',
    '    switch (i) {',
    ...tests.map((_, i) => `        case ${i}: return tj_case_${i}();`),
    '    }',
    '    return "null";',
    '}',
  ].join('\n');

  const main = [
    'int main() {',
    `    for (int i = 0; i < ${tests.length}; i++) {`,
    `        cout << "${MARK_BEGIN}" << i << endl;`,
    '        auto t0 = chrono::steady_clock::now();',
    '        string payload;',
    '        bool ok = true;',
    '        try {',
    '            payload = tj_run(i);',
    '        } catch (const exception& e) {',
    '            ok = false;',
    '            payload = tj::esc(string("예외 발생: ") + e.what());',
    '        } catch (...) {',
    '            ok = false;',
    '            payload = tj::esc("예외 발생");',
    '        }',
    '        double ms = chrono::duration<double, milli>(chrono::steady_clock::now() - t0).count();',
    '        char msbuf[32];',
    '        snprintf(msbuf, sizeof msbuf, "%.2f", ms);',
    `        cout << "\\n${MARK_END}" << i << ":" << (ok ? "OK" : "ERR") << ":" << msbuf << ":" << payload << endl;`,
    '    }',
    '    return 0;',
    '}',
  ].join('\n');

  const source = `${head}${user}${HELPERS}\n${cases.join('\n')}\n${dispatch}\n${main}\n`;
  return { source, offset };
}

/** g++/clang++ 에러 메시지의 줄 번호를 사용자 코드 기준으로 바꾼다. */
export function mapCppErrors(text: string, offset: number, userLineCount: number): string {
  return text
    .replace(/\b[\w./-]*\.(?:cpp|cc|code):(\d+):(?:(\d+):)?/g, (_m, n: string, col?: string) => {
      const line = Number(n) - offset;
      if (line > 0 && line <= userLineCount) return `${line}번째 줄${col ? `:${col}` : ''}:`;
      return '채점 코드:';
    })
    .replace(/^(\s*)(\d+)( \|)/gm, (_m, sp: string, n: string, bar: string) => {
      // 컴파일러가 보여주는 소스 발췌의 줄 번호 (예: "   32 |     return n +;")
      const line = Number(n) - offset;
      const label = line > 0 && line <= userLineCount ? String(line) : '-';
      return `${sp}${label.padStart(n.length)}${bar}`;
    });
}
