# 웹 버전 (PWA) 배포 가이드

같은 Expo 코드를 웹으로 내보내, 브라우저에서 바로 쓰고 휴대폰 홈 화면에 앱처럼 설치할 수 있는 PWA 로 배포합니다.

- 주소: https://jumpprogrammer.app (도메인: name.com 에서 구매, DNS · 호스팅: Cloudflare)
- 호스팅: **Cloudflare Workers 정적 자산** (`wrangler.jsonc`) — 서버 코드 없이 빌드 결과(`dist/`)만 올린다
- 배포: `main` 에 푸시하면 GitHub Actions(`.github/workflows/deploy-web.yml`)가 비공개 콘텐츠를 받아 빌드하고 Cloudflare 에 올린다
- 광고: 앱은 AdMob, 웹은 Google AdSense (같은 계정 `ca-pub-5529768839764642`)

## 1. 구성

| 항목 | 내용 |
| --- | --- |
| 빌드 | `npm run build:web` → `scripts/build-web.mjs` (expo export → PWA 태그 · manifest · 서비스 워커 · 페이지별 index.html · sitemap · robots.txt · ads.txt) |
| 페이지별 HTML | 콘텐츠 화면(홈 · 탭 · 토픽 · 유형 · 개선 패턴 · 리뷰 퀴즈 · 면접 카테고리 · CS 레슨 · 소개 · 개인정보 처리방침)마다 `<경로>/index.html` 에 **제목 · 설명 · canonical 과 실제 본문 HTML** 을 넣는다(`scripts/lib/prerender.ts`). JS 를 실행하지 않는 크롤러(검색 · AdSense 심사)도 콘텐츠를 읽고, 사용자에게는 앱을 불러오는 동안의 첫 화면이 된다. 앱 JS 가 뜨면 React 가 `#root` 를 비우고 앱 화면을 그린다. 앱 기능 화면(온보딩 · 퀴즈 · 카드 · 설정 · 북마크 · 오답노트 · 마이)은 본문 없이 `noindex` |
| 주소 처리 | `not_found_handling: 404-page` — 화면마다 index.html 이 있으므로 없는 경로만 404 상태 코드와 앱 셸(`404.html`)을 내려 준다. 앱은 그대로 열린다 |
| 앱 셸 | `app-shell.html` — 본문 없는 index.html. 서비스 워커가 화면 이동에 이것을 내려 줘, 설치 · 재방문 사용자는 본문 HTML 없이 바로 앱 화면을 본다 |
| 첫 방문 | 웹은 온보딩으로 보내지 않는다. 처음 방문한 사람도 기본 코스(백엔드 · Spring · Python)로 바로 콘텐츠를 보고, 홈의 안내 카드나 [마이 › 내 코스 설정하기]에서 코스를 정한다 (앱은 처음 실행할 때 온보딩) |
| 오프라인 | Workbox 서비스 워커가 앱 파일(콘텐츠 포함)을 미리 저장해 오프라인에서도 모든 화면이 열림 |
| 설치 | Android Chrome · PC Chrome/Edge: [앱 설치] 버튼, iPhone: Safari 공유 → 홈 화면에 추가 (홈 화면 · 설정에서 안내) |
| 학습 기록 | 브라우저 저장소(localStorage). [마이 › 설정 › 백업 내보내기/복원]으로 JSON 백업 |
| 광고 | 콘텐츠 사이의 AdSense 디스플레이 광고(`AdSlot`) — 탭 화면, 알고리즘 토픽 · 유형, 개선 패턴 · 리뷰 퀴즈, 면접 카테고리 · CS 레슨. AdSense 스크립트는 페이지 `<head>` 에 넣지 않고 광고 자리가 처음 그려질 때 불러온다 |
| 루트 파일 | `robots.txt`(sitemap 주소), `ads.txt` · `app-ads.txt`(AdSense · AdMob 판매자 인증)를 빌드가 만든다 |

## 2. 로컬에서 확인

```bash
TJ_WEB_ORIGIN=https://jumpprogrammer.app npm run build:web
```
```bash
npm run preview:web
```

`http://127.0.0.1:4173/` 에서 열립니다. 서비스 워커는 `localhost`/`127.0.0.1` 또는 HTTPS 에서만 동작하고, 개발 서버(`npm run web`)에는 서비스 워커 · 광고가 들어가지 않습니다.

## 3. Cloudflare 설정 (최초 1회)

