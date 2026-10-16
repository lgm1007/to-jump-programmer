/**
 * 객관식 보기 구성 — 보기 순서 섞기와 오답 풀에서 고르기.
 * 퀴즈 화면(오늘의 퀴즈 · 레슨 확인 · 오답 노트 · 북마크 등 모든 진입 경로)과 코드 리뷰 챌린지가 같은 규칙을 쓴다.
 *
 * 보기 구성은 (문제 id, 몇 번째 풀이인지)로 정해지는 결정적 무작위라, 한 문제를 보는 동안에는 바뀌지 않고
 * 다시 풀 때마다 달라진다. 직전 풀이와 정답 위치 · 오답 조합이 같지 않게 고른다.
 * React Native 를 가져오지 않으므로 Node 테스트(scripts/test-core.ts)에서도 쓴다.
 */
import type { McqQuestion } from '@/content/types';
import { hashString, seededRandom, shuffle } from '@/lib/date';

/** 오답 풀 문제에서 기본으로 보여줄 오답 수 */
export const DEFAULT_PICK = 3;
/** 직전 풀이와 같은 구성이 나오면 다시 고르는 최대 횟수 */
const MAX_REROLL = 8;

export interface PresentedChoice {
  text: string;
  correct: boolean;
  /** 오답 풀 문제의 오답이 틀린 이유 */
  why?: string;
  /** 원래 위치 — 고정 보기는 `choices` 인덱스, 오답 풀은 정답 -1 · 오답은 `distractors` 인덱스 */
  source: number;
}

export interface PresentedMcq {
  choices: PresentedChoice[];
  /** 섞은 보기에서 정답의 위치 */
  answer: number;
}

/** 정답 보기 텍스트 (보기 순서와 무관) */
export function correctChoiceText(q: McqQuestion): string {
  return q.correct !== undefined ? q.correct : (q.choices[q.answer] ?? '');
}

/** 고정 보기 · 오답 풀을 섞기 전 순서의 보기 목록으로 */
function baseChoices(q: McqQuestion, random: () => number): PresentedChoice[] {
  if (q.correct !== undefined) {
    const pick = Math.max(0, Math.min(q.pick ?? DEFAULT_PICK, q.distractors.length));
    const chosen = shuffle(
      q.distractors.map((d, i) => ({ ...d, i })),
      random,
    ).slice(0, pick);
    return [
      { text: q.correct, correct: true, source: -1 },
      ...chosen.map((d) => ({ text: d.text, correct: false, why: d.why, source: d.i })),
    ];
  }
  return q.choices.map((text, i) => ({ text, correct: i === q.answer, source: i }));
}

/** 한 번 구성하기 — random 을 주입받는 순수 함수 */
export function arrangeMcq(q: McqQuestion, random: () => number): PresentedMcq {
  const base = baseChoices(q, random);
  let choices: PresentedChoice[];
  if (q.correct === undefined && q.fixedOrder) choices = base;
  else if (q.correct === undefined && q.pinLast && base.length > 1) choices = [...shuffle(base.slice(0, -1), random), base[base.length - 1]];
  else choices = shuffle(base, random);
  return { choices, answer: choices.findIndex((c) => c.correct) };
}

const sameDistractors = (a: PresentedMcq, b: PresentedMcq) => {
  const key = (p: PresentedMcq) =>
    p.choices
      .filter((c) => !c.correct)
      .map((c) => c.source)
      .sort((x, y) => x - y)
      .join(',');
  return key(a) === key(b);
};

/** 직전 구성과 정답 위치가 같거나, 오답 풀에 여유가 있는데 오답 조합이 같은지 */
function repeatsPrevious(q: McqQuestion, cur: PresentedMcq, prev: PresentedMcq): boolean {
  const canMove = q.correct !== undefined || (!q.fixedOrder && cur.choices.length > (q.pinLast ? 2 : 1));
  if (canMove && cur.answer === prev.answer) return true;
  return q.correct !== undefined && q.distractors.length > (q.pick ?? DEFAULT_PICK) && sameDistractors(cur, prev);
}

/**
 * `attempt` 번째 풀이(0부터 — 지금까지 푼 횟수)에 보여줄 보기 구성.
 * 같은 문제 · 같은 회차면 항상 같은 구성이고, 직전 회차와는 정답 위치(와 오답 풀이 넉넉하면 오답 조합)가 다르다.
 */
export function presentMcq(q: McqQuestion, attempt = 0): PresentedMcq {
  let prev: PresentedMcq | undefined;
  for (let n = 0; n <= Math.max(0, attempt); n++) {
    const random = seededRandom(hashString(`${q.id}:${n}`));
    let cur = arrangeMcq(q, random);
    for (let k = 0; prev && k < MAX_REROLL && repeatsPrevious(q, cur, prev); k++) cur = arrangeMcq(q, random);
    prev = cur;
  }
  return prev!;
}

/** 여러 항목의 보여줄 순서(원래 인덱스 목록) — 코드 리뷰 챌린지의 복수 선택 보기 */
export function shuffledOrder(count: number, key: string, attempt = 0): number[] {
  return shuffle(
    Array.from({ length: count }, (_, i) => i),
    seededRandom(hashString(`${key}:${attempt}`)),
  );
}
