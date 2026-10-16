/**
 * 학습 콘텐츠 스키마.
 *
 * 모든 콘텐츠는 앱 번들에 정적으로 포함된다(서버 비용 0원).
 * 문자열 필드 중 "RichText" 로 표시된 필드는 docs/CONTENT_GUIDE.md 의
 * markdown-lite 문법을 따른다.
 */

/** markdown-lite 문자열 (docs/CONTENT_GUIDE.md 참고) */
export type RichText = string;

/** 1: 기초, 2: 중급, 3: 심화 */
export type Difficulty = 1 | 2 | 3;

/** 코드 블록/하이라이팅을 지원하는 언어 */
export type CodeLanguage =
  | 'java'
  | 'kotlin'
  | 'python'
  | 'cpp'
  | 'javascript'
  | 'typescript'
  | 'sql'
  | 'json'
  | 'yaml'
  | 'bash'
  | 'tsx'
  | 'vue'
  | 'html'
  | 'css'
  | 'text';

export interface CodeSnippet {
  language: CodeLanguage;
  /** 들여쓰기 없이 첫 열부터 작성한 소스 코드 */
  source: string;
  /** 화면에 표시할 파일명 (예: OrderService.java) */
  filename?: string;
}

/* ------------------------------------------------------------------ */
/* 퀴즈 (알고리즘 개념 퀴즈 · CS 퀴즈 공용)                              */
/* ------------------------------------------------------------------ */

interface QuestionBase {
  /** 전역 유일 ID. 예: 'cs-os-q01', 'algo-sorting-q03' */
  id: string;
  /** CS 카테고리 ID 또는 알고리즘 토픽 ID */
  categoryId: string;
  difficulty: Difficulty;
  /** 질문 본문 (RichText) */
  prompt: RichText;
  /** 질문과 함께 보여줄 코드 (선택) */
  code?: CodeSnippet;
  /** 해설 (RichText) — 정답 이유 + 오답 선택지가 틀린 이유 */
  explanation: RichText;
  tags?: string[];
  /** 이 문제가 다루는 CS 이론 레슨 id (같은 카테고리). 레슨의 확인 퀴즈가 되고, 해설에서 레슨으로 이동할 수 있다 */
  lessonId?: string;
}

/**
 * 객관식. 보기는 볼 때마다 순서를 섞어 보여주므로(`progress/choices.ts`) 해설에서 보기를 위치(A번 · 첫 번째)로 가리키지 않는다.
 * 형식은 두 가지 — 고정 보기(`choices` + `answer`) 또는 오답 풀(`correct` + `distractors`).
 */
export type McqQuestion = McqChoicesQuestion | McqPoolQuestion;

/** 고정 보기 객관식 (2~5지) — 보기 순서만 섞는다 */
export interface McqChoicesQuestion extends QuestionBase {
  type: 'mcq';
  /** 선택지 (짧은 RichText 인라인 문법만 사용: **굵게**, `코드`) */
  choices: string[];
  /** 정답 선택지 인덱스 (0부터, 원래 순서 기준) */
  answer: number;
  /** 보기끼리 서로를 가리키는 문제("위 보기 모두" 등)라 순서를 섞지 않는다 */
  fixedOrder?: boolean;
  /** 마지막 보기("모두 맞다" 등)를 맨 뒤에 고정하고 나머지만 섞는다 */
  pinLast?: boolean;
  correct?: never;
  distractors?: never;
}

/** 오답 풀 객관식 — 볼 때마다 오답 풀에서 `pick` 개를 골라 정답과 함께 섞는다 */
export interface McqPoolQuestion extends QuestionBase {
  type: 'mcq';
  /** 정답 보기 (인라인 RichText). `explanation` 은 정답 이유만 적는다 */
  correct: string;
  /** 오답 풀 (5~7개 권장, 최소 3개) — 서로 겹치지 않는 그럴듯한 오해 */
  distractors: Distractor[];
  /** 한 번에 보여줄 오답 수 (기본 3) */
  pick?: number;
  choices?: never;
  answer?: never;
}

/** 오답 보기와 그 보기가 틀린 이유 — 이번에 보인 오답의 이유만 해설에 함께 보여준다 */
export interface Distractor {
  /** 보기 (인라인 RichText) */
  text: string;
  /** 틀린 이유 (인라인 RichText, 한두 문장) */
  why: string;
}

