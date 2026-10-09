/**
 * 콘텐츠 진입점. 화면에서는 이 모듈만 import 한다.
 */
import { ALGO_TOPICS } from './algorithm/topics';
import { PROBLEMS } from './algorithm/problems';
import bfsDfs from './algorithm/quiz/bfs-dfs';
import binarySearch from './algorithm/quiz/binary-search';
import bruteForce from './algorithm/quiz/brute-force';
import complexity from './algorithm/quiz/complexity';
import dp from './algorithm/quiz/dp';
import greedy from './algorithm/quiz/greedy';
import hash from './algorithm/quiz/hash';
import heap from './algorithm/quiz/heap';
import shortestPath from './algorithm/quiz/shortest-path';
import sorting from './algorithm/quiz/sorting';
import stackQueue from './algorithm/quiz/stack-queue';
import tree from './algorithm/quiz/tree';
import twoPointer from './algorithm/quiz/two-pointer';
import unionFind from './algorithm/quiz/union-find';
import { CS_CATEGORIES } from './cs/categories';
import architecture from './cs/architecture';
import database from './cs/database';
import datastructure from './cs/datastructure';
import csDjango from './cs/django';
import infra from './cs/infra';
import java from './cs/java';
import javascript from './cs/javascript';
import nestjs from './cs/nestjs';
import network from './cs/network';
import oop from './cs/oop';
import os from './cs/os';
import practice from './cs/practice';
import python from './cs/python';
import security from './cs/security';
import csSpring from './cs/spring';
import reviewDjango from './review/django';
import reviewNest from './review/nest';
import reviewSpring from './review/spring';
import type {
  AlgoProblem,
  AlgoTopicContent,
  CsCategoryContent,
  FrameworkId,
  InterviewCard,
  QuizQuestion,
  ReviewChallenge,
  ReviewFrameworkContent,
  ReviewPattern,
} from './types';

export * from './types';
export { ALGO_TOPICS, ALGO_TOPIC_MAP, EXTRA_PROBLEM_TAGS, topicLabel } from './algorithm/topics';
export { CS_CATEGORIES, CS_CATEGORY_MAP, CS_GROUPS } from './cs/categories';
export {
  REVIEW_CATEGORY_LABEL,
  REVIEW_FRAMEWORK_MAP,
  REVIEW_FRAMEWORKS,
  SEVERITY_LABEL,
} from './review/frameworks';

export const ALGO_QUIZ: Record<string, AlgoTopicContent> = {
  complexity,
  sorting,
  'binary-search': binarySearch,
  'stack-queue': stackQueue,
  hash,
  heap,
  'two-pointer': twoPointer,
  greedy,
  'brute-force': bruteForce,
  'bfs-dfs': bfsDfs,
  dp,
  'shortest-path': shortestPath,
  'union-find': unionFind,
  tree,
};

export const CS_CONTENT: Record<string, CsCategoryContent> = {
  os,
  network,
  datastructure,
  database,
  security,
  java,
  javascript,
  python,
  spring: csSpring,
  nestjs,
  django: csDjango,
  architecture,
  infra,
  oop,
  practice,
};

export const REVIEW_CONTENT: Record<FrameworkId, ReviewFrameworkContent> = {
  spring: reviewSpring,
  nest: reviewNest,
  django: reviewDjango,
};

const LEVEL_ORDER = (a: AlgoProblem, b: AlgoProblem) => a.level - b.level || a.title.localeCompare(b.title, 'ko');

export const ALL_PROBLEMS: AlgoProblem[] = [...PROBLEMS].sort(LEVEL_ORDER);

/* ------------------------------------------------------------------ */
/* 조회용 인덱스                                                        */
/* ------------------------------------------------------------------ */

export type QuestionSource = 'algo' | 'cs';

export const QUESTION_MAP: Record<string, QuizQuestion> = {};
export const QUESTION_SOURCE: Record<string, QuestionSource> = {};
for (const topic of ALGO_TOPICS) {
  for (const q of ALGO_QUIZ[topic.id]?.questions ?? []) {
    QUESTION_MAP[q.id] = q;
    QUESTION_SOURCE[q.id] = 'algo';
  }
}

export const CARD_MAP: Record<string, InterviewCard> = {};
for (const cat of CS_CATEGORIES) {
  const content = CS_CONTENT[cat.id];
  for (const q of content?.quiz ?? []) {
    QUESTION_MAP[q.id] = q;
    QUESTION_SOURCE[q.id] = 'cs';
  }
  for (const card of content?.cards ?? []) CARD_MAP[card.id] = card;
}

export const PROBLEM_MAP: Record<string, AlgoProblem> = Object.fromEntries(ALL_PROBLEMS.map((p) => [p.id, p]));

export const PATTERN_MAP: Record<string, ReviewPattern> = {};
export const CHALLENGE_MAP: Record<string, ReviewChallenge> = {};
for (const fw of Object.values(REVIEW_CONTENT)) {
  for (const p of fw.patterns) PATTERN_MAP[p.id] = p;
  for (const ch of fw.challenges) CHALLENGE_MAP[ch.id] = ch;
}

export const ALL_QUESTION_IDS = Object.keys(QUESTION_MAP);
export const ALL_CARD_IDS = Object.keys(CARD_MAP);

export const CONTENT_STATS = {
  algoQuestions: ALGO_TOPICS.reduce((n, t) => n + (ALGO_QUIZ[t.id]?.questions.length ?? 0), 0),
  problems: ALL_PROBLEMS.length,
  csQuestions: CS_CATEGORIES.reduce((n, c) => n + (CS_CONTENT[c.id]?.quiz.length ?? 0), 0),
  cards: ALL_CARD_IDS.length,
  patterns: Object.keys(PATTERN_MAP).length,
  challenges: Object.keys(CHALLENGE_MAP).length,
};
