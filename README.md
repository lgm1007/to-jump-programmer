# To Jump Programmer — 개발자 취업·이직 준비 앱

코딩 테스트, 코드 리뷰 테스트, 기술 면접을 **한 앱에서** 준비하는 모바일 학습 앱입니다.
하루 10분씩 퀴즈·문제·면접 카드로 꾸준히 학습하도록 설계했습니다.

| 트랙 | 기능 |
| --- | --- |
| **알고리즘 · 코딩 테스트** | 14개 토픽 개념 정리 + 개념 퀴즈 112문항 · 프로그래머스 형식 코딩 문제 29개를 Python · Java · C++ · JavaScript 로 직접 풀고 채점 (힌트 · 해설 · 4개 언어 모범 답안) |
| **코드 리뷰 테스트** | Spring Boot / Node.js·NestJS / Django·Flask 별 **개선 패턴 학습** 10개(개선 전·후 코드, 변경점 diff, 리뷰 체크리스트)와 **리뷰 실전 퀴즈** 6개(문제 줄 찾기 → 문제점 고르기 → 채점 · 모범 리뷰 · 베스트 개선안) — 총 48개 |
| **기술 면접 CS** | 15개 카테고리(OS · 네트워크 · 자료구조 · DB · 보안 · Java · JS/TS · Python · Spring · NestJS · Django · 아키텍처 · 인프라 · OOP · 실무) 퀴즈 225문항 + 면접 질문 카드 120장(모범 답안 · 핵심 키워드 자가 체크 · 꼬리 질문) |
| **학습 관리** | 오늘의 추천 · 하루 목표 · 연속 학습일 · 학습 잔디 · 오답노트 · 북마크 · 다시 볼 카드 · 다크 모드 |

> 모든 콘텐츠는 직접 작성했고, 코딩 문제의 테스트 케이스는 4개 언어 모범 답안을 실제로 실행해 검증했습니다 (`npm run validate`).

---

## 기술 스택과 선정 이유 — "최소 비용으로 스토어 출시"

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 앱 | **Expo SDK 57 (React Native 0.86) + TypeScript** | iOS · Android(· 웹)를 하나의 코드로. 맥/Xcode 없이도 EAS 클라우드 빌드로 스토어 출시 가능 |
| 라우팅 | Expo Router (파일 기반) | 탭 + 스택 네비게이션, 딥링크 기본 지원 |
| 상태·저장 | Zustand + AsyncStorage | 학습 기록을 **기기에만 저장** → 서버·DB 비용 0원, 운영자가 수집하는 개인정보 없음 |
| 콘텐츠 | 앱 번들에 포함된 TypeScript 데이터 | CMS·API 서버 불필요. 콘텐츠 수정은 EAS Update(OTA)로 배포 가능 |
| 코드 에디터 | CodeMirror 6 (WebView 내장, 오프라인) | 구문 강조 · 자동 들여쓰기 · 괄호 짝 · 모바일 입력 지원 + 기호 입력 툴바 |
| 코드 실행 | **기기 내 샌드박스**: Python(Pyodide/WebAssembly) · JavaScript(Web Worker) | 서버 없이 0원. Worker 를 강제 종료해 무한 루프에도 앱이 멈추지 않음 |
| 코드 실행 (선택) | Java · C++: **Piston**(오픈소스) 자가 호스팅 | 저사양 VPS/무료 티어 서버 1대로 운영. 서버가 없어도 앱의 나머지 기능은 모두 동작 |
| 수익화 | **Google AdMob** (`react-native-google-mobile-ads`) | 무료 앱 + 광고. 하단 배너와 학습 세션 사이 전면 광고, 동의(UMP) · iOS 추적 허용(ATT) 처리 포함 |

### 예상 비용

| 항목 | 비용 | 비고 |
| --- | --- | --- |
| 앱 개발 · 서버 · DB | **0원** | 모든 데이터가 기기에 저장되는 구조 |
| EAS Build / Submit / Update | **0원** (Free 플랜) | 월 Android 15회 · iOS 15회 빌드(저우선순위 큐), OTA 업데이트 1,000 MAU. `eas build --local` 은 무제한 |
| Apple Developer Program | 연 $99 | App Store 출시 필수 |
| Google Play 개발자 등록 | $25 (1회) | Play 스토어 출시 필수 |
| Java·C++ 실행 서버 (선택) | 0원 ~ 월 몇 달러 | 클라우드 무료 티어(x86) 또는 저가 VPS. 없으면 Python·JS 만 채점 |
| Google AdMob | 0원 | 광고 수익은 매월 지급(지급 기준액 이상일 때) |

---

## 시작하기

```bash
npm install
npm start          # Expo 개발 서버 (QR 코드를 Expo Go 앱으로 스캔)
npm run web        # 브라우저에서 실행
```