/** O/X 퀴즈 */
export interface OxQuestion extends QuestionBase {
  type: 'ox';
  /** true = O(맞다), false = X(틀리다) */
  answer: boolean;
}

export type QuizQuestion = McqQuestion | OxQuestion;

/* ------------------------------------------------------------------ */
/* 기술 면접 질문 카드                                                   */
/* ------------------------------------------------------------------ */

export interface InterviewCard {
  /** 예: 'cs-os-c01' */
  id: string;
  categoryId: string;
  difficulty: Difficulty;
  /** 면접관이 실제로 할 법한 질문 */
  question: string;
  /** 모범 답변 (RichText) — 면접에서 말하듯 3~6문장, 필요 시 bullet */
  answer: RichText;
  /** 답변에 반드시 들어가야 할 핵심 키워드 (3~6개) */
  keywords: string[];
  /** 예상 꼬리 질문 (1~3개) */
  followUps?: string[];
}

/* ------------------------------------------------------------------ */
/* CS (기술 면접)                                                        */
/* ------------------------------------------------------------------ */

export type CsGroupId = 'fundamentals' | 'language' | 'framework' | 'web' | 'architecture' | 'practice' | 'ai';

export interface CsCategory {
  id: string;
  group: CsGroupId;
  title: string;
  description: string;
  /** Ionicons 아이콘 이름 */
  icon: string;
  /** 이 카테고리를 주로 쓰는 코스. 없으면 백엔드 · 프론트엔드 공통 */
  track?: TrackSide;
  /** 프레임워크 카테고리(group 'framework')가 다루는 프레임워크 */
  framework?: FrameworkId;
}

/** 카테고리별 콘텐츠 파일(src/content/cs/<id>.ts)이 export 하는 형태 */
export interface CsCategoryContent {
  /** 이론 학습 레슨 (순서대로) — 없으면 이론 탭에서 '준비 중' */
  lessons?: CsLesson[];
  quiz: QuizQuestion[];
  cards: InterviewCard[];
}

/** CS 이론 학습 레슨 — 읽은 뒤 이 레슨에 연결된 퀴즈(QuizQuestion.lessonId)로 확인한다 */
export interface CsLesson {
  /** 전역 유일 ID. 예: 'cs-os-l01' */
  id: string;
  categoryId: string;
  title: string;
  /** 한두 문장 요약 (인라인 RichText) */
  summary: string;
  difficulty: Difficulty;
  /** 예상 읽기 시간 (분, 3~7) */
  minutes: number;
  /** 본문 (RichText, '###' 섹션: 왜 필요한가 → 핵심 개념 → 예시 · 코드 → 면접 포인트) */
  body: RichText;
  /** 핵심 정리 (인라인 RichText, 3~5개) */
  keyPoints: string[];
}

/* ------------------------------------------------------------------ */
/* 코드 리뷰                                                             */
/* ------------------------------------------------------------------ */

/* 개발자 코스 — 백엔드 · 프론트엔드 · 풀스택(둘 다) */
export type DevTrack = 'backend' | 'frontend' | 'fullstack';
/** 콘텐츠가 속하는 코스 (풀스택은 두 쪽을 모두 본다) */
export type TrackSide = 'backend' | 'frontend';

export type BackendFrameworkId = 'spring' | 'nest' | 'django';
export type FrontendFrameworkId = 'react' | 'vue';
export type FrameworkId = BackendFrameworkId | FrontendFrameworkId;

export type ReviewCategory =
  | 'performance' // 성능
  | 'security' // 보안
  | 'design' // 설계·구조
  | 'transaction' // 트랜잭션·데이터 정합성
  | 'error-handling' // 예외 처리
  | 'concurrency' // 동시성
  | 'readability' // 가독성·유지보수
  | 'testing' // 테스트
  | 'api-design' // API 설계
  | 'state' // 상태 관리 (프론트엔드)
  | 'accessibility'; // 웹 접근성 (프론트엔드)

export type Severity = 'critical' | 'major' | 'minor';