1. **도메인을 Cloudflare 로 연결**: Cloudflare 대시보드 › **Add a domain** › `jumpprogrammer.app` › Free 플랜. 안내되는 네임서버 2개를 name.com › My Domains › jumpprogrammer.app › **Nameservers** 에 넣습니다. (DNSSEC 을 켰다면 먼저 끕니다) Cloudflare 에서 도메인이 **Active** 가 되면 다음 단계로 갑니다. (몇 분 ~ 최대 24시간)
2. **API 토큰**: Cloudflare › **Manage Account › Account API tokens › Create Token** › **Edit Cloudflare Workers** 템플릿 › 계정 리소스는 내 계정, 영역(Zone) 리소스는 `jumpprogrammer.app` 으로 좁혀서 만듭니다.
3. **GitHub 시크릿 등록** (값은 명령 실행 후 입력):
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --repo lgm1007/to-jump-programmer
   ```
   ```bash
   gh secret set CLOUDFLARE_ACCOUNT_ID --repo lgm1007/to-jump-programmer
   ```
   계정 ID 는 Cloudflare 대시보드의 계정 홈(또는 Workers & Pages 개요) 오른쪽에 있습니다.
4. **비공개 콘텐츠 읽기 키**: `lgm1007/to-jump-content` 의 Deploy keys 에 읽기 전용 키가, 앱 저장소 시크릿에 `CONTENT_DEPLOY_KEY` 로 등록되어 있습니다. 다시 만들 때:
   ```bash
   ssh-keygen -t ed25519 -N "" -C "to-jump-programmer deploy-web" -f /tmp/tj-content-key
   ```
   ```bash
   gh repo deploy-key add /tmp/tj-content-key.pub --repo lgm1007/to-jump-content --title "to-jump-programmer deploy-web"
   ```
   ```bash
   gh secret set CONTENT_DEPLOY_KEY --repo lgm1007/to-jump-programmer < /tmp/tj-content-key
   ```
   등록 후 `/tmp/tj-content-key*` 파일은 지웁니다.
5. `main` 에 푸시하거나 **Actions › Deploy web › Run workflow** 로 배포합니다. 첫 배포 때 `wrangler.jsonc` 의 `routes`(custom_domain)에 따라 Cloudflare 가 `jumpprogrammer.app` DNS 레코드와 인증서를 만듭니다.

- `.app` 도메인은 HTTPS 로만 열리며(HSTS preload), 인증서는 Cloudflare 가 자동으로 발급합니다. name.com 의 SSL 상품은 필요 없습니다.
- `www.jumpprogrammer.app` 도 쓰려면 Cloudflare › Rules › Redirect Rules 에서 `www` → 루트 도메인으로 리디렉션을 만듭니다.

## 4. 광고 (Google AdSense)

1. AdSense › **사이트 › 새 사이트 추가**에 `jumpprogrammer.app` 을 등록합니다. 소유 확인은 **메타 태그** 또는 **ads.txt** 를 고릅니다. 둘 다 빌드에 들어갑니다(저장소 변수 `ADSENSE_CLIENT`).
2. AdSense › **광고 › 광고 단위 기준 › 디스플레이 광고**에서 반응형 광고 단위를 만들고, 광고 단위 ID 를 저장소 변수로 등록합니다.
   ```bash
   gh variable set ADSENSE_SLOT --repo lgm1007/to-jump-programmer --body "광고단위ID"
   ```
3. **자동 광고는 켜지 않습니다** (AdSense › 광고 › 사이트별 › `jumpprogrammer.app` › 자동 광고 끔). 앵커 광고가 탭 바를 가리거나, 화면 이동 때 전면 광고가 끼어들거나, 온보딩 · 퀴즈 풀이처럼 콘텐츠가 없는 화면에 광고가 붙을 수 있습니다.
4. 다시 배포하고 사이트가 "준비됨" 상태가 되면 광고가 나옵니다. 광고가 채워지지 않은 자리는 공간을 차지하지 않습니다.

**'게시자 콘텐츠가 없는 화면에 Google 게재 광고' 로 승인이 거절되었을 때 (2026-10 대응)**
- 원인: ① 처음 방문하면 홈 · 탭이 온보딩 화면으로 넘어가 심사 크롤러가 콘텐츠 대신 온보딩만 봤고, ② AdSense 스크립트가 모든 페이지 `<head>` 에 있어 온보딩 같은 화면에서도 광고 요청이 나갔고, ③ 모든 주소의 HTML 이 본문 없는 같은 껍데기였다.
- 수정: 웹 첫 방문은 온보딩 없이 콘텐츠로, AdSense 스크립트는 콘텐츠 화면의 광고 자리에서만 불러오기, 페이지별 본문 HTML · 제목 · 설명, 서비스 소개(`/about`) 추가, 결과 화면(퀴즈 · 카드 학습 완료)에서 광고 자리 제거, 개인정보 처리방침에 광고 쿠키 고지 · 문의처 추가.
- 배포 후 AdSense › 사이트 › `jumpprogrammer.app` › 정책 위반 항목에서 **[문제를 수정했음을 확인합니다]** 를 체크하고 **검토 요청**을 누릅니다. 심사에는 며칠~몇 주가 걸립니다.
- 다시 요청하기 전에 확인: 자동 광고가 꺼져 있는지, 시크릿 창에서 `https://jumpprogrammer.app/` 를 열었을 때 온보딩이 아니라 홈 콘텐츠가 보이는지, `https://jumpprogrammer.app/interview/lesson/cs-os-l01/` 의 페이지 소스에 레슨 본문이 있는지.

