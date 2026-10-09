// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-nestjs-q01',
      categoryId: 'nestjs',
      type: 'mcq',
      difficulty: 1,
      prompt: 'Node.js의 실행 모델에 대한 설명으로 옳은 것은?',
      choices: [
        '요청마다 새 스레드를 만들어 JavaScript 코드를 병렬로 실행한다',
        'JS는 메인 스레드에서 실행되고, 파일 I/O·`dns.lookup`·일부 `crypto` 작업은 libuv 스레드 풀에서 처리된다',
        '네트워크 소켓 I/O도 libuv 스레드 풀(기본 4개)에서 처리하므로 동시 연결이 4개로 제한된다',
        '`async` 함수로 작성하면 내부의 동기 연산도 별도 스레드에서 실행된다',
      ],
      answer: 1,
      explanation: `Node.js는 **JavaScript를 메인 스레드 하나(이벤트 루프)에서 실행**하지만, 런타임 전체가 단일 스레드인 것은 아닙니다.

- 네트워크 I/O: OS의 비동기 I/O 기능(epoll, kqueue 등)으로 처리합니다. 스레드 풀을 쓰지 않으므로 수많은 연결을 동시에 다룰 수 있습니다.
- 파일 I/O, \`dns.lookup\`, \`crypto.pbkdf2\` 같은 일부 crypto, \`zlib\` 비동기 API: **libuv 스레드 풀**(기본 4개, \`UV_THREADPOOL_SIZE\`로 조정)에서 처리합니다.

\`async\`는 함수가 Promise를 반환하게 할 뿐, 내부의 동기 연산을 다른 스레드로 옮기지 않습니다. 요청마다 스레드를 배정하는 것은 Tomcat 같은 스레드 기반 서버의 모델입니다.`,
      tags: [
        'nodejs',
        'libuv',
        'thread-pool',
      ],
    },
    {
      id: 'cs-nestjs-q02',
      categoryId: 'nestjs',
      type: 'ox',
      difficulty: 1,
      prompt: 'Express 요청 핸들러 안에서 `fs.readFileSync()`로 큰 파일을 읽으면, 읽는 동안 같은 프로세스의 다른 요청 처리도 멈춘다.',
      answer: true,
      explanation: `\`readFileSync\` 같은 **동기(Sync) API는 작업이 끝날 때까지 이벤트 루프를 붙잡습니다.** JavaScript를 실행하는 스레드가 하나뿐이라, 그동안 같은 프로세스에 들어온 다른 요청의 콜백은 하나도 실행되지 못합니다.

- 요청 처리 중에는 \`fs.promises.readFile\` 같은 비동기 API나 \`fs.createReadStream\` 스트림을 씁니다.
- 서버 시작 시 설정 파일을 한 번 읽는 정도는 동기 API를 써도 괜찮습니다.`,
      tags: [
        'nodejs',
        'blocking',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-nestjs-c01',
      categoryId: 'nestjs',
      difficulty: 1,
      question: 'Node.js는 싱글 스레드인데 어떻게 많은 요청을 동시에 처리하나요?',
      answer: `JavaScript 코드는 메인 스레드 하나에서 실행되지만, **I/O는 논블로킹으로 처리해 기다리는 동안 다른 요청을 처리**하기 때문입니다.

- 네트워크 I/O는 OS의 비동기 I/O 기능(epoll, kqueue 등)에 맡기고, 파일 I/O나 일부 crypto 작업은 **libuv 스레드 풀**(기본 4개)이 처리합니다.
- 작업이 끝나면 콜백이 큐에 들어가고, **이벤트 루프**가 콜 스택이 비었을 때 하나씩 실행합니다.

그래서 DB 조회나 외부 API 호출처럼 대기 시간이 대부분인 **I/O 바운드 API 서버**에 잘 맞습니다. 반대로 CPU를 오래 쓰는 동기 연산은 이벤트 루프를 막아 모든 요청을 지연시키므로, 워커 스레드나 별도 작업 큐로 분리해야 합니다.`,
      keywords: [
        '이벤트 루프',
        '논블로킹 I/O',
        'libuv 스레드 풀',
        'I/O 바운드',
        'CPU 바운드 주의',
      ],
      followUps: [
        'libuv 스레드 풀은 어떤 작업에 사용되나요?',
        'CPU를 많이 쓰는 작업은 어떻게 처리하나요?',
      ],
    },
  ],
};

export default content;
