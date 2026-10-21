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
        'ref와 reactive 중 무엇을 기본으로 쓰나요?',
        'reactive 객체를 구조 분해하면 왜 반응성을 잃나요?',
        'shallowRef나 markRaw는 언제 쓰나요?',
      ],
    },
  ],
};

export default content;
