/**
 * 순수 로직 테스트 (외부 도구 불필요)
 *   npm test
 */
import assert from 'node:assert/strict';

import {
  ALL_LESSONS,
  CS_CATEGORIES,
  CS_CATEGORY_MAP,
  CS_CONTENT,
  FRAMEWORK_LANGUAGE_CATEGORIES,
  LESSON_QUESTION_IDS,
  QUESTION_MAP,
  QUESTION_SOURCE,
} from '../src/content';
import type { McqChoicesQuestion, McqPoolQuestion } from '../src/content/types';
import { backupFileName, createBackup, describeBackup, parseBackup } from '../src/features/progress/backup';
import { arrangeMcq, correctChoiceText, presentMcq, shuffledOrder } from '../src/features/progress/choices';
import {
  courseCodeLanguages,
  courseKey,
  csCategoriesForCourse,
  csQuestionGroupsForCourse,
  isCategoryInTrack,
  isQuestionForCourse,
  partitionCategoriesForCourse,
  sideOfDay,
  solveLanguagesFor,
  type Course,
} from '../src/features/progress/course';
import { composeDailyQuiz, dailyQuizQuota, type DailyQuizInput } from '../src/features/progress/daily-quiz';
import {
  categoryLessons,
  isLessonUnderstood,
  lessonStatus,
  nextLessonCandidates,
  pickLessonCheck,
  type LessonRecord,
} from '../src/features/progress/lessons';
import { migrateProgress } from '../src/features/progress/migrate';
import { dailyQuestionIds, quizUpToDate, trackSummary, type DailyPlan } from '../src/features/progress/selectors';
import { useProgress, type ProgressData, type ProgressState } from '../src/features/progress/store';
import { computeBestStreak, computeStreak, dayKey, seededRandom } from '../src/lib/date';
import { diffLines, diffStats } from '../src/lib/diff';
import { highlightLines } from '../src/lib/highlight';
import { resultsMatch } from './lib/harness/compare';
import { parseHarnessOutput } from './lib/harness/protocol';
import { parseInline, parseMarkdown } from '../src/lib/markdown';
import { staticPages } from './lib/prerender';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log('markdown');
test('인라인: 굵게와 코드, 코드 안의 ** 는 굵게가 아님', () => {
  assert.deepEqual(parseInline('**O(n)**이고 `a**b` 다'), [
    { text: 'O(n)', bold: true },
    { text: '이고 ' },
    { text: 'a**b', code: true },
    { text: ' 다' },
  ]);
});
test('블록: 제목 · 목록 · 팁 · 코드 · 표', () => {
  const blocks = parseMarkdown(
    '### 제목\n문단 1\n이어짐\n\n- a\n- b\n\n1. 하나\n2. 둘\n\n> 팁\n\n```python\nx = 1\n```\n\n| A | B |\n|---|---|\n| 1 | `x|y` |',
  );
  assert.deepEqual(
    blocks.map((b) => b.type),
    ['heading', 'paragraph', 'bullet', 'ordered', 'quote', 'code', 'table'],
  );
  const table = blocks[6] as Extract<(typeof blocks)[number], { type: 'table' }>;
  assert.equal(table.rows[0][1][0].text, 'x|y');
  const code = blocks[5] as Extract<(typeof blocks)[number], { type: 'code' }>;
  assert.equal(code.lang, 'python');
  assert.equal(code.code, 'x = 1');
});

console.log('diff');
test('줄 단위 diff', () => {
  const lines = diffLines('a\nb\nc', 'a\nB\nc\nd');
  assert.deepEqual(
    lines.map((l) => l.type),
    ['same', 'del', 'add', 'same', 'add'],
  );
  assert.deepEqual(diffStats(lines), { added: 2, removed: 1 });
});

console.log('compare');
test('exact / unordered / float', () => {
  assert.equal(resultsMatch([1, 2], [1, 2]), true);
  assert.equal(resultsMatch([1, 2], [2, 1]), false);
  assert.equal(resultsMatch([1, 2], [2, 1], 'unordered'), true);
  assert.equal(resultsMatch(0.1 + 0.2, 0.3, 'float'), true);
  assert.equal(resultsMatch(0.1 + 0.2, 0.3), false);
  assert.equal(resultsMatch([[1], [2]], [[1], [2]]), true);
  assert.equal(resultsMatch(true, 1), false);
});

console.log('protocol');
test('케이스별 출력 분리 · 비정상 종료 감지', () => {
  const out = '@@TJ:BEGIN:0\nhello\n\n@@TJ:END:0:OK:1.50:[1,2]\n@@TJ:BEGIN:1\nno newline@@TJ:END:1:ERR:0.10:"boom"\n@@TJ:BEGIN:2\npartial';
  const r = parseHarnessOutput(out);
  assert.equal(r.outputs.length, 2);
  assert.deepEqual(r.outputs[0], { index: 0, ok: true, value: [1, 2], stdout: 'hello\n', timeMs: 1.5 });
  assert.equal(r.outputs[1].ok, false);
  assert.equal(r.outputs[1].stdout, 'no newline');
  assert.equal(r.crashedIndex, 2);
  assert.equal(r.crashedStdout, 'partial');
});