/** 개선 패턴 학습 카드 */
export interface ReviewPattern {
  /** 예: 'spring-p-n-plus-one' */
  id: string;
  framework: FrameworkId;
  /** 세부 프레임워크/라이브러리 표기 (예: 'Spring Data JPA', 'Express', 'Flask') */
  subFramework?: string;
  category: ReviewCategory;
  difficulty: Difficulty;
  /** 예: 'JPA N+1 문제' */
  title: string;
  /** 한 줄 요약 */
  summary: string;
  /** 문제 상황 설명 (RichText) */
  problem: RichText;
  /** 개선 전 코드 */
  before: CodeSnippet;
  /** 개선 후 코드 */
  after: CodeSnippet;
  /** 개선 포인트 설명 (RichText) */
  explanation: RichText;
  /** 코드 리뷰 시 확인할 체크리스트 (짧은 문장 3~5개) */
  checklist: string[];
}

/** 리뷰 실전 퀴즈에서 정답으로 제시되는 이슈 */
export interface ReviewIssue {
  /** 문제가 되는 라인 번호 (1부터, code.source 기준) */
  lines: number[];
  category: ReviewCategory;
  severity: Severity;
  /** 예: '반복문 안에서 지연 로딩으로 N+1 쿼리 발생' */
  title: string;
  /** 왜 문제인지 (RichText) */
  description: RichText;
  /** 어떻게 고치는지 (RichText) */
  suggestion: RichText;
}

export interface ReviewOption {
  text: string;
  correct: boolean;
}

/** 리뷰 실전 퀴즈 */
export interface ReviewChallenge {
  /** 예: 'spring-c01' */
  id: string;
  framework: FrameworkId;
  subFramework?: string;
  difficulty: Difficulty;
  /** 예: '주문 생성 API 리뷰' */
  title: string;
  /** 상황/요구사항 설명 (RichText) */
  context: RichText;
  /** 리뷰 대상 코드 */
  code: CodeSnippet;
  /** 정답 이슈 (2~4개) */
  issues: ReviewIssue[];
  /** '개선이 필요한 점을 모두 고르세요' 형태의 복수 선택 문항 */
  question: {
    prompt: string;
    /** 5~6개, 정답 2~4개 */
    options: ReviewOption[];
  };
  /** 베스트 개선안 코드 */
  improved: CodeSnippet;
  /** 총평 / 핵심 정리 (RichText) */
  summary: RichText;
}

/** 프레임워크별 콘텐츠 파일(src/content/review/<framework>.ts)이 export 하는 형태 */
export interface ReviewFrameworkContent {
  patterns: ReviewPattern[];
  challenges: ReviewChallenge[];
}

/*
 * 리뷰 콘텐츠의 다른 언어 버전 (예: Spring Boot 의 Kotlin 코드).
 * 코드는 반드시 새로 쓰고, 설명 필드는 그 언어에 맞게 달라지는 것만 덮어쓴다. 지정하지 않은 필드는 기본 언어 버전을 그대로 쓴다.
 */

export interface ReviewPatternVariant {
  before: CodeSnippet;
  after: CodeSnippet;
  title?: string;
  summary?: string;
  problem?: RichText;
  explanation?: RichText;
  checklist?: string[];
}

export interface ReviewIssueVariant {
  /** 이 언어 버전 code 기준 라인 번호 */
  lines: number[];
  title?: string;
  description?: RichText;
  suggestion?: RichText;
}

export interface ReviewChallengeVariant {
  code: CodeSnippet;
  improved: CodeSnippet;
  /** 기본 버전 issues 와 같은 순서 · 같은 개수 (채점 줄 번호가 언어마다 다르므로 필수) */
  issues: ReviewIssueVariant[];
  title?: string;
  context?: RichText;
  question?: ReviewChallenge['question'];
  summary?: RichText;
}

/** 다른 언어 버전 파일(src/content/review/<framework>-<language>.ts)이 export 하는 형태. 키는 패턴 · 챌린지 id */
export interface ReviewVariantContent {
  language: CodeLanguage;
  patterns: Record<string, ReviewPatternVariant>;
  challenges: Record<string, ReviewChallengeVariant>;
}

export interface ReviewFramework {
  id: FrameworkId;
  /** 백엔드 / 프론트엔드 코스 구분 */
  track: TrackSide;
  title: string;
  subtitle: string;
  /** 대표 언어 (코드 하이라이팅 기본값) */
  language: CodeLanguage;
  /** 대표 언어 외에 코드 예제를 함께 제공하는 언어 (예: Spring Boot → kotlin) */
  variants?: CodeLanguage[];
  icon: string;
  accent: string;
}

/* ------------------------------------------------------------------ */
/* 알고리즘                                                              */
/* ------------------------------------------------------------------ */

export interface AlgoTopic {
  /** 예: 'binary-search' */
  id: string;
  title: string;
  description: string;
  icon: string;
}

