// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
힙은 **부모가 자식보다 작거나 같은** 완전 이진 트리입니다(최소 힙 기준). 그래서 루트에 항상 최솟값이 있고, 우선순위 큐는 보통 힙으로 구현합니다.

- 최솟값 확인 \`O(1)\`, 삽입·삭제 \`O(log N)\`
- 전체가 정렬된 상태는 **아닙니다**. 보장되는 것은 루트뿐입니다.`,
  questions: [
    {
      id: 'algo-heap-q01',
      categoryId: 'heap',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `import heapq

h = []
for x in [5, 1, 8, 3]:
    heapq.heappush(h, x)
print(heapq.heappop(h), heapq.heappop(h))`,
      },
      choices: [
        '`8 5`',
        '`1 3`',
        '`5 1`',
        '`3 8`',
      ],
      answer: 1,
      explanation: `\`heapq\`는 **최소 힙**이라 \`heappop\`은 항상 남은 값 중 가장 작은 값을 꺼냅니다. 1을 꺼낸 뒤 남은 3, 5, 8 중 최솟값 3이 나옵니다.

- \`8 5\`: 최대 힙으로 착각한 답입니다. 최대 힙이 필요하면 \`-x\`를 넣고 꺼낼 때 다시 \`-\`를 붙입니다.
- \`5 1\`: 넣은 순서대로 꺼내는 큐로 착각한 답입니다.
- \`3 8\`: 나중에 넣은 것부터 꺼내는 스택으로 착각한 답입니다.`,
    },
    {
      id: 'algo-heap-q02',
      categoryId: 'heap',
      type: 'mcq',
      difficulty: 1,
      prompt: '작업이 수시로 추가되고, 매번 "남은 작업 중 마감이 가장 이른 작업"을 하나씩 꺼내 처리해야 합니다. 가장 알맞은 자료구조는?',
      choices: [
        '스택',
        '큐',
        '꺼낼 때마다 정렬하는 리스트',
        '우선순위 큐(힙)',
      ],
      answer: 3,
      explanation: `'추가가 계속 일어나면서 최솟값(최댓값)을 반복해서 꺼낸다'는 힙의 대표적인 신호입니다. 마감 시각을 우선순위로 하는 최소 힙에 넣으면 삽입과 꺼내기가 모두 \`O(log N)\`입니다.

- 스택·큐: 넣은 순서로만 꺼내므로 마감 순서를 반영하지 못합니다.
- 매번 정렬: 꺼낼 때마다 \`O(N log N)\`이 들어 작업이 많으면 느립니다.`,
    },
  ],
};

export default content;
