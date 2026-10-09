import {
  ALGO_QUIZ,
  ALGO_TOPICS,
  ALL_CARD_IDS,
  ALL_PROBLEMS,
  CARD_MAP,
  CHALLENGE_MAP,
  CS_CATEGORIES,
  CS_CONTENT,
  PATTERN_MAP,
  PROBLEM_MAP,
  QUESTION_MAP,
  REVIEW_CONTENT,
  type FrameworkId,
} from '@/content';
import { dayKey, hashString, seededRandom, shuffle } from '@/lib/date';

import { useProgress, type DailyPlanRecord, type ProgressState, type QuizRecord } from './store';

export interface QuizSetStats {
  total: number;
  attempted: number;
  /** 가장 최근 풀이가 정답인 문제 수 */
  correct: number;
  /** attempted 대비 정답 비율 (0~1) */
  accuracy: number;
  /** total 대비 푼 비율 (0~1) */
  progress: number;
}

export function quizSetStats(ids: string[], quiz: Record<string, QuizRecord>): QuizSetStats {
  let attempted = 0;
  let correct = 0;
  for (const id of ids) {
    const r = quiz[id];
    if (!r) continue;
    attempted++;
    if (r.last) correct++;
  }
  return {
    total: ids.length,
    attempted,
    correct,
    accuracy: attempted ? correct / attempted : 0,
    progress: ids.length ? attempted / ids.length : 0,
  };
}

export const algoTopicQuestionIds = (topicId: string) => (ALGO_QUIZ[topicId]?.questions ?? []).map((q) => q.id);
export const csCategoryQuestionIds = (categoryId: string) => (CS_CONTENT[categoryId]?.quiz ?? []).map((q) => q.id);
export const csCategoryCardIds = (categoryId: string) => (CS_CONTENT[categoryId]?.cards ?? []).map((c) => c.id);

export const ALL_ALGO_QUESTION_IDS = ALGO_TOPICS.flatMap((t) => algoTopicQuestionIds(t.id));
export const ALL_CS_QUESTION_IDS = CS_CATEGORIES.flatMap((c) => csCategoryQuestionIds(c.id));

/** 가장 최근에 틀린 문제 (오답노트) — 최근에 틀린 순 */
export function wrongQuestionIds(quiz: Record<string, QuizRecord>, filter?: (id: string) => boolean): string[] {
  return Object.entries(quiz)
    .filter(([id, r]) => !r.last && QUESTION_MAP[id] && (!filter || filter(id)))
    .sort((a, b) => b[1].lastAt - a[1].lastAt)
    .map(([id]) => id);
}

export function againCardIds(state: Pick<ProgressState, 'cards'>): string[] {
  return Object.entries(state.cards)
    .filter(([id, r]) => r.rating !== 'good' && CARD_MAP[id])
    .sort((a, b) => b[1].lastAt - a[1].lastAt)
    .map(([id]) => id);
}

export interface TrackSummary {
  algo: { quiz: QuizSetStats; solved: number; problems: number };
  review: { patternsRead: number; patterns: number; challengesDone: number; challenges: number };
  cs: { quiz: QuizSetStats; cardsReviewed: number; cards: number };
}

export function trackSummary(state: ProgressState): TrackSummary {
  return {
    algo: {
      quiz: quizSetStats(ALL_ALGO_QUESTION_IDS, state.quiz),
      solved: ALL_PROBLEMS.filter((p) => state.problems[p.id]?.solved).length,
      problems: ALL_PROBLEMS.length,
    },
    review: {
      patternsRead: Object.keys(state.patterns).filter((id) => PATTERN_MAP[id]).length,
      patterns: Object.keys(PATTERN_MAP).length,
      challengesDone: Object.keys(state.challenges).filter((id) => CHALLENGE_MAP[id]).length,
      challenges: Object.keys(CHALLENGE_MAP).length,
    },
    cs: {
      quiz: quizSetStats(ALL_CS_QUESTION_IDS, state.quiz),
      cardsReviewed: Object.keys(state.cards).filter((id) => CARD_MAP[id]).length,
      cards: ALL_CARD_IDS.length,
    },
  };
}

/** 0~1 사이 트랙 진행률 */
export function trackProgress(s: TrackSummary) {
  const ratio = (a: number, b: number) => (b ? a / b : 0);
  return {
    algo: (s.algo.quiz.progress + ratio(s.algo.solved, s.algo.problems)) / 2,
    review: (ratio(s.review.patternsRead, s.review.patterns) + ratio(s.review.challengesDone, s.review.challenges)) / 2,
    cs: (s.cs.quiz.progress + ratio(s.cs.cardsReviewed, s.cs.cards)) / 2,
  };
}

