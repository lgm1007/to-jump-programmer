/**
 * 전체 콘텐츠(src/content/data, full)에서 공개 저장소용 샘플(src/content/sample)을 만든다.
 *   npm run content:sync && npm run content:sample
 *
 * 샘플 범위: 알고리즘 토픽마다 개념 첫 단락 + 퀴즈 2문항, CS 카테고리마다 퀴즈 2문항 + 카드 1장,
 * 프레임워크마다 개선 패턴 2개 + 리뷰 퀴즈 1개, 코딩 문제는 난이도별 1개.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ALGO_TOPICS } from '../src/content/algorithm/topics';
import { CS_CATEGORIES } from '../src/content/cs/categories';
import { REVIEW_FRAMEWORKS } from '../src/content/review/frameworks';
import type { AlgoProblem, AlgoTopicContent, CsCategoryContent, ReviewFrameworkContent } from '../src/content/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src', 'content', 'data');
const SAMPLE = join(ROOT, 'src', 'content', 'sample');

const HEADER = '// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.';

/** 원본 소스와 비슷한 모양의 TS 리터럴로 직렬화한다 (여러 줄 문자열은 템플릿 리터럴) */
function literal(v: unknown, indent = ''): string {
  const next = `${indent}  `;
  if (typeof v === 'string') {
    if (v.includes('\n')) return '`' + v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
    return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return `[\n${v.map((x) => `${next}${literal(x, next)},`).join('\n')}\n${indent}]`;
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined);
    if (entries.length === 0) return '{}';
    const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
    return `{\n${entries.map(([k, x]) => `${next}${key(k)}: ${literal(x, next)},`).join('\n')}\n${indent}}`;
  }
  throw new Error(`직렬화할 수 없는 값: ${typeof v}`);
}

function writeModule(file: string, typeName: string, value: unknown) {
  mkdirSync(dirname(file), { recursive: true });
  const body = [
    HEADER,
    `import type { ${typeName} } from '@/content/types';`,
    '',
    `const content: ${typeName} = ${literal(value)};`,
    '',
    'export default content;',
    '',
  ].join('\n');
  writeFileSync(file, body);
}

async function load<T>(file: string): Promise<T> {
  return ((await import(pathToFileURL(file).href)) as { default: T }).default;
}

/** 개념 정리의 첫 번째 '###' 단락만 남긴다 */
function firstSection(primer: string): string {
  const idx = primer.indexOf('\n### ', primer.indexOf('### ') + 4);
  return (idx > 0 ? primer.slice(0, idx) : primer).trimEnd();
}

async function main() {
  if (!existsSync(join(DATA, '.source')) || readFileSync(join(DATA, '.source'), 'utf8').trim() !== 'full') {
    console.error('✗ src/content/data 가 전체 콘텐츠가 아닙니다. 먼저 `npm run content:sync` 를 실행하세요.');
    process.exit(1);
  }
  rmSync(SAMPLE, { recursive: true, force: true });

  for (const topic of ALGO_TOPICS) {
    const c = await load<AlgoTopicContent>(join(DATA, 'algorithm', 'quiz', `${topic.id}.ts`));
    writeModule(join(SAMPLE, 'algorithm', 'quiz', `${topic.id}.ts`), 'AlgoTopicContent', {
      primer: firstSection(c.primer),
      questions: c.questions.slice(0, 2),
    });
  }

  for (const cat of CS_CATEGORIES) {
    const c = await load<CsCategoryContent>(join(DATA, 'cs', `${cat.id}.ts`));
    writeModule(join(SAMPLE, 'cs', `${cat.id}.ts`), 'CsCategoryContent', {
      quiz: c.quiz.slice(0, 2),
      cards: c.cards.slice(0, 1),
    });
  }

  for (const fw of REVIEW_FRAMEWORKS) {
    const c = await load<ReviewFrameworkContent>(join(DATA, 'review', `${fw.id}.ts`));
    writeModule(join(SAMPLE, 'review', `${fw.id}.ts`), 'ReviewFrameworkContent', {
      patterns: c.patterns.slice(0, 2),
      challenges: c.challenges.slice(0, 1),
    });
  }

  const dir = join(DATA, 'algorithm', 'problems');
  const problems: AlgoProblem[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && x !== 'index.ts').sort()) {
    problems.push(await load<AlgoProblem>(join(dir, f)));
  }
  const picked = new Map<number, AlgoProblem>();
  for (const p of problems) if (!picked.has(p.level)) picked.set(p.level, p);
  for (const p of picked.values()) {
    writeModule(join(SAMPLE, 'algorithm', 'problems', `${p.id}.ts`), 'AlgoProblem', p);
  }

  console.log(
    `✓ 샘플 생성: 알고리즘 토픽 ${ALGO_TOPICS.length} · CS ${CS_CATEGORIES.length} · 리뷰 ${REVIEW_FRAMEWORKS.length} · 코딩 문제 ${picked.size}개 (${[...picked.values()].map((p) => p.id).join(', ')})`,
  );
}

void main();