console.log('highlight');
test('키워드 · 문자열 · 주석 · 여러 줄 토큰', () => {
  const lines = highlightLines('def f():\n    """doc\n    string"""\n    return "x"  # c', 'python');
  assert.equal(lines.length, 4);
  assert.equal(lines[0][0].kind, 'keyword');
  assert.ok(lines[2].some((t) => t.kind === 'string'));
  assert.ok(lines[3].some((t) => t.kind === 'comment'));
});

test('JSX · Vue 템플릿 · CSS 속성', () => {
  const kinds = (code: string, lang: string) => highlightLines(code, lang).flat().filter((t) => t.kind !== 'plain');
  const tsx = kinds('const a = useState<number>(0);\nreturn <Item key={id} className="x" />;', 'tsx');
  assert.ok(tsx.some((t) => t.kind === 'type' && t.text === 'Item'));
  assert.ok(tsx.some((t) => t.kind === 'annotation' && t.text === 'className'));
  assert.ok(!tsx.some((t) => t.kind === 'keyword' && t.text === 'number')); // 제네릭은 태그가 아니다
  const vue = kinds('<script setup lang="ts">\nconst n = ref(0);\n</script>\n<template>\n  <p v-if="ok" @click="n++">{{ n }}</p>\n</template>\n<style>\n.a { color: red; }\n</style>', 'vue');
  assert.ok(vue.some((t) => t.kind === 'keyword' && t.text === 'const'));
  assert.ok(vue.some((t) => t.kind === 'annotation' && t.text === 'v-if'));
  assert.ok(vue.some((t) => t.kind === 'annotation' && t.text === '@click'));
  assert.ok(vue.some((t) => t.kind === 'type' && t.text === 'color'));
  assert.ok(kinds('name: app', 'yaml').some((t) => t.kind === 'type' && t.text === 'name'));
});

console.log('backup');
test('학습 기록 백업 만들기 · 읽기', () => {
  const progress: ProgressData = {
    profile: {
      nickname: '점프',
      goal: 'new',
      language: 'kotlin',
      track: 'fullstack',
      framework: 'spring',
      frontendFramework: 'vue',
      dailyGoal: 10,
      onboarded: true,
    },
    settings: { theme: 'dark', haptics: true, reviewLanguage: { spring: 'kotlin' } },
    quiz: { q1: { attempts: 2, correct: 1, last: true, lastAt: 1 } },
    cards: {},
    problems: { p1: { solved: true, language: 'kotlin', bestPassed: 3, total: 3, submissions: 1, lastAt: 1 } },
    patterns: {},
    challenges: {},
    algoPatterns: { 'binary-search-lower-bound': 1 },
    lessons: { 'cs-os-l01': { startedAt: 1, readAt: 2, completedAt: 3, correct: 2, total: 3, lastAt: 3 } },
    bookmarks: {},
    activity: { '2026-10-09': 3, '2026-10-10': 1 },
    daily: null,
  } as ProgressData;
  const now = new Date(2026, 9, 10, 9, 0);
  const file = createBackup(progress, now);
  const parsed = parseBackup(JSON.stringify(file));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.backup.progress, progress);
  assert.equal(parsed.backup.drafts, undefined);
  // 이전 버전 백업(작성 중인 코드 포함)도 읽을 수 있다
  const old = { ...file, drafts: { drafts: { 'p1:kotlin': 'class Solution {}' }, lastLanguage: { p1: 'kotlin' } } };
  assert.ok(parseBackup(JSON.stringify(old)).ok);
  assert.equal(backupFileName(now), 'to-jump-backup-2026-10-10.json');
  assert.match(describeBackup(parsed.backup), /학습한 날 2일 · 퀴즈 1문항 · 알고리즘 유형 1개 · CS 이론 1개/);
});
test('잘못된 백업 파일은 거절', () => {
  const ok = { app: 'to-jump-programmer', format: 1, exportedAt: '', progress: { profile: {}, settings: {} } };
  const reject = (v: unknown) => assert.equal(parseBackup(typeof v === 'string' ? v : JSON.stringify(v)).ok, false);
  assert.equal(parseBackup(JSON.stringify(ok)).ok, true);
  reject('not json');
  reject({ ...ok, app: 'other-app' });
  reject({ ...ok, format: 99 });
  reject({ ...ok, progress: { settings: {} } });
  reject({ ...ok, progress: { ...ok.progress, quiz: [] } });
  reject({ ...ok, progress: { ...ok.progress, algoPatterns: 'x' } });
  reject({ ...ok, progress: { ...ok.progress, daily: 'x' } });
  reject({ ...ok, drafts: { drafts: { a: 1 }, lastLanguage: {} } });
});

console.log('daily quiz');
const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);
const compose = (input: Partial<DailyQuizInput> & { goal: number }) =>
  composeDailyQuiz({ wrong: [], cs: [ids('c', 40)], algo: ids('a', 40), seen: () => false, random: seededRandom(7), ...input });
