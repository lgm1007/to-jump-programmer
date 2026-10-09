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
      choices: [
        'O(n) — `get(i)`는 인덱스로 바로 접근하므로 O(1)이다',
        'O(n²) — `get(i)`가 매번 앞이나 뒤에서부터 노드를 따라가므로 O(n)이다',
        'O(n log n) — `LinkedList`는 내부적으로 이진 탐색으로 노드를 찾는다',
        'O(n²) — `size()`가 호출될 때마다 노드를 처음부터 센다',
      ],
      answer: 1,
      explanation: `연결 리스트는 다음 노드의 참조만 알기 때문에, i번째 원소를 찾으려면 노드를 하나씩 따라가야 합니다. Java \`LinkedList.get(i)\`는 앞과 뒤 중 가까운 쪽에서 출발하지만 그래도 O(n)이고, 이를 n번 반복하니 전체는 **O(n²)**입니다.

- 인덱스로 O(1) 접근이 되는 것은 배열 기반인 \`ArrayList\`입니다.
- 이진 탐색은 임의 접근이 가능해야 쓸 수 있어 연결 리스트와 맞지 않습니다.
- \`size()\`는 크기를 필드로 저장해 두므로 O(1)입니다.

\`for (int x : list)\`처럼 Iterator로 순회하면 다음 노드로 바로 이동하므로 O(n)이 됩니다. 리스트를 인덱스로 순회한다면 구현체가 무엇인지 꼭 확인하세요.`,
    },
    {
      id: 'cs-datastructure-q02',
      categoryId: 'datastructure',
      type: 'mcq',
      difficulty: 1,
      prompt: '자료구조와 활용 예의 연결이 **잘못된** 것은?',
      choices: [
        '스택 — 실행 취소(Undo), 괄호 짝 검사',
        '큐 — 너비 우선 탐색(BFS), 작업 대기열',
        '큐 — 재귀 호출을 반복문으로 바꿀 때 호출 상태 저장',
        '덱 — 슬라이딩 윈도우에서 양쪽 끝 삽입·삭제',
      ],
      answer: 2,
      explanation: `재귀를 반복문으로 바꿀 때는 '가장 나중에 호출된 것부터 처리'하는 호출 스택을 흉내 내야 하므로 **스택(LIFO)**을 씁니다. 큐(FIFO)를 쓰면 처리 순서가 달라져 같은 동작이 되지 않습니다. 예를 들어 DFS를 큐로 구현하면 BFS가 됩니다.

- 스택: 가장 최근 작업을 되돌리는 Undo, 가장 최근에 연 괄호와 짝을 맞추는 괄호 검사에 적합합니다.
- 큐: 가까운 정점부터 방문하는 BFS, 들어온 순서대로 처리하는 대기열에 적합합니다.
- 덱: 양쪽 끝에서 O(1)로 넣고 뺄 수 있어 슬라이딩 윈도우 최댓값 같은 문제에 씁니다.

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
