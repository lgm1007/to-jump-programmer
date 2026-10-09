# 스토어 출시 가이드

Expo EAS 로 맥/Xcode 없이 클라우드에서 빌드하고 App Store · Google Play 에 제출하는 절차입니다.

## 0. 준비물

| 항목 | 비용 | 비고 |
| --- | --- | --- |
| Expo 계정 | 무료 | https://expo.dev |
| Apple Developer Program | 연 $99 | 개인 또는 사업자(D-U-N-S 필요)로 가입 |
| Google Play Console | $25 (1회) | 신규 개인 계정은 출시 전 비공개 테스트 요건이 있을 수 있음 |
| 개인정보 처리방침 URL | 무료 | `docs/PRIVACY.md` 를 GitHub Pages · Notion 등에 게시 |
| Google AdMob 계정 | 무료 | 광고 수익용. 아래 [광고(AdMob) 설정](#광고admob-설정) 참고 |
| 개발자 웹사이트 | 무료 | 스토어에 등록할 사이트. `app-ads.txt` 를 이 도메인 루트에 게시 (GitHub Pages 가능) |

## 1. 앱 식별자 · 정보 정리 (`app.json`)

- [ ] `expo.name` (기기 홈 화면 이름, 현재 `To Jump`) — 스토어 이름 `To Jump Programmer` 는 App Store Connect · Play Console 에서 따로 입력
- [ ] `ios.bundleIdentifier`, `android.package` 를 본인 도메인 기반으로 변경 (예: `com.mycompany.tojump`) — **출시 후에는 바꿀 수 없음**
- [ ] `version` (사용자에게 보이는 버전) — 빌드 번호는 `eas.json` 의 `autoIncrement` 가 관리
- [ ] 아이콘/스플래시 교체 시 `scripts/generate-icons.py` 수정 후 재생성
- [ ] (선택) Java·C++ 실행 서버 기본값: EAS 환경 변수 `EXPO_PUBLIC_RUNNER_URL`
- [ ] AdMob 앱 ID · 광고 단위 ID 를 EAS 환경 변수(production)에 등록 — 없으면 production 빌드가 중단됨 (아래 참고)

## 광고(AdMob) 설정

광고는 Google AdMob(`react-native-google-mobile-ads`)으로 넣었습니다. 코드는 `src/features/ads/`, 네이티브 설정은 `app.config.ts` 에 있습니다.

| 위치 | 형식 | 노출 규칙 |
| --- | --- | --- |
| 탭 화면(홈·알고리즘·코드 리뷰·면접 CS·마이) 하단, 탭 바 바로 위 | 배너 (320×50) | 항상 (불러오지 못하면 자리를 차지하지 않음) |
| 퀴즈 · 면접 카드 · 코드 리뷰 퀴즈 · 코딩 문제(정답 후 다음 문제)를 마치고 나갈 때 | 전면 광고 | 세션 2번 마칠 때마다 1번, 앱 실행 직후·직전 광고 후 3분 동안은 노출 안 함 |

문제를 푸는 중(퀴즈 진행, 코드 에디터, 카드 학습)에는 광고를 띄우지 않습니다. 노출 규칙은 `src/features/ads/config.ts` 의 `INTERSTITIAL_POLICY` 에서 조정합니다.

### 1) AdMob 가입과 앱 · 광고 단위 만들기

1. https://admob.google.com 에서 가입하고 **지급 정보**(주소·은행 계좌)와 **세금 정보**를 입력합니다. 수익이 지급 기준액(보통 US$100)을 넘으면 매월 지급됩니다.
2. **앱 › 앱 추가**에서 Android · iOS 앱을 각각 추가합니다. 스토어 출시 전이면 "아직 출시 안 함"으로 추가하고 출시 후 스토어 앱과 연결합니다. 앱마다 **앱 ID**(`ca-app-pub-…~…`)가 발급됩니다.
3. 앱마다 **광고 단위**를 2개씩 만듭니다: `배너`, `전면 광고`. 각각 **광고 단위 ID**(`ca-app-pub-…/…`)가 발급됩니다.

### 2) ID 등록 — 저장소에는 올리지 않습니다

`app.config.ts` 가 아래 6개 환경 변수를 읽습니다. 값이 없으면 Google 공식 테스트 ID 로 동작하고, 개발 빌드(`__DEV__`)는 값이 있어도 항상 테스트 광고를 씁니다(본인 광고 클릭으로 인한 계정 정지 방지).

| 변수 | 예시 |
| --- | --- |
| `ADMOB_ANDROID_APP_ID` / `ADMOB_IOS_APP_ID` | `ca-app-pub-1234567890123456~1234567890` |
| `ADMOB_ANDROID_BANNER_ID` / `ADMOB_IOS_BANNER_ID` | `ca-app-pub-1234567890123456/1234567890` |
| `ADMOB_ANDROID_INTERSTITIAL_ID` / `ADMOB_IOS_INTERSTITIAL_ID` | `ca-app-pub-1234567890123456/1234567890` |

- **EAS Build(스토어 빌드)**: EAS 환경 변수 `production` 에 등록합니다. `.env` 파일은 `.gitignore` 대상이라 EAS 로 업로드되지 않습니다.
  ```bash
  npx eas-cli@latest env:set --name ADMOB_IOS_APP_ID --value "ca-app-pub-…~…" --environment production --visibility plaintext
  # 나머지 5개도 같은 방식으로 등록 → 확인: npx eas-cli@latest env:list --environment production
  ```
  `production` 프로필로 빌드할 때 해당 플랫폼 값이 하나라도 없으면 빌드가 중단됩니다(테스트 광고가 실린 채 출시되는 것 방지). ID 는 앱 바이너리에 그대로 들어가는 공개 값이라 `secret` 이 아닌 `plaintext`(또는 `sensitive`)로 등록해야 빌드 설정에서 읽힙니다.
- **로컬**: `.env.example` 을 `.env.local` 로 복사해 채웁니다(커밋되지 않음).
- **EAS Update**: 업데이트를 배포할 때도 같은 값이 필요하므로 `npx eas-cli@latest update --channel production --environment production` 처럼 `--environment` 를 붙입니다.

### 3) app-ads.txt

AdMob 콘솔의 **앱 › app-ads.txt** 에 나오는 한 줄을 스토어 등록 정보의 **개발자 웹사이트** 루트(`https://내도메인/app-ads.txt`)에 게시합니다. 게시하지 않으면 광고 수요가 크게 줄 수 있습니다.

### 4) 개인정보 · 동의

- **iOS 추적 허용(ATT)**: 온보딩을 마치고 메인 화면에 처음 들어왔을 때 한 번 묻습니다. 문구는 `app.json` 의 `expo-tracking-transparency` 플러그인에서 바꿉니다.
- **EEA · 영국 · 스위스 배포 시**: AdMob 콘솔 **개인정보 보호 및 메시지**에서 GDPR 동의 메시지를 만들어 게시하세요. 앱이 실행될 때 해당 지역 사용자에게만 동의 화면을 띄우고, 설정 화면에 "광고 개인정보 설정" 메뉴가 나타납니다. 한국에만 출시한다면 필요 없습니다.
- 개인정보 처리방침(`docs/PRIVACY.md`, 앱 내 화면)에는 AdMob 관련 내용을 반영해 두었습니다. 게시된 URL 의 내용도 함께 갱신하세요.

### 5) 출시 전 확인

- 개발 빌드에서 "Test Ad" 표시가 붙은 배너·전면 광고가 나오는지 확인합니다(`npx expo run:ios` / `run:android`, 또는 `eas build --profile development`).
- 실제 광고 단위로 실기기 테스트를 할 때는 AdMob 콘솔 **설정 › 테스트 기기**에 기기를 등록하세요. **본인 광고를 직접 누르면 무효 트래픽으로 계정이 정지될 수 있습니다.**
- Expo Go 에는 광고 SDK 가 없어 광고 없이 실행됩니다. 광고 확인은 개발 빌드에서 하세요.
- 테스트(샘플 앱 ID)에서는 동의 SDK 가 영어로 된 "Our app wants to stay free for you" 안내를 띄운 뒤 추적 허용 팝업이 나옵니다. Google 샘플 앱에 설정된 안내라서 그렇고, 본인 계정에서는 **개인정보 보호 및 메시지 › IDFA 안내 메시지**를 만들었을 때만 나옵니다(한국어로 작성 가능). 만들지 않으면 앱이 바로 추적 허용 팝업(`app.json` 의 한국어 문구)을 띄웁니다.

## 2. 빌드

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure                  # 최초 1회 (프로젝트 ID 연결)
npx eas-cli@latest build -p android --profile preview   # 내부 테스트용 APK
npx eas-cli@latest build -p all --profile production    # 스토어 제출용 (AAB / IPA)
```

- iOS 인증서·프로비저닝 프로필은 EAS 가 대화형으로 생성·관리합니다.
- 무료 플랜은 월 Android 15회 · iOS 15회 빌드(저우선순위 큐)입니다. 로컬 머신에 Xcode/Android SDK 가 있으면 `--local` 로 무제한 빌드할 수 있습니다.
- 콘텐츠 수정처럼 JS 만 바뀐 업데이트는 `npx eas-cli@latest update --channel production` 으로 스토어 심사 없이 배포할 수 있습니다(무료 1,000 MAU).

## 3. 제출

```bash
npx eas-cli@latest submit -p ios --profile production
npx eas-cli@latest submit -p android --profile production   # 최초 1회는 Play Console 에 AAB 를 수동 업로드해야 할 수 있음
```

## 4. 스토어 등록 정보

앱 이름 · 설명 · 키워드 · 스크린샷 구성 초안은 [`STORE_LISTING.md`](STORE_LISTING.md) 에 있습니다.

### 공통
- **카테고리**: 교육 (Education)
- **연령 등급**: 전체 이용가 (폭력·사용자 간 소통 없음). 광고는 포함하며, 광고 콘텐츠 등급을 PG 이하로 제한함(`src/features/ads/google.tsx`)
- **스크린샷**: 홈 / 코드 풀이(에디터) / 채점 결과 / 코드 리뷰 퀴즈 / 면접 카드 화면 추천
- **짧은 설명 예시**: 코딩 테스트 · 코드 리뷰 · 기술 면접을 하루 10분씩 준비하는 개발자 취업·이직 학습 앱

### App Store Connect
- **App Privacy(개인정보 라벨)**: 학습 기록은 기기에만 저장되지만, 광고 SDK(Google Mobile Ads)가 수집하는 항목을 신고해야 합니다. [Google 안내](https://developers.google.com/admob/ios/privacy/data-disclosure)를 기준으로 한 작성 예시 — 제출 전 최신 안내를 다시 확인하세요.
  - 위치 › 대략적인 위치(IP 기반) — 제3자 광고, 분석
  - 식별자 › 기기 ID(IDFA 등) — 제3자 광고, 분석 · **추적에 사용**
  - 사용 데이터 › 광고 데이터, 기타 사용 데이터(제품 상호작용) — 제3자 광고, 분석
  - 진단 › 충돌 데이터, 성능 데이터 — 분석
- **수출 규정(암호화)**: `app.json` 에 `usesNonExemptEncryption: false` 가 설정되어 있어 매 빌드 질문을 생략
- **심사 메모 예시**:
  > 이 앱은 프로그래밍 학습용 교육 앱입니다. 사용자가 직접 작성한 학습용 코드를 WKWebView 안의 격리된 Web Worker 에서 실행해 채점합니다(App Review Guideline 2.5.2 의 교육용 예외). Python 실행을 위해 WebAssembly 인터프리터(Pyodide)를 최초 1회 내려받으며, 앱의 기능을 변경하는 코드는 내려받지 않습니다. 로그인 없이 모든 기능을 사용할 수 있습니다.

### Google Play Console
- **데이터 보안(Data safety)**: 광고 SDK 가 수집·공유하는 항목을 신고합니다. [Google 안내](https://developers.google.com/admob/android/privacy/play-data-disclosure) 기준 예시 — 제출 전 최신 안내를 확인하세요.
  - 위치 › 대략적인 위치(IP 기반), 앱 활동 › 앱 상호작용, 앱 정보 및 성능 › 비정상 종료 로그·진단, 기기 또는 기타 ID(광고 ID)
  - 목적: 광고 또는 마케팅, 분석, 사기 방지·보안·규정 준수 / 수집 및 공유 / 전송 중 암호화: 예
- **광고**: 있음 ("광고 포함" 표시)
- **광고 ID**: 사용함 — 광고 또는 마케팅 (Android 13+ 대상 앱 필수 선언)
- **대상 연령**: 18세 이상(취업 준비 성인 대상) 또는 13세 이상 — 앱 성격에 맞게 선택
- **앱 액세스 권한**: 로그인 불필요

## 5. 출시 전 점검

- [ ] `npm run content:sync` 로 **전체 콘텐츠**를 맞춘 뒤 빌드 (`src/content/data/.source` 가 `full`). production 빌드는 샘플이면 실패합니다. `eas update` 도 같은 상태에서 실행하세요.
- [ ] `npm run typecheck` · `npm run validate` 통과
- [ ] 실기기(iOS·Android)에서 확인: 온보딩 → 퀴즈 → 코드 풀이(Python 첫 실행 다운로드, 무한 루프 시간 초과) → 코드 리뷰 퀴즈 → 면접 카드 → 다크 모드
- [ ] 키보드가 열렸을 때 코드 에디터 · 기호 툴바 위치 (iPhone SE 같은 작은 화면 포함)
- [ ] 비행기 모드에서 Python 외 기능 정상 동작 확인
- [ ] 개인정보 처리방침 URL 게시
- [ ] AdMob: EAS 환경 변수 6개 등록, `app-ads.txt` 게시, 개발 빌드에서 테스트 광고 노출 확인