test('하루 목표를 틀린 문제 : CS : 알고리즘 = 2 : 4 : 2 로 나눔', () => {
  assert.deepEqual(dailyQuizQuota(5), { wrong: 1, cs: 3, algo: 1 });
  assert.deepEqual(dailyQuizQuota(8), { wrong: 2, cs: 4, algo: 2 }); // 예전 고정 구성
  assert.deepEqual(dailyQuizQuota(10), { wrong: 2, cs: 5, algo: 3 });
  assert.deepEqual(dailyQuizQuota(20), { wrong: 5, cs: 10, algo: 5 });
  assert.deepEqual(dailyQuizQuota(30), { wrong: 7, cs: 15, algo: 8 });
});
test('목표 5 · 10 · 20 · 30 만큼 출제, 영역별 몫 · 틀린 문제 먼저', () => {
  const wrong = ['c39', 'a39', 'c38', 'a38', 'c37', 'a37', 'c36', 'a36'];
  const seen = (id: string) => wrong.includes(id);
  for (const goal of [5, 10, 20, 30]) {
    const quota = dailyQuizQuota(goal);
    const quiz = compose({ goal, wrong, seen });
    assert.equal(quiz.length, goal);
    assert.equal(new Set(quiz).size, goal);
    assert.deepEqual(quiz.slice(0, quota.wrong), wrong.slice(0, quota.wrong));
    const fresh = quiz.slice(quota.wrong);
    assert.equal(fresh.filter((id) => id.startsWith('c')).length, quota.cs);
    assert.equal(fresh.filter((id) => id.startsWith('a')).length, quota.algo);
    assert.ok(fresh.every((id) => !seen(id))); // 안 본 문제가 충분하면 본 문제는 다시 안 냄
  }
  assert.deepEqual(compose({ goal: 10, wrong, seen }), compose({ goal: 10, wrong, seen })); // 같은 날 · 같은 시드면 같은 구성
});
test('후보가 모자라면 다른 영역에서 채우고, 전체보다 많으면 있는 만큼만', () => {
  const quiz = compose({ goal: 10, cs: [ids('c', 2)] });
  assert.equal(quiz.length, 10);
  assert.equal(quiz.filter((id) => id.startsWith('c')).length, 2);
  // 틀린 문제가 없으면 그 몫도 새 문제로
  assert.equal(compose({ goal: 20 }).length, 20);
  // 안 본 문제를 다 쓰면 이미 푼 문제로 채움
  const seenAll = compose({ goal: 10, cs: [ids('c', 3)], algo: ids('a', 3), seen: (id) => id.endsWith('0') });
  assert.equal(seenAll.length, 6);
  assert.ok(seenAll.slice(-2).every((id) => id.endsWith('0')));
  assert.equal(compose({ goal: 30, cs: [ids('c', 4)], algo: ids('a', 3) }).length, 7);
  assert.deepEqual(compose({ goal: 10, cs: [], algo: [] }), []);
});
test('목표를 바꿔도 오늘 이미 푼 문제는 남김', () => {
  const keep = ['c1', 'a1', 'c2'];
  const wrong = ['c39', 'a39', 'c38', 'a38', 'c37'];
  const quiz = compose({ goal: 20, keep, wrong, seen: (id) => keep.includes(id) || wrong.includes(id) });
  assert.equal(quiz.length, 20);
  assert.deepEqual(quiz.slice(0, 3), keep);
  assert.deepEqual(quiz.slice(3, 8), wrong);
  // 남긴 문제도 영역 몫(CS 10 · 알고리즘 5)에 포함
  assert.equal(quiz.slice(8).filter((id) => id.startsWith('c')).length, 8);
  assert.equal(quiz.slice(8).filter((id) => id.startsWith('a')).length, 4);
  // 목표를 줄이면 앞에서부터 목표 수만큼
  assert.deepEqual(compose({ goal: 5, keep: ids('c', 8) }), ids('c', 5));
});
test('풀스택은 CS 후보 묶음을 번갈아 골라 한쪽으로 쏠리지 않음', () => {
  for (const seed of [1, 2, 3, 4]) {
    const quiz = composeDailyQuiz({
      goal: 20,
      wrong: ids('w', 5),
      cs: [ids('b', 30), ids('f', 30), ids('x', 30)],
      algo: ids('a', 30),
      seen: (id) => id.startsWith('w'),
      random: seededRandom(seed),
    });
    const count = (p: string) => quiz.filter((id) => id.startsWith(p)).length;
    assert.equal(count('b') + count('f') + count('x'), 10);
    assert.ok(Math.max(count('b'), count('f'), count('x')) - Math.min(count('b'), count('f'), count('x')) <= 1);
  }
  // 한 묶음이 모자라면 다른 묶음에서 채운다 (CS 몫 5 + 틀린 문제가 없어 남는 2)
  const short = composeDailyQuiz({ goal: 10, wrong: [], cs: [ids('b', 1), ids('f', 30)], algo: ids('a', 30), seen: () => false, random: seededRandom(1) });
  assert.equal(short.filter((id) => id.startsWith('b')).length, 1);
  assert.equal(short.filter((id) => id.startsWith('f')).length, 6);
});

