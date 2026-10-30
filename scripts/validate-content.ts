/**
 * 콘텐츠 검증 스크립트
 *
 *   npx tsx scripts/validate-content.ts                 # 전체 검증 + 알고리즘 구현 예제 실행
 *   npx tsx scripts/validate-content.ts --quick         # 구조 검증만
 *   npx tsx scripts/validate-content.ts --section patterns --only two-pointer --langs python,java
 *   npx tsx scripts/validate-content.ts --section cs --only os,network
 *   npx tsx scripts/validate-content.ts --section patterns --only binary-search   # 토픽 id 또는 유형 id
 *
 * --section: cs | review | algo-quiz | patterns (쉼표로 여러 개)
 * --langs: python | javascript | java | kotlin | cpp (기본: 전부)
 *
 * Kotlin 은 KOTLINC(컴파일러 경로)와 KOTLIN_JAVA_HOME(컴파일·실행 JDK)로 다른 버전 조합(예: 1.8 · JDK 8)을 지정할 수 있다.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

import { ALGO_TOPICS } from '../src/content/algorithm/topics';
import { CS_CATEGORIES } from '../src/content/cs/categories';
import { REVIEW_FRAMEWORKS } from '../src/content/review/frameworks';
import type {
  AlgoPattern,
  AlgoTopicContent,
  CodeSnippet,
  CompareMode,
  CsCategoryContent,
  CsLesson,
  FollowUp,
  InterviewCard,
  QuizQuestion,
  ReviewChallenge,
  ReviewFrameworkContent,
  ReviewVariantContent,
  Signature,
  SolveLanguage,
  TestCase,
  ValueType,
} from '../src/content/types';
import { formatValue, resultsMatch } from './lib/harness/compare';
import { buildCppProgram, mapCppErrors } from './lib/harness/cpp-harness';
import { buildJavaProgram, mapJavaErrors } from './lib/harness/java-harness';
import { buildKotlinProgram, mapKotlinErrors } from './lib/harness/kotlin-harness';
import { parseHarnessOutput } from './lib/harness/protocol';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// 학습 데이터 (npm run content:sync 로 채워진 전체 또는 샘플 콘텐츠). TJ_CONTENT_DATA 로 비공개 콘텐츠 폴더를 직접 지정할 수 있다
const CONTENT = process.env.TJ_CONTENT_DATA ? resolve(process.env.TJ_CONTENT_DATA) : join(ROOT, 'src', 'content', 'data');

/* ------------------------------------------------------------------ */
/* CLI                                                                  */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
function flag(name: string): boolean {
  return argv.includes(`--${name}`);
}
function option(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
const QUICK = flag('quick');
const ONLY = option('only')?.split(',').filter(Boolean);
const SECTIONS = new Set((option('section') ?? 'cs,review,algo-quiz,patterns').split(','));
const ALL_LANGS: SolveLanguage[] = ['python', 'javascript', 'java', 'kotlin', 'cpp'];
const LANGS = (option('langs')?.split(',') ?? ALL_LANGS) as SolveLanguage[];

const KOTLINC = process.env.KOTLINC ?? 'kotlinc';
const KOTLIN_ENV = process.env.KOTLIN_JAVA_HOME ? { ...process.env, JAVA_HOME: process.env.KOTLIN_JAVA_HOME } : process.env;
const KOTLIN_JAVA = process.env.KOTLIN_JAVA_HOME ? join(process.env.KOTLIN_JAVA_HOME, 'bin', 'java') : 'java';

/* ------------------------------------------------------------------ */
/* 리포트                                                               */
/* ------------------------------------------------------------------ */

const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`✗ [${where}] ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`△ [${where}] ${msg}`);

const seenIds = new Map<string, string>();
function checkId(id: unknown, where: string) {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    err(where, `id 형식 오류: ${String(id)} (소문자/숫자/하이픈만)`);
    return;
  }
  const prev = seenIds.get(id);
  if (prev) err(where, `id 중복: ${id} (이미 ${prev}에서 사용)`);
  seenIds.set(id, where);
}

/* ------------------------------------------------------------------ */
/* RichText 검사                                                        */
/* ------------------------------------------------------------------ */

const CODE_LANGS = new Set([
  'java',
  'kotlin',
  'python',
  'cpp',
  'javascript',
  'typescript',
  'sql',
  'json',
  'yaml',
  'bash',
  'tsx',
  'vue',
  'html',
  'css',
  'text',
]);

function nonEmpty(v: unknown, where: string, field: string, min = 1): v is string {
  if (typeof v !== 'string' || v.trim().length < min) {
    err(where, `${field} 가 비어있거나 너무 짧습니다 (최소 ${min}자)`);
    return false;
  }
  return true;
}

/** 인라인 코드(`...`) 안의 내용은 굵게(**) 검사에서 제외한다 */
function stripInlineCode(text: string): string {
  return text.replace(/`[^`]*`/g, '');
}

