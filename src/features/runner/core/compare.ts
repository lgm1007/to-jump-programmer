import type { CompareMode } from '@/content/types';

const FLOAT_EPS = 1e-6;

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function floatEqual(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff <= FLOAT_EPS || diff <= FLOAT_EPS * Math.max(Math.abs(a), Math.abs(b));
}

function deepEqual(a: unknown, b: unknown, float: boolean): boolean {
  if (isNumber(a) && isNumber(b)) {
    return float ? floatEqual(a, b) : a === b;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], float)) return false;
    }
    return true;
  }
  return a === b;
}

function sortKey(v: unknown): string {
  return JSON.stringify(v);
}

/** 기대값과 실제 반환값을 비교한다. */
export function resultsMatch(expected: unknown, actual: unknown, mode: CompareMode = 'exact'): boolean {
  if (mode === 'unordered' && Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    const a = [...expected].map(sortKey).sort();
    const b = [...actual].map(sortKey).sort();
    return a.every((v, i) => v === b[i]);
  }
  return deepEqual(expected, actual, mode === 'float');
}

/** 화면 표시용 값 포맷 (Python 스타일이 아닌 JSON 스타일) */
export function formatValue(v: unknown, maxLength = 400): string {
  let s: string;
  try {
    s = JSON.stringify(v);
  } catch {
    s = String(v);
  }
  if (s === undefined) s = 'undefined';
  if (s.length > maxLength) s = `${s.slice(0, maxLength)}…`;
  return s;
}