console.log('course');
const course = (track: Course['track'], framework: Course['framework'] = 'spring', frontendFramework: Course['frontendFramework'] = 'react'): Course => ({
  track,
  framework,
  frontendFramework,
});
const catIds = (c: Course) => csCategoriesForCourse(c).map((cat) => cat.id);
test('언어 · 프레임워크 매핑은 실제 카테고리만, 모든 언어 카테고리는 어느 프레임워크에선가 출제', () => {
  const languageIds = CS_CATEGORIES.filter((c) => c.group === 'language').map((c) => c.id);
  for (const list of Object.values(FRAMEWORK_LANGUAGE_CATEGORIES)) assert.ok(list.every((id) => languageIds.includes(id)));
  assert.deepEqual([...new Set(Object.values(FRAMEWORK_LANGUAGE_CATEGORIES).flat())].sort(), [...languageIds].sort());
  // 프레임워크 카테고리는 프레임워크와 연결되고, 그 프레임워크와 같은 코스
  for (const cat of CS_CATEGORIES.filter((c) => c.group === 'framework')) {
    assert.ok(cat.framework, `${cat.id}: framework 없음`);
  }
  assert.equal(CS_CATEGORY_MAP.react.track, 'frontend');
  assert.equal(CS_CATEGORY_MAP.spring.track, 'backend');
});
test('백엔드 코스: 고른 프레임워크 · 언어만, 프론트엔드 카테고리 제외', () => {
  const ids = catIds(course('backend', 'django'));
  assert.ok(ids.includes('python') && !ids.includes('java') && !ids.includes('javascript'));
  assert.ok(ids.includes('django') && !ids.includes('spring') && !ids.includes('react'));
  assert.ok(ids.includes('database') && ids.includes('os') && !ids.includes('browser'));
});
test('프론트엔드 코스: 프론트엔드 · 공통 카테고리, 백엔드 전용 제외', () => {
  const ids = catIds(course('frontend', 'spring', 'vue'));
  assert.ok(ids.includes('javascript') && ids.includes('vue') && ids.includes('browser') && ids.includes('network'));
  assert.ok(!ids.includes('java') && !ids.includes('spring') && !ids.includes('react') && !ids.includes('database'));
  assert.equal(isCategoryInTrack(CS_CATEGORY_MAP.infra, 'frontend'), false);
  assert.equal(isCategoryInTrack(CS_CATEGORY_MAP.security, 'frontend'), true);
});
test('풀스택 코스: 두 쪽에서 고른 프레임워크 하나씩, CS 후보는 백엔드 · 프론트엔드 · 공통 묶음', () => {
  const c = course('fullstack', 'spring', 'vue');
  const ids = catIds(c);
  assert.ok(ids.includes('java') && ids.includes('javascript') && ids.includes('spring') && ids.includes('vue'));
  assert.ok(!ids.includes('react') && !ids.includes('nestjs') && !ids.includes('python'));
  assert.ok(ids.includes('database') && ids.includes('browser'));
  const groups = csQuestionGroupsForCourse(c);
  assert.ok(groups.length >= 1 && groups.length <= 3);
  assert.equal(csQuestionGroupsForCourse(course('backend')).length, 1);
  const all = groups.flat();
  assert.ok(all.every((id) => isQuestionForCourse(id, c)));
  // 다른 코스의 문제와 알고리즘 문제
  const javaQ = Object.keys(QUESTION_MAP).find((id) => QUESTION_MAP[id].categoryId === 'java');
  if (javaQ) assert.equal(isQuestionForCourse(javaQ, course('frontend')), false);
  const algoQ = Object.keys(QUESTION_MAP).find((id) => QUESTION_SOURCE[id] === 'algo' && !QUESTION_MAP[id].code)!;
  assert.equal(isQuestionForCourse(algoQ, course('frontend')), true);
  assert.equal(isQuestionForCourse('없는-문제', c), false);
});
test('Spring 코스는 Java · Kotlin 언어 문제를 함께 출제', () => {
  const spring = course('backend', 'spring');
  assert.ok(catIds(spring).includes('java') && catIds(spring).includes('kotlin'));
  assert.ok(catIds(course('fullstack', 'spring', 'vue')).includes('kotlin'));
  assert.ok(!catIds(course('backend', 'nest')).includes('kotlin') && !catIds(course('frontend')).includes('kotlin'));
  const groups = csQuestionGroupsForCourse(spring);
  const firstOf = (cat: string) => groups.flat().find((id) => QUESTION_MAP[id].categoryId === cat);
  const javaQ = firstOf('java');
  const kotlinQ = firstOf('kotlin');
  assert.ok(javaQ && kotlinQ);
  // 안 푼 CS 문제가 Java · Kotlin 하나씩뿐이면 오늘의 퀴즈에 둘 다 나온다
  const quiz = composeDailyQuiz({ goal: 10, wrong: [], cs: groups, algo: [], seen: (id) => id !== javaQ && id !== kotlinQ, random: seededRandom(3) });
  assert.ok(quiz.includes(javaQ) && quiz.includes(kotlinQ));
});
test('AI Agent 카테고리는 모든 코스에서 출제', () => {
  for (const c of [course('backend', 'django'), course('frontend', 'spring', 'vue'), course('fullstack')]) {
    assert.ok(catIds(c).includes('ai-agent'));
  }
});
console.log('course scope (#23)');
const ALGO_IDS = Object.keys(QUESTION_MAP).filter((id) => QUESTION_SOURCE[id] === 'algo');
const algoWithCode = (lang: string) => ALGO_IDS.find((id) => QUESTION_MAP[id].code?.language === lang);
const sorted = (set: Set<string>) => [...set].sort();
test('알고리즘 코드 문제는 내 언어(코딩 테스트 언어 + 고른 프레임워크의 언어)로 쓴 것만 오늘의 퀴즈 범위', () => {
  assert.deepEqual(sorted(courseCodeLanguages(course('backend', 'spring'))), ['java', 'kotlin']);
  assert.deepEqual(sorted(courseCodeLanguages({ ...course('frontend'), language: 'python' })), ['javascript', 'python', 'typescript']);
  assert.deepEqual(sorted(courseCodeLanguages(course('fullstack', 'django', 'vue'))), ['javascript', 'python', 'typescript']);
  const noCode = ALGO_IDS.find((id) => !QUESTION_MAP[id].code)!;
  for (const c of [course('backend', 'spring'), course('frontend'), course('fullstack', 'django')]) assert.ok(isQuestionForCourse(noCode, c));
  const py = algoWithCode('python');
  if (py) {
    assert.equal(isQuestionForCourse(py, course('backend', 'spring')), false);
    assert.equal(isQuestionForCourse(py, { ...course('backend', 'spring'), language: 'python' }), true);
    assert.equal(isQuestionForCourse(py, course('backend', 'django')), true);
  }
  const java = algoWithCode('java');
  if (java) {
    assert.equal(isQuestionForCourse(java, course('backend', 'spring')), true);
    assert.equal(isQuestionForCourse(java, { ...course('frontend'), language: 'kotlin' }), false);
  }
});

