/**
 * 웹(PWA) 빌드 — expo export 결과(dist/)를 설치 가능한 오프라인 웹 앱으로 만든다.
 *   npm run build:web                                         # 로컬 확인용 (사이트 루트 /)
 *   TJ_WEB_ORIGIN=https://jumpprogrammer.app npm run build:web  # 배포용 (Cloudflare, 도메인 루트)
 *   TJ_WEB_BASE_URL=/to-jump-programmer npm run build:web     # 하위 경로에 둘 때 (예: GitHub Pages 프로젝트 사이트)
 *   npm run preview:web                                       # dist/ 를 GitHub Pages 처럼 띄워 확인
 *
 * 1) expo export -p web (TJ_WEB_BASE_URL → app.config.ts 의 experiments.baseUrl)
 * 2) index.html <head> 에 manifest · 홈 화면 아이콘 · 테마 색 · 서비스 워커 등록 · (설정 시) AdSense 사이트 확인 태그 추가
 * 3) app-shell.html(서비스 워커의 화면 이동 응답) · 404.html(없는 주소) — 본문 없는 앱 셸
 * 4) 페이지별 index.html — 콘텐츠 화면은 제목 · 설명 · 실제 본문 HTML 을 넣고(크롤러 · AdSense 심사용, 홈 '/' 포함),
 *    앱 기능 화면은 noindex. sitemap.xml(TJ_WEB_ORIGIN 이 있을 때) — scripts/web-routes.ts · scripts/lib/prerender.ts
 * 5) 도메인 루트에 둘 때: robots.txt · ads.txt · app-ads.txt (AdSense · AdMob 판매자 인증)
 * 6) manifest.webmanifest · 서비스 워커(sw.js, Workbox) 생성
 *
 * 환경 변수 (모두 선택)
 *   TJ_WEB_BASE_URL                 배포 경로 (예: /to-jump-programmer). 없으면 도메인 루트
 *   TJ_WEB_ORIGIN                   사이트 주소 (예: https://jumpprogrammer.app) — 있으면 sitemap.xml · 링크 미리보기 태그를 만든다
 *   EXPO_PUBLIC_ADSENSE_CLIENT      AdSense 게시자 ID (ca-pub-…) — 사이트 소유 확인 태그 · ads.txt. 없으면 넣지 않는다
 *   EXPO_PUBLIC_ADSENSE_SLOT        AdSense 디스플레이 광고 단위 ID (숫자)
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateSW } from 'workbox-build';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const APP = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo;

const BASE = (process.env.TJ_WEB_BASE_URL ?? '').trim().replace(/\/+$/, '');
if (BASE && !/^\/[\w.-]+(\/[\w.-]+)*$/.test(BASE)) {
  console.error(`✗ TJ_WEB_BASE_URL 은 /저장소이름 형태여야 합니다: ${BASE}`);
  process.exit(1);
}
const PREFIX = `${BASE}/`;
const ORIGIN = process.env.TJ_WEB_ORIGIN?.trim().replace(/\/+$/, '') ?? '';
if (ORIGIN && !/^https:\/\/[^/]+$/.test(ORIGIN)) {
  console.error(`✗ TJ_WEB_ORIGIN 은 https://도메인 형태여야 합니다: ${ORIGIN}`);
  process.exit(1);
}
const BASE_PATTERN = BASE.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');

const ADSENSE_CLIENT = process.env.EXPO_PUBLIC_ADSENSE_CLIENT?.trim() ?? '';
if (ADSENSE_CLIENT && !/^ca-pub-\d+$/.test(ADSENSE_CLIENT)) {
  console.error(`✗ EXPO_PUBLIC_ADSENSE_CLIENT 는 ca-pub-숫자 형태여야 합니다: ${ADSENSE_CLIENT}`);
  process.exit(1);
}

/** 앱 배경색 (src/theme/tokens.ts 의 bg) — 설치한 앱의 상태 표시줄 · 시작 화면 색 */
const BG = { light: '#F2F4F6', dark: '#0E1013' };
const DESCRIPTION = '코딩 테스트 · 코드 리뷰 · 기술 면접을 하루 10분씩 준비하는 개발자 취업·이직 학습 앱';

