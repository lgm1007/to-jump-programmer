/**
 * 콘텐츠 진입점. 화면에서는 이 모듈만 import 한다.
 * 학습 데이터는 src/content/data/ (gitignore 대상) 에 있으며 `npm run content:sync` 로 채운다.
 * 전체 콘텐츠는 비공개 저장소, 공개 저장소에는 src/content/sample/ 만 있다.
 */
import { ALGO_TOPICS } from './algorithm/topics';
import { PATTERNS } from './data/algorithm/patterns';
import bfsDfs from './data/algorithm/quiz/bfs-dfs';
import binarySearch from './data/algorithm/quiz/binary-search';
import bruteForce from './data/algorithm/quiz/brute-force';
import complexity from './data/algorithm/quiz/complexity';
import dp from './data/algorithm/quiz/dp';
import greedy from './data/algorithm/quiz/greedy';
import hash from './data/algorithm/quiz/hash';
import heap from './data/algorithm/quiz/heap';
import implementation from './data/algorithm/quiz/implementation';
import shortestPath from './data/algorithm/quiz/shortest-path';
import sorting from './data/algorithm/quiz/sorting';
import stackQueue from './data/algorithm/quiz/stack-queue';
import tree from './data/algorithm/quiz/tree';
import twoPointer from './data/algorithm/quiz/two-pointer';
import unionFind from './data/algorithm/quiz/union-find';
import { CS_CATEGORIES } from './cs/categories';
import aiAgent from './data/cs/ai-agent';
import architecture from './data/cs/architecture';
import browser from './data/cs/browser';
import caseTraffic from './data/cs/case-traffic';
import caseMigration from './data/cs/case-migration';
import caseIntegration from './data/cs/case-integration';
import caseConcurrency from './data/cs/case-concurrency';
import casePerformance from './data/cs/case-performance';
import caseIncident from './data/cs/case-incident';
import caseLegacy from './data/cs/case-legacy';
import caseFePerformance from './data/cs/case-fe-performance';
import caseFeModernize from './data/cs/case-fe-modernize';
import caseCollaboration from './data/cs/case-collaboration';
import caseFePlatform from './data/cs/case-fe-platform';
import database from './data/cs/database';
import datastructure from './data/cs/datastructure';
import frontendPractice from './data/cs/frontend-practice';
import htmlCss from './data/cs/html-css';
import csDjango from './data/cs/django';
import infra from './data/cs/infra';
import java from './data/cs/java';
import kotlin from './data/cs/kotlin';
import javascript from './data/cs/javascript';
import nestjs from './data/cs/nestjs';
import network from './data/cs/network';
import oop from './data/cs/oop';
import os from './data/cs/os';
import practice from './data/cs/practice';
import python from './data/cs/python';
import csReact from './data/cs/react';
import security from './data/cs/security';
import csSpring from './data/cs/spring';
import csVue from './data/cs/vue';
import webPerformance from './data/cs/web-performance';
import webSecurity from './data/cs/web-security';
import reviewDjango from './data/review/django';
import reviewNest from './data/review/nest';
import reviewReact from './data/review/react';
import reviewSpring from './data/review/spring';
import reviewSpringKotlin from './data/review/spring-kotlin';
import reviewVue from './data/review/vue';
import { REVIEW_FRAMEWORK_MAP } from './review/frameworks';
import type {
  AlgoPattern,
  AlgoTopicContent,
  CodeLanguage,
  CsCategoryContent,
  CsLesson,
  FrameworkId,
  InterviewCard,
  QuizQuestion,
  ReviewChallenge,
  ReviewFrameworkContent,
  ReviewPattern,
  ReviewVariantContent,
  SolveLanguage,
} from './types';

export * from './types';
export { ALGO_TOPICS, ALGO_TOPIC_MAP } from './algorithm/topics';
export { CS_CATEGORIES, CS_CATEGORY_MAP, CS_GROUPS, FRAMEWORK_LANGUAGE_CATEGORIES, isCaseCategory } from './cs/categories';
export {
  DEV_TRACK_LABEL,
  DEV_TRACKS,
  REVIEW_CATEGORY_LABEL,
  REVIEW_FRAMEWORK_MAP,
  REVIEW_FRAMEWORKS,
  SEVERITY_LABEL,
  TRACK_SIDE_LABEL,
  trackSides,
} from './review/frameworks';

export const ALGO_QUIZ: Record<string, AlgoTopicContent> = {
  complexity,
  implementation,
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
  kotlin,
  javascript,
  python,
  spring: csSpring,
  nestjs,
  django: csDjango,
  react: csReact,
  vue: csVue,
  browser,
  'html-css': htmlCss,
  'web-performance': webPerformance,
  'web-security': webSecurity,
  'frontend-practice': frontendPractice,
  architecture,
  infra,
  oop,
  practice,
  'case-traffic': caseTraffic,
  'case-migration': caseMigration,
  'case-integration': caseIntegration,
  'case-concurrency': caseConcurrency,
  'case-performance': casePerformance,
  'case-incident': caseIncident,
  'case-legacy': caseLegacy,
  'case-fe-performance': caseFePerformance,
  'case-fe-modernize': caseFeModernize,
  'case-fe-platform': caseFePlatform,
  'case-collaboration': caseCollaboration,
  'ai-agent': aiAgent,
};