const BACKENDS = ['spring', 'nest', 'django'] as const;
const FRONTENDS = ['react', 'vue'] as const;
const LANGUAGES = ['python', 'java', 'kotlin', 'cpp', 'javascript'] as const;
/** 이슈 #6 · #23 의 기대 동작을 그대로 적은 표 (구현의 매핑과 따로 둔다) */
const EXPECTED_LANGS: Record<string, string[]> = { spring: ['java', 'kotlin'], nest: ['javascript'], django: ['python'], react: ['javascript'], vue: ['javascript'] };
const allCourses = (): Course[] =>
  (['backend', 'frontend', 'fullstack'] as const).flatMap((track) =>
    BACKENDS.flatMap((framework) => FRONTENDS.flatMap((frontendFramework) => LANGUAGES.map((language) => ({ track, framework, frontendFramework, language })))),
  );
const chosenFrameworks = (c: Course) =>
  c.track === 'backend' ? [c.framework] : c.track === 'frontend' ? [c.frontendFramework] : [c.framework, c.frontendFramework];
/** 기대 동작 기준으로 오늘의 퀴즈에 나와도 되는 문제인지 — 안 되면 이유를 돌려준다 */
function outOfScope(id: string, c: Course): string | null {
  const q = QUESTION_MAP[id];
  const fws: string[] = chosenFrameworks(c);
  const langs = new Set(fws.flatMap((f) => EXPECTED_LANGS[f]));
  if (QUESTION_SOURCE[id] === 'cs') {
    const cat = CS_CATEGORY_MAP[q.categoryId];
    if (cat.group === 'language' && !langs.has(cat.id)) return `고르지 않은 언어 ${cat.id}`;
    if (cat.framework && !fws.includes(cat.framework)) return `고르지 않은 프레임워크 ${cat.id}`;
    if (cat.track && c.track !== 'fullstack' && cat.track !== c.track) return `다른 코스 ${cat.id}`;
    return null;
  }
  const lang = q.code?.language;
  if (!lang || !['python', 'java', 'kotlin', 'cpp', 'javascript', 'typescript'].includes(lang)) return null;
  if (c.language) langs.add(c.language);
  const ok = langs.has(lang) || (lang === 'typescript' && langs.has('javascript'));
  return ok ? null : `다른 언어 코드 ${lang}`;
}
const base = useProgress.getState();
const stateFor = (c: Course, quiz: ProgressState['quiz'] = {}): ProgressState => ({
  ...base,
  quiz,
  profile: { ...base.profile, ...c, nickname: '점프', dailyGoal: 30 },
});
test('오늘의 퀴즈: 코스 × 프레임워크 × 코딩 테스트 언어마다 범위 밖 언어 · 기술 문제 없음 (틀린 문제 몫 포함)', () => {
  // 모든 문제를 한 번씩 틀린 기록 — 예전에 다른 언어 · 프레임워크를 고르고 틀린 문제도 오늘의 퀴즈에는 나오지 않아야 한다
  const allWrong = Object.fromEntries(Object.keys(QUESTION_MAP).map((id, i) => [id, { attempts: 1, correct: 0, last: false, lastAt: i }]));
  for (const c of allCourses()) {
    for (const quiz of [{}, allWrong]) {
      for (const day of [1, 2]) {
        const ids = dailyQuestionIds(stateFor(c, quiz), new Date(2026, 9, day));
        assert.ok(ids.length > 0);
        for (const id of ids) {
          const why = outOfScope(id, c);
          assert.equal(why, null, `${c.track}/${c.framework}/${c.frontendFramework}/${c.language}: ${id} (${why})`);
        }
      }
    }
  }
});
test('면접 CS 탭 · 랜덤 10문제 후보는 오늘의 퀴즈와 같은 범위, 나머지는 접힌 목록으로', () => {
  for (const c of allCourses().filter((x) => x.language === 'python')) {
    const { mine, others } = partitionCategoriesForCourse(c);
    assert.deepEqual(mine.map((cat) => cat.id), catIds(c));
    assert.equal(mine.length + others.length, CS_CATEGORIES.length);
    assert.ok(others.every((cat) => !mine.includes(cat)));
    for (const cat of mine) for (const q of CS_CONTENT[cat.id]?.quiz ?? []) assert.equal(outOfScope(q.id, c), null, q.id);
  }
  // 신고된 사례: Spring 을 골랐는데 Python · Django · NestJS 가 내 코스로 보이던 문제
  const spring = partitionCategoriesForCourse(course('backend', 'spring')).others.map((cat) => cat.id);
  for (const id of ['python', 'django', 'nestjs', 'javascript', 'react']) assert.ok(spring.includes(id), id);
});
test('저장된 오늘의 플랜에 범위 밖 문제가 있으면 다시 만든다', () => {
  const c: Course = { ...course('backend', 'spring'), language: 'java' };
  const state = stateFor(c);
  const plan: DailyPlan = { key: '2026-10-14', goal: 30, course: courseKey(c), questionIds: dailyQuestionIds(state, new Date(2026, 9, 14)) };
  assert.equal(quizUpToDate(plan, state.profile), true);
  const django = CS_CONTENT.django?.quiz[0]?.id;
  if (django) assert.equal(quizUpToDate({ ...plan, questionIds: [...plan.questionIds, django] }, state.profile), false);
  const py = algoWithCode('python');
  if (py) {
    const withPy = { ...plan, questionIds: [...plan.questionIds, py] };
    assert.equal(quizUpToDate(withPy, state.profile), false);
    // 코딩 테스트 언어를 Python 으로 바꾸면 그 문제는 범위 안
    assert.equal(quizUpToDate(withPy, { ...state.profile, language: 'python' }), true);
  }
  assert.equal(quizUpToDate({ ...plan, questionIds: [...plan.questionIds, '없는-문제'] }, state.profile), false);
  assert.equal(quizUpToDate(plan, { ...state.profile, framework: 'django' }), false);
  assert.equal(quizUpToDate(plan, { ...state.profile, dailyGoal: 10 }), false);
});
test('학습 진행 요약의 CS 집계는 오늘의 퀴즈와 같은 범위', () => {
  for (const c of [course('backend', 'spring'), course('frontend', 'spring', 'vue'), course('fullstack', 'nest', 'react')]) {
    const summary = trackSummary(stateFor(c));
    const cats = catIds(c);
    const count = (key: 'quiz' | 'cards' | 'lessons') => cats.reduce((n, id) => n + (CS_CONTENT[id]?.[key]?.length ?? 0), 0);
    assert.equal(summary.cs.quiz.total, count('quiz'));
    assert.equal(summary.cs.cards, count('cards'));
    assert.equal(summary.cs.lessons, count('lessons'));
  }
});
test('풀스택의 오늘의 추천은 날마다 백엔드 · 프론트엔드를 번갈아', () => {
  const d1 = new Date(2026, 9, 13);
  const d2 = new Date(2026, 9, 14);
  assert.notEqual(sideOfDay('fullstack', d1), sideOfDay('fullstack', d2));
  assert.notEqual(sideOfDay('fullstack', d1), sideOfDay('fullstack', d1, 1)); // 리뷰와 면접 질문은 엇갈리게
  assert.equal(sideOfDay('frontend', d1), 'frontend');
  assert.equal(sideOfDay('backend', d2, 1), 'backend');
});
test('코스별 코딩 테스트 언어 순서', () => {
  assert.equal(solveLanguagesFor('frontend')[0], 'javascript');
  assert.equal(solveLanguagesFor('frontend').length, 5);
  assert.equal(solveLanguagesFor('backend')[0], 'python');
});
test('이전 버전 학습 기록 옮기기 (v1 → 백엔드 코스, v2 → 레슨 기록)', () => {
  const old = { profile: { nickname: '점프', framework: 'django', language: 'java' }, quiz: { q1: { attempts: 1 } } };
  const migrated = migrateProgress(old, 1);
  assert.equal(migrated.profile?.track, 'backend');
  assert.equal(migrated.profile?.frontendFramework, 'react');
  assert.equal(migrated.profile?.framework, 'django');
  assert.deepEqual(migrated.quiz, old.quiz);
  assert.deepEqual(migrated.lessons, {}); // v3: 레슨 기록
  const v2 = { profile: { track: 'frontend', frontendFramework: 'vue' } };
  assert.deepEqual(migrateProgress(v2, 2), { ...v2, lessons: {} });
  const current = { ...v2, lessons: { 'cs-os-l01': { startedAt: 1, lastAt: 1 } } };
  assert.deepEqual(migrateProgress(current, 3), current);
});

