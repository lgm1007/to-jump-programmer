// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-javascript-q01',
      categoryId: 'javascript',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 중 평가 결과가 `true`인 것은?',
      choices: [
        '`NaN === NaN`',
        '`null === undefined`',
        '`[1] === [1]`',
        '`null == undefined`',
      ],
      answer: 3,
      explanation: `\`==\`(느슨한 동등)는 비교 전에 타입을 변환하는데, \`null\`과 \`undefined\`는 **서로끼리만** 느슨하게 같도록 정해져 있습니다. 그래서 \`null == undefined\`는 \`true\`이고, \`null == 0\`은 \`false\`입니다.

- \`NaN === NaN\`: \`NaN\`은 자기 자신과도 같지 않습니다. 판별은 \`Number.isNaN()\`이나 \`Object.is()\`로 합니다.
- \`null === undefined\`: \`===\`(엄격한 동등)는 타입이 다르면 바로 \`false\`입니다.
- \`[1] === [1]\`: 객체는 내용이 아니라 **참조**를 비교하므로 서로 다른 배열입니다.

> 실무에서는 \`===\`를 기본으로 쓰고, null과 undefined를 한 번에 거르는 \`x == null\` 정도만 예외로 허용하는 팀이 많습니다.`,
      tags: [
        'equality',
        'type-coercion',
      ],
    },
    {
      id: 'cs-javascript-q02',
      categoryId: 'javascript',
      type: 'ox',
      difficulty: 1,
      prompt: '`const`로 선언한 객체는 프로퍼티 값도 변경할 수 없다.',
      answer: false,
      explanation: `\`const\`는 **변수의 재할당**만 막을 뿐, 변수가 가리키는 객체 내부까지 불변으로 만들지 않습니다.

\`\`\`javascript
const user = { name: 'kim' };
user.name = 'lee'; // 가능
user = {}; // TypeError: Assignment to constant variable.
\`\`\`

- 객체 변경까지 막으려면 \`Object.freeze()\`를 쓰지만, **1단계만 얕게** 동결되어 중첩 객체는 여전히 바뀝니다.
- 상태를 다룰 때는 원본을 고치지 않고 \`{ ...user, name: 'lee' }\`처럼 새 객체를 만드는 **불변 업데이트**를 주로 씁니다.`,
      tags: [
        'const',
        'immutability',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-javascript-c01',
      categoryId: 'javascript',
      difficulty: 1,
      question: '자바스크립트 이벤트 루프의 동작 방식을 설명해주세요.',
      answer: `자바스크립트는 **콜 스택이 하나인 싱글 스레드**로 코드를 실행하고, 타이머나 네트워크 같은 비동기 작업은 브라우저의 Web API나 Node.js의 libuv에 맡깁니다.

- 작업이 끝나면 콜백이 큐에 들어갑니다. \`setTimeout\`, I/O 콜백은 **태스크(매크로태스크) 큐**로, Promise의 \`then\`과 \`queueMicrotask\`는 **마이크로태스크 큐**로 갑니다.
- 이벤트 루프는 콜 스택이 비면 마이크로태스크 큐를 **끝까지 비운 뒤** 태스크를 하나 꺼내 실행하는 과정을 반복합니다. 그래서 \`Promise.then\`이 \`setTimeout(fn, 0)\`보다 먼저 실행됩니다.

실무에서는 오래 걸리는 동기 연산이 콜 스택을 점유하면 모든 콜백이 밀리므로, 무거운 작업은 쪼개거나 워커로 분리합니다.`,
      keywords: [
        '콜 스택',
        '태스크 큐',
        '마이크로태스크 큐',
        'Web API·libuv',
        '논블로킹',
      ],
      followUps: [
        'setTimeout(fn, 0)은 정확히 0ms 뒤에 실행되나요?',
        '마이크로태스크가 끝없이 추가되면 어떤 일이 생기나요?',
        'Node.js의 이벤트 루프는 브라우저와 무엇이 다른가요?',
      ],
    },
  ],
};

export default content;