광고 배치 원칙 (AdSense 정책):
- 메뉴 · 버튼 같은 누를 수 있는 요소 바로 옆에 두지 않습니다(실수 클릭 유도 금지). 그래서 앱의 탭 바 위 고정 배너는 웹에서 쓰지 않습니다.
- 사용자가 화면을 옮길 때만 새 광고를 요청하고, 같은 자리를 시간마다 새로고침하지 않습니다.
- 문제를 푸는 화면(퀴즈 진행 · 카드 학습)에는 광고를 두지 않습니다.
- 본인 광고를 직접 누르지 않습니다.

## 5. 검색 노출 (Google Search Console)

- **도메인 속성** `jumpprogrammer.app` 으로 등록하고, 안내되는 TXT 레코드(`google-site-verification=…`)를 Cloudflare › DNS › Records 에 추가해 확인합니다.
- **URL 접두어 속성** `https://jumpprogrammer.app/` 으로 등록할 때는 HTML 파일 방법을 쓸 수 있습니다. 내려받은 `google….html` 을 `public/` 에 두면 빌드가 도메인 루트로 복사합니다(이미 `public/google6f2d767f4614ac15.html` 이 있음 — 확인된 상태를 유지하려면 지우지 않습니다).
- **Sitemaps** 에 `https://jumpprogrammer.app/sitemap.xml` 을 제출합니다. (홈 · 탭 · 토픽 · 알고리즘 유형 · 개선 패턴 · 리뷰 퀴즈 · 면접 카테고리 · CS 레슨 · 소개 · 개인정보 처리방침, `robots.txt` 에도 들어 있음)
- 페이지마다 제목 · 설명 · canonical 이 다르고 본문이 HTML 에 들어 있어, [URL 검사]의 '크롤링된 페이지 보기'에서 본문이 보여야 합니다.

## 6. 알아 둘 점

- **콘텐츠 공개**: 웹 앱은 전체 콘텐츠가 담긴 JS 파일을 누구나 내려받을 수 있습니다. (원본 · 작성 이력 · 모범 답안 검증 기준은 비공개 저장소에 그대로 둡니다)
- **iPhone 저장 공간**: 홈 화면에 설치한 앱은 Safari 와 저장 공간이 따로입니다. Safari 에서 쌓은 기록은 백업 → 복원으로 옮깁니다. 또 Safari 는 7일 넘게 방문하지 않은 사이트의 데이터를 지울 수 있어(홈 화면 앱은 예외) 설치를 권장합니다.
- **새 버전**: 배포하면 서비스 워커가 바로 교체되고, 앱을 다시 열 때 새 버전이 적용됩니다. 학습 기록은 캐시가 아니라 브라우저 저장소에 있어 지워지지 않습니다.
- **카카오톡 등 앱 안의 브라우저**에서는 설치할 수 없어 다른 브라우저로 열도록 안내합니다.
- **하위 경로 배포**: `TJ_WEB_BASE_URL=/경로` 로 빌드하면 GitHub Pages 프로젝트 사이트처럼 하위 경로에도 배포할 수 있습니다(`404.html` · 경로별 `index.html` 이 그 경우를 위한 파일).