- **Expo Go**: 광고를 제외한 모든 기능을 별도 빌드 없이 실기기에서 바로 확인할 수 있습니다. 광고 SDK 는 Expo Go 에 없어서 광고 없이 실행됩니다.
- **개발 빌드(광고 포함)**: `npx expo run:ios` / `npx expo run:android` (각각 Xcode / Android Studio 필요) 또는 `npx eas-cli@latest build --profile development`. 개발 빌드는 항상 Google 테스트 광고를 보여줍니다.
- **Xcode 27(iOS 27 SDK)** 로 빌드한 앱은 UIScene 생명주기를 쓰지 않으면 실행 즉시 종료됩니다. Expo SDK 57 템플릿에는 아직 없어서 `plugins/with-ios-scene-lifecycle.js` 가 prebuild 때 SDK 58 템플릿과 같은 `SceneDelegate` 를 추가합니다. SDK 58 이상으로 올리면 이 플러그인은 지워도 됩니다.
- 로컬 iOS 빌드는 프로젝트가 **iCloud 로 동기화되는 폴더(데스크탑·문서)** 안에 있으면 코드 서명 단계에서 `resource fork, Finder information, or similar detritus not allowed` 오류로 실패합니다. 동기화되지 않는 폴더(예: `~/Developer`)로 옮겨서 빌드하세요. EAS 클라우드 빌드는 영향이 없습니다.

### 자주 쓰는 명령

| 명령 | 설명 |
| --- | --- |
| `npm run typecheck` | 앱 · 스크립트 · 에디터 타입 검사 |
| `npm run lint` | ESLint (React Compiler 규칙 포함) |
| `npm test` | 핵심 로직 테스트 (마크다운 파서 · diff · 채점 비교 · 출력 파서 · 연속 학습일) |
| `npm run test:harness` | Java · C++ 채점 하네스 테스트 (JDK, g++/clang++ 필요) |
| `npm run validate` | 콘텐츠 구조 검증 + 알고리즘 모범 답안 4개 언어 실행 검증 (python3, node, JDK 15+, g++/clang++ 필요) |
| `npm run validate -- --quick` | 구조 검증만 |
| `npm run content:index` | 코딩 문제 인덱스 재생성 (문제 파일을 추가/삭제했을 때) |
| `npm run build:editor` | `editor/src/main.ts`(CodeMirror) 수정 후 에디터 번들 재생성 |
| `node scripts/dev-runner.mjs` | 로컬 JDK/컴파일러로 Java·C++ 를 실행하는 **개발용** Piston 호환 서버 (127.0.0.1:2000) |

---

## 프로젝트 구조

```text
src/
  app/                      # 화면 (Expo Router)
    (tabs)/                 #   홈 · 알고리즘 · 코드 리뷰 · 면접 CS · 마이
    algorithm/              #   토픽 개념 정리 · 문제 상세 · 코드 풀이(에디터/실행/채점)
    review/                 #   개선 패턴 학습 · 리뷰 실전 퀴즈
    interview/[id].tsx      #   CS 카테고리 상세
    quiz.tsx · cards.tsx    #   퀴즈 세션 · 면접 카드 세션
    notes · bookmarks · settings · privacy · onboarding
  components/               # UI 컴포넌트 (코드 블록 · diff · 마크다운 렌더러 · 실행 결과 등)
  content/                  # 학습 콘텐츠 (types.ts 스키마 + 데이터)
    algorithm/quiz/         #   토픽별 개념 정리 · 퀴즈
    algorithm/problems/     #   코딩 문제 (문제별 1파일)
    cs/                     #   CS 카테고리별 퀴즈 · 면접 카드
    review/                 #   프레임워크별 개선 패턴 · 리뷰 퀴즈
  features/
    runner/                 # 코드 실행·채점
      core/                 #   시작 코드 · Java/C++ 채점 하네스 생성 · 결과 비교 (Node 에서도 재사용)
      sandbox/              #   Web Worker 샌드박스 (Python/Pyodide, JavaScript)
      remote.ts             #   Piston 클라이언트 (Java/C++)
    editor/                 # CodeMirror WebView/iframe 래퍼 · 키보드 툴바
    progress/               # 학습 기록 저장소 · 통계 · 오늘의 추천
    ads/                    # AdMob 광고 (하단 배너 · 전면 광고 · 동의/ATT, Expo Go·웹에서는 광고 없이 동작)
  lib/                      # markdown-lite 파서 · 구문 강조 · diff · 날짜 유틸
  theme/                    # 디자인 토큰 (라이트/다크)
editor/src/main.ts          # 내장 코드 에디터 소스 (esbuild 로 번들)
scripts/                    # 콘텐츠 검증 · 인덱스 생성 · 에디터 번들 · 아이콘 생성 · 개발용 실행 서버
infra/runner/               # Java·C++ 실행 서버 (Piston + Caddy HTTPS) docker-compose
docs/                       # 콘텐츠 작성 가이드 · 출시 가이드 · 개인정보 처리방침
app.config.ts               # app.json + AdMob 설정 (ID 는 환경 변수로 주입)
plugins/                    # 로컬 config plugin (iOS UIScene 생명주기)
```

### 코드 실행 구조