console.log('lessons');
test('레슨 상태: 안 읽음 → 읽는 중 → 완료, 2/3 이상이면 이해함', () => {
  assert.equal(lessonStatus(undefined), 'new');
  assert.equal(lessonStatus({ startedAt: 1, lastAt: 1 }), 'reading');
  assert.equal(lessonStatus({ startedAt: 1, readAt: 2, lastAt: 2 }), 'reading');
  const done = (correct: number, total: number): LessonRecord => ({ startedAt: 1, completedAt: 3, correct, total, lastAt: 3 });
  assert.equal(lessonStatus(done(0, 3)), 'done');
  assert.equal(isLessonUnderstood(done(2, 3)), true);
  assert.equal(isLessonUnderstood(done(1, 3)), false);
  assert.equal(isLessonUnderstood(done(2, 2)), true);
  assert.equal(isLessonUnderstood({ startedAt: 1, lastAt: 1 }), false);
});
test('레슨마다 확인 퀴즈 3개 이상이 연결되고, 안 푼 문제를 먼저 3개 고름', () => {
  for (const l of ALL_LESSONS) assert.ok((LESSON_QUESTION_IDS[l.id]?.length ?? 0) >= 3, `${l.id}: 확인 퀴즈 부족`);
  const lesson = ALL_LESSONS.find((l) => (LESSON_QUESTION_IDS[l.id]?.length ?? 0) >= 4);
  if (!lesson) return;
  const ids = LESSON_QUESTION_IDS[lesson.id];
  const seen = new Set(ids.slice(0, ids.length - 3));
  const picked = pickLessonCheck(lesson.id, (id) => seen.has(id), seededRandom(3));
  assert.equal(picked.length, 3);
  assert.equal(new Set(picked).size, 3);
  assert.ok(picked.every((id) => !seen.has(id))); // 안 푼 문제가 3개 있으면 그것만
  assert.ok(picked.every((id) => QUESTION_MAP[id].lessonId === lesson.id));
});
test('오늘 읽을 레슨: 카테고리마다 다음 레슨, 읽다 만 레슨이 있으면 그것', () => {
  const cat = CS_CATEGORIES.find((c) => categoryLessons(c.id).length >= 2);
  if (!cat) return;
  const [first, second] = categoryLessons(cat.id);
  assert.equal(nextLessonCandidates([cat], {})[0].id, first.id);
  const records: Record<string, LessonRecord> = { [first.id]: { startedAt: 1, completedAt: 2, total: 3, correct: 3, lastAt: 2 } };
  assert.equal(nextLessonCandidates([cat], records)[0].id, second.id);
  const other = CS_CATEGORIES.find((c) => c.id !== cat.id && categoryLessons(c.id).length > 0);
  if (other) {
    const reading = { ...records, [second.id]: { startedAt: 3, lastAt: 3 } };
    assert.deepEqual(nextLessonCandidates([cat, other], reading).map((l) => l.id), [second.id]);
  }
});

