// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-vue-q01',
      categoryId: 'vue',
      type: 'mcq',
      difficulty: 1,
      prompt: 'Vue 3 Composition API의 `ref`와 `reactive`에 대한 설명으로 옳은 것은?',
      correct: '`ref`는 원시 값을 포함한 모든 값을 `.value`로 감싸고, 템플릿에서는 최상위 ref가 자동으로 풀린다',
      distractors: [
        {
          text: '`reactive`는 숫자 · 문자열 같은 원시 값도 감쌀 수 있고 `.value` 없이 쓴다',
          why: '`reactive`는 객체 · 배열 · `Map` · `Set` 같은 **객체 타입**에만 동작합니다. 원시 값은 Proxy로 감쌀 수 없어 반응형이 되지 않습니다.',
        },
        {
          text: '`ref`로 만든 값은 템플릿에서도 반드시 `count.value`처럼 접근해야 한다',
          why: '템플릿에서는 `<script setup>`의 최상위 ref가 자동으로 풀리므로 `{{ count }}`처럼 씁니다. `.value`는 스크립트에서만 붙입니다.',
        },
        {
          text: '`reactive` 객체를 담은 변수에 새 객체를 다시 할당해도 반응성이 유지된다',
          why: '변수가 새 일반 객체를 가리키게 되어 기존 Proxy와의 연결이 끊깁니다. 내용을 바꾸려면 프로퍼티를 수정하거나 `Object.assign`을 씁니다.',
        },
        {
          text: '`reactive(raw)`는 원본 객체 `raw` 자체를 반응형으로 바꿔 같은 객체를 돌려준다',
          why: '`reactive`는 원본을 감싼 **Proxy**를 돌려주며, 이는 원본과 다른 객체입니다. 원본을 직접 고치면 Proxy를 거치지 않아 변경이 추적되지 않습니다.',
        },
        {
          text: '`ref`에 객체를 넣으면 `.value` 교체만 추적되고, 안쪽 프로퍼티 변경은 추적되지 않는다',
          why: '`ref`에 객체를 넣으면 내부적으로 `reactive`로 바뀌어 깊게 반응형이 됩니다. `.value` 교체만 추적하는 것은 `shallowRef`입니다.',
        },
        {
          text: '`reactive` 객체를 구조 분해해 꺼낸 원시 값도 원본과 연결되어 반응성이 유지된다',
          why: '구조 분해는 그 순간의 값을 일반 변수로 복사할 뿐이라 반응성을 잃습니다. 연결을 유지하려면 `toRefs` · `toRef`로 꺼냅니다.',
        },
      ],
      explanation: `\`ref\`는 값을 \`.value\` 프로퍼티를 가진 객체로 감싸, \`.value\`를 읽을 때 추적(track)하고 쓸 때 다시 실행(trigger)합니다. 원시 값도 감쌀 수 있고, 객체를 넣으면 내부적으로 \`reactive\`로 바꿔 깊게 반응형으로 만듭니다. 템플릿에서는 \`<script setup>\`의 최상위 ref가 자동으로 풀리므로 \`{{ count }}\`처럼 \`.value\` 없이 씁니다.

> 어떤 값이든 담을 수 있고 \`.value\`에 새 객체를 통째로 넣어도 연결이 유지되기 때문에, Vue 공식 문서는 \`ref\`를 반응형 상태를 선언하는 기본 API로 권장합니다.`,
      tags: [
        'ref',
        'reactive',
        'reactivity',
      ],
    },
    {
      id: 'cs-vue-q02',
      categoryId: 'vue',
      type: 'ox',
      difficulty: 1,
      prompt: '`v-show`의 조건이 `false`가 되면 요소가 DOM에서 제거되고, 다시 `true`가 되면 새로 생성된다.',
      answer: false,
      explanation: `설명은 \`v-if\`의 동작입니다. \`v-show\`는 요소를 **항상 렌더링해 DOM에 둔 채** CSS \`display: none\`만 바꿉니다.

| 구분 | \`v-if\` | \`v-show\` |
|---|---|---|
| 동작 | 조건에 따라 요소 · 컴포넌트를 생성 · 제거 | \`display\` 속성만 전환 |
| 처음 조건이 false | 아무것도 렌더링하지 않음 | 렌더링한 뒤 숨김 |
| 컴포넌트 상태 | 제거될 때 사라지고 생명주기 훅 실행 | 그대로 유지 |
| 비용 | 전환 비용이 큼 | 초기 렌더링 비용이 큼 |

자주 열고 닫는 탭 · 드롭다운은 \`v-show\`, 거의 바뀌지 않거나 권한에 따라 아예 그리지 않아야 하는 영역은 \`v-if\`가 적합합니다. 참고로 \`v-show\`는 \`<template>\`에 쓸 수 없고 \`v-else\`와 함께 쓸 수도 없습니다.`,
      tags: [
        'v-if',
        'v-show',
        'directive',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-vue-c01',
      categoryId: 'vue',
      difficulty: 2,
      question: 'Vue 3의 반응성 시스템은 어떻게 동작하나요?',
      answer: `Vue 3의 반응성은 **Proxy 기반의 의존성 추적**입니다.

1. \`reactive\`는 객체를 Proxy로 감쌉니다. 컴포넌트 렌더링, \`computed\`, \`watch\` 같은 effect가 실행되는 동안 프로퍼티를 읽으면 \`get\` 트랩이 "이 effect가 이 객체의 이 키에 의존한다"를 기록합니다(**track**).
2. 값을 쓰면 \`set\` 트랩이 그 키에 의존하는 effect를 찾아 다시 실행하도록 예약합니다(**trigger**). 컴포넌트 렌더링도 하나의 effect라서 그 값을 쓰는 컴포넌트만 다시 렌더링됩니다.
3. 원시 값은 Proxy로 감쌀 수 없으므로 \`ref\`는 \`.value\`의 getter · setter로 같은 일을 합니다.

이 구조 때문에 **프록시를 거치지 않으면 반응성을 잃습니다.** \`reactive\` 객체를 구조 분해하거나 프로퍼티 값을 함수에 넘기면 값만 복사되므로, \`toRefs\` · \`toRef\`나 getter로 연결을 유지합니다.

Vue 2는 초기화 시점에 \`Object.defineProperty\`로 프로퍼티마다 getter · setter를 심었기 때문에 나중에 추가한 프로퍼티나 배열 인덱스 변경을 감지하지 못했습니다. Proxy는 객체 단위로 모든 접근을 가로채므로 이런 제약이 사라졌고, 중첩 객체도 접근할 때 지연해서 감싸므로 초기화 비용이 줄었습니다.`,
      keywords: [
        'Proxy',
        'track · trigger',
        'effect(렌더링 · computed · watch)',
        'ref의 .value',
        '구조 분해 시 반응성 손실',
        'Object.defineProperty의 한계',
      ],
      followUps: [
        {
          question: 'ref와 reactive 중 무엇을 기본으로 쓰나요?',
          answer: '공식 문서 권장대로 `ref`를 기본으로 씁니다. `reactive`는 객체 타입에만 쓸 수 있고, 변수에 새 객체를 재할당하거나 구조 분해 · 프로퍼티 값 전달을 하면 연결이 끊기는 제약이 있습니다. `ref`는 원시 값도 담고 `.value`에 새 객체를 통째로 넣어도 반응성이 유지되며, `.value`가 붙어 있어 반응형 값이라는 것이 코드에서 드러나는 장점도 있습니다. 폼 필드처럼 항상 함께 다니고 통째로 바꿀 일이 없는 묶음이라면 `reactive`도 괜찮습니다.',
          followUps: [
            {
              question: 'reactive 객체 안에 ref를 넣으면 어떻게 되나요?',
              answer: '깊은 반응형 객체의 프로퍼티로 접근하면 ref가 자동으로 풀려 `.value` 없이 읽고 쓸 수 있고, 원래 ref와의 연결도 유지됩니다. 다만 반응형 배열의 요소나 `Map` 같은 컬렉션 안에 든 ref는 풀리지 않으므로 그때는 `.value`를 붙여야 합니다.',
            },
          ],
        },
        {
          question: 'reactive 객체를 구조 분해하면 왜 반응성을 잃나요?',
          answer: '구조 분해는 그 순간 Proxy에서 값을 **한 번 읽어** 지역 변수에 복사하는 문법이기 때문입니다. 원시 값이면 이후 지역 변수를 읽어도 Proxy의 `get`을 거치지 않으니 track이 일어나지 않고, 지역 변수에 대입해도 `set`이 없어 trigger도 없습니다. 중첩 객체를 꺼내면 그 객체 자체는 Proxy라 안쪽 필드는 반응형이지만, 원본에서 그 프로퍼티를 새 객체로 바꾸면 꺼낸 변수는 옛 객체를 계속 가리킵니다. `toRefs`가 만든 ref는 읽기 · 쓰기를 원본 프로퍼티로 넘겨 주는 접근자라서 이 연결이 유지됩니다.',
        },
        {
          question: 'shallowRef나 markRaw는 언제 쓰나요?',
          answer: '둘 다 **깊은 반응성을 끄는** 도구입니다. `shallowRef`는 `.value` 자체를 바꿀 때만 반응하고 안쪽은 Proxy로 감싸지 않으므로, API에서 받은 큰 배열을 통째로 교체하는 경우처럼 내부를 고칠 일이 없는 큰 데이터에서 Proxy 비용을 줄입니다. `markRaw`는 객체가 절대 Proxy로 감싸지지 않게 표시하는 것으로, 지도 · 차트 라이브러리 인스턴스처럼 Proxy로 감싸면 내부 동작이 깨지거나 느려지는 외부 객체를 반응형 상태에 넣을 때 씁니다.',
          followUps: [
            {
              question: 'shallowRef 안의 배열을 push로 고쳤는데 화면을 갱신하려면 어떻게 하나요?',
              answer: '안쪽 변경은 추적되지 않으므로 `triggerRef(list)`로 그 ref에 의존하는 effect를 직접 깨우거나, `list.value = [...list.value, item]`처럼 새 배열을 대입합니다. 통째로 바꾸는 불변 방식이 `shallowRef`를 쓰는 의도에 더 잘 맞습니다.',
            },
          ],
        },
      ],
    },
  ],
};

export default content;
