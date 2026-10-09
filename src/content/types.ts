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
}

/** 4지선다(2~5지) 객관식 */
export interface McqQuestion extends QuestionBase {
  type: 'mcq';
  /** 선택지 (짧은 RichText 인라인 문법만 사용: **굵게**, `코드`) */
  choices: string[];
  /** 정답 선택지 인덱스 (0부터) */
  answer: number;
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

export type CsGroupId = 'fundamentals' | 'language' | 'framework' | 'architecture' | 'practice';

export interface CsCategory {
  id: string;
  group: CsGroupId;
  title: string;
  description: string;
  /** Ionicons 아이콘 이름 */
  icon: string;
}

/** 카테고리별 콘텐츠 파일(src/content/cs/<id>.ts)이 export 하는 형태 */
export interface CsCategoryContent {
  quiz: QuizQuestion[];
  cards: InterviewCard[];
}

/* ------------------------------------------------------------------ */
/* 코드 리뷰                                                             */
/* ------------------------------------------------------------------ */

export type FrameworkId = 'spring' | 'nest' | 'django';

export type ReviewCategory =
  | 'performance' // 성능
  | 'security' // 보안
  | 'design' // 설계·구조
  | 'transaction' // 트랜잭션·데이터 정합성
  | 'error-handling' // 예외 처리
  | 'concurrency' // 동시성
  | 'readability' // 가독성·유지보수
  | 'testing' // 테스트
  | 'api-design'; // API 설계

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

/** 코딩 문제 파라미터/반환 타입 */
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

/** 코딩 문제 풀이 언어 */
export type SolveLanguage = 'python' | 'java' | 'kotlin' | 'cpp' | 'javascript';

/**
 * 결과 비교 방식
 * - exact: 완전 일치 (기본)
 * - unordered: 반환 배열의 순서 무시 (1차원 배열에만 사용)
 * - float: 실수 오차 1e-6 허용
 */
export type CompareMode = 'exact' | 'unordered' | 'float';

export interface AlgoProblem {
  /** kebab-case. 예: 'bracket-balance' */
  id: string;
  title: string;
  /** Lv.1 ~ Lv.3 */
  level: Difficulty;
  /** AlgoTopic id 또는 'implementation' | 'string' | 'math' */
  topics: string[];
  /** 문제 설명 (RichText) */
  description: RichText;
  /** 제한사항 (인라인 RichText) */
  constraints: string[];
  signature: Signature;
  /** 화면에 보여주는 입출력 예 (2~3개) */
  examples: TestCase[];
  /** 입출력 예 설명 (RichText, 선택) */
  exampleNotes?: RichText;
  /** 채점용 숨김 테스트 (8~15개, 엣지 케이스 포함) */
  tests: TestCase[];
  compare?: CompareMode;
  /** 단계별 힌트 (2~3개) */
  hints: string[];
  /** 언어별 모범 답안 */
  solutions: Record<SolveLanguage, string>;
  /** 풀이 해설 (RichText) */
  explanation: RichText;
  complexity: { time: string; space: string };
}
