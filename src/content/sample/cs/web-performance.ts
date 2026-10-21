// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-web-performance-q01',
      categoryId: 'web-performance',
      type: 'mcq',
      difficulty: 1,
      prompt: '현재 Google이 정의한 **Core Web Vitals** 세 지표의 조합으로 옳은 것은?',
      correct: '`LCP` · `INP` · `CLS`',
      distractors: [
        {
          text: '`LCP` · `FID` · `CLS`',
          why: '2024년 3월 이전의 조합입니다. FID는 첫 번째 상호작용의 입력 지연만 쟀고, 페이지를 쓰는 동안의 모든 상호작용을 보는 **INP**로 대체되었습니다.',
        },
        {
          text: '`FCP` · `TTI` · `CLS`',
          why: 'FCP는 원인을 좁히는 보조 지표이고, TTI는 측정 편차가 커서 Lighthouse 점수 계산에서도 빠졌습니다. 둘 다 Core Web Vitals가 아닙니다.',
        },
        {
          text: '`TTFB` · `INP` · `TBT`',
          why: 'TTFB는 서버 응답을 보는 보조 지표이고, TBT는 실험실 도구에서 INP 대신 보는 지표입니다. 로딩은 LCP, 시각적 안정성은 CLS가 대표합니다.',
        },
        {
          text: '`LCP` · `TBT` · `CLS`',
          why: 'TBT는 클릭이 없는 실험실 환경에서 반응성을 짐작하려고 쓰는 대체 지표입니다. Core Web Vitals의 반응성 지표는 실제 상호작용을 재는 INP입니다.',
        },
        {
          text: '`FCP` · `INP` · `CLS`',
          why: 'FCP는 첫 콘텐츠가 그려진 시점이라 핵심 콘텐츠가 보였는지를 대표하지 못합니다. 로딩 지표는 가장 큰 콘텐츠가 그려진 시점인 LCP입니다.',
        },
        {
          text: '`LCP` · `INP` · `TTFB`',
          why: 'TTFB는 서버가 첫 바이트를 보내기까지의 시간으로, LCP가 늦은 원인을 좁히는 보조 지표입니다. 시각적 안정성을 대표하는 지표는 CLS입니다.',
        },
      ],
      explanation: `Core Web Vitals는 사용자 경험의 세 축을 하나씩 대표하는 지표입니다.

| 지표 | 보는 것 | '좋음' 기준 |
| --- | --- | --- |
| LCP (Largest Contentful Paint) | 로딩: 화면에서 가장 큰 이미지·텍스트 블록이 그려진 시점 | 2.5초 이하 |
| INP (Interaction to Next Paint) | 반응성: 클릭·탭·키 입력 후 다음 화면이 그려지기까지 | 200ms 이하 |
| CLS (Cumulative Layout Shift) | 시각적 안정성: 예상치 못한 레이아웃 이동 | 0.1 이하 |

INP는 2024년 3월부터 Core Web Vitals의 반응성 지표가 되었고, 페이지를 쓰는 동안 일어난 클릭 · 탭 · 키 입력을 모두 봅니다.

> 판정은 실제 사용자 데이터의 **75번째 백분위(p75)** 기준입니다. 평균이 좋아도 느린 기기 사용자 25%가 나쁘면 통과하지 못합니다.`,
      tags: [
        'core-web-vitals',
        'LCP',
        'INP',
        'CLS',
      ],
    },
    {
      id: 'cs-web-performance-q02',
      categoryId: 'web-performance',
      type: 'mcq',
      difficulty: 1,
      prompt: '기사 페이지를 열면 본문이 먼저 보이다가, 대표 이미지가 로드되는 순간 본문 전체가 아래로 밀려납니다. 이 현상을 줄이는 방법으로 가장 적절한 것은?',
      code: {
        language: 'html',
        source: `<article>
  <h1>개발자 컨퍼런스 후기</h1>
  <img src="/images/conference.jpg" alt="발표장 전경" />
  <p>올해 컨퍼런스에서는 ...</p>
</article>`,
      },
      correct: '`img`에 `width`·`height` 속성을 지정해 이미지 자리를 미리 확보한다',
      distractors: [
        {
          text: '이미지에 `loading="lazy"`를 추가한다',
          why: '로딩 시점만 늦출 뿐 자리를 확보하지 않아, 이미지가 도착하는 순간 본문이 밀리는 것은 같습니다. 오히려 스크롤 중에 밀림이 생길 수 있습니다.',
        },
        {
          text: '이미지를 WebP로 바꿔 더 빨리 로드되게 한다',
          why: '파일이 작아져 더 빨리 도착할 뿐, 크기를 모르는 동안 높이가 0인 것은 같아 도착하는 순간 본문이 밀립니다.',
        },
        {
          text: '이미지 서버 출처에 `preconnect`를 걸어 연결을 앞당긴다',
          why: '연결 시간을 줄여 이미지를 조금 일찍 받을 뿐, 도착하는 순간 본문이 밀리는 것은 막지 못합니다.',
        },
        {
          text: '이미지에 `decoding="async"`를 추가한다',
          why: '이미지 디코딩이 다른 작업을 덜 막게 하는 힌트일 뿐, 이미지가 차지할 자리를 미리 알려 주지는 않습니다.',
        },
        {
          text: '이미지를 `opacity: 0`으로 숨겼다가 로드되면 서서히 나타나게 한다',
          why: '투명하게 숨겨도 크기를 모르는 동안 높이는 0이라, 로드되는 순간 아래 본문이 밀리는 것은 같습니다.',
        },
        {
          text: '본문 `p`에 `min-height`를 지정해 높이를 고정한다',
          why: '본문의 높이를 정해도 이미지 자리는 비어 있지 않아, 이미지가 들어오면 그 아래 본문이 통째로 밀려납니다. 자리는 이미지 자신에게 확보해야 합니다.',
        },
      ],
      explanation: `이미지 크기를 모르면 브라우저는 처음에 이미지 높이를 0으로 두고 레이아웃을 끝냅니다. 이미지가 도착해 높이가 정해지는 순간 아래 본문이 밀려나고, 이것이 **CLS(Cumulative Layout Shift)**를 키웁니다.

\`\`\`html
<img src="/images/conference.jpg" alt="발표장 전경" width="1200" height="675" />
\`\`\`

\`width\`·\`height\` 속성이 있으면 브라우저가 가로세로 비율을 미리 계산해, CSS로 \`width: 100%; height: auto;\`를 줘도 비율에 맞는 자리를 먼저 비워 둡니다. CSS \`aspect-ratio\`로 지정해도 같습니다.

> 광고·임베드·늦게 받는 배너도 \`min-height\`로 자리를 잡아 두고, 사용자 동작 없이 기존 콘텐츠 위에 요소를 끼워 넣지 않아야 합니다.`,
      tags: [
        'CLS',
        'image',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-web-performance-c01',
      categoryId: 'web-performance',
      difficulty: 1,
      question: 'Core Web Vitals의 세 지표를 설명하고, 각각 어떻게 개선하는지 말해주세요.',
      answer: `Core Web Vitals는 로딩, 반응성, 시각적 안정성을 대표하는 세 지표로, 실제 사용자 데이터의 **75번째 백분위**로 판정합니다.

- **LCP**: 화면에서 가장 큰 이미지나 텍스트 블록이 그려지는 시점으로, 2.5초 이하가 좋음입니다. 서버 응답(TTFB)을 줄이고, LCP 이미지는 지연 로딩하지 않고 \`fetchpriority="high"\`나 preload로 일찍 받고, 렌더링을 막는 CSS·JS를 줄입니다.
- **INP**: 클릭·탭·키 입력 후 다음 화면이 그려지기까지의 시간으로, 200ms 이하가 좋음입니다. 2024년 3월 FID를 대체했습니다. 긴 작업(Long Task)을 쪼개고 무거운 연산은 워커로 옮깁니다.
- **CLS**: 예상치 못한 레이아웃 이동의 누적 점수로, 0.1 이하가 좋음입니다. 이미지·광고 자리를 미리 확보하고, 폰트 교체로 인한 밀림을 줄입니다.

실무에서는 Lighthouse로 원인을 찾고, 개선 효과는 RUM이나 Search Console 같은 필드 데이터로 확인합니다.`,
      keywords: [
        'LCP (로딩)',
        'INP (반응성, FID 대체)',
        'CLS (시각적 안정성)',
        '75번째 백분위',
        '필드 데이터',
      ],
      followUps: [
        'Lighthouse 점수가 높은데도 Core Web Vitals가 나쁠 수 있는 이유는 무엇인가요?',
        'FID가 INP로 바뀐 이유는 무엇인가요?',
        'CLS 점수는 어떻게 계산되나요?',
      ],
    },
  ],
};

export default content;
