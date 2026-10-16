// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-web-security-q01',
      categoryId: 'web-security',
      type: 'mcq',
      difficulty: 1,
      prompt: 'React 컴포넌트에서 사용자가 입력한 `comment` 문자열을 출력하는 코드입니다. **XSS 위험이 있는** 것은?',
      correct: '`<div dangerouslySetInnerHTML={{ __html: comment }} />`',
      distractors: [
        {
          text: '`<p>{comment}</p>`',
          why: 'JSX의 `{}`에 넣은 문자열은 **텍스트 노드**로 들어가므로, `<script>`나 `<img onerror>`가 들어 있어도 글자로 보일 뿐 실행되지 않습니다.',
        },
        {
          text: '`<input defaultValue={comment} />`',
          why: '`defaultValue`는 입력창의 값으로 설정될 뿐 HTML로 해석되지 않으므로, 태그가 들어 있어도 글자 그대로 보입니다.',
        },
        {
          text: '`<p title={comment}>댓글</p>`',
          why: 'React는 속성 값을 DOM 속성의 **값**으로 설정하므로, 따옴표를 닫고 `onmouseover` 같은 새 속성을 끼워 넣는 공격이 통하지 않습니다.',
        },
        {
          text: '`<textarea value={comment} readOnly />`',
          why: '`value`는 입력 요소의 값으로만 설정되므로, 태그가 들어 있어도 HTML로 해석되지 않고 글자로 표시됩니다.',
        },
        {
          text: '`<img src="/avatar.png" alt={comment} />`',
          why: '`alt`도 속성 값으로만 설정되어, 사용자 입력이 새 속성이나 태그로 해석되지 않습니다.',
        },
        {
          text: '`<p>{\'작성자 메모: \' + comment}</p>`',
          why: '문자열을 이어 붙여도 결과는 여전히 문자열이라, JSX가 텍스트 노드로 넣어 그대로 글자로 보입니다.',
        },
      ],
      explanation: `React는 JSX의 \`{}\`에 넣은 문자열을 **텍스트**로 다룹니다. DOM에 넣을 때 텍스트 노드나 속성 값으로 설정하므로, \`<script>\`나 \`<img onerror>\` 같은 문자열도 글자로 보일 뿐 실행되지 않습니다.

\`dangerouslySetInnerHTML\`은 이름 그대로 이 보호를 **우회**해 문자열을 HTML로 해석합니다. 사용자 입력이 들어가면 \`<img src=x onerror="...">\` 같은 코드가 실행됩니다.

프레임워크의 자동 이스케이프를 우회하는 대표적인 경로는 다음과 같습니다.

- React \`dangerouslySetInnerHTML\`, Vue \`v-html\`, Angular \`bypassSecurityTrustHtml\`
- \`ref\`로 꺼낸 DOM 요소에 \`innerHTML\` 직접 대입
- \`href\`·\`src\`에 사용자 입력 URL을 검증 없이 넣기 (\`javascript:\` 스킴)

HTML을 꼭 렌더링해야 한다면 DOMPurify 같은 sanitizer로 정제한 결과만 넣습니다.`,
      tags: [
        'XSS',
        'React',
        '자동 이스케이프',
      ],
    },
    {
      id: 'cs-web-security-q02',
      categoryId: 'web-security',
      type: 'ox',
      difficulty: 1,
      prompt: 'Vite의 `VITE_`, Next.js의 `NEXT_PUBLIC_` 접두사가 붙은 환경 변수는 빌드할 때 클라이언트 번들에 값이 그대로 들어가므로, 여기에 결제 API의 비밀 키(secret key)를 넣으면 누구나 볼 수 있다.',
      answer: true,
      explanation: `프론트엔드 코드는 결국 사용자 브라우저로 내려가 실행되므로, 번들에 들어간 값은 DevTools의 Sources 탭이나 네트워크 응답에서 누구나 읽을 수 있습니다. 두 도구 모두 이 접두사가 붙은 변수를 빌드 시점에 **문자열로 치환**해 번들에 넣습니다.

- 클라이언트에 둬도 되는 값: 공개를 전제로 만든 키(허용 도메인을 제한한 지도 SDK 키, 결제 위젯의 publishable key 등), API 주소
- 서버에만 둬야 하는 값: 비밀 키, DB 접속 정보, 토큰 서명 키

비밀 키가 필요한 호출은 서버(BFF, API 라우트)를 거쳐 처리합니다. 또 운영 환경에 소스맵을 공개 배포하면 원본 코드와 주석까지 노출되므로, 소스맵은 에러 추적 서비스에만 올리는 방식도 고려합니다.`,
      tags: [
        '환경 변수',
        '비밀 키',
        '번들',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-web-security-c01',
      categoryId: 'web-security',
      difficulty: 1,
      question: '프론트엔드에서 CORS 에러가 발생하면 어떻게 해결하나요?',
      answer: `CORS 에러는 **브라우저가** 다른 출처의 응답을 스크립트에 넘겨도 되는지 서버의 허락(\`Access-Control-Allow-*\` 응답 헤더)을 확인했는데, 허락이 없어 막은 것입니다. 단순 요청이라면 서버는 이미 요청을 처리했을 수도 있고, 막히는 것은 **응답 읽기**입니다. 그래서 근본적인 해결은 서버 설정입니다.

- 서버가 허용할 출처를 \`Access-Control-Allow-Origin\`으로 응답합니다. 쿠키를 쓴다면 와일드카드 대신 정확한 출처와 \`Access-Control-Allow-Credentials: true\`를 함께 보냅니다.
- \`PUT\`·\`DELETE\`, \`application/json\` 본문, 커스텀 헤더를 쓰면 프리플라이트(\`OPTIONS\`)가 먼저 가므로, 서버가 \`OPTIONS\`에 인증 없이 허용 메서드·헤더를 응답해야 합니다.
- 개발 환경에서는 Vite·webpack 개발 서버의 프록시로 같은 출처처럼 요청할 수 있지만, 운영에서는 같은 도메인 아래 리버스 프록시로 묶거나 서버 CORS 설정이 필요합니다.

\`mode: 'no-cors'\`는 응답을 읽을 수 없게 만들 뿐 해결책이 아니고, 브라우저 확장 프로그램으로 CORS를 끄는 것은 내 브라우저에서만 통하는 임시방편입니다.`,
      keywords: [
        '브라우저 정책',
        '응답 읽기 차단',
        'Access-Control-Allow-Origin',
        '프리플라이트(OPTIONS)',
        '자격 증명 요청',
        '개발 서버 프록시',
      ],
      followUps: [
        '프리플라이트 요청은 언제 발생하나요?',
        'CORS 설정에서 요청의 Origin을 그대로 돌려주면 어떤 문제가 있나요?',
        '서버끼리 통신할 때는 왜 CORS 에러가 나지 않나요?',
      ],
    },
  ],
};

export default content;
