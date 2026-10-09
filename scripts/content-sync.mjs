// 학습 콘텐츠를 src/content/data/ (gitignore 대상) 로 가져온다.
//
// 전체 콘텐츠는 비공개 저장소에 있고, 공개 저장소에는 샘플(src/content/sample/)만 있다.
//   - 비공개 콘텐츠 폴더가 있으면 그것을 복사한다. 경로: TJ_CONTENT_DIR 환경 변수, 기본값 ../to-jump-content
//   - 없으면 샘플을 복사한다 (공개 저장소만 받은 경우에도 앱이 동작하도록)
//
//   node scripts/content-sync.mjs              전체 콘텐츠(없으면 샘플)로 다시 맞춘다
//   node scripts/content-sync.mjs --sample     샘플로 맞춘다
//   node scripts/content-sync.mjs --if-missing data 가 비어 있을 때만 채운다 (npm install 후, EAS 빌드 서버)
//   node scripts/content-sync.mjs --require-full  data 가 전체 콘텐츠가 아니면 실패한다
//   node scripts/content-sync.mjs --eas        EAS 빌드 서버용: production 프로필이면 --require-full, 아니면 --if-missing
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeProblemIndex } from './gen-problem-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src', 'content', 'data');
const SAMPLE = join(ROOT, 'src', 'content', 'sample');
const MARKER = join(DATA, '.source');
const PRIVATE = resolve(ROOT, process.env.TJ_CONTENT_DIR ?? '../to-jump-content');
/** 콘텐츠 폴더 구조 (비공개 저장소와 샘플이 같은 구조) */
const PARTS = ['algorithm/quiz', 'algorithm/problems', 'cs', 'review'];

const args = new Set(process.argv.slice(2));
if (args.has('--eas')) {
  // 스토어 출시 빌드에 샘플 콘텐츠가 실리지 않도록 막는다
  args.add(process.env.EAS_BUILD_PROFILE === 'production' ? '--require-full' : '--if-missing');
}
const currentSource = () => (existsSync(MARKER) ? readFileSync(MARKER, 'utf8').trim() : null);

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name), base) : [relative(base, join(dir, e.name))],
  );
}

/** src 의 콘텐츠로 data 를 맞춘다. 개발 서버(Metro)가 켜져 있어도 깨지지 않게 폴더를 지우지 않고 파일 단위로 갱신한다. */
function copyFrom(src, source) {
  for (const part of PARTS) {
    if (!existsSync(join(src, part))) {
      console.error(`✗ ${join(src, part)} 폴더가 없습니다.`);
      process.exit(1);
    }
  }
  const wanted = new Set(
    PARTS.flatMap((part) => listFiles(join(src, part)).map((f) => join(part, f))).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('index.ts'),
    ),
  );
  for (const f of wanted) {
    const from = readFileSync(join(src, f));
    const to = join(DATA, f);
    if (existsSync(to) && readFileSync(to).equals(from)) continue;
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, from);
  }
  const keep = new Set([...wanted, '.source', join('algorithm', 'problems', 'index.ts')]);
  for (const f of listFiles(DATA)) if (!keep.has(f)) rmSync(join(DATA, f));
  writeProblemIndex(join(DATA, 'algorithm', 'problems'));
  writeFileSync(MARKER, `${source}\n`);
  console.log(`✓ 콘텐츠 동기화: ${source === 'full' ? `전체 콘텐츠 (${PRIVATE})` : '샘플 콘텐츠'} → src/content/data (${wanted.size}개 파일)`);
}

if (args.has('--require-full')) {
  if (currentSource() !== 'full') {
    console.error(
      '✗ src/content/data 가 전체 콘텐츠가 아닙니다 (현재: ' + (currentSource() ?? '없음') + ').\n' +
        '  비공개 콘텐츠 저장소를 받은 뒤 `npm run content:sync` 를 실행하고 다시 빌드하세요.',
    );
    process.exit(1);
  }
  console.log('✓ 전체 콘텐츠 확인');
} else if (args.has('--if-missing') && currentSource()) {
  console.log(`· 콘텐츠 유지 (${currentSource()})`);
} else if (args.has('--sample')) {
  copyFrom(SAMPLE, 'sample');
} else if (existsSync(PRIVATE)) {
  copyFrom(PRIVATE, 'full');
} else {
  if (!args.has('--if-missing')) {
    console.warn(`! 비공개 콘텐츠 폴더(${PRIVATE})가 없어 샘플 콘텐츠를 사용합니다.`);
  }
  copyFrom(SAMPLE, 'sample');
}