console.log('choices (#28)');
const fixedQ: McqChoicesQuestion = {
  id: 't-fixed',
  categoryId: 'os',
  type: 'mcq',
  difficulty: 1,
  prompt: '문제',
  explanation: '해설',
  choices: ['정답', '오답1', '오답2', '오답3'],
  answer: 0,
};
const poolQ: McqPoolQuestion = {
  id: 't-pool',
  categoryId: 'os',
  type: 'mcq',
  difficulty: 1,
  prompt: '문제',
  explanation: '해설',
  correct: '정답',
  distractors: ['가', '나', '다', '라', '마', '바'].map((t) => ({ text: t, why: `${t} 이유` })),
};
const order = (p: ReturnType<typeof presentMcq>) => p.choices.map((ch) => ch.text).join('|');
test('같은 문제 · 같은 회차면 같은 구성, 다른 시드면 순서가 달라짐', () => {
  assert.equal(order(presentMcq(fixedQ, 3)), order(presentMcq(fixedQ, 3)));
  assert.equal(order(arrangeMcq(poolQ, seededRandom(1))), order(arrangeMcq(poolQ, seededRandom(1))));
  const orders = new Set(Array.from({ length: 20 }, (_, n) => order(arrangeMcq(fixedQ, seededRandom(n)))));
  assert.ok(orders.size > 5);
  // 원본 문제는 바뀌지 않는다
  assert.deepEqual(fixedQ.choices, ['정답', '오답1', '오답2', '오답3']);
});
test('섞은 뒤에도 정답 판정이 맞음 (모든 정답 위치 · 여러 시드)', () => {
  const positions = new Set<number>();
  for (let answer = 0; answer < 4; answer++) {
    const q = { ...fixedQ, answer };
    for (let seed = 0; seed < 50; seed++) {
      const p = arrangeMcq(q, seededRandom(seed));
      assert.equal(p.choices.length, 4);
      assert.equal(p.choices.filter((ch) => ch.correct).length, 1);
      assert.equal(p.choices[p.answer].text, q.choices[answer]);
      assert.equal(p.choices[p.answer].source, answer);
      assert.deepEqual([...p.choices.map((ch) => ch.text)].sort(), [...q.choices].sort());
      positions.add(p.answer);
    }
  }
  assert.equal(positions.size, 4);
  assert.equal(correctChoiceText({ ...fixedQ, answer: 2 }), '오답2');
});
test('오답 풀에서 정확히 pick 개를 중복 없이 고르고 정답은 항상 포함, 오답 이유를 함께', () => {
  for (let seed = 0; seed < 50; seed++) {
    for (const pick of [undefined, 2, 4]) {
      const p = arrangeMcq({ ...poolQ, pick }, seededRandom(seed));
      const wrong = p.choices.filter((ch) => !ch.correct);
      assert.equal(wrong.length, pick ?? 3);
      assert.equal(new Set(wrong.map((ch) => ch.text)).size, wrong.length);
      assert.ok(wrong.every((ch) => ch.why === `${ch.text} 이유` && poolQ.distractors[ch.source].text === ch.text));
      assert.equal(p.choices[p.answer].text, '정답');
      assert.equal(p.choices[p.answer].why, undefined);
    }
  }
  assert.equal(correctChoiceText(poolQ), '정답');
  // 풀이 pick 보다 적으면 있는 만큼만
  const short = arrangeMcq({ ...poolQ, distractors: poolQ.distractors.slice(0, 2) }, seededRandom(3));
  assert.equal(short.choices.length, 3);
});
test('다시 풀면 직전 회차와 정답 위치 · 오답 조합이 다름', () => {
  const wrongSet = (p: ReturnType<typeof presentMcq>) => p.choices.filter((ch) => !ch.correct).map((ch) => ch.source).sort().join(',');
  for (const q of [fixedQ, poolQ]) {
    for (let n = 1; n < 30; n++) {
      const prev = presentMcq(q, n - 1);
      const cur = presentMcq(q, n);
      assert.notEqual(cur.answer, prev.answer, `${q.id} ${n}회차 정답 위치`);
      if (q === poolQ) assert.notEqual(wrongSet(cur), wrongSet(prev), `${n}회차 오답 조합`);
    }
  }
});
test('고정 순서 옵션: fixedOrder 는 그대로, pinLast 는 마지막 보기만 고정', () => {
  for (let seed = 0; seed < 30; seed++) {
    const fixed = arrangeMcq({ ...fixedQ, fixedOrder: true }, seededRandom(seed));
    assert.deepEqual(fixed.choices.map((ch) => ch.text), fixedQ.choices);
    assert.equal(fixed.answer, 0);
    const pinned = arrangeMcq({ ...fixedQ, choices: ['가', '나', '다', '위 보기 모두'], answer: 3, pinLast: true }, seededRandom(seed));
    assert.equal(pinned.choices[3].text, '위 보기 모두');
    assert.equal(pinned.answer, 3);
  }
  // 섞을 수 없는 문제는 다시 풀어도 같은 구성 (무한 반복 없이)
  assert.equal(presentMcq({ ...fixedQ, fixedOrder: true }, 5).answer, 0);
});
test('실제 콘텐츠의 모든 객관식: 보기 구성 후 정답 텍스트가 그대로', () => {
  for (const q of Object.values(QUESTION_MAP)) {
    if (q.type !== 'mcq') continue;
    for (const attempt of [0, 1, 2]) {
      const p = presentMcq(q, attempt);
      assert.equal(p.choices[p.answer]?.text, correctChoiceText(q), q.id);
      assert.ok(p.choices.length >= 2 && p.choices.length <= 5, q.id);
    }
  }
});
test('코드 리뷰 챌린지 보기 섞기: 순열이고, 원래 인덱스로 채점하면 정답 집합이 같음', () => {
  const options = [true, false, true, false, false, true].map((correct, i) => ({ text: `o${i}`, correct }));
  const correctSet = (idx: number[]) => idx.filter((i) => options[i].correct).sort().join(',');
  for (let attempt = 0; attempt < 10; attempt++) {
    const o = shuffledOrder(options.length, 'spring-c01', attempt);
    assert.deepEqual([...o].sort(), [0, 1, 2, 3, 4, 5]);
    assert.equal(correctSet(o), '0,2,5');
  }
  assert.deepEqual(shuffledOrder(6, 'spring-c01', 1), shuffledOrder(6, 'spring-c01', 1));
  assert.notDeepEqual(shuffledOrder(6, 'spring-c01', 0), [0, 1, 2, 3, 4, 5]);
});

