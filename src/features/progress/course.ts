/**
 * 개발자 코스(백엔드 · 프론트엔드 · 풀스택)에 맞는 콘텐츠 범위.
 * React Native 를 가져오지 않으므로 Node 테스트(scripts/test-core.ts)에서도 쓴다.
 */
import {
  CS_CATEGORIES,
  CS_CONTENT,
  FRAMEWORK_LANGUAGE_CATEGORIES,
  QUESTION_MAP,
  QUESTION_SOURCE,
  REVIEW_FRAMEWORKS,
  SOLVE_LANGUAGE_IDS,
  trackSides,
  type BackendFrameworkId,
  type CodeLanguage,
  type CsCategory,
  type DevTrack,
  type FrameworkId,
  type FrontendFrameworkId,
  type OutputLanguage,
  type ReviewFramework,
  type SolveLanguage,
  type TrackSide,
} from '@/content';

/** 프로필 중 코스와 관련된 부분 */
export interface Course {
  track: DevTrack;
  framework: BackendFrameworkId;
  frontendFramework: FrontendFrameworkId;
  /** 코딩 테스트 언어 — 알고리즘 퀴즈 코드를 오늘의 퀴즈에 낼지 정할 때 쓴다 */
  language?: SolveLanguage;
}

/** 코스 설정이 바뀌었는지 비교하는 키 (오늘의 플랜을 다시 만들지 판단) */
export const courseKey = (c: Course) => `${c.track}:${c.framework}:${c.frontendFramework}`;

export const sideFramework = (c: Course, side: TrackSide): FrameworkId =>
  side === 'backend' ? c.framework : c.frontendFramework;

/** 코스에서 고른 프레임워크 (풀스택은 백엔드 · 프론트엔드 하나씩) */
export function courseFrameworks(c: Course): FrameworkId[] {
  return trackSides(c.track).map((side) => sideFramework(c, side));
}

/** 코스 쪽의 코드 리뷰 프레임워크 목록 */
export function reviewFrameworksFor(side: TrackSide): ReviewFramework[] {
  return REVIEW_FRAMEWORKS.filter((f) => f.track === side);
}

/** 코스 쪽 CS 카테고리인지 — 공통이거나 코스 쪽 카테고리. 언어 · 프레임워크 선택은 보지 않으므로 출제 범위는 `csCategoriesForCourse` 를 쓴다 */
export function isCategoryInTrack(cat: CsCategory, track: DevTrack): boolean {
  return !cat.track || trackSides(track).includes(cat.track);
}

/**
 * 오늘의 퀴즈 · 면접 질문에 내는 CS 카테고리.
 * 코스 범위 중 언어 카테고리는 고른 프레임워크의 언어만, 프레임워크 카테고리는 고른 프레임워크만 낸다.
 */
export function csCategoriesForCourse(c: Course): CsCategory[] {
  const frameworks = courseFrameworks(c);
  const languages = new Set(frameworks.flatMap((f) => FRAMEWORK_LANGUAGE_CATEGORIES[f]));
  return CS_CATEGORIES.filter((cat) => {
    if (cat.group === 'language') return languages.has(cat.id);
    if (cat.framework) return frameworks.includes(cat.framework);
    return isCategoryInTrack(cat, c.track);
  });
}

/**
 * 면접 CS 탭의 카테고리 — 오늘의 퀴즈와 같은 범위(`csCategoriesForCourse`)를 먼저 보여주고,
 * 고르지 않은 언어 · 프레임워크와 다른 코스 카테고리는 아래에 접어 둔다(직접 찾아볼 수는 있게).
 */
export function partitionCategoriesForCourse(c: Course): { mine: CsCategory[]; others: CsCategory[] } {
  const ids = courseCategoryIds(c);
  return {
    mine: CS_CATEGORIES.filter((cat) => ids.has(cat.id)),
    others: CS_CATEGORIES.filter((cat) => !ids.has(cat.id)),
  };
}

/**
 * 오늘의 퀴즈 CS 후보를 묶음으로 나눈다. 풀스택은 백엔드 · 프론트엔드 · 공통 묶음을 번갈아 골라
 * 한쪽으로 쏠리지 않게 하고, 나머지 코스는 묶음 하나다.
 */
export function csQuestionGroupsForCourse(c: Course): string[][] {
  const ids = (cats: CsCategory[]) => cats.flatMap((cat) => (CS_CONTENT[cat.id]?.quiz ?? []).map((q) => q.id));
  const cats = csCategoriesForCourse(c);
  if (c.track !== 'fullstack') return [ids(cats)];
  return [
    ids(cats.filter((cat) => cat.track === 'backend')),
    ids(cats.filter((cat) => cat.track === 'frontend')),
    ids(cats.filter((cat) => !cat.track)),
  ].filter((g) => g.length > 0);
}

