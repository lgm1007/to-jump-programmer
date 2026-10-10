/**
 * 웹 버전의 콘텐츠 페이지 주소 준비 — scripts/build-web.mjs 가 부른다.
 *   npx tsx scripts/web-routes.ts <dist 폴더> [사이트 주소(예: https://lgm1007.github.io/to-jump-programmer/)]
 *
 * - GitHub Pages 는 없는 경로에 404.html 을 404 상태 코드로 내려 준다. 앱은 그대로 열리지만 검색 엔진 · AdSense
 *   크롤러는 404 페이지를 색인하지 않으므로, 콘텐츠 화면마다 <경로>/index.html 로 앱 셸을 복사해 200 으로 열리게 한다.
 * - 사이트 주소를 주면 같은 경로 목록으로 sitemap.xml 을 만든다.
 * 온보딩 없이 열리는 화면(탭 · 토픽 · 문제 · 개선 패턴 · 리뷰 퀴즈 · 면접 카테고리 · 개인정보 처리방침)만 넣는다.
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ALL_PROBLEMS, CHALLENGE_MAP, PATTERN_MAP } from '../src/content';
import { ALGO_TOPICS } from '../src/content/algorithm/topics';
import { CS_CATEGORIES } from '../src/content/cs/categories';

const [dist, site] = process.argv.slice(2);
if (!dist || (site && !/^https:\/\/.+\/$/.test(site))) {
  console.error('사용법: tsx scripts/web-routes.ts <dist> [https://…/]');
  process.exit(1);
}

const paths = [
  'algorithm',
  'review',
  'interview',
  ...ALGO_TOPICS.map((t) => `algorithm/topic/${t.id}`),
  ...ALL_PROBLEMS.map((p) => `algorithm/problem/${p.id}`),
  ...Object.keys(PATTERN_MAP).map((id) => `review/pattern/${id}`),
  ...Object.keys(CHALLENGE_MAP).map((id) => `review/challenge/${id}`),
  ...CS_CATEGORIES.map((c) => `interview/${c.id}`),
  'privacy',
];

for (const p of paths) {
  mkdirSync(join(dist, p), { recursive: true });
  copyFileSync(join(dist, 'index.html'), join(dist, p, 'index.html'));
}
console.log(`✓ 콘텐츠 페이지 ${paths.length}개 (경로별 index.html)`);

if (site) {
  const today = new Date().toISOString().slice(0, 10);
  // GitHub Pages 는 폴더 주소를 / 로 끝나는 주소로 리디렉션하므로 처음부터 / 를 붙인다
  const urls = ['', ...paths.map((p) => `${p}/`)];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(join(dist, 'sitemap.xml'), xml);
  console.log(`✓ sitemap.xml: ${urls.length}개 주소`);
}
