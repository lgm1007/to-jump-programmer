// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
| 알고리즘 | 쓰는 상황 | 복잡도 |
|---|---|---|
| BFS | 모든 간선 비용이 같음 | O(V + E) |
| 0-1 BFS | 비용이 0 또는 1 | O(V + E) |
| 다익스트라 | 한 시작점, 비용 ≥ 0 | O(E log V) |
| 벨만-포드 | 한 시작점, 음수 간선 | O(VE) |
| 플로이드-워셜 | 모든 쌍, V가 작음 | O(V^3) |`,
  questions: [
    {
      id: 'algo-shortest-path-q01',
      categoryId: 'shortest-path',
      type: 'mcq',
      difficulty: 1,
      prompt: '정점 10,000개, 간선 100,000개인 도로망이 있고 모든 도로의 이동 시간은 양수입니다. 한 도시에서 다른 모든 도시까지의 최단 시간을 구할 때 가장 적합한 알고리즘은?',
      choices: [
        '플로이드-워셜',
        'BFS',
        '다익스트라',
        '벨만-포드',
      ],
      answer: 2,
      explanation: `시작점이 하나이고 가중치가 양수이므로 **다익스트라**(우선순위 큐, O(E log V))가 가장 적합합니다. E × log V ≈ 100,000 × 13 = 약 130만 번 수준이라 충분히 빠릅니다.

- 플로이드-워셜은 O(V^3) = 10^12로 불가능합니다.
- BFS는 모든 간선의 가중치가 같을 때만 최단 거리를 보장합니다.
- 벨만-포드는 O(VE) = 10^9으로 너무 느립니다. 음수 간선이 있을 때 고려합니다.`,
      tags: [
        '접근법 선택',
        '다익스트라',
      ],
    },
    {
      id: 'algo-shortest-path-q02',
      categoryId: 'shortest-path',
      type: 'ox',
      difficulty: 1,
      prompt: '다익스트라 알고리즘은 음수 가중치 간선이 있어도 항상 올바른 최단 거리를 구한다.',
      answer: false,
      explanation: `다익스트라는 '우선순위 큐에서 꺼낸 정점의 거리는 더 이상 줄지 않는다'는 가정 위에서 동작합니다. 음수 간선이 있으면 이미 확정한 정점의 거리가 나중에 더 줄어들 수 있어 이 가정이 깨집니다.

- 방문 배열로 확정 처리하는 구현은 틀린 답을 낼 수 있습니다.
- 거리가 갱신될 때마다 다시 넣는 구현은 답이 맞더라도 최악의 경우 시간이 지수적으로 늘 수 있고, 음수 사이클이 있으면 끝나지 않습니다.

음수 간선이 있으면 **벨만-포드**(모든 쌍이 필요하면 플로이드-워셜)를 사용합니다.`,
      tags: [
        '다익스트라',
        '음수 간선',
      ],
    },
  ],
};

export default content;