export const courseCategoryIds = (c: Course) => new Set(csCategoriesForCourse(c).map((cat) => cat.id));

/** 같은 계열로 보는 코드 언어 (JavaScript 를 고르면 TypeScript 코드도 낸다) */
const CODE_FAMILY: Partial<Record<CodeLanguage, CodeLanguage[]>> = { javascript: ['javascript', 'typescript'] };
/** 언어를 가리는 코드 — text · sql · bash · json 같은 코드는 언어와 무관하게 누구에게나 낸다 */
const PROGRAMMING_LANGUAGES = new Set<CodeLanguage>(['python', 'java', 'kotlin', 'cpp', 'javascript', 'typescript']);

/** 내 언어 — 코딩 테스트 언어와 고른 프레임워크의 언어 (Spring → Java · Kotlin, NestJS · React · Vue → JS/TS, Django → Python) */
export function courseCodeLanguages(c: Course): Set<CodeLanguage> {
  const langs: CodeLanguage[] = courseFrameworks(c).flatMap((f) => FRAMEWORK_LANGUAGE_CATEGORIES[f] as CodeLanguage[]);
  if (c.language) langs.push(c.language);
  return new Set(langs.flatMap((l) => CODE_FAMILY[l] ?? [l]));
}

/** 오늘의 퀴즈에 낼 문제의 범위 (문제마다 다시 계산하지 않도록 미리 만들어 둔다) */
export interface QuestionScope {
  categoryIds: Set<string>;
  codeLanguages: Set<CodeLanguage>;
}

export const questionScope = (c: Course): QuestionScope => ({
  categoryIds: courseCategoryIds(c),
  codeLanguages: courseCodeLanguages(c),
});

/**
 * 오늘의 퀴즈에 낼 문제인지.
 * CS 는 코스 카테고리(`csCategoriesForCourse`)의 문제만, 알고리즘은 코드가 없거나 내 언어로 쓴 문제만 낸다.
 * 다른 언어로 쓴 알고리즘 문제는 알고리즘 탭의 토픽 퀴즈에서 직접 풀 수 있다.
 */
export function isQuestionForCourse(id: string, c: Course, scope: QuestionScope = questionScope(c)): boolean {
  const q = QUESTION_MAP[id];
  if (!q) return false;
  if (QUESTION_SOURCE[id] === 'cs') return scope.categoryIds.has(q.categoryId);
  if (!q.code || !PROGRAMMING_LANGUAGES.has(q.code.language) || scope.codeLanguages.has(q.code.language)) return true;
  // 출력 맞추기 문제는 내 언어 버전이 있으면 그 언어로 보여 줄 수 있다
  return Object.keys(q.variants ?? {}).some((l) => scope.codeLanguages.has(l as CodeLanguage));
}

/**
 * 출력 맞추기 퀴즈의 기본 코드 언어 — 코스 프레임워크의 언어(풀스택은 백엔드 쪽).
 * 코딩 테스트 언어가 그 프레임워크 언어 중 하나면 그 언어(Spring + Kotlin → Kotlin). 프론트엔드 · NestJS → JavaScript, Django → Python
 */
export function defaultQuizCodeLanguage(c: Course): OutputLanguage {
  const languages = FRAMEWORK_LANGUAGE_CATEGORIES[c.track === 'frontend' ? c.frontendFramework : c.framework] as OutputLanguage[];
  return languages.find((l) => l === c.language) ?? languages[0];
}

/** 오늘의 면접 질문 후보 카테고리. 풀스택은 그날 볼 쪽(side)과 공통 카테고리만 */
export function cardCategoriesForCourse(c: Course, side?: TrackSide): CsCategory[] {
  const cats = csCategoriesForCourse(c);
  if (c.track !== 'fullstack' || !side) return cats;
  return cats.filter((cat) => !cat.track || cat.track === side);
}

/** 날짜마다 번갈아 보는 쪽 — 풀스택의 오늘의 추천이 한쪽으로 쏠리지 않게 (offset 으로 리뷰 · 면접 질문을 서로 엇갈리게) */
export function sideOfDay(track: DevTrack, date: Date, offset = 0): TrackSide {
  if (track !== 'fullstack') return track;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return (day + offset) % 2 === 0 ? 'backend' : 'frontend';
}

/** 코스에 맞춘 코딩 테스트 언어 순서 — 프론트엔드는 JavaScript 를 먼저 */
export function solveLanguagesFor(track: DevTrack): SolveLanguage[] {
  if (track !== 'frontend') return SOLVE_LANGUAGE_IDS;
  return ['javascript', ...SOLVE_LANGUAGE_IDS.filter((l) => l !== 'javascript')];
}
