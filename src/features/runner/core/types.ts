import type { CompareMode, Signature, SolveLanguage, TestCase } from '@/content/types';

export type CaseStatus = 'pass' | 'fail' | 'error' | 'timeout' | 'skipped';

export interface CaseResult {
  index: number;
  status: CaseStatus;
  input: unknown[];
  expected: unknown;
  actual?: unknown;
  /** 사용자 코드가 출력한 표준 출력 */
  stdout: string;
  error?: string;
  timeMs?: number;
  /** 숨김 테스트 여부 (라벨 표시용 — 학습용 앱이라 실패 시 입력/기대값은 보여준다) */
  hidden?: boolean;
}

export type RunStatus =
  | 'ok' // 모든 케이스 실행 완료 (통과 여부와 무관)
  | 'compile-error'
  | 'unavailable' // 실행 환경 없음 (원격 서버 미설정 등)
  | 'cancelled' // 사용자가 화면을 떠나는 등으로 취소됨 (기록하지 않는다)
  | 'internal-error';

export interface RunResult {
  status: RunStatus;
  message?: string;
  cases: CaseResult[];
  elapsedMs: number;
}

export interface RunRequest {
  language: SolveLanguage;
  code: string;
  signature: Signature;
  tests: TestCase[];
  /** tests 중 앞에서부터 몇 개가 공개 예제인지 (결과 표시용) */
  visibleCount: number;
  compare: CompareMode;
  /** 케이스 하나당 제한 시간 (ms) */
  timeLimitMs: number;
}

/** 사용자 코드에서 하네스로 전달되는 원시 결과 (비교 전) */
export interface RawCaseOutput {
  index: number;
  ok: boolean;
  /** ok=true 이면 반환값(JSON), false 이면 에러 메시지 */
  value: unknown;
  stdout: string;
  timeMs: number;
}