function run() {
  // 환경 변수(EXPO_PUBLIC_*)가 번들에 새로 들어가도록 캐시를 비우고 내보낸다
  const r = spawnSync('npx', ['expo', 'export', '-p', 'web', '--clear'], { cwd: ROOT, stdio: 'inherit', env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function headTags() {
  const tags = [
    `<meta name="description" content="${DESCRIPTION}">`,
    `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${BG.light}">`,
    `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${BG.dark}">`,
    `<link rel="manifest" href="${PREFIX}manifest.webmanifest">`,
    `<link rel="apple-touch-icon" href="${PREFIX}icons/apple-touch-icon.png">`,
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    `<meta name="apple-mobile-web-app-title" content="${APP.web?.shortName ?? APP.name}">`,
    '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
    `<meta property="og:title" content="${APP.web?.name ?? APP.name}">`,
    `<meta property="og:description" content="${DESCRIPTION}">`,
    // iOS Safari 는 16px 보다 작은 입력 칸을 누르면 화면을 확대하므로 iOS 에서만 자동 확대를 막는다
    '<script>(function(){var u=navigator.userAgent;if(!/Android/i.test(u)&&(/iP(hone|ad|od)/.test(u)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))){var m=document.querySelector("meta[name=viewport]");if(m)m.setAttribute("content",m.getAttribute("content")+", maximum-scale=1")}})()</script>',
    `<script>if("serviceWorker"in navigator)addEventListener("load",function(){navigator.serviceWorker.register("${PREFIX}sw.js",{scope:"${PREFIX}"}).catch(function(){})})</script>`,
  ];
  // 링크 미리보기(카카오톡 · 슬랙 등)는 절대 주소만 읽는다
  if (ORIGIN) tags.push(`<meta property="og:url" content="${ORIGIN}${PREFIX}">`, `<meta property="og:image" content="${ORIGIN}${PREFIX}icons/icon-512.png">`);
  if (ADSENSE_CLIENT) {
    // 사이트 소유 확인(메타 태그). AdSense 스크립트는 넣지 않는다 — 콘텐츠 화면의 광고 자리(AdSlot,
    // src/features/ads/index.web.tsx)가 처음 그려질 때 불러와, 콘텐츠가 없는 화면에서는 광고 요청이 나가지 않게 한다
    tags.push(
      `<meta name="google-adsense-account" content="${ADSENSE_CLIENT}">`,
      // 채워지지 않은 광고 자리는 공간을 차지하지 않게 한다
      '<style>ins.adsbygoogle[data-ad-status="unfilled"]{display:none!important}</style>',
    );
  }
  return tags.join('\n    ');
}

function patchIndex() {
  const file = join(DIST, 'index.html');
  let html = readFileSync(file, 'utf8');
  // app.json 의 web.themeColor 대신 화면 배경색(라이트/다크)을 쓴다
  html = html.replace(/<meta name="theme-color"[^>]*>\s*/g, '');
  if (!html.includes('</head>')) throw new Error('dist/index.html 에 </head> 가 없습니다');
  html = html.replace('</head>', `    ${headTags()}\n  </head>`);
  writeFileSync(file, html);
  // 본문 없는 앱 셸 — 서비스 워커가 화면 이동에 내려 주고(이미 설치한 사용자는 바로 앱 화면), 없는 주소에도 쓴다.
  // index.html 은 writeRoutes 가 홈 본문을 넣어 다시 쓴다
  copyFileSync(file, join(DIST, 'app-shell.html'));
  copyFileSync(file, join(DIST, '404.html'));
}

function writeManifest() {
  const manifest = {
    id: PREFIX,
    name: APP.web?.name ?? APP.name,
    short_name: APP.web?.shortName ?? APP.name,
    description: DESCRIPTION,
    lang: 'ko',
    dir: 'ltr',
    start_url: PREFIX,
    scope: PREFIX,
    display: 'standalone',
    orientation: 'portrait',
    background_color: BG.light,
    theme_color: BG.light,
    categories: ['education', 'productivity'],
    icons: [
      { src: `${PREFIX}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${PREFIX}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${PREFIX}icons/maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: `${PREFIX}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  writeFileSync(join(DIST, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeRoutes() {
  const args = ['tsx', 'scripts/web-routes.ts', DIST, PREFIX, ...(ORIGIN ? [`${ORIGIN}${PREFIX}`] : [])];
  const r = spawnSync('npx', args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

/** 도메인 루트에만 의미가 있는 파일 — 하위 경로 배포에서는 만들지 않는다 */
function writeRootFiles() {
  if (BASE) return;
  if (ORIGIN) {
    writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
  }
  if (ADSENSE_CLIENT) {
    // AdSense(웹)와 AdMob(앱)은 같은 게시자 ID 를 쓴다. app-ads.txt 는 스토어에 등록할 개발자 웹사이트용
    const line = `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`;
    writeFileSync(join(DIST, 'ads.txt'), line);
    writeFileSync(join(DIST, 'app-ads.txt'), line);
  }
}

async function writeServiceWorker() {
  const { count, size, warnings } = await generateSW({
    globDirectory: DIST,
    globPatterns: ['**/*.{html,js,css,json,webmanifest,png,ico,ttf,woff,woff2}'],
    // 페이지별 index.html(홈 포함)은 크롤러 · 첫 방문용 본문이 든 페이지라 미리 캐시하지 않는다 — 화면 이동은 앱 셸(navigateFallback)이 처리.
    // 404.html 은 앱 셸과 같고, metadata.json 은 앱이 쓰지 않는다
    globIgnores: ['index.html', '404.html', '*/**/index.html', 'metadata.json', 'sitemap.xml', 'sw.js', 'workbox-*.js'],
    swDest: join(DIST, 'sw.js'),
    sourcemap: false,
    // 앱 번들(콘텐츠 포함)이 5MB 를 넘으므로 기본 한도(2MB)를 늘린다
    maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
    // 어떤 경로로 들어와도(오프라인 포함) 앱 셸을 내려 준다 — 화면 이동은 Expo Router 가 처리
    navigateFallback: `${PREFIX}app-shell.html`,
    navigateFallbackAllowlist: [new RegExp(`^${BASE_PATTERN}/`)],
    // 사이트 루트의 정적 파일(sitemap · robots · ads · 검색엔진 소유권 확인)은 앱 셸 대신 서버 응답을 그대로 보여 준다
    navigateFallbackDenylist: [new RegExp(`^${BASE_PATTERN}/(sitemap\\.xml|robots\\.txt|ads\\.txt|app-ads\\.txt|google[^/]+\\.html)$`)],
    // 새 버전을 배포하면 다음 실행부터 바로 쓰도록 한다 (학습 기록은 캐시가 아니라 브라우저 저장소에 있어 지워지지 않는다)
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  });
  for (const w of warnings) console.warn(`  ! ${w}`);
  console.log(`✓ 서비스 워커: 미리 캐시할 파일 ${count}개 (${(size / 1024 / 1024).toFixed(1)}MB)`);
}

run();
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ dist/index.html 이 없습니다. expo export 결과를 확인하세요.');
  process.exit(1);
}
patchIndex();
writeManifest();
writeRoutes();
writeRootFiles();
await writeServiceWorker();
console.log(
  `✓ 웹 빌드 완료: dist/ (경로 ${PREFIX}${ADSENSE_CLIENT ? `, AdSense ${ADSENSE_CLIENT}` : ', 광고 코드 없음'})`,
);