```text
[풀이 화면] ─ 실행/제출 ─▶ runSolution()
   ├─ Python / JavaScript ─▶ 숨김 WebView(네이티브) / 브라우저(웹)
   │      └─ 매니저가 언어별 Module Worker 관리 · 케이스별 제한 시간 초과 시 terminate
   │          ├─ JavaScript: new Function 으로 solution 실행
   │          └─ Python: Pyodide(CPython→WASM, 최초 1회 CDN 다운로드 후 캐시)
   └─ Java / C++ ─▶ 채점 하네스 코드 생성(테스트 입력을 리터럴로 삽입)
          └─ Piston /api/v2/execute ─▶ 표준 출력 마커 파싱 → 케이스별 결과
```

- 채점은 프로그래머스처럼 `solution` 함수의 **반환값**을 비교합니다. `print`/`console.log` 출력은 케이스별로 따로 보여줍니다.
- 에러 메시지의 줄 번호는 하네스 코드를 제외한 **사용자 코드 기준**으로 바꿔 표시합니다.

---

## 콘텐츠 추가하기

1. [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) 의 스키마와 markdown-lite 문법을 확인합니다.
2. `src/content/` 의 해당 파일에 항목을 추가합니다. (코딩 문제는 `algorithm/problems/<id>.ts` 새 파일 + `npm run content:index`)
3. `npm run validate` 로 검증합니다. 코딩 문제는 4개 언어 모범 답안이 모든 테스트를 통과해야 합니다.

---

## Java · C++ 실행 서버 (선택)

Python · JavaScript 는 기기 안에서 실행되므로 서버가 필요 없습니다. Java · C++ 채점을 켜려면:

```bash
cd infra/runner
cp .env.example .env          # RUNNER_DOMAIN=runner.내도메인.com
docker compose up -d          # Piston + Caddy(자동 HTTPS)
./install-runtimes.sh         # Java 15, GCC 10 설치 (최초 1회)
```

앱 › 마이 › 설정 › **코드 실행 서버**에 `https://runner.내도메인.com` 을 입력하고 연결 확인을 누르세요.
배포 시 기본값으로 넣고 싶다면 빌드 환경 변수 `EXPO_PUBLIC_RUNNER_URL` 을 지정하면 됩니다.

> Piston 은 `privileged` 컨테이너와 x86_64 리눅스를 필요로 합니다. 메모리 1GB 이상(2GB 권장) 서버를 사용하세요.

---

## 광고 (AdMob)

| 위치 | 형식 | 규칙 |
| --- | --- | --- |
| 탭 화면 하단(탭 바 위) | 배너 (320×50) | 항상. 불러오지 못하면 자리를 차지하지 않음 |
| 퀴즈 · 면접 카드 · 코드 리뷰 퀴즈 · 코딩 문제를 마치고 나갈 때 | 전면 광고 | 세션 2번 마칠 때마다 1번, 앱 실행 직후·직전 광고 후 3분간 노출 안 함 |

문제를 푸는 중(퀴즈 진행 · 코드 에디터 · 카드 학습)에는 광고를 띄우지 않습니다.
AdMob 앱 ID · 광고 단위 ID 는 저장소에 넣지 않고 환경 변수(`.env.local`, EAS 환경 변수)로 주입합니다. 값이 없으면 Google 테스트 광고로 동작합니다.
가입 · 광고 단위 생성 · `app-ads.txt` · 스토어 개인정보 신고 절차는 [`docs/RELEASE.md`](docs/RELEASE.md#광고admob-설정) 를 참고하세요.

---

## 빌드 · 스토어 출시

자세한 체크리스트는 [`docs/RELEASE.md`](docs/RELEASE.md) 에 있습니다.

```bash
npm install -g eas-cli        # 또는 npx eas-cli@latest
eas login
eas build:configure
eas build --platform all --profile production
eas submit --platform all --profile production
```

Android 패키지명은 `com.leegm.tojumpprogrammer` 로 확정했습니다(Play 스토어에 올린 뒤에는 바꿀 수 없음). iOS `ios.bundleIdentifier`(현재 임시값 `com.tojump.programmer`)는 App Store Connect 에 앱을 만들기 전에 확정하세요.

---

## 로드맵

- 프론트엔드 트랙 (React · Next.js 코드 리뷰, 브라우저/프론트 CS)
- 계정 · 기기 간 학습 기록 동기화 (Supabase 무료 티어 등)
- 콘텐츠 원격 업데이트 (앱 업데이트 없이 문제 추가)
- 대용량 입력 기반 효율성 테스트, 문제 수 확대
- Java · C++ 기기 내 실행 (WebAssembly 기반 컴파일러/JVM 검토) — 서버 없이 4개 언어 채점
- 면접 답변 음성 녹음 · 셀프 피드백
- 광고 제거 인앱 결제 (구독 또는 1회 구매)

## 오픈소스

Expo · React Native · CodeMirror 6 · Pyodide · Piston(서버, 선택) 을 사용합니다. 각 프로젝트의 라이선스를 따릅니다.

## 라이선스

Copyright (c) 2026 lgm1007. All rights reserved.
포트폴리오·참고 목적으로 열람만 허용하며, 코드와 학습 콘텐츠의 사용·복제·배포는 허용하지 않습니다. 자세한 내용은 [`LICENSE`](LICENSE) 를 참고하세요.