/* ------------------------------------------------------------------ */
/* 오늘의 학습 (날짜 기반 결정적 추천)                                  */
/* ------------------------------------------------------------------ */

export type DailyPlan = DailyPlanRecord;

function pickPreferUnseen(ids: string[], seen: (id: string) => boolean, count: number, random: () => number): string[] {
  const unseen = shuffle(
    ids.filter((id) => !seen(id)),
    random,
  );
  const rest = shuffle(
    ids.filter((id) => seen(id)),
    random,
  );
  return [...unseen, ...rest].slice(0, count);
}

export function dailyPlan(state: ProgressState, date: Date = new Date()): DailyPlan {
  const key = dayKey(date);
  const random = seededRandom(hashString(`${key}:${state.profile.nickname}`));
  const seenQuiz = (id: string) => !!state.quiz[id];

  // 틀린 문제 2개 + 새 CS 4개 + 새 알고리즘 개념 2개
  const wrong = wrongQuestionIds(state.quiz).slice(0, 2);
  const cs = pickPreferUnseen(ALL_CS_QUESTION_IDS, seenQuiz, 4, random);
  const algo = pickPreferUnseen(ALL_ALGO_QUESTION_IDS, seenQuiz, 2, random);
  const questionIds = [...new Set([...wrong, ...cs, ...algo])].slice(0, 8);

  const level = state.profile.goal === 'career' ? 2 : 1;
  const unsolved = ALL_PROBLEMS.filter((p) => !state.problems[p.id]?.solved);
  const pool = unsolved.filter((p) => p.level >= level && p.level <= level + 1);
  const problemPool = pool.length ? pool : unsolved.length ? unsolved : ALL_PROBLEMS;
  const problemId = problemPool.length ? problemPool[Math.floor(random() * problemPool.length)].id : undefined;

  const cardPool = ALL_CARD_IDS.filter((id) => !state.cards[id]);
  const cards = cardPool.length ? cardPool : ALL_CARD_IDS;
  const cardId = cards.length ? cards[Math.floor(random() * cards.length)] : undefined;

  const fw: FrameworkId = state.profile.framework;
  const content = REVIEW_CONTENT[fw];
  const patterns = content.patterns.filter((p) => !state.patterns[p.id]);
  const challenges = content.challenges.filter((c) => !state.challenges[c.id]);
  let review: DailyPlan['review'];
  if (patterns.length && (random() < 0.5 || !challenges.length)) {
    review = { kind: 'pattern', id: patterns[Math.floor(random() * patterns.length)].id };
  } else if (challenges.length) {
    review = { kind: 'challenge', id: challenges[Math.floor(random() * challenges.length)].id };
  } else if (content.patterns.length) {
    review = { kind: 'pattern', id: content.patterns[Math.floor(random() * content.patterns.length)].id };
  }

  return { key, questionIds, problemId, cardId, review };
}

/** 오늘의 추천을 하루 동안 고정해서 돌려준다 (필요하면 새로 만든다) */
export function useDailyPlan(): DailyPlan {
  const daily = useProgress((s) => s.daily);
  const key = dayKey();
  const valid =
    daily &&
    daily.key === key &&
    daily.questionIds.length > 0 &&
    daily.questionIds.every((id) => QUESTION_MAP[id]) &&
    (!daily.problemId || PROBLEM_MAP[daily.problemId]) &&
    (!daily.cardId || CARD_MAP[daily.cardId]);
  if (valid) return daily;
  const plan = dailyPlan(useProgress.getState());
  if (plan.questionIds.length > 0) {
    // 렌더 중 상태 갱신을 피하기 위해 다음 틱에 저장
    setTimeout(() => {
      const cur = useProgress.getState().daily;
      if (cur?.key !== key || cur.questionIds.length === 0) useProgress.getState().setDaily(plan);
    }, 0);
  }
  return plan;
}

/** 오늘의 코드 리뷰 추천 — 관심 프레임워크가 바뀌어도 바로 반영되도록 매번 계산한다 */
export function pickReview(state: ProgressState, date: Date = new Date()): DailyPlanRecord['review'] {
  const fw: FrameworkId = state.profile.framework;
  const content = REVIEW_CONTENT[fw];
  const random = seededRandom(hashString(`${dayKey(date)}:${fw}:review`));
  const patterns = content.patterns.filter((p) => !state.patterns[p.id]);
  const challenges = content.challenges.filter((c) => !state.challenges[c.id]);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
  if (patterns.length && (random() < 0.5 || !challenges.length)) return { kind: 'pattern', id: pick(patterns).id };
  if (challenges.length) return { kind: 'challenge', id: pick(challenges).id };
  if (content.patterns.length) return { kind: 'pattern', id: pick(content.patterns).id };
  return undefined;
}
