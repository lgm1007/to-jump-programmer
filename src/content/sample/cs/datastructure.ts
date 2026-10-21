// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-datastructure-q01',
      categoryId: 'datastructure',
      type: 'mcq',
      difficulty: 1,
      prompt: '`list`에 원소가 n개 있을 때, 아래 코드의 시간 복잡도와 그 이유로 옳은 것은?',
      code: {
        language: 'java',
        source: `List<Integer> list = new LinkedList<>(source);

long sum = 0;
for (int i = 0; i < list.size(); i++) {
    sum += list.get(i);
}`,
      },
      correct: 'O(n²) — `get(i)`가 매번 앞이나 뒤에서부터 노드를 따라가므로 O(n)이다',
      distractors: [
        {
          text: 'O(n) — `get(i)`는 인덱스로 바로 접근하므로 O(1)이다',
          why: '인덱스로 O(1) 접근이 되는 것은 배열 기반인 `ArrayList`입니다. `LinkedList`는 i번째 노드까지 하나씩 따라가야 해서 `get(i)` 한 번이 O(n)입니다.',
        },
        {
          text: 'O(n log n) — `LinkedList`는 내부적으로 이진 탐색으로 노드를 찾는다',
          why: '이진 탐색은 가운데 원소로 바로 갈 수 있는 임의 접근이 필요해 연결 리스트에는 쓸 수 없습니다. `get(i)`는 노드를 하나씩 따라갑니다.',
        },
        {
          text: 'O(n²) — `size()`가 호출될 때마다 노드를 처음부터 센다',
          why: '복잡도는 맞지만 이유가 틀립니다. `LinkedList`는 크기를 필드로 들고 있어 `size()`는 O(1)이고, O(n²)의 원인은 `get(i)`입니다.',
        },
        {
          text: 'O(n) — `LinkedList`가 직전에 찾은 노드를 기억해 다음 `get(i)`를 O(1)에 처리한다',
          why: '`LinkedList.get(i)`는 직전 위치를 기억하지 않고 매번 머리나 꼬리에서 출발합니다. 현재 노드에서 다음 노드로 바로 넘어가는 것은 Iterator로 순회할 때입니다.',
        },
        {
          text: 'O(n) — 반복문이 n번 돌고, 한 번에 원소 하나씩만 더한다',
          why: '반복 횟수만 세면 n번이지만, 반복마다 부르는 `get(i)`가 O(n)이라 둘을 곱한 O(n²)이 됩니다.',
        },
        {
          text: 'O(n²) — 생성자가 `source`를 복사할 때 원소마다 리스트 끝까지 따라가 이어 붙인다',
          why: '`LinkedList`는 꼬리 참조를 들고 있어 맨 뒤 추가가 O(1)이므로 복사는 O(n)입니다. O(n²)의 원인은 반복문 안의 `get(i)`입니다.',
        },
      ],
      explanation: `연결 리스트는 다음 노드의 참조만 알기 때문에, i번째 원소를 찾으려면 노드를 하나씩 따라가야 합니다. Java \`LinkedList.get(i)\`는 앞과 뒤 중 가까운 쪽에서 출발하지만 그래도 O(n)이고, 이를 n번 반복하니 전체는 **O(n²)**입니다.

\`for (int x : list)\`처럼 Iterator로 순회하면 다음 노드로 바로 이동하므로 O(n)이 됩니다. 리스트를 인덱스로 순회한다면 구현체가 무엇인지 꼭 확인하세요.`,
    },
    {
      id: 'cs-datastructure-q02',
      categoryId: 'datastructure',
      type: 'mcq',
      difficulty: 1,
      prompt: '자료구조와 활용 예의 연결이 **잘못된** 것은?',
      correct: '큐 — 재귀 호출을 반복문으로 바꿀 때 호출 상태 저장',
      distractors: [
        {
          text: '스택 — 실행 취소(Undo), 괄호 짝 검사',
          why: '이 연결은 맞습니다 — 가장 최근 작업을 되돌리는 Undo와 가장 최근에 연 괄호부터 짝을 맞추는 괄호 검사는 모두 LIFO인 스택에 맞습니다.',
        },
        {
          text: '큐 — 너비 우선 탐색(BFS), 작업 대기열',
          why: '이 연결은 맞습니다 — 가까운 정점부터 방문하는 BFS와 들어온 순서대로 처리하는 대기열은 FIFO인 큐에 맞습니다.',
        },
        {
          text: '덱 — 슬라이딩 윈도우에서 양쪽 끝 삽입·삭제',
          why: '이 연결은 맞습니다 — 덱은 양쪽 끝에서 O(1)로 넣고 뺄 수 있어 슬라이딩 윈도우 최댓값 같은 문제에 씁니다.',
        },
        {
          text: '스택 — 깊이 우선 탐색(DFS)에서 다음에 방문할 정점 저장',
          why: '이 연결은 맞습니다 — 반복문으로 DFS를 구현할 때 스택에 정점을 쌓아, 가장 최근에 넣은 갈래부터 끝까지 따라갑니다.',
        },
        {
          text: '스택 — 함수 호출 시 지역 변수와 복귀 주소 저장',
          why: '이 연결은 맞습니다 — 호출 스택은 가장 나중에 호출된 함수부터 끝나므로 LIFO 구조입니다.',
        },
        {
          text: '덱 — 하나의 자료구조로 스택과 큐를 겸용',
          why: '이 연결은 맞습니다 — 덱은 한쪽 끝에서만 넣고 빼면 스택, 양쪽 끝을 나눠 쓰면 큐가 되어 Java `ArrayDeque`가 둘 다로 쓰입니다.',
        },
      ],
      explanation: `재귀를 반복문으로 바꿀 때는 '가장 나중에 호출된 것부터 처리'하는 호출 스택을 흉내 내야 하므로 **스택(LIFO)**을 씁니다. 큐(FIFO)를 쓰면 처리 순서가 달라져 같은 동작이 되지 않습니다. 예를 들어 DFS를 큐로 구현하면 BFS가 됩니다.

Java에서는 레거시 \`Stack\` 클래스 대신 \`ArrayDeque\`를 스택과 큐로 쓰는 것이 권장됩니다.`,
    },
  ],
  cards: [
    {
      id: 'cs-datastructure-c01',
      categoryId: 'datastructure',
      difficulty: 1,
      question: '배열과 연결 리스트의 차이를 설명해주세요.',
      answer: `**배열**은 원소를 메모리에 연속으로 저장해 인덱스로 O(1)에 접근할 수 있지만, 중간에 삽입·삭제하면 뒤 원소들을 옮겨야 해 O(n)이 듭니다. **연결 리스트**는 각 노드가 다음(이중 연결이면 이전도) 노드의 참조를 가지는 구조라, 위치를 이미 알고 있으면 삽입·삭제가 O(1)이지만 k번째 원소를 찾으려면 처음부터 따라가야 해 O(n)입니다.

또 배열은 연속된 메모리라 캐시 지역성이 좋고, 연결 리스트는 노드마다 포인터를 저장하는 추가 메모리가 듭니다. 그래서 실무에서는 대부분 \`ArrayList\` 같은 동적 배열을 기본으로 쓰고, 노드 참조를 직접 들고 빠르게 떼어 내야 하는 LRU 캐시 같은 곳에서 연결 리스트를 씁니다.`,
      keywords: [
        '연속 메모리',
        '인덱스 접근 O(1)',
        '삽입·삭제 비용',
        '캐시 지역성',
        '포인터 오버헤드',
      ],
      followUps: [
        'ArrayList와 LinkedList 중 실무에서 무엇을 주로 쓰나요? 이유는요?',
        '동적 배열은 용량이 부족하면 어떻게 늘어나나요?',
      ],
    },
  ],
};

export default content;
