/**
 * 서비스 소개 (앱의 /about 화면 + 웹 빌드가 만드는 /about 페이지의 본문, RichText)
 * 수록 콘텐츠 수는 지금 콘텐츠에서 센다.
 */
import { ALGO_TOPICS, CONTENT_STATS, CS_CATEGORIES, REVIEW_FRAMEWORKS } from './index';
import { GITHUB_URL } from './legal';

export function aboutText(): string {
  const s = CONTENT_STATS;
  return `### To Jump Programmer는
개발자 취업·이직을 준비하는 사람이 **코딩 테스트, 코드 리뷰, 기술 면접**을 하루 10분씩 꾸준히 준비할 수 있게 만든 무료 학습 서비스입니다. 웹(https://jumpprogrammer.app)과 모바일 앱으로 제공하며, 회원가입 없이 바로 쓸 수 있습니다.

### 무엇을 공부할 수 있나요?
- **알고리즘 · 코딩 테스트**: ${ALGO_TOPICS.length}개 토픽의 개념 정리와 개념 퀴즈 ${s.algoQuestions}문항, 자주 나오는 문제 유형 ${s.algoPatterns}개를 Python · Java · Kotlin · C++ · JavaScript 구현 예제로 비교합니다.
- **코드 리뷰 테스트**: ${REVIEW_FRAMEWORKS.map((f) => f.title).join(', ')} 실무 코드의 개선 패턴 ${s.patterns}개와 리뷰 실전 퀴즈 ${s.challenges}개로, 문제 있는 코드 줄을 찾고 개선안을 비교합니다.
- **기술 면접 CS**: ${CS_CATEGORIES.length}개 카테고리의 이론 레슨 ${s.lessons}개, 퀴즈 ${s.csQuestions}문항, 모범 답변과 꼬리 질문이 있는 면접 질문 카드 ${s.cards}장을 제공합니다.

이론을 먼저 읽고, 확인 퀴즈로 점검하고, 틀린 문제는 해설과 관련 이론으로 돌아가 복습하는 흐름으로 공부합니다. 백엔드 · 프론트엔드 · 풀스택 코스와 고른 언어 · 프레임워크에 맞춰 오늘의 학습을 추천합니다.

### 콘텐츠는 이렇게 만듭니다
- 모든 문제 · 해설 · 레슨 · 면접 답변은 직접 작성한 창작물입니다. 외부 문제 사이트의 지문을 옮기지 않습니다.
- 알고리즘 구현 예제는 다섯 언어 모두 실제로 실행해 예제 테스트를 통과하는지 확인한 뒤 싣습니다.
- 버전에 따라 달라지는 내용은 버전을 함께 적고, 오류를 발견하면 고쳐서 다시 배포합니다.

### 학습 기록과 개인정보
학습 기록은 사용자의 기기(웹은 브라우저 저장소)에만 저장되고 운영자 서버로 보내지 않습니다. 서비스는 광고 수익으로 무료로 운영되며, 자세한 내용은 개인정보 처리방침에 있습니다.

### 운영 · 문의
- 운영: lgm1007 (GitHub)
- 소스 코드: ${GITHUB_URL} (앱 코드는 공개, 학습 콘텐츠 원본은 비공개)
- 문의 · 오류 제보: GitHub 저장소의 Issues (${GITHUB_URL}/issues)`;
}
