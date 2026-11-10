/**
 * CS 이론 레슨의 학습 상태와 확인 퀴즈 선택.
 * React Native 를 가져오지 않으므로 Node 테스트(scripts/test-core.ts)에서도 쓴다.
 */
import { CS_CONTENT, LESSON_QUESTION_IDS, QUESTION_MAP, type CsCategory, type CsLesson, type Difficulty } from '@/content';
import { shuffle } from '@/lib/date';

export interface LessonRecord {
  /** 처음 연 시각 */
  startedAt: number;
  /** 끝까지 읽은 시각 */
  readAt?: number;
  /** 확인 퀴즈를 제출한 시각 — 이때 레슨을 완료로 본다 */
  completedAt?: number;
  /** 가장 최근 확인 퀴즈 결과 */
  correct?: number;
  total?: number;
  lastAt: number;
}

export type LessonStatus = 'new' | 'reading' | 'done';

/** 안 읽음 · 읽는 중 · 완료 (확인 퀴즈 제출) */
export function lessonStatus(rec: LessonRecord | undefined): LessonStatus {
  if (!rec) return 'new';
  return rec.completedAt ? 'done' : 'reading';
}

/** 확인 퀴즈를 2/3 이상(5문제면 4개, 예전 3문제 기록은 2개) 맞혔으면 '이해함' */
export function isLessonUnderstood(rec: LessonRecord | undefined): boolean {
  return !!rec?.completedAt && !!rec.total && (rec.correct ?? 0) * 3 >= rec.total * 2;
}

export const categoryLessons = (categoryId: string): CsLesson[] => CS_CONTENT[categoryId]?.lessons ?? [];

/** 확인 퀴즈 문제 수 */
export const LESSON_CHECK_COUNT = 5;
/** 자리마다 낼 난이도 — 기초 2 · 중급 2 · 심화 1 */
const CHECK_SLOTS: Difficulty[] = [1, 1, 2, 2, 3];
/** 그 난이도가 모자랄 때 채울 난이도 — 가까운 것부터 (기초가 없으면 중급부터, 심화가 모자라면 중급으로) */
const FALLBACK: Record<Difficulty, Difficulty[]> = { 1: [2, 3], 2: [1, 3], 3: [2, 1] };

/**
 * 확인 퀴즈 문제 고르기 — 난이도별로 자리를 채우고(난이도 안에서는 안 푼 문제 먼저, 섞어서),
 * 모자란 자리는 가까운 난이도로 채운 뒤 기초 → 중급 → 심화 순서로 낸다. 문제가 count 개보다 적으면 있는 만큼.
 */
export function arrangeLessonCheck(
  questions: readonly { id: string; difficulty: Difficulty }[],
  seen: (id: string) => boolean,
  random: () => number = Math.random,
  count = LESSON_CHECK_COUNT,
): string[] {
  const pools = {} as Record<Difficulty, string[]>;
  for (const d of [1, 2, 3] as const) {
    const ids = questions.filter((q) => q.difficulty === d).map((q) => q.id);
    pools[d] = [...shuffle(ids.filter((id) => !seen(id)), random), ...shuffle(ids.filter(seen), random)];
  }
  const level = new Map(questions.map((q) => [q.id, q.difficulty]));
  const picked: string[] = [];
  const take = (d: Difficulty) => {
    const id = pools[d].shift();
    if (id) picked.push(id);
    return !!id;
  };
  const slots = Array.from({ length: count }, (_, i) => CHECK_SLOTS[i] ?? 2);
  const missing = slots.filter((d) => !take(d));
  for (const d of missing) FALLBACK[d].some(take);
  return picked.sort((a, b) => level.get(a)! - level.get(b)!);
}

/** 레슨 확인 퀴즈 — 레슨에 연결된 문제에서 `arrangeLessonCheck` 로 고른다 */
export function pickLessonCheck(
  lessonId: string,
  seen: (id: string) => boolean,
  random: () => number = Math.random,
  count = LESSON_CHECK_COUNT,
): string[] {
  const questions = (LESSON_QUESTION_IDS[lessonId] ?? []).flatMap((id) => (QUESTION_MAP[id] ? [QUESTION_MAP[id]] : []));
  return arrangeLessonCheck(questions, seen, random, count);
}

/**
 * 오늘 읽을 레슨 후보 — 카테고리마다 아직 완료하지 않은 첫 레슨(순서대로 읽도록).
 * 읽다 만 레슨이 있으면 그 레슨들만 후보로 한다.
 */
export function nextLessonCandidates(categories: CsCategory[], records: Record<string, LessonRecord>): CsLesson[] {
  const next = categories
    .map((cat) => categoryLessons(cat.id).find((l) => lessonStatus(records[l.id]) !== 'done'))
    .filter((l): l is CsLesson => !!l);
  const reading = next.filter((l) => lessonStatus(records[l.id]) === 'reading');
  return reading.length ? reading : next;
}
