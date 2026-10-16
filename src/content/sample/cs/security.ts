// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-security-q01',
      categoryId: 'security',
      type: 'mcq',
      difficulty: 1,
      prompt: '로그인한 일반 사용자가 관리자 전용 API(`DELETE /admin/users/3`)를 호출했습니다. 인증·인가 관점에서 가장 적절한 응답 상태 코드는?',
      correct: '`403 Forbidden`',
      distractors: [
        {
          text: '`401 Unauthorized`',
          why: '`401`은 이름과 달리 **인증이 안 된** 상태(토큰 없음·만료·위조)에 씁니다. 이 사용자는 이미 로그인해 누구인지 확인됐습니다.',
        },
        {
          text: '`400 Bad Request`',
          why: '`400`은 요청 형식이나 파라미터가 잘못됐을 때 씁니다. 요청 자체는 올바르고, 문제는 권한입니다.',
        },
        {
          text: '`405 Method Not Allowed`',
          why: '`405`는 그 경로가 해당 HTTP 메서드를 지원하지 않을 때 씁니다. 관리자가 보낸 같은 요청은 정상 처리되므로 메서드 문제가 아닙니다.',
        },
        {
          text: '`407 Proxy Authentication Required`',
          why: '`407`은 클라이언트와 서버 사이의 **프록시**가 인증을 요구할 때 씁니다. 애플리케이션의 권한 부족과는 관계가 없습니다.',
        },
        {
          text: '`409 Conflict`',
          why: '`409`는 동시 수정이나 중복 생성처럼 리소스의 현재 상태와 요청이 충돌할 때 씁니다. 권한 부족을 뜻하지 않습니다.',
        },
        {
          text: '`500 Internal Server Error`',
          why: '`500`은 서버 내부 오류입니다. 권한 없는 요청을 거부하는 것은 서버 오류가 아니라 클라이언트 쪽 사유(4xx)입니다.',
        },
      ],
      explanation: `사용자가 **누구인지는 확인(인증)됐지만, 이 작업을 할 권한(인가)이 없는** 상황이므로 \`403 Forbidden\`이 적절합니다. 다시 로그인해도 결과가 같다는 점에서, 다시 인증하면 해결될 수 있는 인증 실패와 구분됩니다.

> 리소스의 존재 자체를 숨겨야 한다면 403 대신 404를 반환하도록 설계하기도 합니다.`,
      tags: [
        '인증·인가',
        'HTTP 상태 코드',
      ],
    },
    {
      id: 'cs-security-q02',
      categoryId: 'security',
      type: 'mcq',
      difficulty: 1,
      prompt: '아래는 어떤 JWT의 Payload 부분을 디코딩한 결과입니다. 이에 대한 설명으로 옳은 것은?',
      code: {
        language: 'json',
        source: `{
  "sub": "1024",
  "role": "USER",
  "iat": 1760000000,
  "exp": 1760000900
}`,
      },
      correct: 'Payload는 인코딩만 되어 있어 누구나 읽을 수 있고, 서명은 변조 여부를 검증합니다.',
      distractors: [
        {
          text: 'Payload는 서명 키로 암호화되어 있어, 키가 없으면 내용을 볼 수 없습니다.',
          why: 'Header와 Payload는 **Base64URL 인코딩**일 뿐 암호화가 아니라, 키 없이도 누구나 디코딩해 읽을 수 있습니다.',
        },
        {
          text: '서명이 있으므로 Payload에 개인정보나 비밀번호를 넣어도 안전합니다.',
          why: '서명은 변조 여부만 검증할 뿐 내용을 숨기지 않으므로, 민감 정보를 넣으면 토큰을 가진 누구나 볼 수 있습니다.',
        },
        {
          text: '`exp`가 지났더라도 서명만 유효하면 서버는 토큰을 받아들여야 합니다.',
          why: '서버는 서명과 함께 `exp`(만료), `iss`(발급자), `aud`(대상) 같은 클레임도 검증하고, 만료된 토큰은 거부합니다.',
        },
        {
          text: '`role`을 `ADMIN`으로 바꿔도 서명은 그대로 유효하므로, 서버는 변조를 알아챌 수 없습니다.',
          why: '서명은 Header와 Payload 전체로 계산되므로, Payload를 한 글자만 바꿔도 서명 검증에 실패합니다.',
        },
        {
          text: '`iat`과 `exp`의 차이가 900이므로, 이 토큰은 발급 후 900분 동안 유효합니다.',
          why: '`iat`·`exp`는 **초 단위** Unix 시간이라 900초, 즉 15분 동안 유효합니다.',
        },
        {
          text: '`sub`는 토큰을 발급한 인증 서버를 뜻하므로, 서버는 이 값으로 발급자를 확인합니다.',
          why: '`sub`는 토큰의 주체(사용자) 식별자입니다. 발급자는 `iss` 클레임으로 확인합니다.',
        },
      ],
      explanation: `JWT는 \`Header.Payload.Signature\` 세 부분을 점(\`.\`)으로 이은 문자열입니다. Header와 Payload는 **Base64URL 인코딩**일 뿐 암호화가 아니므로, 토큰을 가진 누구나 디코딩해 내용을 볼 수 있습니다.

- Signature는 Header와 Payload를 비밀 키(또는 개인 키)로 서명한 값으로, **변조 여부를 검증**할 뿐 내용을 숨기지 않습니다.
- 그래서 Payload에는 민감 정보를 넣지 않고 사용자 식별자, 권한, 만료 시각 정도만 담습니다.

> 내용까지 숨겨야 한다면 JWE(JSON Web Encryption)를 사용합니다.`,
      tags: [
        'JWT',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-security-c01',
      categoryId: 'security',
      difficulty: 1,
      question: '인증(Authentication)과 인가(Authorization)의 차이를 설명해주세요.',
      answer: `**인증**은 "당신이 누구인지"를 확인하는 과정이고, **인가**는 "인증된 사용자가 이 작업을 할 권한이 있는지"를 확인하는 과정입니다. 인증이 먼저 이루어지고, 그 결과로 얻은 사용자 ID와 역할을 바탕으로 인가를 판단합니다.

HTTP에서는 인증 실패를 \`401 Unauthorized\`, 인가 실패를 \`403 Forbidden\`으로 구분합니다. 로그인하지 않았으면 401, 일반 사용자가 관리자 API를 호출하면 403입니다.

실무에서는 역할 기반 검사(RBAC)뿐 아니라 **"이 리소스의 주인인가"** 같은 객체 수준의 인가를 빠뜨리지 않는 것이 중요합니다. 이를 놓치면 ID만 바꿔 남의 데이터를 조회하는 IDOR 취약점이 생깁니다.`,
      keywords: [
        '신원 확인',
        '권한 확인',
        '401과 403',
        '객체 수준 인가',
        'IDOR',
      ],
      followUps: [
        '인가 로직은 게이트웨이, 컨트롤러, 서비스 중 어디에 두는 것이 좋을까요?',
        'RBAC와 ABAC는 어떻게 다른가요?',
      ],
    },
  ],
};

export default content;