/** 토픽별 개념 정리 + 퀴즈 (src/content/algorithm/quiz-*.ts) */
export interface AlgoTopicContent {
  /** 개념 정리 (RichText, 코드 템플릿 포함 가능) */
  primer: RichText;
  questions: QuizQuestion[];
}

/** 알고리즘 예제 문제의 파라미터/반환 타입 */
export type ValueType =
  | 'int'
  | 'long'
  | 'double'
  | 'bool'
  | 'string'
  | 'int[]'
  | 'long[]'
  | 'double[]'
  | 'bool[]'
  | 'string[]'
  | 'int[][]'
  | 'string[][]';

export interface Param {
  name: string;
  type: ValueType;
}

export interface Signature {
  params: Param[];
  returns: ValueType;
}

export interface TestCase {
  /** 파라미터 순서대로의 값 (JSON 값) */
  input: unknown[];
  /** 기대 반환값 (JSON 값) */
  output: unknown;
}

/** 코딩 테스트 언어 — 알고리즘 구현 예제를 이 5개 언어로 제공한다 */
export type SolveLanguage = 'python' | 'java' | 'kotlin' | 'cpp' | 'javascript';

/**
 * 결과 비교 방식
 * - exact: 완전 일치 (기본)
 * - unordered: 반환 배열의 순서 무시 (1차원 배열에만 사용)
 * - float: 실수 오차 1e-6 허용
 */
export type CompareMode = 'exact' | 'unordered' | 'float';

/* ------------------------------------------------------------------ */
/* 알고리즘 유형별 구현 예제                                              */
/* ------------------------------------------------------------------ */

/** 구현 예제의 핵심 해설. 같은 내용이 언어마다 다른 줄에 있어 줄 번호를 언어별로 지정한다 */
export interface AlgoKeyPoint {
  /** 짧은 제목 (예: '탐색 범위', '중간값 오버플로') */
  title: string;
  /** 설명 (RichText) */
  explanation: RichText;
  /** 언어별로 강조할 줄 번호 (1부터) */
  lines: Record<SolveLanguage, number[]>;
}

/** 한 가지 접근 방식의 구현 예제 (5개 언어) */
export interface AlgoImplementation {
  /** 접근 방식 이름 (예: '반복문', '재귀', '정렬 + 투 포인터') */
  title: string;
  /** 이 구현의 특징 (인라인 RichText, 한두 문장) */
  summary: string;
  complexity: { time: string; space: string };
  /** 언어별 코드 — 모든 언어가 예제 문제의 solution 함수를 구현한다 */
  code: Record<SolveLanguage, string>;
  /** 핵심 구현 해설 (2~5개) */
  keyPoints: AlgoKeyPoint[];
}

/** 유형의 예제 문제. 구현 예제가 모두 이 함수를 구현하고, tests 로 예제 코드를 실제로 실행해 검증한다 */
export interface AlgoPatternExample {
  /** 문제 설명 (RichText, 짧게) */
  description: RichText;
  signature: Signature;
  /** 화면에 보여주는 입출력 예 (1~3개) */
  examples: TestCase[];
  /** 검증용 테스트 (5개 이상, 화면에는 보이지 않음 — npm run validate 가 모든 언어로 실행) */
  tests: TestCase[];
  compare?: CompareMode;
}

/** 알고리즘 토픽에서 자주 출제되는 문제 유형 (algorithm/patterns/<id>.ts, 파일 1개 = 유형 1개) */
export interface AlgoPattern {
  /** 토픽 id 로 시작하는 kebab-case. 예: 'binary-search-lower-bound' */
  id: string;
  topicId: string;
  /** 토픽 안에서의 순서 (1부터) */
  order: number;
  title: string;
  /** 한 줄 요약 */
  summary: string;
  difficulty: Difficulty;
  /** 이 유형을 알아보는 신호 — 문제에 이런 표현 · 조건이 보이면 (인라인 RichText, 2~4개) */
  whenToUse: string[];
  /** 접근 방법 (RichText) */
  approach: RichText;
  example: AlgoPatternExample;
  /** 구현 예제 (변형이 있으면 2~3개, 없으면 1개) */
  implementations: AlgoImplementation[];
  /** 자주 하는 실수 (인라인 RichText) */
  pitfalls?: string[];
  /** 관련 개념 퀴즈 id */
  quizIds?: string[];
}