function checkInline(text: string, where: string, field: string) {
  if (text.includes('\n')) warn(where, `${field}: 한 줄 필드에 줄바꿈이 있습니다`);
  const ticks = (text.match(/`/g) ?? []).length;
  if (ticks % 2 !== 0) err(where, `${field}: 인라인 코드 백틱(\`) 짝이 맞지 않습니다: ${text.slice(0, 60)}`);
  const bold = (stripInlineCode(text).match(/\*\*/g) ?? []).length;
  if (bold % 2 !== 0) err(where, `${field}: 굵게(**) 짝이 맞지 않습니다: ${text.slice(0, 60)}`);
}

function checkRich(text: unknown, where: string, field: string, min = 1) {
  if (!nonEmpty(text, where, field, min)) return;
  const lines = text.split('\n');
  let inCode = false;
  let paragraph: string[] = [];
  const flushParagraph = () => {
    const joined = paragraph.join('\n');
    const bold = (paragraph.map(stripInlineCode).join('\n').match(/\*\*/g) ?? []).length;
    if (bold % 2 !== 0) err(where, `${field}: 굵게(**) 짝이 맞지 않습니다: "${joined.slice(0, 80)}"`);
    paragraph = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      if (!inCode) {
        flushParagraph();
        const lang = fence[1];
        if (lang && !CODE_LANGS.has(lang)) err(where, `${field}: 지원하지 않는 코드 블록 언어 "${lang}"`);
        if (/^\s+```/.test(line)) warn(where, `${field}: 코드 펜스(\`\`\`)는 줄 맨 앞에서 시작하세요`);
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (line.trim() === '') {
      flushParagraph();
      continue;
    }
    if (/^#{1,2}\s/.test(line)) warn(where, `${field}: '#'/'##' 제목은 지원하지 않습니다 ('###'만): ${line}`);
    if (/\[[^\]]+\]\([^)]+\)/.test(line)) warn(where, `${field}: 링크 문법은 지원하지 않습니다: ${line.slice(0, 60)}`);
    if (/^\s{2,}[-*]\s/.test(raw)) warn(where, `${field}: 중첩 목록은 지원하지 않습니다: ${line.trim().slice(0, 60)}`);
    // 인라인 코드 안의 태그(`<button>` 등)는 코드로 보여주므로 괜찮다
    if (/<\/?(br|b|i|code|p|div|span)\b/i.test(stripInlineCode(line))) warn(where, `${field}: HTML 태그는 지원하지 않습니다`);
    const ticks = (line.match(/`/g) ?? []).length;
    if (ticks % 2 !== 0) err(where, `${field}: 인라인 코드 백틱 짝이 맞지 않습니다: "${line.slice(0, 80)}"`);
    paragraph.push(line);
  }
  flushParagraph();
  if (inCode) err(where, `${field}: 코드 블록(\`\`\`)이 닫히지 않았습니다`);
}

function checkSnippet(s: CodeSnippet | undefined, where: string, field: string) {
  if (!s || typeof s !== 'object') {
    err(where, `${field} 코드가 없습니다`);
    return;
  }
  if (!CODE_LANGS.has(s.language)) err(where, `${field}.language 오류: ${s.language}`);
  if (!nonEmpty(s.source, where, `${field}.source`, 10)) return;
  const firstLine = s.source.replace(/^\n+/, '').split('\n')[0];
  if (/^\s{2,}\S/.test(firstLine) && !/^\s*(@|\/\/|#|\*)/.test(firstLine)) {
    warn(where, `${field}.source 첫 줄이 들여쓰기 되어 있습니다 (첫 열부터 작성 권장)`);
  }
  if (s.source.includes('\t')) warn(where, `${field}.source 에 탭 문자가 있습니다 (공백 사용 권장)`);
}

/* ------------------------------------------------------------------ */
/* 퀴즈 · 카드                                                           */
/* ------------------------------------------------------------------ */

/** 보기를 위치로 가리키는 해설 — 화면에서 보기 순서를 섞으므로 'A번' · '**B**' 대신 보기 내용으로 가리킨다 */
const CHOICE_POSITION_REF = /\*\*[A-E][.,:]?\*\*|(?<![A-Za-z0-9_`])[A-E]번(?![가-힣])|(선택지|보기) ?[A-E①-⑤](?![A-Za-z0-9])|[①-⑤]번 ?보기|(첫|두|세|네|마지막) ?번째 (보기|선택지)/;
/** 다른 보기를 가리키는 보기 — 섞으면 뜻이 바뀌므로 fixedOrder · pinLast 가 필요하다 */
const ORDER_DEPENDENT_CHOICE = /위(의)? 보기|위 (내용|설명) (모두|전부)|(보기|위의 것) (모두|전부)|모두 (정답|맞다|옳다)$|정답 없음|보기 중 없음/;
const MCQ_POOL_RECOMMENDED = 5;

function checkMcqText(text: unknown, w: string, field: string, used: Set<string>) {
  if (!nonEmpty(text, w, field)) return;
  checkInline(text as string, w, field);
  const key = (text as string).trim();
  if (used.has(key)) err(w, `${field}: 다른 보기와 같은 내용입니다`);
  used.add(key);
}

function checkQuestion(q: QuizQuestion, categoryId: string, where: string) {
  const w = `${where}/${q?.id}`;
  checkId(q.id, w);
  if (q.categoryId !== categoryId) err(w, `categoryId 가 '${categoryId}' 이어야 합니다 (현재 '${q.categoryId}')`);
  if (![1, 2, 3].includes(q.difficulty)) err(w, `difficulty 는 1|2|3`);
  checkRich(q.prompt, w, 'prompt', 5);
  checkRich(q.explanation, w, 'explanation', 20);
  if (q.code) checkSnippet(q.code, w, 'code');
  if (q.type === 'mcq') {
    const shuffled = q.correct !== undefined || !q.fixedOrder;
    if (shuffled && typeof q.explanation === 'string' && CHOICE_POSITION_REF.test(q.explanation)) {
      err(w, `해설이 보기를 위치로 가리킵니다("${q.explanation.match(CHOICE_POSITION_REF)?.[0]}") — 보기 순서는 섞이므로 보기 내용으로 가리키세요`);
    }
    const used = new Set<string>();
    if (q.correct !== undefined || q.distractors !== undefined) {
      // 오답 풀 형식
      if ((q as { choices?: unknown }).choices !== undefined || (q as { answer?: unknown }).answer !== undefined) {
        err(w, `오답 풀 형식(correct · distractors)과 choices · answer 를 함께 쓸 수 없습니다`);
      }
      checkMcqText(q.correct, w, 'correct', used);
      const pool = Array.isArray(q.distractors) ? q.distractors : [];
      if (!Array.isArray(q.distractors)) err(w, `distractors 는 배열이어야 합니다`);
      const pick = q.pick ?? 3;
      if (!Number.isInteger(pick) || pick < 1 || pick > 4) err(w, `pick 은 1~4 (보기는 정답 포함 2~5개)`);
      if (pool.length < Math.max(3, pick)) err(w, `오답 풀이 ${pool.length}개 — 최소 ${Math.max(3, pick)}개 필요`);
      else if (pool.length < MCQ_POOL_RECOMMENDED) warn(w, `오답 풀이 ${pool.length}개 — ${MCQ_POOL_RECOMMENDED}~7개 권장 (다시 풀 때 보기 조합이 바뀌도록)`);
      pool.forEach((d, i) => {
        checkMcqText(d?.text, w, `distractors[${i}].text`, used);
        if (nonEmpty(d?.why, w, `distractors[${i}].why`, 5)) checkInline(d.why, w, `distractors[${i}].why`);
      });
      return;
    }
    if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 5) {
      err(w, `choices 는 2~5개`);
      return;
    }
    q.choices.forEach((c, i) => checkMcqText(c, w, `choices[${i}]`, used));
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) {
      err(w, `answer 인덱스 범위 오류: ${q.answer}`);
    }
    if (q.fixedOrder && q.pinLast) warn(w, `fixedOrder 면 pinLast 는 필요 없습니다`);
    const dependent = q.choices.filter((c, i) => ORDER_DEPENDENT_CHOICE.test(c) && !(q.pinLast && i === q.choices.length - 1));
    if (dependent.length && !q.fixedOrder) {
      warn(w, `다른 보기를 가리키는 보기가 있습니다(${dependent.map((c) => `"${c}"`).join(', ')}) — 순서를 섞지 않으려면 fixedOrder, 마지막에 두려면 pinLast`);
    }
  } else if (q.type === 'ox') {
    if (typeof q.answer !== 'boolean') err(w, `ox 문제의 answer 는 boolean`);
  } else {
    err(w, `알 수 없는 type: ${(q as { type: string }).type}`);
  }
}

function checkCard(c: InterviewCard, categoryId: string, where: string) {
  const w = `${where}/${c?.id}`;
  checkId(c.id, w);
  if (c.categoryId !== categoryId) err(w, `categoryId 가 '${categoryId}' 이어야 합니다`);
  if (![1, 2, 3].includes(c.difficulty)) err(w, `difficulty 는 1|2|3`);
  nonEmpty(c.question, w, 'question', 8);
  checkRich(c.answer, w, 'answer', 60);
  if (!Array.isArray(c.keywords) || c.keywords.length < 2 || c.keywords.length > 8) err(w, `keywords 는 2~8개`);
  else c.keywords.forEach((k, i) => nonEmpty(k, w, `keywords[${i}]`));
  checkFollowUps(c, w);
}

/** 꼬리 질문: 1~3개, 각각 질문 + 답변, 추가 꼬리 질문은 0~2개이고 그 안에는 더 두지 않는다 */
function checkFollowUps(c: InterviewCard, w: string) {
  if (c.followUps === undefined) return warn(w, 'followUps 가 없습니다 (꼬리 질문 1~3개 권장)');
  if (!Array.isArray(c.followUps) || c.followUps.length < 1 || c.followUps.length > 3) return err(w, 'followUps 는 1~3개');
  const seen = new Set([c.question.trim()]);
  const checkOne = (f: FollowUp, at: string, nested: boolean) => {
    if (!f || typeof f !== 'object' || Array.isArray(f)) return err(w, `${at}: { question, answer } 객체여야 합니다`);
    if (nonEmpty(f.question, w, `${at}.question`, 8)) {
      if (seen.has(f.question.trim())) err(w, `${at}: 같은 질문이 이미 있습니다: ${f.question}`);
      seen.add(f.question.trim());
    }
    checkRich(f.answer, w, `${at}.answer`, nested ? 30 : 50);
    if (typeof f.answer === 'string') {
      if (f.answer.length > (nested ? 500 : 700)) warn(w, `${at}.answer: ${f.answer.length}자 — 꼬리 질문 답변은 말하듯 짧게(${nested ? '1~3' : '2~4'}문장)`);
      if (/^###\s/m.test(f.answer)) err(w, `${at}.answer: 꼬리 질문 답변에는 ### 제목을 쓰지 않습니다`);
    }
    if (nested) {
      if ('followUps' in f) err(w, `${at}: 추가 꼬리 질문은 한 단계까지만 둡니다`);
      return;
    }
    const deeper = f.followUps;
    if (deeper === undefined) return;
    if (!Array.isArray(deeper) || deeper.length < 1 || deeper.length > 2) return err(w, `${at}.followUps 는 1~2개 (없으면 필드를 빼세요)`);
    deeper.forEach((d, j) => checkOne(d, `${at}.followUps[${j}]`, true));
  };
  c.followUps.forEach((f, i) => checkOne(f, `followUps[${i}]`, false));
}


async function importDefault<T>(file: string): Promise<T | null> {
  if (!existsSync(file)) return null;
  const mod = await import(pathToFileURL(file).href);
  return (mod.default ?? null) as T | null;
}

/** 레슨 구조와 퀴즈 연결 — 레슨마다 확인 퀴즈 3개 이상, 퀴즈의 lessonId 는 같은 카테고리의 레슨 */
function checkLessons(lessons: CsLesson[], quiz: QuizQuestion[], categoryId: string, where: string) {
  const ids = new Set<string>();
  lessons.forEach((l, i) => {
    const w = `${where}/${l?.id}`;
    checkId(l.id, w);
    ids.add(l.id);
    if (!new RegExp(`^cs-${categoryId}-l\\d{2}$`).test(l.id)) err(w, `레슨 id 는 'cs-${categoryId}-l01' 형식 (${i + 1}번째)`);
    if (l.categoryId !== categoryId) err(w, `categoryId 가 '${categoryId}' 이어야 합니다`);
    if (![1, 2, 3].includes(l.difficulty)) err(w, 'difficulty 는 1|2|3');
    nonEmpty(l.title, w, 'title', 2);
    nonEmpty(l.summary, w, 'summary', 10) && checkInline(l.summary, w, 'summary');
    if (!Number.isInteger(l.minutes) || l.minutes < 2 || l.minutes > 10) err(w, 'minutes 는 2~10 정수');
    checkRich(l.body, w, 'body', 600);
    if (typeof l.body === 'string' && !/^###\s/m.test(l.body)) warn(w, "body 에 '###' 섹션 제목이 없습니다");
    if (!Array.isArray(l.keyPoints) || l.keyPoints.length < 3 || l.keyPoints.length > 6) err(w, 'keyPoints 는 3~6개');
    l.keyPoints?.forEach((k, j) => nonEmpty(k, w, `keyPoints[${j}]`, 5) && checkInline(k, w, `keyPoints[${j}]`));
    const linked = quiz.filter((q) => q.lessonId === l.id).length;
    if (linked < 3) err(w, `확인 퀴즈(lessonId 로 연결된 문제)가 ${linked}개입니다 — 3개 이상 필요`);
  });
  for (const q of quiz) {
    if (q.lessonId && !ids.has(q.lessonId)) err(`${where}/${q.id}`, `lessonId '${q.lessonId}' 레슨이 이 카테고리에 없습니다`);
  }
  if (lessons.length) {
    const unlinked = quiz.filter((q) => !q.lessonId).length;
    if (unlinked) warn(where, `레슨에 연결되지 않은 퀴즈가 ${unlinked}개 있습니다 (해설에서 이론으로 이동할 수 없음)`);
  }
}

/** 실전 사례 레슨의 본문 섹션 — 이 순서대로 있어야 한다 (docs/CONTENT_GUIDE.md 3-2) */
const CASE_SECTIONS = ['상황', '원인 분석', '선택지와 트레이드오프', '적용한 해결 방안', '결과와 검증', '면접에서 말하는 법'];

/** 실전 사례 카테고리(group 'case') — 레슨 섹션 템플릿, 판단형 퀴즈는 오답 풀 형식, 질문 카드는 경험이 없을 때의 답변 포함 */
function checkCaseContent(content: CsCategoryContent, where: string) {
  for (const l of content.lessons ?? []) {
    const headings = typeof l.body === 'string' ? [...l.body.matchAll(/^###\s+(.+?)\s*$/gm)].map((m) => m[1]) : [];
    let at = -1;
    for (const name of CASE_SECTIONS) {
      const i = headings.findIndex((h, k) => k > at && h.startsWith(name));
      if (i < 0) {
        err(`${where}/${l.id}`, `사례 레슨 본문에 '### ${name}' 섹션이 없거나 순서가 다릅니다 (순서: ${CASE_SECTIONS.join(' → ')})`);
        break;
      }
      at = i;
    }
  }
  for (const q of content.quiz) {
    if (q.type === 'mcq' && q.correct === undefined) err(`${where}/${q.id}`, '사례 퀴즈의 객관식은 오답 풀 형식(correct · distractors)으로 씁니다');
  }
  for (const c of content.cards) {
    if (typeof c.answer === 'string' && !c.answer.includes('경험이 없다면')) {
      err(`${where}/${c.id}`, "사례 질문 카드 답변에 '경험이 없다면' 으로 시작하는 대안 답변이 없습니다");
    }
  }
}

async function validateCs() {
  for (const cat of CS_CATEGORIES.filter((c) => !ONLY || ONLY.includes(c.id))) {
    const file = join(CONTENT, 'cs', `${cat.id}.ts`);
    const where = `cs/${cat.id}`;
    const content = await importDefault<CsCategoryContent>(file);
    if (!content) {
      warn(where, '파일 없음');
      continue;
    }
    if (!Array.isArray(content.quiz) || !Array.isArray(content.cards)) {
      err(where, 'default export 는 { quiz: [], cards: [] } 형태여야 합니다');
      continue;
    }
    content.quiz.forEach((q) => checkQuestion(q, cat.id, where));
    content.cards.forEach((c) => checkCard(c, cat.id, where));
    const lessons = content.lessons ?? [];
    if (!Array.isArray(lessons)) err(where, 'lessons 는 배열이어야 합니다');
    else checkLessons(lessons, content.quiz, cat.id, where);
    if (cat.group === 'case') checkCaseContent(content, where);
    console.log(`  cs/${cat.id}: 이론 ${lessons.length} · 퀴즈 ${content.quiz.length} · 카드 ${content.cards.length}`);
  }
}

async function validateAlgoQuiz() {
  for (const topic of ALGO_TOPICS.filter((t) => !ONLY || ONLY.includes(t.id))) {
    const file = join(CONTENT, 'algorithm', 'quiz', `${topic.id}.ts`);
    const where = `algo-quiz/${topic.id}`;
    const content = await importDefault<AlgoTopicContent>(file);
    if (!content) {
      warn(where, '파일 없음');
      continue;
    }
    checkRich(content.primer, where, 'primer', content.questions.length ? 100 : 0);
    content.questions.forEach((q) => checkQuestion(q, topic.id, where));
    console.log(`  algo-quiz/${topic.id}: 퀴즈 ${content.questions.length}`);
  }
}

/* ------------------------------------------------------------------ */
/* 코드 리뷰                                                            */
/* ------------------------------------------------------------------ */

const REVIEW_CATEGORIES = new Set([
  'performance',
  'security',
  'design',
  'transaction',
  'error-handling',
  'concurrency',
  'readability',
  'testing',
  'api-design',
  'state',
  'accessibility',
]);
const SEVERITIES = new Set(['critical', 'major', 'minor']);

function lineCount(source: string): number {
  return source.replace(/^\n+/, '').replace(/\s+$/, '').split('\n').length;
}

/** 리뷰 퀴즈 이슈의 줄 번호가 코드 범위 안에 있고 의미 있는 줄인지 */
function checkIssueLines(lines: unknown, source: string | undefined, iw: string) {
  const total = source ? lineCount(source) : 0;
  const srcLines = source ? source.replace(/^\n+/, '').split('\n') : [];
  if (!Array.isArray(lines) || lines.length === 0) {
    err(iw, 'lines 가 비어있습니다');
    return;
  }
  lines.forEach((n) => {
    if (!Number.isInteger(n) || n < 1 || n > total) err(iw, `라인 번호 범위 오류: ${n} (코드 ${total}줄)`);
    else if (srcLines[n - 1]?.trim() === '') warn(iw, `${n}번째 줄은 빈 줄입니다`);
    else if (/^\s*[}\])]+;?\s*$/.test(srcLines[n - 1] ?? '')) warn(iw, `${n}번째 줄은 닫는 괄호뿐입니다`);
  });
}

function checkChallengeQuestion(question: ReviewChallenge['question'] | undefined, w: string) {
  const opts = question?.options;
  nonEmpty(question?.prompt, w, 'question.prompt', 5);
  if (!Array.isArray(opts) || opts.length < 4 || opts.length > 7) err(w, 'question.options 는 4~7개');
  else {
    const correct = opts.filter((o) => o.correct).length;
    if (correct < 1 || correct > 5) err(w, `정답 선택지는 1~5개여야 합니다 (현재 ${correct})`);
    if (correct === opts.length) err(w, '모든 선택지가 정답입니다');
    opts.forEach((o, i) => nonEmpty(o.text, w, `options[${i}]`) && checkInline(o.text, w, `options[${i}]`));
  }
}

/** 설명에 기본 언어 코드 블록(예: ```java)이 있는데 다른 언어 버전이 덮어쓰지 않았으면 그 언어 화면에 Java 코드가 보인다 */
function checkFenceOverride(base: unknown, override: unknown, baseLang: string, lang: string, w: string, field: string) {
  const fence = (t: unknown, l: string) => typeof t === 'string' && new RegExp('^\\s*```' + l + '\\s*$', 'm').test(t);
  if (override === undefined && fence(base, baseLang)) {
    err(w, `${field} 에 ${baseLang} 코드 블록이 있어 ${lang} 버전에서 그대로 보입니다 — ${field} 를 ${lang} 로 덮어쓰세요`);
  }
  if (fence(override, baseLang)) warn(w, `${lang} 버전 ${field} 에 ${baseLang} 코드 블록이 있습니다`);
}

async function validateReviewVariants(fwId: string, baseLang: string, lang: string, content: ReviewFrameworkContent) {
  const where = `review/${fwId}-${lang}`;
  const v = await importDefault<ReviewVariantContent>(join(CONTENT, 'review', `${fwId}-${lang}.ts`));
  if (!v) {
    err(where, '파일 없음');
    return;
  }
  if (v.language !== lang) err(where, `language 가 '${lang}' 이어야 합니다`);
  const snippet = (s: { language?: string } | undefined, w: string, field: string) => {
    checkSnippet(s as never, w, field);
    if (s && s.language !== lang) err(w, `${field}.language 가 '${lang}' 이어야 합니다 (현재 '${s.language}')`);
  };
  for (const id of Object.keys(v.patterns ?? {})) if (!content.patterns.some((p) => p.id === id)) err(where, `없는 패턴 id: ${id}`);
  for (const id of Object.keys(v.challenges ?? {})) if (!content.challenges.some((c) => c.id === id)) err(where, `없는 리뷰 퀴즈 id: ${id}`);

  for (const p of content.patterns) {
    const w = `${where}/${p.id}`;
    const pv = v.patterns?.[p.id];
    if (!pv) {
      err(w, `${lang} 버전이 없습니다`);
      continue;
    }
    snippet(pv.before, w, 'before');
    snippet(pv.after, w, 'after');
    if (pv.before?.source?.trim() === pv.after?.source?.trim()) err(w, 'before 와 after 코드가 같습니다');
    if (pv.title !== undefined) nonEmpty(pv.title, w, 'title', 3);
    if (pv.summary !== undefined) nonEmpty(pv.summary, w, 'summary', 8);
    if (pv.problem !== undefined) checkRich(pv.problem, w, 'problem', 30);
    if (pv.explanation !== undefined) checkRich(pv.explanation, w, 'explanation', 50);
    if (pv.checklist !== undefined) {
      if (!Array.isArray(pv.checklist) || pv.checklist.length < 2 || pv.checklist.length > 6) err(w, 'checklist 는 2~6개');
      else pv.checklist.forEach((c, i) => nonEmpty(c, w, `checklist[${i}]`) && checkInline(c, w, `checklist[${i}]`));
    }
    checkFenceOverride(p.problem, pv.problem, baseLang, lang, w, 'problem');
    checkFenceOverride(p.explanation, pv.explanation, baseLang, lang, w, 'explanation');
  }

  for (const c of content.challenges) {
    const w = `${where}/${c.id}`;
    const cv = v.challenges?.[c.id];
    if (!cv) {
      err(w, `${lang} 버전이 없습니다`);
      continue;
    }
    snippet(cv.code, w, 'code');
    snippet(cv.improved, w, 'improved');
    if (cv.code?.source?.trim() === cv.improved?.source?.trim()) err(w, 'code 와 improved 가 같습니다');
    if (cv.title !== undefined) nonEmpty(cv.title, w, 'title', 3);
    if (cv.context !== undefined) checkRich(cv.context, w, 'context', 20);
    if (cv.summary !== undefined) checkRich(cv.summary, w, 'summary', 30);
    if (cv.question !== undefined) checkChallengeQuestion(cv.question, w);
    checkFenceOverride(c.context, cv.context, baseLang, lang, w, 'context');
    checkFenceOverride(c.summary, cv.summary, baseLang, lang, w, 'summary');
    if (!Array.isArray(cv.issues) || cv.issues.length !== c.issues.length) {
      err(w, `issues 는 기본 버전과 같은 ${c.issues.length}개여야 합니다 (현재 ${cv.issues?.length ?? 0}개)`);
      continue;
    }
    cv.issues.forEach((is, i) => {
      const iw = `${w}/issues[${i}]`;
      checkIssueLines(is.lines, cv.code?.source, iw);
      if (is.title !== undefined) nonEmpty(is.title, iw, 'title', 4);
      if (is.description !== undefined) checkRich(is.description, iw, 'description', 20);
      if (is.suggestion !== undefined) checkRich(is.suggestion, iw, 'suggestion', 10);
      checkFenceOverride(c.issues[i].description, is.description, baseLang, lang, iw, 'description');
      checkFenceOverride(c.issues[i].suggestion, is.suggestion, baseLang, lang, iw, 'suggestion');
    });
  }
  const done = (o: object | undefined) => Object.keys(o ?? {}).length;
  console.log(`  review/${fwId}-${lang}: 패턴 ${done(v.patterns)}/${content.patterns.length} · 챌린지 ${done(v.challenges)}/${content.challenges.length}`);
}

async function validateReview() {
  for (const fw of REVIEW_FRAMEWORKS.filter((f) => !ONLY || ONLY.includes(f.id))) {
    const file = join(CONTENT, 'review', `${fw.id}.ts`);
    const where = `review/${fw.id}`;
    const content = await importDefault<ReviewFrameworkContent>(file);
    if (!content) {
      warn(where, '파일 없음');
      continue;
    }
    for (const p of content.patterns) {
      const w = `${where}/${p.id}`;
      checkId(p.id, w);
      if (p.framework !== fw.id) err(w, `framework 가 '${fw.id}' 이어야 합니다`);
      if (!REVIEW_CATEGORIES.has(p.category)) err(w, `category 오류: ${p.category}`);
      if (![1, 2, 3].includes(p.difficulty)) err(w, `difficulty 는 1|2|3`);
      nonEmpty(p.title, w, 'title', 3);
      nonEmpty(p.summary, w, 'summary', 8);
      checkRich(p.problem, w, 'problem', 30);
      checkSnippet(p.before, w, 'before');
      checkSnippet(p.after, w, 'after');
      if (p.before?.source?.trim() === p.after?.source?.trim()) err(w, 'before 와 after 코드가 같습니다');
      checkRich(p.explanation, w, 'explanation', 50);
      if (!Array.isArray(p.checklist) || p.checklist.length < 2 || p.checklist.length > 6) err(w, 'checklist 는 2~6개');
      else p.checklist.forEach((c, i) => nonEmpty(c, w, `checklist[${i}]`) && checkInline(c, w, `checklist[${i}]`));
    }
    for (const c of content.challenges) {
      const w = `${where}/${c.id}`;
      checkId(c.id, w);
      if (c.framework !== fw.id) err(w, `framework 가 '${fw.id}' 이어야 합니다`);
      if (![1, 2, 3].includes(c.difficulty)) err(w, `difficulty 는 1|2|3`);
      nonEmpty(c.title, w, 'title', 3);
      checkRich(c.context, w, 'context', 20);
      checkSnippet(c.code, w, 'code');
      checkSnippet(c.improved, w, 'improved');
      if (c.code?.source?.trim() === c.improved?.source?.trim()) err(w, 'code 와 improved 가 같습니다');
      if (!Array.isArray(c.issues) || c.issues.length < 1 || c.issues.length > 5) err(w, 'issues 는 1~5개');
      c.issues?.forEach((is, i) => {
        const iw = `${w}/issues[${i}]`;
        if (!REVIEW_CATEGORIES.has(is.category)) err(iw, `category 오류: ${is.category}`);
        if (!SEVERITIES.has(is.severity)) err(iw, `severity 오류: ${is.severity}`);
        nonEmpty(is.title, iw, 'title', 4);
        checkRich(is.description, iw, 'description', 20);
        checkRich(is.suggestion, iw, 'suggestion', 10);
        checkIssueLines(is.lines, c.code?.source, iw);
      });
      checkChallengeQuestion(c.question, w);
      checkRich(c.summary, w, 'summary', 30);
    }
    console.log(`  review/${fw.id}: 패턴 ${content.patterns.length} · 챌린지 ${content.challenges.length}`);
    for (const lang of fw.variants ?? []) await validateReviewVariants(fw.id, fw.language, lang, content);
  }
}

/* ------------------------------------------------------------------ */
/* 알고리즘 문제                                                        */
/* ------------------------------------------------------------------ */

const VALUE_TYPES = new Set<ValueType>([
  'int',
  'long',
  'double',
  'bool',
  'string',
  'int[]',
  'long[]',
  'double[]',
  'bool[]',
  'string[]',
  'int[][]',
  'string[][]',
]);

const RESERVED = new Set(
  (
    // Java
    'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record yield true false null ' +
    // C++ (+ std 이름: using namespace std 때문에 매개변수명으로 쓰면 타입을 가림)
    'and auto bool delete explicit export friend inline mutable namespace operator register signed sizeof template typedef typeid typename union unsigned using virtual string vector map set queue stack pair array list deque greater less sort min max swap count find size begin end tuple hash ' +
    // JavaScript
    'function let in of typeof await arguments eval with ' +
    // Python
    'def lambda is not or pass from global nonlocal elif except raise None True False print len input str dict sum type id'
  ).split(' '),
);

function isInt(v: unknown, bits: 32 | 53): boolean {
  if (typeof v !== 'number' || !Number.isInteger(v)) return false;
  return bits === 32 ? v >= -2147483648 && v <= 2147483647 : Number.isSafeInteger(v);
}

function matchesType(v: unknown, t: ValueType): boolean {
  switch (t) {
    case 'int':
      return isInt(v, 32);
    case 'long':
      return isInt(v, 53);
    case 'double':
      return typeof v === 'number' && Number.isFinite(v);
    case 'bool':
      return typeof v === 'boolean';
    case 'string':
      return typeof v === 'string';
    case 'int[]':
    case 'long[]':
    case 'double[]':
    case 'bool[]':
    case 'string[]':
      return Array.isArray(v) && v.every((x) => matchesType(x, t.slice(0, -2) as ValueType));
    case 'int[][]':
    case 'string[][]':
      return Array.isArray(v) && v.every((x) => matchesType(x, t.slice(0, -2) as ValueType));
  }
}

/** 예제 문제의 시그니처와 테스트 입출력 형식 검사 */
function checkSignatureAndCases(
  w: string,
  sig: Signature | undefined,
  examples: TestCase[],
  tests: TestCase[],
  compare: CompareMode | undefined,
  min: { examples: number; tests: number },
): boolean {
  let ok = true;
  if (compare && !['exact', 'unordered', 'float'].includes(compare)) err(w, `compare 오류: ${compare}`);
  if (!sig || !Array.isArray(sig.params) || !VALUE_TYPES.has(sig.returns)) {
    err(w, 'signature 형식 오류');
    return false;
  }
  if (compare === 'unordered' && !['int[]', 'long[]', 'double[]', 'bool[]', 'string[]'].includes(sig.returns)) {
    err(w, "compare: 'unordered' 는 1차원 배열 반환에만 사용");
  }
  if (sig.returns === 'double' && compare !== 'float') warn(w, "double 반환은 compare: 'float' 권장");
  sig.params.forEach((prm) => {
    if (!/^[a-z][A-Za-z0-9_]*$/.test(prm.name)) err(w, `매개변수 이름 오류: ${prm.name} (camelCase)`);
    if (RESERVED.has(prm.name)) err(w, `매개변수 이름 '${prm.name}' 는 일부 언어의 예약어/표준 이름과 충돌합니다`);
    if (!VALUE_TYPES.has(prm.type)) err(w, `매개변수 타입 오류: ${prm.type}`);
  });
  const checkCases = (cases: TestCase[], label: string, minCount: number) => {
    if (!Array.isArray(cases) || cases.length < minCount) {
      err(w, `${label} 는 최소 ${minCount}개`);
      ok = false;
      return;
    }
    cases.forEach((tc, i) => {
      if (!Array.isArray(tc.input) || tc.input.length !== sig.params.length) {
        err(w, `${label}[${i}] 입력 개수가 매개변수 개수(${sig.params.length})와 다릅니다`);
        ok = false;
        return;
      }
      tc.input.forEach((v, j) => {
        if (!matchesType(v, sig.params[j].type)) {
          err(w, `${label}[${i}] 입력 ${sig.params[j].name} 이 타입 ${sig.params[j].type} 와 맞지 않습니다: ${formatValue(v, 80)}`);
          ok = false;
        }
      });
      if (!matchesType(tc.output, sig.returns)) {
        err(w, `${label}[${i}] 기대값이 반환 타입 ${sig.returns} 와 맞지 않습니다: ${formatValue(tc.output, 80)}`);
        ok = false;
      }
    });
  };
  checkCases(examples, 'examples', min.examples);
  checkCases(tests, 'tests', min.tests);
  const size = JSON.stringify([examples, tests]).length;
  if (size > 15000) warn(w, `테스트 데이터가 큽니다 (${(size / 1024).toFixed(1)}KB > 15KB)`);
  return ok;
}

/** 언어별 코드가 하니스가 부르는 solution 함수 형태인지, 오래된 컴파일러에서도 되는 문법인지 */
function checkSolutionCode(w: string, code: Record<SolveLanguage, string> | undefined, field: string): boolean {
  let ok = true;
  for (const lang of ALL_LANGS) {
    if (!nonEmpty(code?.[lang], w, `${field}.${lang}`, 20)) ok = false;
  }
  if (!code) return false;
  // 코딩 테스트 사이트의 Kotlin 은 1.8 이하인 곳이 많아 1.9 이후 문법은 쓰지 않는다
  if (code.kotlin && /\.\.<|\b[A-Z]\w*\.entries\b|\bdata\s+object\b|\benumEntries\b/.test(code.kotlin)) {
    warn(w, `${field}.kotlin 은 Kotlin 1.8 호환이어야 합니다 (..<, enum 의 entries, data object 금지)`);
  }
  if (code.kotlin && !/\bclass\s+Solution\b[\s\S]*\bfun\s+solution\s*\(/.test(code.kotlin)) {
    err(w, `${field}.kotlin 은 class Solution { fun solution(...) } 형태여야 합니다`);
    ok = false;
  }
  if (code.java && !/\bclass\s+Solution\b[\s\S]*\bsolution\s*\(/.test(code.java)) {
    err(w, `${field}.java 는 class Solution { public ... solution(...) } 형태여야 합니다`);
    ok = false;
  }
  if (code.java && /\brecord\s+\w+\s*\(|\.toList\(\)|instanceof\s+\w+\s+\w+\s*[)&|]/.test(code.java)) {
    warn(w, `${field}.java 는 Java 15 호환이어야 합니다 (record, Stream.toList(), instanceof 패턴 금지)`);
  }
  if (code.python && !/^def\s+solution\s*\(/m.test(code.python)) {
    err(w, `${field}.python 은 def solution(...) 함수가 있어야 합니다`);
    ok = false;
  }
  if (code.javascript && !/\bfunction\s+solution\s*\(/.test(code.javascript)) {
    err(w, `${field}.javascript 는 function solution(...) 함수가 있어야 합니다`);
    ok = false;
  }
  if (code.cpp && !/\bsolution\s*\(/.test(code.cpp)) {
    err(w, `${field}.cpp 는 solution(...) 함수가 있어야 합니다`);
    ok = false;
  }
  return ok;
}

/* ---- 실행기 ---- */

interface ExecOutput {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

function exec(
  cmd: string,
  args: string[],
  opts: { cwd?: string; input?: string; timeoutMs: number; env?: NodeJS.ProcessEnv },
): Promise<ExecOutput> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, opts.timeoutMs);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(e), timedOut });
    });
    if (opts.input !== undefined) child.stdin.end(opts.input);
    else child.stdin.end();
  });
}

interface LangRun {
  fatal?: string;
  outputs: { ok: boolean; value: unknown }[];
}

async function runPython(code: string, cases: TestCase[]): Promise<LangRun> {
  const res = await exec('python3', ['-I', join(ROOT, 'scripts', 'lib', 'run_python.py')], {
    input: JSON.stringify({ code, tests: cases.map((c) => c.input), timeLimitSec: 10 }),
    timeoutMs: 120_000,
  });
  if (res.timedOut) return { fatal: '전체 시간 초과', outputs: [] };
  try {
    const parsed = JSON.parse(res.stdout);
    if (parsed.compileError) return { fatal: parsed.compileError, outputs: [] };
    return { outputs: parsed.results };
  } catch {
    return { fatal: `출력 파싱 실패: ${res.stderr || res.stdout}`.slice(0, 2000), outputs: [] };
  }
}

async function runJavascript(code: string, cases: TestCase[]): Promise<LangRun> {
  const ctx = vm.createContext({ console: { log() {}, error() {}, warn() {}, info() {} } });
  try {
    vm.runInContext(code, ctx, { timeout: 5000 });
  } catch (e) {
    return { fatal: String(e), outputs: [] };
  }
  const outputs = cases.map((c) => {
    try {
      ctx.__args = JSON.stringify(c.input);
      const out = vm.runInContext('JSON.stringify(solution(...JSON.parse(__args)))', ctx, { timeout: 10_000 });
      return { ok: true, value: out === undefined ? undefined : JSON.parse(out) };
    } catch (e) {
      return { ok: false, value: String(e) };
    }
  });
  return { outputs };
}

async function runCompiled(lang: 'java' | 'kotlin' | 'cpp', userCode: string, sig: Signature, cases: TestCase[]): Promise<LangRun> {
  const dir = mkdtempSync(join(tmpdir(), `tj-${lang}-`));
  try {
    if (lang === 'kotlin') {
      const prog = buildKotlinProgram(userCode, sig, cases);
      writeFileSync(join(dir, 'Main.kt'), prog.source);
      const c = await exec(KOTLINC, ['-nowarn', 'Main.kt', '-include-runtime', '-d', 'code.jar'], { cwd: dir, timeoutMs: 180_000, env: KOTLIN_ENV });
      if (c.code !== 0) return { fatal: mapKotlinErrors(c.stderr || c.stdout, prog.offset).slice(0, 3000), outputs: [] };
      const r = await exec(KOTLIN_JAVA, ['-jar', 'code.jar'], { cwd: dir, timeoutMs: 60_000 });
      return collectHarness(r, cases.length);
    }
    if (lang === 'java') {
      const prog = buildJavaProgram(userCode, sig, cases);
      writeFileSync(join(dir, 'Main.java'), prog.source);
      const c = await exec('javac', ['--release', '15', '-encoding', 'UTF-8', '-nowarn', '-d', 'out', 'Main.java'], {
        cwd: dir,
        timeoutMs: 60_000,
      });
      if (c.code !== 0) return { fatal: mapJavaErrors(c.stderr || c.stdout, prog.offset).slice(0, 3000), outputs: [] };
      const r = await exec('java', ['-cp', 'out', 'Main'], { cwd: dir, timeoutMs: 60_000 });
      return collectHarness(r, cases.length);
    }
    const prog = buildCppProgram(userCode, sig, cases);
    writeFileSync(join(dir, 'solution.cpp'), prog.source);
    const c = await exec('clang++', ['-std=c++17', '-O2', '-o', 'sol', 'solution.cpp'], { cwd: dir, timeoutMs: 120_000 });
    if (c.code !== 0) {
      return {
        fatal: mapCppErrors(c.stderr || c.stdout, prog.offset, userCode.split('\n').length).slice(0, 3000),
        outputs: [],
      };
    }
    const r = await exec(join(dir, 'sol'), [], { cwd: dir, timeoutMs: 60_000 });
    return collectHarness(r, cases.length);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function collectHarness(r: ExecOutput, n: number): LangRun {
  const parsed = parseHarnessOutput(r.stdout);
  const outputs: { ok: boolean; value: unknown }[] = [];
  for (let i = 0; i < n; i++) {
    const o = parsed.outputs.find((x) => x.index === i);
    outputs.push(o ? { ok: o.ok, value: o.value } : { ok: false, value: `실행되지 않음 (exit ${r.code}${r.timedOut ? ', 시간 초과' : ''}) ${r.stderr.slice(0, 300)}` });
  }
  return { outputs };
}

interface RunTarget {
  /** 리포트 위치 (예: pattern/binary-search-lower-bound#1) */
  where: string;
  code: Record<SolveLanguage, string>;
  signature: Signature;
  examples: TestCase[];
  tests: TestCase[];
  compare?: CompareMode;
}

/** 언어별 코드를 예제 + 테스트로 실행해 기대값과 비교한다 */
async function runTarget(t: RunTarget) {
  const cases = [...t.examples, ...t.tests];
  const w = t.where;
  for (const lang of LANGS) {
    const started = Date.now();
    let run: LangRun;
    if (lang === 'python') run = await runPython(t.code.python, cases);
    else if (lang === 'javascript') run = await runJavascript(t.code.javascript, cases);
    else run = await runCompiled(lang, t.code[lang], t.signature, cases);
    if (run.fatal) {
      err(w, `[${lang}] 실행 실패:\n${run.fatal}`);
      continue;
    }
    let failed = 0;
    run.outputs.forEach((o, i) => {
      const c = cases[i];
      const label = i < t.examples.length ? `examples[${i}]` : `tests[${i - t.examples.length}]`;
      if (!o.ok) {
        failed++;
        err(w, `[${lang}] ${label} 에러: ${String(o.value).slice(0, 300)}`);
      } else if (!resultsMatch(c.output, o.value, t.compare ?? 'exact')) {
        failed++;
        err(w, `[${lang}] ${label} 불일치\n      입력: ${formatValue(c.input, 200)}\n      기대: ${formatValue(c.output, 200)}\n      실제: ${formatValue(o.value, 200)}`);
      }
    });
    const ms = Date.now() - started;
    console.log(`    ${failed === 0 ? '✓' : '✗'} ${w} [${lang}] ${cases.length - failed}/${cases.length} (${ms}ms)`);
  }
}

/** Kotlin 컴파일러가 있는지 확인한다 (없으면 오류를 남기고 false) */
function checkKotlinc(section: string): boolean {
  if (!LANGS.includes('kotlin')) return true;
  const v = spawnSync(KOTLINC, ['-version'], { env: KOTLIN_ENV });
  if (v.status !== 0) {
    err(section, `${KOTLINC} 를 찾을 수 없어 Kotlin 코드를 실행하지 못했습니다. (brew install kotlin 또는 --langs 로 제외)`);
    return false;
  }
  console.log(`  ${`${v.stdout}${v.stderr}`.trim()}`);
  return true;
}

/** 실행 대상을 4개씩 병렬로 실행한다 */
async function runAll(targets: RunTarget[]) {
  const queue = [...targets];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) await runTarget(queue.shift()!);
  });
  await Promise.all(workers);
}

/* ------------------------------------------------------------------ */
/* 알고리즘 유형별 구현 예제                                              */
/* ------------------------------------------------------------------ */

const LANG_LABEL: Record<SolveLanguage, string> = { python: 'Python', javascript: 'JavaScript', java: 'Java', kotlin: 'Kotlin', cpp: 'C++' };

/** 핵심 해설의 언어별 줄 번호가 그 언어 코드 범위 안의 의미 있는 줄인지 */
function checkKeyPointLines(lines: Record<SolveLanguage, number[]> | undefined, code: Record<SolveLanguage, string>, w: string) {
  for (const lang of ALL_LANGS) {
    const list = lines?.[lang];
    if (!Array.isArray(list) || list.length === 0) {
      err(w, `lines.${lang} 가 비어있습니다`);
      continue;
    }
    if (list.length > 12) warn(w, `lines.${lang} 가 ${list.length}줄입니다 — 핵심 줄만 고르세요`);
    checkIssueLines(list, code?.[lang], `${w} [${LANG_LABEL[lang]}]`);
  }
}

function checkPatternStructure(p: AlgoPattern, file: string, quizIds: Set<string>, orders: Map<string, Set<number>>): boolean {
  const w = `pattern/${p?.id}`;
  checkId(p.id, w);
  if (`${p.id}.ts` !== file) err(w, `파일명(${file})과 id 가 다릅니다`);
  if (!ALGO_TOPICS.some((t) => t.id === p.topicId)) err(w, `알 수 없는 topicId: ${p.topicId}`);
  else if (!p.id.startsWith(`${p.topicId}-`)) err(w, `id 는 토픽 id(${p.topicId}-)로 시작해야 합니다`);
  if (!Number.isInteger(p.order) || p.order < 1) err(w, 'order 는 1 이상의 정수');
  else {
    const used = orders.get(p.topicId) ?? new Set<number>();
    if (used.has(p.order)) err(w, `같은 토픽에 order ${p.order} 가 이미 있습니다`);
    used.add(p.order);
    orders.set(p.topicId, used);
  }
  nonEmpty(p.title, w, 'title', 2);
  nonEmpty(p.summary, w, 'summary', 10) && checkInline(p.summary, w, 'summary');
  if (![1, 2, 3].includes(p.difficulty)) err(w, 'difficulty 는 1|2|3');
  if (!Array.isArray(p.whenToUse) || p.whenToUse.length < 2 || p.whenToUse.length > 5) err(w, 'whenToUse 는 2~5개');
  p.whenToUse?.forEach((t, i) => nonEmpty(t, w, `whenToUse[${i}]`, 5) && checkInline(t, w, `whenToUse[${i}]`));
  checkRich(p.approach, w, 'approach', 60);
  p.pitfalls?.forEach((t, i) => nonEmpty(t, w, `pitfalls[${i}]`, 5) && checkInline(t, w, `pitfalls[${i}]`));
  p.quizIds?.forEach((id) => !quizIds.has(id) && err(w, `quizIds 의 퀴즈가 없습니다: ${id}`));

  const ex = p.example;
  checkRich(ex?.description, w, 'example.description', 20);
  let ok = checkSignatureAndCases(w, ex?.signature, ex?.examples, ex?.tests, ex?.compare, { examples: 1, tests: 5 });
  if (Array.isArray(ex?.examples) && ex.examples.length > 3) warn(w, 'example.examples 는 3개 이하 권장 (화면에 모두 보입니다)');

  const impls = p.implementations;
  if (!Array.isArray(impls) || impls.length < 1 || impls.length > 3) {
    err(w, 'implementations 는 1~3개');
    return false;
  }
  impls.forEach((im, i) => {
    const iw = `${w}#${i + 1}`;
    nonEmpty(im.title, iw, 'title', 2);
    nonEmpty(im.summary, iw, 'summary', 10) && checkInline(im.summary, iw, 'summary');
    nonEmpty(im.complexity?.time, iw, 'complexity.time');
    nonEmpty(im.complexity?.space, iw, 'complexity.space');
    if (!checkSolutionCode(iw, im.code, 'code')) ok = false;
    if (!Array.isArray(im.keyPoints) || im.keyPoints.length < 2 || im.keyPoints.length > 6) err(iw, 'keyPoints 는 2~6개');
    im.keyPoints?.forEach((k, j) => {
      const kw = `${iw} keyPoints[${j}]`;
      nonEmpty(k.title, kw, 'title', 2);
      checkRich(k.explanation, kw, 'explanation', 20);
      if (im.code) checkKeyPointLines(k.lines, im.code, kw);
    });
  });
  const titles = impls.map((im) => im.title);
  if (new Set(titles).size !== titles.length) err(w, '구현 예제 title 이 겹칩니다');
  return ok;
}

async function validateAlgoPatterns() {
  const dir = join(CONTENT, 'algorithm', 'patterns');
  if (!existsSync(dir)) {
    err('patterns', `${dir} 폴더가 없습니다`);
    return;
  }
  const quizIds = new Set<string>();
  for (const topic of ALGO_TOPICS) {
    const c = await importDefault<AlgoTopicContent>(join(CONTENT, 'algorithm', 'quiz', `${topic.id}.ts`));
    c?.questions.forEach((q) => quizIds.add(q.id));
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .filter((f) => !ONLY || ONLY.some((o) => f.replace(/\.ts$/, '') === o || f.startsWith(`${o}-`) || f.includes(o)))
    .sort();
  const orders = new Map<string, Set<number>>();
  const patterns: AlgoPattern[] = [];
  for (const f of files) {
    const p = await importDefault<AlgoPattern>(join(dir, f));
    if (!p) {
      err(`pattern/${f}`, 'default export 가 없습니다');
      continue;
    }
    if (checkPatternStructure(p, f, quizIds, orders)) patterns.push(p);
  }
  const perTopic = ALGO_TOPICS.map((t) => `${t.id} ${patterns.filter((p) => p.topicId === t.id).length}`).join(' · ');
  const impls = patterns.reduce((n, p) => n + p.implementations.length, 0);
  console.log(`  patterns: ${files.length}개 (구조 검증 통과 ${patterns.length}개, 구현 예제 ${impls}개)\n    ${perTopic}`);
  if (QUICK || !checkKotlinc('patterns')) return;
  await runAll(
    patterns.flatMap((p) =>
      p.implementations.map((im, i) => ({
        where: `pattern/${p.id}#${i + 1}`,
        code: im.code,
        signature: p.example.signature,
        examples: p.example.examples,
        tests: p.example.tests,
        compare: p.example.compare,
      })),
    ),
  );
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log('콘텐츠 검증 시작\n');
  if (SECTIONS.has('cs')) await validateCs();
  if (SECTIONS.has('algo-quiz')) await validateAlgoQuiz();
  if (SECTIONS.has('review')) await validateReview();
  if (SECTIONS.has('patterns')) await validateAlgoPatterns();

  console.log('');
  if (warnings.length) {
    console.log(`경고 ${warnings.length}건`);
    warnings.forEach((m) => console.log(`  ${m}`));
  }
  if (errors.length) {
    console.log(`\n오류 ${errors.length}건`);
    errors.forEach((m) => console.log(`  ${m}`));
    process.exit(1);
  }
  console.log('\n✅ 검증 통과');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