console.log('web pages');
test('웹 정적 페이지: 콘텐츠 화면마다 제목 · 설명 · 본문 HTML, 앱 기능 화면은 noindex', () => {
  const pages = staticPages('/');
  const paths = pages.map((p) => p.path);
  assert.equal(new Set(paths).size, paths.length);
  const expected = [
    '',
    'algorithm',
    'review',
    'interview',
    'about',
    'privacy',
    ...ALL_LESSONS.map((l) => `interview/lesson/${l.id}`),
    ...CS_CATEGORIES.map((c) => `interview/${c.id}`),
  ];
  for (const p of expected) assert.ok(paths.includes(p), p);
  for (const page of pages.filter((p) => !p.noindex)) {
    const text = page.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.ok(page.title.length >= 2 && page.description.length >= 20, page.path);
    assert.ok(/<h1>/.test(page.html) && text.length >= 200, `${page.path}: 본문이 짧음 (${text.length}자)`);
    assert.ok(!/<script/i.test(page.html), `${page.path}: 본문에 script 태그`);
    assert.ok(!/href="\/[^"]*[^/"]"/.test(page.html.replace(/href="\/"/g, '')), `${page.path}: 사이트 안 링크는 / 로 끝나야 함`);
  }
  // 앱 기능 화면은 본문 없이 noindex
  for (const p of ['onboarding', 'quiz', 'cards', 'settings']) {
    const page = pages.find((x) => x.path === p)!;
    assert.ok(page.noindex && page.html === '', p);
  }
  // 하위 경로 배포에서도 링크가 그 경로 아래를 가리킨다
  assert.ok(staticPages('/sub/').every((p) => !/href="\/(?!sub\/)/.test(p.html)));
});

console.log('date');
test('연속 학습일', () => {
  const today = new Date(2026, 9, 9);
  const k = (d: number) => dayKey(new Date(2026, 9, d));
  assert.equal(computeStreak({ [k(9)]: 1, [k(8)]: 2, [k(7)]: 1, [k(5)]: 1 }, today), 3);
  assert.equal(computeStreak({ [k(8)]: 1, [k(7)]: 1 }, today), 2); // 오늘 아직 안 했으면 어제부터
  assert.equal(computeStreak({ [k(6)]: 1 }, today), 0);
  assert.equal(computeBestStreak({ [k(1)]: 1, [k(2)]: 1, [k(3)]: 1, [k(7)]: 1 }), 3);
});

console.log(`\n✅ ${passed}개 테스트 통과`);
