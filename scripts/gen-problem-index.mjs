// src/content/algorithm/problems/index.ts 를 자동 생성한다.
//   node scripts/gen-problem-index.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src', 'content', 'algorithm', 'problems');
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .sort();

const ident = (f) => 'p_' + f.replace(/\.ts$/, '').replace(/[^a-zA-Z0-9]/g, '_');
const lines = [
  '// 자동 생성 파일입니다. 직접 수정하지 말고 `npm run content:index` 를 실행하세요.',
  "import type { AlgoProblem } from '../../types';",
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
if (prev !== next) {
  writeFileSync(out, next);
  console.log(`problems/index.ts 갱신: ${files.length}개 문제`);
} else {
  console.log(`problems/index.ts 최신 상태: ${files.length}개 문제`);
}
