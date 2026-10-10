# 웹 버전 (PWA) 배포 가이드

같은 Expo 코드를 웹으로 내보내, 브라우저에서 바로 쓰고 휴대폰 홈 화면에 앱처럼 설치할 수 있는 PWA 로 배포합니다.

- 주소: https://jump-programmer.github.io/to-jump-programmer/
- 배포: `main` 에 푸시하면 GitHub Actions(`.github/workflows/deploy-web.yml`)가 비공개 콘텐츠를 받아 빌드하고 GitHub Pages 에 올립니다.
- 광고: 앱은 AdMob, 웹은 Google AdSense 를 씁니다.

## 1. 구성

| 항목 | 내용 |
| --- | --- |
| 빌드 | `npm run build:web` → `scripts/build-web.mjs` (expo export → PWA 태그 · manifest · 서비스 워커 · 페이지별 index.html · sitemap) |
| 오프라인 | Workbox 서비스 워커가 앱 파일(약 5.6MB)을 미리 저장. Python 실행 환경(Pyodide)은 처음 실행할 때 받아 캐시 |
| 설치 | Android Chrome · PC Chrome/Edge: [앱 설치] 버튼, iPhone: Safari 공유 → 홈 화면에 추가 (홈 화면 · 설정에서 안내) |
| 학습 기록 | 브라우저 저장소(localStorage). [마이 › 설정 › 백업 내보내기/복원]으로 JSON 백업 |
| 광고 | 화면 콘텐츠 끝의 AdSense 디스플레이 광고(`AdSlot`) — 탭 화면, 개선 패턴 · 토픽 · 면접 카테고리, 학습 결과 화면 |
| 주소 | 콘텐츠 화면마다 `<경로>/index.html` 을 만들어 200 으로 열리게 하고(검색 · AdSense 크롤러용), 나머지 경로는 `404.html`(같은 앱)로 연다 |

## 2. 로컬에서 확인

```bash
npm run build:web
```
```bash
npm run preview:web
```

GitHub Pages 와 같은 경로로 확인하려면 두 명령 모두 `TJ_WEB_BASE_URL=/to-jump-programmer` 를 붙입니다. `http://127.0.0.1:4173/to-jump-programmer/` 에서 열립니다.

- 서비스 워커는 `localhost`/`127.0.0.1` 또는 HTTPS 에서만 동작합니다.
- 개발 서버(`npm run web`)에는 서비스 워커 · 광고가 들어가지 않습니다.

## 3. GitHub Pages 배포 설정 (최초 1회)

1. **콘텐츠 읽기용 배포 키**: SSH 키를 만들어 공개 키는 `to-jump-content` 저장소의 **Settings › Deploy keys** 에 읽기 전용으로, 개인 키는 `to-jump-programmer` 저장소의 **Settings › Secrets and variables › Actions** 에 `CONTENT_DEPLOY_KEY` 로 등록합니다.
   ```bash
   ssh-keygen -t ed25519 -N "" -C "to-jump-programmer deploy-web" -f /tmp/tj-content-key
   ```
   ```bash
   gh repo deploy-key add /tmp/tj-content-key.pub --repo lgm1007/to-jump-content --title "to-jump-programmer deploy-web"
   ```
   ```bash
   gh secret set CONTENT_DEPLOY_KEY --repo jump-programmer/to-jump-programmer < /tmp/tj-content-key
   ```
   등록 후 `/tmp/tj-content-key*` 파일은 지웁니다.
2. **Pages 켜기**: `to-jump-programmer` 저장소의 **Settings › Pages › Build and deployment › Source** 를 **GitHub Actions** 로 바꿉니다.
3. `main` 에 푸시하거나 **Actions › Deploy web › Run workflow** 로 배포합니다.

## 4. 광고 (Google AdSense)

블로그에서 쓰는 AdSense 계정(`ca-pub-9194914695506719`)에 웹 앱 사이트를 **새 사이트로 추가**합니다. 웹 앱 주소(`jump-programmer.github.io`)는 블로그(`lgm1007.github.io`)와 다른 사이트라 따로 심사를 받습니다.

