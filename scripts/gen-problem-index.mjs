// 코딩 문제 폴더의 index.ts 를 자동 생성한다.
//   node scripts/gen-problem-index.mjs              src/content/data/algorithm/problems
//   node scripts/gen-problem-index.mjs <폴더>
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ident = (f) => 'p_' + f.replace(/\.ts$/, '').replace(/[^a-zA-Z0-9]/g, '_');

/** 폴더의 문제 파일을 모아 index.ts 를 만든다. 위치와 관계없이 쓰이도록 타입은 별칭 경로로 가져온다. */
export function writeProblemIndex(dir) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .sort();
  const lines = [
    '// 자동 생성 파일입니다. 직접 수정하지 말고 `npm run content:index` 를 실행하세요.',
    "import type { AlgoProblem } from '@/content/types';",
    '',
    ...files.map((f) => `import ${ident(f)} from './${f.replace(/\.ts$/, '')}';`),
    '',
    'export const PROBLEMS: AlgoProblem[] = [',
    ...files.map((f) => `  ${ident(f)},`),
    '];',
    '',
  ];
  const out = join(dir, 'index.ts');
  const next = lines.join('\n');
  let prev = '';
  try {
    prev = readFileSync(out, 'utf8');
  } catch {}
  if (prev !== next) writeFileSync(out, next);
  return files.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? join(root, 'src', 'content', 'data', 'algorithm', 'problems'));
  console.log(`problems/index.ts: ${writeProblemIndex(dir)}개 문제`);
}
