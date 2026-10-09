import type { Signature, SolveLanguage, ValueType } from '@/content/types';

export interface SolveLanguageInfo {
  id: SolveLanguage;
  label: string;
  /** 기기 안에서 실행 가능한지 (false 면 원격 실행 서버 필요) */
  local: boolean;
  /** Piston 언어 이름 */
  piston: string;
}

export const SOLVE_LANGUAGES: SolveLanguageInfo[] = [
  { id: 'python', label: 'Python', local: true, piston: 'python' },
  { id: 'java', label: 'Java', local: false, piston: 'java' },
  { id: 'cpp', label: 'C++', local: false, piston: 'c++' },
  { id: 'javascript', label: 'JavaScript', local: true, piston: 'javascript' },
];

export const SOLVE_LANGUAGE_MAP = Object.fromEntries(SOLVE_LANGUAGES.map((l) => [l.id, l])) as Record<
  SolveLanguage,
  SolveLanguageInfo
>;

export const JAVA_TYPE: Record<ValueType, string> = {
  int: 'int',
  long: 'long',
  double: 'double',
  bool: 'boolean',
  string: 'String',
  'int[]': 'int[]',
  'long[]': 'long[]',
  'double[]': 'double[]',
  'bool[]': 'boolean[]',
  'string[]': 'String[]',
  'int[][]': 'int[][]',
  'string[][]': 'String[][]',
};

export const CPP_TYPE: Record<ValueType, string> = {
  int: 'int',
  long: 'long long',
  double: 'double',
  bool: 'bool',
  string: 'string',
  'int[]': 'vector<int>',
  'long[]': 'vector<long long>',
  'double[]': 'vector<double>',
  'bool[]': 'vector<bool>',
  'string[]': 'vector<string>',
  'int[][]': 'vector<vector<int>>',
  'string[][]': 'vector<vector<string>>',
};

function javaDefault(t: ValueType): string {
  switch (t) {
    case 'int':
      return 'int answer = 0;';
    case 'long':
      return 'long answer = 0;';
    case 'double':
      return 'double answer = 0;';
    case 'bool':
      return 'boolean answer = false;';
    case 'string':
      return 'String answer = "";';
    case 'int[]':
      return 'int[] answer = {};';
    case 'long[]':
      return 'long[] answer = {};';
    case 'double[]':
      return 'double[] answer = {};';
    case 'bool[]':
      return 'boolean[] answer = {};';
    case 'string[]':
      return 'String[] answer = {};';
    case 'int[][]':
      return 'int[][] answer = {};';
    case 'string[][]':
      return 'String[][] answer = {};';
  }
}

function cppDefault(t: ValueType): string {
  switch (t) {
    case 'int':
    case 'long':
    case 'double':
      return `${CPP_TYPE[t]} answer = 0;`;
    case 'bool':
      return 'bool answer = false;';
    case 'string':
      return 'string answer = "";';
    default:
      return `${CPP_TYPE[t]} answer;`;
  }
}

function jsPyDefault(t: ValueType, lang: 'python' | 'javascript'): string {
  if (t.endsWith('[]')) return '[]';
  if (t === 'string') return lang === 'python' ? "''" : "''";
  if (t === 'bool') return lang === 'python' ? 'False' : 'false';
  return '0';
}

/** 프로그래머스 스타일 시작 코드 */
export function starterCode(lang: SolveLanguage, sig: Signature): string {
  const names = sig.params.map((p) => p.name);
  switch (lang) {
    case 'python':
      return `def solution(${names.join(', ')}):\n    answer = ${jsPyDefault(sig.returns, 'python')}\n    return answer\n`;
    case 'javascript':
      return `function solution(${names.join(', ')}) {\n    var answer = ${jsPyDefault(sig.returns, 'javascript')};\n    return answer;\n}\n`;
    case 'java': {
      const params = sig.params.map((p) => `${JAVA_TYPE[p.type]} ${p.name}`).join(', ');
      return `class Solution {\n    public ${JAVA_TYPE[sig.returns]} solution(${params}) {\n        ${javaDefault(sig.returns)}\n        return answer;\n    }\n}\n`;
    }
    case 'cpp': {
      const params = sig.params.map((p) => `${CPP_TYPE[p.type]} ${p.name}`).join(', ');
      return `#include <string>\n#include <vector>\n\nusing namespace std;\n\n${CPP_TYPE[sig.returns]} solution(${params}) {\n    ${cppDefault(sig.returns)}\n    return answer;\n}\n`;
    }
  }
}

/** 문제 화면에 보여줄 함수 시그니처 설명 */
export function signatureText(lang: SolveLanguage, sig: Signature): string {
  const names = sig.params.map((p) => p.name);
  switch (lang) {
    case 'python':
      return `def solution(${names.join(', ')})`;
    case 'javascript':
      return `function solution(${names.join(', ')})`;
    case 'java':
      return `${JAVA_TYPE[sig.returns]} solution(${sig.params.map((p) => `${JAVA_TYPE[p.type]} ${p.name}`).join(', ')})`;
    case 'cpp':
      return `${CPP_TYPE[sig.returns]} solution(${sig.params.map((p) => `${CPP_TYPE[p.type]} ${p.name}`).join(', ')})`;
  }
}
