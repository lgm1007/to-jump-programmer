/**
 * 웹 버전의 페이지 만들기 — scripts/build-web.mjs 가 부른다.
 *   npx tsx scripts/web-routes.ts <dist 폴더> <사이트 루트 경로(예: / 또는 /to-jump-programmer/)> [사이트 주소(예: https://jumpprogrammer.app/)]
 *
 * - 콘텐츠 화면마다 <경로>/index.html 을 만든다. 앱 셸(dist/app-shell.html)에 그 화면의 제목 · 설명과 실제 본문
 *   HTML(scripts/lib/prerender.ts)을 넣어, JS 를 실행하지 않는 크롤러(검색 · AdSense 심사)도 콘텐츠를 읽을 수 있게 한다.
 *   앱 JS 가 뜨면 React 가 #root 를 비우고 앱 화면을 그린다. 홈('/')은 dist/index.html 을 이 방식으로 다시 쓴다.
 * - 앱 기능 화면(온보딩 · 퀴즈 풀이 · 설정 …)은 본문 없이 noindex 로 만든다.
 * - 사이트 주소를 주면 콘텐츠 페이지로 sitemap.xml 을 만들고, 페이지마다 canonical · og:url 을 넣는다.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { esc, PRERENDER_STYLE, SITE_NAME, staticPages, type StaticPage } from './lib/prerender';

const [dist, prefix, site] = process.argv.slice(2);
if (!dist || !prefix?.startsWith('/') || !prefix.endsWith('/') || (site && !/^https:\/\/.+\/$/.test(site))) {
  console.error('사용법: tsx scripts/web-routes.ts <dist> </ 또는 /경로/> [https://…/]');
  process.exit(1);
}

// 앱 셸 — build-web.mjs 가 index.html 을 고친 뒤 app-shell.html 로 복사해 둔다 (서비스 워커의 화면 이동 응답)
const shell = readFileSync(join(dist, 'app-shell.html'), 'utf8');

function replaceOnce(html: string, pattern: RegExp, value: string, what: string): string {
  if (!pattern.test(html)) throw new Error(`앱 셸에서 ${what} 을(를) 찾지 못했습니다`);
  return html.replace(pattern, value);
}

function render(page: StaticPage): string {
  const title = page.path ? `${page.title} | ${SITE_NAME}` : `${SITE_NAME} — ${page.title}`;
  const url = site ? `${site}${page.path ? `${page.path}/` : ''}` : '';
  let html = shell;
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`, '<title>');
  html = replaceOnce(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(page.description)}">`, 'description');
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`, 'og:title');
  html = replaceOnce(
    html,
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${esc(page.description)}">`,
    'og:description',
  );
  if (url) html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(url)}">`);
  const head = [
    page.noindex ? '<meta name="robots" content="noindex">' : url ? `<link rel="canonical" href="${esc(url)}">` : '',
    page.html ? PRERENDER_STYLE : '',
  ].filter(Boolean);
  if (head.length) html = replaceOnce(html, /<\/head>/, `${head.join('\n')}\n</head>`, '</head>');
  if (page.html) html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${page.html}</div>`, '<div id="root">');
  return html;
}

const pages = staticPages(prefix);
for (const page of pages) {
  const dir = join(dist, page.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), render(page));
}
const content = pages.filter((p) => !p.noindex);
console.log(`✓ 페이지 ${pages.length}개 (콘텐츠 ${content.length}개는 본문 HTML 포함, 앱 기능 화면 ${pages.length - content.length}개는 noindex)`);

if (site) {
  const today = new Date().toISOString().slice(0, 10);
  // 폴더 주소는 / 로 끝나는 주소로 리디렉션되므로 처음부터 / 를 붙인다
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...content.map((p) => `  <url><loc>${site}${p.path ? `${p.path}/` : ''}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(join(dist, 'sitemap.xml'), xml);
  console.log(`✓ sitemap.xml: ${content.length}개 주소`);
}
