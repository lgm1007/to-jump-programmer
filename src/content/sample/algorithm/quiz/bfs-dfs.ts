// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
- **DFS(깊이 우선 탐색)**: 한 갈래로 끝까지 들어갔다가, 막히면 되돌아와 다른 갈래로 갑니다. 재귀나 스택으로 구현합니다.
- **BFS(너비 우선 탐색)**: 시작점에서 가까운 정점부터 차례로 방문합니다. 큐로 구현합니다.`,
  questions: [
    {
      id: 'algo-bfs-dfs-q01',
      categoryId: 'bfs-dfs',
      type: 'mcq',
      difficulty: 1,
      prompt: '가중치가 없는 미로에서 출발 칸부터 도착 칸까지의 **최소 이동 횟수**를 구하려고 합니다. 가장 적합한 방법은?',
      choices: [
        'DFS로 탐색하다가 처음 도착했을 때의 이동 횟수를 답으로 한다',
        'BFS로 탐색하며 각 칸까지의 거리를 기록한다',
        '모든 칸 쌍에 대해 플로이드-워셜을 수행한다',
        '칸들을 좌표 순으로 정렬한 뒤 이분 탐색한다',
      ],
      answer: 1,
      explanation: `BFS는 시작점에서 거리 1인 칸, 거리 2인 칸… 순서로 방문하므로 **처음 도착한 순간의 거리가 곧 최단 거리**입니다. 각 칸을 한 번씩만 방문하므로 O(NM)입니다.

- DFS는 한 방향으로 깊게 들어가므로, 처음 찾은 경로가 멀리 돌아가는 경로일 수 있습니다.
- 플로이드-워셜은 답은 맞지만 칸 수 V에 대해 O(V^3)이라 격자에서는 너무 느립니다.
- 정렬과 이분 탐색은 경로 탐색과 관계가 없습니다.`,
      tags: [
        '접근법 선택',
        '최단 거리',
      ],
    },
    {
      id: 'algo-bfs-dfs-q02',
      categoryId: 'bfs-dfs',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 BFS 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `from collections import deque

graph = {1: [2, 3], 2: [4], 3: [4, 5], 4: [], 5: []}
visited = {1}
q = deque([1])
order = []
while q:
    v = q.popleft()
    order.append(v)
    for nxt in graph[v]:
        if nxt not in visited:
            visited.add(nxt)
            q.append(nxt)
print(order)`,
      },
      choices: [
        '`[1, 2, 4, 3, 5]`',
        '`[1, 3, 5, 4, 2]`',
        '`[1, 2, 3, 5, 4]`',
        '`[1, 2, 3, 4, 5]`',
      ],
      answer: 3,
      explanation: `BFS는 큐에 들어간 순서대로 꺼냅니다.

1. 1을 꺼내 2, 3을 넣습니다. → 큐: 2, 3
2. 2를 꺼내 4를 넣습니다. → 큐: 3, 4
3. 3을 꺼냅니다. 4는 이미 방문 표시가 되어 있으니 5만 넣습니다. → 큐: 4, 5
4. 4와 5를 차례로 꺼냅니다.

따라서 \`[1, 2, 3, 4, 5]\`입니다. \`[1, 2, 4, 3, 5]\`는 재귀 DFS, \`[1, 3, 5, 4, 2]\`는 스택을 쓰는 반복 DFS의 방문 순서입니다.`,
      tags: [
        '코드 읽기',
        'BFS',
      ],
    },
  ],
};

export default content;
