/**
 * 콘텐츠 검증 스크립트
 *
 *   npx tsx scripts/validate-content.ts                 # 전체 검증 + 모범 답안 실행
 *   npx tsx scripts/validate-content.ts --quick         # 구조 검증만
 *   npx tsx scripts/validate-content.ts --section problems --only two-sum,merge-intervals --langs python,java
 *   npx tsx scripts/validate-content.ts --section cs --only os,network
 *
 * --section: cs | review | algo-quiz | problems (쉼표로 여러 개)
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

import { ALGO_TOPICS, EXTRA_PROBLEM_TAGS } from '../src/content/algorithm/topics';
import { CS_CATEGORIES } from '../src/content/cs/categories';
import { REVIEW_FRAMEWORKS } from '../src/content/review/frameworks';
import type {
  AlgoProblem,
  AlgoTopicContent,
  CodeSnippet,
  CsCategoryContent,
  InterviewCard,
  QuizQuestion,
  ReviewFrameworkContent,
  SolveLanguage,
  TestCase,
  ValueType,
} from '../src/content/types';
import { formatValue, resultsMatch } from '../src/features/runner/core/compare';
import { buildCppProgram, mapCppErrors } from '../src/features/runner/core/cpp-harness';
import { buildJavaProgram, mapJavaErrors } from '../src/features/runner/core/java-harness';
import { parseHarnessOutput } from '../src/features/runner/core/protocol';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src', 'content');

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
const SECTIONS = new Set((option('section') ?? 'cs,review,algo-quiz,problems').split(','));
const LANGS = (option('langs') ?? 'python,javascript,java,cpp').split(',') as SolveLanguage[];

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
    if (/<\/?(br|b|i|code|p|div|span)\b/i.test(line)) warn(where, `${field}: HTML 태그는 지원하지 않습니다`);
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

const answerPositions: Record<string, number[]> = {};

function checkQuestion(q: QuizQuestion, categoryId: string, where: string) {
  const w = `${where}/${q?.id}`;
  checkId(q.id, w);
  if (q.categoryId !== categoryId) err(w, `categoryId 가 '${categoryId}' 이어야 합니다 (현재 '${q.categoryId}')`);
  if (![1, 2, 3].includes(q.difficulty)) err(w, `difficulty 는 1|2|3`);
  checkRich(q.prompt, w, 'prompt', 5);
  checkRich(q.explanation, w, 'explanation', 20);
  if (q.code) checkSnippet(q.code, w, 'code');
  if (q.type === 'mcq') {
    if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 5) {
      err(w, `choices 는 2~5개`);
      return;
    }
    q.choices.forEach((c, i) => {
      if (nonEmpty(c, w, `choices[${i}]`)) checkInline(c, w, `choices[${i}]`);
    });
    if (new Set(q.choices.map((c) => c.trim())).size !== q.choices.length) err(w, `중복 선택지가 있습니다`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) {
      err(w, `answer 인덱스 범위 오류: ${q.answer}`);
    }
    (answerPositions[where] ??= []).push(q.answer);
    const joined = q.choices.join(' ');
    if (/모두 (정답|맞|옳)|정답 없음|보기 중 없음/.test(joined)) warn(w, `'모두 정답/정답 없음' 형태 선택지는 피하세요`);
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
  if (c.followUps && (!Array.isArray(c.followUps) || c.followUps.length > 4)) err(w, `followUps 는 0~4개`);
}

function reportAnswerSkew() {
  for (const [where, list] of Object.entries(answerPositions)) {
    if (list.length < 6) continue;
    const counts = new Map<number, number>();
    list.forEach((a) => counts.set(a, (counts.get(a) ?? 0) + 1));
    const max = Math.max(...counts.values());
    if (max / list.length > 0.45) {
      warn(where, `객관식 정답 위치가 한쪽으로 쏠려 있습니다: ${JSON.stringify(Object.fromEntries(counts))}`);
    }
  }
}

async function importDefault<T>(file: string): Promise<T | null> {
  if (!existsSync(file)) return null;
  const mod = await import(pathToFileURL(file).href);
  return (mod.default ?? null) as T | null;
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
    console.log(`  cs/${cat.id}: 퀴즈 ${content.quiz.length} · 카드 ${content.cards.length}`);
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
]);
const SEVERITIES = new Set(['critical', 'major', 'minor']);

function lineCount(source: string): number {
  return source.replace(/^\n+/, '').replace(/\s+$/, '').split('\n').length;
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
      const total = c.code?.source ? lineCount(c.code.source) : 0;
      const srcLines = c.code?.source ? c.code.source.replace(/^\n+/, '').split('\n') : [];
      if (!Array.isArray(c.issues) || c.issues.length < 1 || c.issues.length > 5) err(w, 'issues 는 1~5개');
      c.issues?.forEach((is, i) => {
        const iw = `${w}/issues[${i}]`;
        if (!REVIEW_CATEGORIES.has(is.category)) err(iw, `category 오류: ${is.category}`);
        if (!SEVERITIES.has(is.severity)) err(iw, `severity 오류: ${is.severity}`);
        nonEmpty(is.title, iw, 'title', 4);
        checkRich(is.description, iw, 'description', 20);
        checkRich(is.suggestion, iw, 'suggestion', 10);
        if (!Array.isArray(is.lines) || is.lines.length === 0) err(iw, 'lines 가 비어있습니다');
        is.lines?.forEach((n) => {
          if (!Number.isInteger(n) || n < 1 || n > total) err(iw, `라인 번호 범위 오류: ${n} (코드 ${total}줄)`);
          else if (srcLines[n - 1]?.trim() === '') warn(iw, `${n}번째 줄은 빈 줄입니다`);
          else if (/^\s*[}\])]+;?\s*$/.test(srcLines[n - 1] ?? '')) warn(iw, `${n}번째 줄은 닫는 괄호뿐입니다`);
        });
      });
      const opts = c.question?.options;
      nonEmpty(c.question?.prompt, w, 'question.prompt', 5);
      if (!Array.isArray(opts) || opts.length < 4 || opts.length > 7) err(w, 'question.options 는 4~7개');
      else {
        const correct = opts.filter((o) => o.correct).length;
        if (correct < 1 || correct > 5) err(w, `정답 선택지는 1~5개여야 합니다 (현재 ${correct})`);
        if (correct === opts.length) err(w, '모든 선택지가 정답입니다');
        opts.forEach((o, i) => nonEmpty(o.text, w, `options[${i}]`) && checkInline(o.text, w, `options[${i}]`));
      }
      checkRich(c.summary, w, 'summary', 30);
    }
    console.log(`  review/${fw.id}: 패턴 ${content.patterns.length} · 챌린지 ${content.challenges.length}`);
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

function checkProblemStructure(p: AlgoProblem, file: string): boolean {
  const w = `problem/${p?.id}`;
  checkId(p.id, w);
  if (`${p.id}.ts` !== file) err(w, `파일명(${file})과 id 가 다릅니다`);
  nonEmpty(p.title, w, 'title', 2);
  if (![1, 2, 3].includes(p.level)) err(w, 'level 은 1|2|3');
  const topicIds = new Set([...ALGO_TOPICS.map((t) => t.id), ...Object.keys(EXTRA_PROBLEM_TAGS)]);
  if (!Array.isArray(p.topics) || p.topics.length === 0) err(w, 'topics 가 비어있습니다');
  p.topics?.forEach((t) => !topicIds.has(t) && err(w, `알 수 없는 topic: ${t}`));
  checkRich(p.description, w, 'description', 40);
  if (!Array.isArray(p.constraints) || p.constraints.length === 0) err(w, 'constraints 가 비어있습니다');
  p.constraints?.forEach((c, i) => checkInline(c, w, `constraints[${i}]`));
  if (p.exampleNotes) checkRich(p.exampleNotes, w, 'exampleNotes');
  if (!Array.isArray(p.hints) || p.hints.length === 0) err(w, 'hints 가 비어있습니다');
  checkRich(p.explanation, w, 'explanation', 80);
  nonEmpty(p.complexity?.time, w, 'complexity.time');
  nonEmpty(p.complexity?.space, w, 'complexity.space');
  if (p.compare && !['exact', 'unordered', 'float'].includes(p.compare)) err(w, `compare 오류: ${p.compare}`);

  let ok = true;
  const sig = p.signature;
  if (!sig || !Array.isArray(sig.params) || !VALUE_TYPES.has(sig.returns)) {
    err(w, 'signature 형식 오류');
    return false;
  }
  if (p.compare === 'unordered' && !['int[]', 'long[]', 'double[]', 'bool[]', 'string[]'].includes(sig.returns)) {
    err(w, "compare: 'unordered' 는 1차원 배열 반환에만 사용");
  }
  if (sig.returns === 'double' && p.compare !== 'float') warn(w, "double 반환은 compare: 'float' 권장");
  sig.params.forEach((prm) => {
    if (!/^[a-z][A-Za-z0-9_]*$/.test(prm.name)) err(w, `매개변수 이름 오류: ${prm.name} (camelCase)`);
    if (RESERVED.has(prm.name)) err(w, `매개변수 이름 '${prm.name}' 는 일부 언어의 예약어/표준 이름과 충돌합니다`);
    if (!VALUE_TYPES.has(prm.type)) err(w, `매개변수 타입 오류: ${prm.type}`);
  });
  const checkCases = (cases: TestCase[], label: string, min: number) => {
    if (!Array.isArray(cases) || cases.length < min) {
      err(w, `${label} 는 최소 ${min}개`);
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
  checkCases(p.examples, 'examples', 1);
  checkCases(p.tests, 'tests', 5);
  const size = JSON.stringify([p.examples, p.tests]).length;
  if (size > 15000) warn(w, `테스트 데이터가 큽니다 (${(size / 1024).toFixed(1)}KB > 15KB)`);
  for (const lang of ['python', 'javascript', 'java', 'cpp'] as SolveLanguage[]) {
    if (!nonEmpty(p.solutions?.[lang], w, `solutions.${lang}`, 20)) ok = false;
  }
  if (p.solutions?.java && /\brecord\s+\w+\s*\(|\.toList\(\)|instanceof\s+\w+\s+\w+\s*[)&|]/.test(p.solutions.java)) {
    warn(w, 'Java 모범 답안은 Java 15 호환이어야 합니다 (record, Stream.toList(), instanceof 패턴 금지)');
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

function exec(cmd: string, args: string[], opts: { cwd?: string; input?: string; timeoutMs: number }): Promise<ExecOutput> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: opts.cwd });
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

async function runPython(p: AlgoProblem, cases: TestCase[]): Promise<LangRun> {
  const res = await exec('python3', ['-I', join(ROOT, 'scripts', 'lib', 'run_python.py')], {
    input: JSON.stringify({ code: p.solutions.python, tests: cases.map((c) => c.input), timeLimitSec: 10 }),
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

async function runJavascript(p: AlgoProblem, cases: TestCase[]): Promise<LangRun> {
  const ctx = vm.createContext({ console: { log() {}, error() {}, warn() {}, info() {} } });
  try {
    vm.runInContext(p.solutions.javascript, ctx, { timeout: 5000 });
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

async function runCompiled(lang: 'java' | 'cpp', p: AlgoProblem, cases: TestCase[]): Promise<LangRun> {
  const dir = mkdtempSync(join(tmpdir(), `tj-${lang}-`));
  try {
    const userCode = p.solutions[lang];
    if (lang === 'java') {
      const prog = buildJavaProgram(userCode, p.signature, cases);
      writeFileSync(join(dir, 'Main.java'), prog.source);
      const c = await exec('javac', ['--release', '15', '-encoding', 'UTF-8', '-nowarn', '-d', 'out', 'Main.java'], {
        cwd: dir,
        timeoutMs: 60_000,
      });
      if (c.code !== 0) return { fatal: mapJavaErrors(c.stderr || c.stdout, prog.offset).slice(0, 3000), outputs: [] };
      const r = await exec('java', ['-cp', 'out', 'Main'], { cwd: dir, timeoutMs: 60_000 });
      return collectHarness(r, cases.length);
    }
    const prog = buildCppProgram(userCode, p.signature, cases);
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

async function runProblem(p: AlgoProblem) {
  const cases = [...p.examples, ...p.tests];
  const w = `problem/${p.id}`;
  for (const lang of LANGS) {
    const started = Date.now();
    let run: LangRun;
    if (lang === 'python') run = await runPython(p, cases);
    else if (lang === 'javascript') run = await runJavascript(p, cases);
    else run = await runCompiled(lang, p, cases);
    if (run.fatal) {
      err(w, `[${lang}] 실행 실패:\n${run.fatal}`);
      continue;
    }
    let failed = 0;
    run.outputs.forEach((o, i) => {
      const c = cases[i];
      const label = i < p.examples.length ? `examples[${i}]` : `tests[${i - p.examples.length}]`;
      if (!o.ok) {
        failed++;
        err(w, `[${lang}] ${label} 에러: ${String(o.value).slice(0, 300)}`);
      } else if (!resultsMatch(c.output, o.value, p.compare ?? 'exact')) {
        failed++;
        err(w, `[${lang}] ${label} 불일치\n      입력: ${formatValue(c.input, 200)}\n      기대: ${formatValue(c.output, 200)}\n      실제: ${formatValue(o.value, 200)}`);
      }
    });
    const ms = Date.now() - started;
    console.log(`    ${failed === 0 ? '✓' : '✗'} ${p.id} [${lang}] ${cases.length - failed}/${cases.length} (${ms}ms)`);
  }
}

async function validateProblems() {
  const dir = join(CONTENT, 'algorithm', 'problems');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .filter((f) => !ONLY || ONLY.some((o) => f.replace(/\.ts$/, '') === o || f.includes(o)))
    .sort();
  const problems: AlgoProblem[] = [];
  for (const f of files) {
    const p = await importDefault<AlgoProblem>(join(dir, f));
    if (!p) {
      err(`problem/${f}`, 'default export 가 없습니다');
      continue;
    }
    if (checkProblemStructure(p, f)) problems.push(p);
  }
  console.log(`  problems: ${files.length}개 (구조 검증 통과 ${problems.length}개)`);
  if (QUICK) return;
  const queue = [...problems];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const p = queue.shift()!;
      await runProblem(p);
    }
  });
  await Promise.all(workers);
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log('콘텐츠 검증 시작\n');
  if (SECTIONS.has('cs')) await validateCs();
  if (SECTIONS.has('algo-quiz')) await validateAlgoQuiz();
  if (SECTIONS.has('review')) await validateReview();
  if (SECTIONS.has('problems')) await validateProblems();
  reportAnswerSkew();

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