export const REVIEW_CONTENT: Record<FrameworkId, ReviewFrameworkContent> = {
  spring: reviewSpring,
  nest: reviewNest,
  django: reviewDjango,
  react: reviewReact,
  vue: reviewVue,
};

/** 리뷰 콘텐츠의 다른 언어 버전 (프레임워크 → 언어 → id 별 코드 · 설명) */
export const REVIEW_VARIANTS: Partial<Record<FrameworkId, Partial<Record<CodeLanguage, ReviewVariantContent>>>> = {
  spring: { kotlin: reviewSpringKotlin },
};

/** 프레임워크가 코드 예제를 제공하는 언어 (대표 언어 + 다른 언어 버전) */
export function reviewLanguages(framework: FrameworkId): CodeLanguage[] {
  const fw = REVIEW_FRAMEWORK_MAP[framework];
  return [fw.language, ...(fw.variants ?? [])];
}

/** 패턴을 해당 언어 버전으로 바꾼다. 그 언어 버전이 없으면 원본 그대로 */
export function resolvePattern(p: ReviewPattern, language?: CodeLanguage): ReviewPattern {
  const v = language ? REVIEW_VARIANTS[p.framework]?.[language]?.patterns[p.id] : undefined;
  if (!v) return p;
  return {
    ...p,
    before: v.before,
    after: v.after,
    title: v.title ?? p.title,
    summary: v.summary ?? p.summary,
    problem: v.problem ?? p.problem,
    explanation: v.explanation ?? p.explanation,
    checklist: v.checklist ?? p.checklist,
  };
}

/** 리뷰 퀴즈를 해당 언어 버전으로 바꾼다. 채점 줄 번호도 그 언어의 코드 기준으로 바뀐다 */
export function resolveChallenge(ch: ReviewChallenge, language?: CodeLanguage): ReviewChallenge {
  const v = language ? REVIEW_VARIANTS[ch.framework]?.[language]?.challenges[ch.id] : undefined;
  if (!v || v.issues.length !== ch.issues.length) return ch;
  return {
    ...ch,
    code: v.code,
    improved: v.improved,
    title: v.title ?? ch.title,
    context: v.context ?? ch.context,
    question: v.question ?? ch.question,
    summary: v.summary ?? ch.summary,
    issues: ch.issues.map((issue, i) => {
      const o = v.issues[i];
      return {
        ...issue,
        lines: o.lines,
        title: o.title ?? issue.title,
        description: o.description ?? issue.description,
        suggestion: o.suggestion ?? issue.suggestion,
      };
    }),
  };
}

/** 코딩 테스트 언어 (알고리즘 구현 예제의 언어 전환 순서) */
export const SOLVE_LANGUAGE_IDS: SolveLanguage[] = ['python', 'java', 'kotlin', 'cpp', 'javascript'];

/** 토픽별 문제 유형 (토픽 안의 order 순) */
export const ALGO_PATTERNS: Record<string, AlgoPattern[]> = Object.fromEntries(
  ALGO_TOPICS.map((t) => [t.id, PATTERNS.filter((p) => p.topicId === t.id).sort((a, b) => a.order - b.order)]),
);
/** 모든 문제 유형 (토픽 순 → 토픽 안의 order 순) */
export const ALL_ALGO_PATTERNS: AlgoPattern[] = ALGO_TOPICS.flatMap((t) => ALGO_PATTERNS[t.id]);
export const ALGO_PATTERN_MAP: Record<string, AlgoPattern> = Object.fromEntries(ALL_ALGO_PATTERNS.map((p) => [p.id, p]));

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

export const PATTERN_MAP: Record<string, ReviewPattern> = {};
export const CHALLENGE_MAP: Record<string, ReviewChallenge> = {};
for (const fw of Object.values(REVIEW_CONTENT)) {
  for (const p of fw.patterns) PATTERN_MAP[p.id] = p;
  for (const ch of fw.challenges) CHALLENGE_MAP[ch.id] = ch;
}

/** CS 이론 레슨 — 카테고리 순 → 카테고리 안의 순서 */
export const ALL_LESSONS: CsLesson[] = CS_CATEGORIES.flatMap((cat) => CS_CONTENT[cat.id]?.lessons ?? []);
export const LESSON_MAP: Record<string, CsLesson> = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l]));
/** 레슨 id → 연결된 확인 퀴즈 id (QuizQuestion.lessonId) */
export const LESSON_QUESTION_IDS: Record<string, string[]> = {};
for (const q of Object.values(QUESTION_MAP)) {
  if (q.lessonId && LESSON_MAP[q.lessonId]) (LESSON_QUESTION_IDS[q.lessonId] ??= []).push(q.id);
}

export const ALL_QUESTION_IDS = Object.keys(QUESTION_MAP);
export const ALL_CARD_IDS = Object.keys(CARD_MAP);

export const CONTENT_STATS = {
  algoQuestions: ALGO_TOPICS.reduce((n, t) => n + (ALGO_QUIZ[t.id]?.questions.length ?? 0), 0),
  algoPatterns: ALL_ALGO_PATTERNS.length,
  csQuestions: CS_CATEGORIES.reduce((n, c) => n + (CS_CONTENT[c.id]?.quiz.length ?? 0), 0),
  cards: ALL_CARD_IDS.length,
  lessons: ALL_LESSONS.length,
  patterns: Object.keys(PATTERN_MAP).length,
  challenges: Object.keys(CHALLENGE_MAP).length,
};
