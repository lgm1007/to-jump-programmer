// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-browser-q01',
      categoryId: 'browser',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 중 브라우저의 **렌더 트리(Render Tree)에 포함되지 않는** 요소는?',
      correct: '`display: none`이 적용된 요소',
      distractors: [
        {
          text: '`visibility: hidden`이 적용된 요소',
          why: '보이지 않을 뿐 렌더 트리에 남아 **레이아웃 공간을 차지**합니다. 클릭 대상이 되지 않는 점이 `opacity: 0`과 다릅니다.',
        },
        {
          text: '`opacity: 0`이 적용된 요소',
          why: '투명하게 그려지는 것이라 렌더 트리에 남아 공간을 차지하고, 클릭 같은 이벤트도 그대로 받습니다.',
        },
        {
          text: '스크롤해야 보이는, 뷰포트 밖에 있는 요소',
          why: '렌더 트리에 있고 위치도 계산됩니다. 지금 화면에 보이지 않을 뿐입니다.',
        },
        {
          text: '`position: absolute`로 문서 흐름에서 빠진 요소',
          why: '절대 위치 요소는 다른 요소의 배치에 영향을 주지 않을 뿐, 렌더 트리에 남아 자기 위치와 크기가 계산되고 그려집니다.',
        },
        {
          text: '`transform: scale(0)`으로 크기를 0으로 줄인 요소',
          why: '`transform`은 그려지는 모습만 바꿉니다. 요소는 렌더 트리에 남고 원래 크기만큼 레이아웃 공간도 차지합니다.',
        },
        {
          text: '`z-index: -1`로 다른 요소 뒤에 가려진 요소',
          why: '다른 요소에 가려 보이지 않을 뿐 렌더 트리에 남아 그려집니다. `z-index`는 겹친 요소를 그리는 순서를 정하는 속성입니다.',
        },
      ],
      explanation: `렌더 트리는 DOM과 CSSOM을 합쳐 **화면에 그려질 노드만** 모은 트리입니다. \`display: none\`인 요소는 자손까지 통째로 렌더 트리에서 빠지므로 레이아웃 공간도 차지하지 않습니다. \`head\`, \`script\`, \`meta\`처럼 원래 보이지 않는 요소도 마찬가지입니다.

> 요소를 숨길 때 \`display\`를 바꾸면 주변 레이아웃이 다시 계산되고, \`visibility\`·\`opacity\`는 자리를 유지한 채 숨깁니다.`,
      tags: [
        'rendering',
        'render-tree',
      ],
    },
    {
      id: 'cs-browser-q02',
      categoryId: 'browser',
      type: 'mcq',
      difficulty: 1,
      prompt: '이미 화면에 그려진 요소의 스타일을 아래처럼 바꿀 때, **레이아웃(리플로우)을 다시 계산하게 만드는** 변경은?',
      correct: '`width: 100px` → `width: 200px`',
      distractors: [
        {
          text: '`color: red` → `color: blue`',
          why: '글자색은 기하 정보에 영향을 주지 않아 레이아웃 없이 **리페인트**만 일어납니다.',
        },
        {
          text: '`transform: translateX(0)` → `transform: translateX(100px)`',
          why: '`transform`은 문서 흐름상의 자리를 바꾸지 않고 그려지는 위치만 바꾸므로, 레이아웃 없이 보통 **합성** 단계만으로 처리됩니다.',
        },
        {
          text: '`opacity: 1` → `opacity: 0.5`',
          why: '`opacity`도 문서 흐름에 영향을 주지 않아 레이아웃을 다시 계산하지 않고, 보통 **합성** 단계만으로 처리됩니다.',
        },
        {
          text: '`visibility: visible` → `visibility: hidden`',
          why: '`visibility: hidden`은 자리를 그대로 둔 채 보이지만 않게 하므로, 레이아웃 없이 리페인트만 일어납니다.',
        },
        {
          text: '`box-shadow: none` → `box-shadow: 0 2px 8px gray`',
          why: '그림자는 요소의 크기나 다른 요소의 배치를 바꾸지 않아 레이아웃 없이 리페인트만 일어납니다.',
        },
      ],
      explanation: `요소의 크기나 문서 흐름상의 위치가 바뀌면, 그 요소와 영향을 받는 주변 요소의 기하 정보를 다시 계산하는 **레이아웃(리플로우)**이 일어나고 페인트·합성도 이어서 다시 합니다. \`width\`, \`height\`, \`padding\`, \`margin\`, \`font-size\` 변경, DOM 추가·삭제 등이 여기에 속합니다.

> 요소를 움직이는 애니메이션은 \`left\`·\`top\` 대신 \`transform: translate()\`로 구현하는 것이 기본입니다.`,
      tags: [
        'reflow',
        'repaint',
        'composite',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-browser-c01',
      categoryId: 'browser',
      difficulty: 1,
      question: '주소창에 URL을 입력한 뒤 화면이 그려지기까지, 브라우저가 HTML을 받은 이후의 렌더링 과정을 설명해주세요.',
      answer: `DNS 조회와 TCP·TLS 연결을 거쳐 HTML 응답이 오면, 브라우저는 다음 순서로 화면을 그립니다. 이 흐름을 **중요 렌더링 경로(Critical Rendering Path)**라고 합니다.

1. **DOM 생성**: HTML을 파싱해 DOM 트리를 만듭니다. 속성 없는 일반 스크립트를 만나면 파싱을 멈추고 내려받아 실행합니다.
2. **CSSOM 생성**: CSS를 파싱해 CSSOM을 만듭니다. CSS는 렌더링 차단 리소스라 CSSOM이 준비돼야 그릴 수 있습니다.
3. **렌더 트리**: DOM과 CSSOM을 합쳐 실제로 보이는 노드만 모읍니다. \`display: none\`인 요소는 빠집니다.
4. **레이아웃**: 각 노드의 크기와 위치를 계산합니다.
5. **페인트**: 글자·색·이미지·그림자 등을 그리는 명령을 레이어별로 만듭니다.
6. **합성(Composite)**: 여러 레이어를 GPU에서 합쳐 최종 화면을 만듭니다.

실무에서는 첫 화면을 빨리 그리기 위해 첫 화면용 CSS를 작게 유지하고, 스크립트에 \`defer\`를 붙여 파싱을 막지 않게 하며, 애니메이션은 레이아웃·페인트를 건너뛰는 \`transform\`·\`opacity\`로 구현합니다.`,
      keywords: [
        'DOM · CSSOM',
        '렌더 트리',
        '레이아웃',
        '페인트',
        '합성(Composite)',
        '렌더링 차단 리소스',
      ],
      followUps: [
        {
          question: 'CSS가 렌더링 차단 리소스라고 하셨는데, 그동안 HTML 파싱도 멈추나요?',
          answer: 'HTML 파싱은 멈추지 않습니다. CSS가 막는 것은 첫 페인트이고, 파서는 스타일시트를 기다리는 동안에도 DOM을 계속 만듭니다. 다만 스크립트는 `getComputedStyle()`처럼 스타일을 읽을 수 있으므로, 브라우저는 앞에 나온 스타일시트가 도착할 때까지 뒤따르는 스크립트의 실행을 미룹니다. 그 스크립트가 속성 없는 일반 스크립트라면 결과적으로 CSS 때문에 파싱까지 멈추게 됩니다.',
          followUps: [
            {
              question: '그럼 첫 화면에 필요 없는 CSS는 어떻게 렌더링을 막지 않게 하나요?',
              answer: '`media="print"`처럼 지금 환경과 맞지 않는 미디어 조건이 붙은 스타일시트는 내려받기만 하고 렌더링을 막지 않습니다. 그래서 첫 화면에 꼭 필요한 규칙만 작게 먼저 적용하고(필요하면 `head`에 인라인), 나머지 CSS는 페이지별로 나누거나 첫 렌더링 뒤에 불러와 렌더링을 막는 CSS의 크기를 줄입니다.',
            },
          ],
        },
        {
          question: 'display: none과 visibility: hidden은 렌더링 과정에서 어떻게 다르게 처리되나요?',
          answer: '`display: none`인 요소는 자손까지 렌더 트리에서 빠져 레이아웃 공간을 차지하지 않으므로, 값을 바꾸면 주변 요소의 레이아웃이 다시 계산됩니다. `visibility: hidden`은 렌더 트리에 남아 자리를 그대로 차지한 채 보이지만 않게 하므로, 바꿀 때 리플로우 없이 리페인트만 일어납니다. 또 `visibility: hidden`인 요소의 자식은 `visibility: visible`로 다시 보이게 할 수 있지만, `display: none`의 자손은 어떤 값으로도 보이게 할 수 없습니다.',
        },
        {
          question: 'DNS 조회부터 HTML 응답을 받기까지 네트워크 구간에서는 어떤 일이 일어나나요?',
          answer: '먼저 브라우저·OS의 DNS 캐시를 확인하고, 없으면 DNS 리졸버가 루트 → TLD → 권한 있는 네임서버 순으로 물어 IP 주소를 얻습니다. 그 IP로 TCP 3-way 핸드셰이크를 하고, HTTPS라면 TLS 핸드셰이크로 서버 인증서를 검증하고 암호화 키를 합의합니다. 그다음 HTTP 요청을 보내 서버가 HTML의 첫 바이트를 돌려줄 때까지, 이 구간을 모두 합친 것이 TTFB입니다. HTTP/3는 TCP 대신 UDP 기반의 QUIC을 써서 연결 수립과 TLS 협상을 한 번의 왕복으로 합칩니다.',
        },
      ],
    },
  ],
};

export default content;