1. **ads.txt 게시**: `ads.txt` 는 도메인 최상위(`https://jump-programmer.github.io/ads.txt`)에 있어야 하므로, 조직에 `jump-programmer.github.io` 저장소(GitHub Pages 조직 사이트)를 만들고 루트에 아래 한 줄로 `ads.txt` 를 둡니다.
   ```text
   google.com, pub-9194914695506719, DIRECT, f08c47fec0942fa0
   ```
2. AdSense › **사이트 › 새 사이트 추가**에 `jump-programmer.github.io` 를 등록하고 검토를 요청합니다. (웹 앱 빌드에는 소유 확인용 메타 태그와 AdSense 코드가 들어가 있어야 하므로, 먼저 아래 3번의 `ADSENSE_CLIENT` 를 등록해 배포해 둡니다)
3. `to-jump-programmer` 저장소 **Settings › Secrets and variables › Actions › Variables** 에 등록합니다. 광고 단위 ID 는 AdSense › **광고 › 광고 단위 기준 › 디스플레이 광고**에서 반응형 광고 단위를 만들어 확인합니다.
   ```bash
   gh variable set ADSENSE_CLIENT --repo jump-programmer/to-jump-programmer --body "ca-pub-9194914695506719"
   ```
   ```bash
   gh variable set ADSENSE_SLOT --repo jump-programmer/to-jump-programmer --body "광고단위ID"
   ```
4. **자동 광고는 켜지 않습니다.** 사이트에 자동 광고를 켜면 앵커 광고가 탭 바를 가리거나 화면 이동 때 전면 광고가 끼어들 수 있습니다. (AdSense › 광고 › 사이트 기준 › jump-programmer.github.io 에서 자동 광고 꺼짐 확인)
5. 사이트가 "준비됨" 상태가 되면 광고가 나옵니다. 광고가 채워지지 않은 자리는 공간을 차지하지 않습니다.

광고 배치 원칙 (AdSense 정책):
- 메뉴 · 버튼 같은 누를 수 있는 요소 바로 옆에 두지 않습니다(실수 클릭 유도 금지). 그래서 앱의 탭 바 위 고정 배너는 웹에서 쓰지 않습니다.
- 사용자가 화면을 옮길 때만 새 광고를 요청하고, 같은 자리를 시간마다 새로고침하지 않습니다.
- 문제를 푸는 화면(코드 에디터 · 퀴즈 진행)에는 광고를 두지 않습니다.
- 본인 광고를 직접 누르지 않습니다.

## 5. 검색 노출 (선택)

- 빌드가 `sitemap.xml`(콘텐츠 화면 111개)을 만듭니다: https://jump-programmer.github.io/to-jump-programmer/sitemap.xml
- Google Search Console 에 `https://jump-programmer.github.io/` 속성을 추가해 **Sitemaps** 에서 위 주소를 제출하거나, `jump-programmer.github.io` 저장소 루트의 `robots.txt` 에 `Sitemap:` 줄을 넣습니다.

## 6. 알아 둘 점

- **콘텐츠 공개**: 웹 앱은 전체 콘텐츠가 담긴 JS 파일을 누구나 내려받을 수 있습니다. (원본 · 작성 이력 · 모범 답안 검증 기준은 비공개 저장소에 그대로 둡니다)
- **iPhone 저장 공간**: 홈 화면에 설치한 앱은 Safari 와 저장 공간이 따로입니다. Safari 에서 쌓은 기록은 백업 → 복원으로 옮깁니다. 또 Safari 는 7일 넘게 방문하지 않은 사이트의 데이터를 지울 수 있어(홈 화면 앱은 예외) 설치를 권장합니다.
- **새 버전**: 배포하면 서비스 워커가 바로 교체되고, 앱을 다시 열 때 새 버전이 적용됩니다. 학습 기록은 캐시가 아니라 브라우저 저장소에 있어 지워지지 않습니다.
- **Java · Kotlin · C++**: 웹에서도 실행 서버(Piston)가 있어야 채점됩니다. 저장소 변수 `RUNNER_URL` 에 HTTPS 주소를 넣으면 기본값이 됩니다(`infra/runner` 의 Caddy 설정이 브라우저 요청(CORS)을 허용합니다).
- **카카오톡 등 앱 안의 브라우저**에서는 설치할 수 없어 다른 브라우저로 열도록 안내합니다.
