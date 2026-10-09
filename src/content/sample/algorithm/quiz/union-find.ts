// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
유니온 파인드(Union-Find, 서로소 집합)는 원소들을 **겹치지 않는 그룹**으로 나누어 관리합니다.

- \`find(x)\`: x가 속한 그룹의 대표(루트)를 찾습니다.
- \`union(a, b)\`: a와 b가 속한 두 그룹을 하나로 합칩니다.
- \`find(a) == find(b)\`이면 같은 그룹입니다.`,
  questions: [
    {
      id: 'algo-union-find-q01',
      categoryId: 'union-find',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 중 유니온 파인드로 가장 효율적으로 해결할 수 있는 문제는?',
      choices: [
        '가중치 그래프에서 두 정점 사이의 최단 거리 구하기',
        '방향 그래프에서 위상 정렬 순서 구하기',
        '친구 관계가 계속 추가될 때, 두 사람이 같은 친구 무리인지 매번 확인하기',
        '배열에서 k번째로 작은 수 찾기',
      ],
      answer: 2,
      explanation: `유니온 파인드는 '두 그룹 합치기(union)'와 '같은 그룹인지 확인(find)'을 거의 O(1)에 처리합니다. 관계가 계속 추가되면서 연결 여부를 반복해서 묻는 문제에 딱 맞습니다.

- 최단 거리는 다익스트라 같은 최단 경로 알고리즘이 필요합니다.
- 위상 정렬은 진입 차수와 큐를 사용합니다.
- k번째 수는 정렬, 힙, 퀵 셀렉트 등으로 구합니다.`,
      tags: [
        '접근법 선택',
      ],
    },
    {
      id: 'algo-union-find-q02',
      categoryId: 'union-find',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `parent = list(range(6))

def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])
    return parent[x]

def union(a, b):
    a, b = find(a), find(b)
    if a != b:
        parent[b] = a

for a, b in [(0, 1), (2, 3), (1, 3), (4, 5)]:
    union(a, b)
print(len({find(x) for x in range(6)}))`,
      },
      choices: [
        '`1`',
        '`2`',
        '`3`',
        '`4`',
      ],
      answer: 1,
      explanation: `합쳐지는 과정을 따라가 보면 다음과 같습니다.

- (0, 1) → {0, 1}
- (2, 3) → {2, 3}
- (1, 3) → 1과 3의 루트(0과 2)가 달라 합쳐져 {0, 1, 2, 3}
- (4, 5) → {4, 5}

최종 그룹은 {0, 1, 2, 3}, {4, 5}로 **2개**입니다.

> 그룹 수는 서로 다른 \`find(x)\` 값의 개수로 세야 합니다. 이 시점의 \`parent\`는 \`[0, 0, 0, 2, 4, 4]\`라서, \`len(set(parent))\`처럼 \`parent\` 값을 그대로 세면 \`3\`이 나옵니다.`,
      tags: [
        '코드 읽기',
        '그룹 개수',
      ],
    },
  ],
};

export default content;
