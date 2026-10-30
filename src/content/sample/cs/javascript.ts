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
      correct: '`null == undefined`',
      distractors: [
        {
          text: '`NaN === NaN`',
          why: '`NaN`은 자기 자신과도 같지 않아 `false`입니다. `NaN`인지는 `Number.isNaN()`이나 `Object.is()`로 판별합니다.',
        },
        {
          text: '`null === undefined`',
          why: '`===`(엄격한 동등)는 타입을 변환하지 않으므로, 타입이 다른 `null`과 `undefined`를 비교하면 바로 `false`입니다.',
        },
        {
          text: '`[1] === [1]`',
          why: '객체는 내용이 아니라 **참조**를 비교합니다. 리터럴 두 개는 서로 다른 배열이라 `false`입니다.',
        },
        {
          text: '`null == 0`',
          why: '`==`에서 `null`은 숫자 0으로 변환되지 않고 `undefined`하고만 같으므로 `false`입니다.',
        },
        {
          text: '`null == false`',
          why: '`null`이 falsy 값이라도 `==`로 `false`와 같지는 않습니다. `null`은 `undefined`하고만 느슨하게 같아 결과는 `false`입니다.',
        },
        {
          text: '`\'1\' === 1`',
          why: '`\'1\' == 1`은 타입 변환으로 `true`가 되지만, `===`는 문자열과 숫자를 변환 없이 비교하므로 `false`입니다.',
        },
      ],
      explanation: `\`==\`(느슨한 동등)는 비교 전에 타입을 변환하는데, \`null\`과 \`undefined\`는 **서로끼리만** 느슨하게 같도록 정해져 있습니다. 그래서 \`null == undefined\`는 \`true\`이고, \`null\`이나 \`undefined\`를 그 밖의 값과 느슨하게 비교하면 \`false\`입니다.

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
        {
          question: 'setTimeout(fn, 0)은 정확히 0ms 뒤에 실행되나요?',
          answer: '아닙니다. 0은 "최소 지연"일 뿐이고, 타이머가 만료된 콜백은 태스크 큐에서 차례를 기다리다 현재 동기 코드와 쌓인 마이크로태스크가 모두 끝나야 실행됩니다. 게다가 브라우저는 타이머 안에서 타이머를 거듭 중첩해 5단계를 넘기면 지연을 최소 4ms로 늘리고, 백그라운드 탭의 타이머는 1초 단위 이상으로 늦추기도 합니다. Node.js도 0을 1ms로 바꿔 처리하므로, setTimeout은 "정확히 그 시각"이 아니라 "적어도 그만큼 뒤"로 이해해야 합니다.',
        },
        {
          question: '마이크로태스크가 끝없이 추가되면 어떤 일이 생기나요?',
          answer: '이벤트 루프가 다음 태스크로 넘어가지 못해 타이머 · I/O 콜백 · 사용자 입력 처리, 브라우저라면 화면 렌더링까지 계속 밀리는 기아 상태(starvation)가 됩니다. 마이크로태스크 큐는 빌 때까지 처리되고, 처리 중에 추가된 것도 이번 차례에 함께 실행되기 때문입니다. 예를 들어 `then` 안에서 자기 자신을 다시 예약하는 함수는 콜 스택은 넘치지 않지만 페이지가 멈춘 것처럼 됩니다. 긴 작업을 쪼갤 때는 마이크로태스크가 아니라 `setTimeout` 같은 태스크로 양보해야 그 사이에 렌더링과 입력이 처리됩니다.',
        },
        {
          question: 'Node.js의 이벤트 루프는 브라우저와 무엇이 다른가요?',
          answer: 'Node.js의 이벤트 루프는 libuv 위에서 timers → pending callbacks → poll(I/O) → check(`setImmediate`) → close callbacks 같은 **단계(phase)**를 돌며 단계마다 자기 큐를 처리하고, 브라우저와 달리 렌더링 단계가 없습니다. 또 `process.nextTick` 큐가 따로 있어 Promise 마이크로태스크보다도 먼저 처리됩니다. Node.js 11부터는 타이머 · `setImmediate` 콜백 하나가 끝날 때마다 마이크로태스크를 비우도록 바뀌어, 타이머 콜백 사이의 Promise 처리 순서가 브라우저와 같아졌습니다.',
          followUps: [
            {
              question: 'setTimeout(fn, 0)과 setImmediate 중 무엇이 먼저 실행되나요?',
              answer: '메인 모듈에서 바로 호출하면 순서가 보장되지 않습니다. 루프가 timers 단계에 도착했을 때 1ms 타이머가 이미 만료됐는지가 프로세스 상황에 따라 달라지기 때문입니다. 반면 I/O 콜백 안에서 호출하면 poll 단계 바로 다음이 check 단계라 `setImmediate`가 항상 먼저 실행됩니다.',
            },
          ],
        },
      ],
    },
  ],
};

export default content;
