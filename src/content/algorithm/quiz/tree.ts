// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
트리는 **사이클이 없는 연결 그래프**입니다.

- 정점이 N개면 간선은 정확히 **N-1개**입니다.
- 두 정점 사이의 경로는 **딱 하나**입니다.
- 루트를 정하면 부모·자식, 깊이(depth), 서브트리가 정해집니다.
- **이진 트리**는 모든 노드의 자식이 최대 2개인 트리입니다.`,
  questions: [
    {
      id: 'algo-tree-q01',
      categoryId: 'tree',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `tree = {   # 노드: (왼쪽 자식, 오른쪽 자식)
    'A': ('B', 'C'),
    'B': ('D', 'E'),
    'C': (None, 'F'),
    'D': (None, None),
    'E': (None, None),
    'F': (None, None),
}

def visit(node, out):
    if node is None:
        return
    left, right = tree[node]
    visit(left, out)
    out.append(node)
    visit(right, out)

out = []
visit('A', out)
print(''.join(out))`,
      },
      choices: [
        '`ABDECF`',
        '`DBEACF`',
        '`DEBFCA`',
        '`ABCDEF`',
      ],
      answer: 1,
      explanation: `\`out.append(node)\`가 왼쪽 재귀와 오른쪽 재귀 **사이**에 있으므로 **중위 순회**(왼쪽 → 루트 → 오른쪽)입니다.

A의 왼쪽 서브트리(D, B, E)를 먼저 방문하고, 다음으로 A, 마지막으로 오른쪽 서브트리(C, F)를 방문하므로 \`DBEACF\`입니다.

- \`ABDECF\`: 전위 순회(루트 → 왼쪽 → 오른쪽)
- \`DEBFCA\`: 후위 순회(왼쪽 → 오른쪽 → 루트)
- \`ABCDEF\`: 레벨 순회(BFS)`,
      tags: [
        '순회',
        '코드 읽기',
      ],
    },
    {
      id: 'algo-tree-q02',
      categoryId: 'tree',
      type: 'mcq',
      difficulty: 1,
      prompt: '정점이 N개인 트리에 대한 설명으로 **옳지 않은** 것은?',
      choices: [
        '간선은 정확히 N-1개이다',
        '임의의 두 정점 사이의 경로는 하나뿐이다',
        '모든 노드는 자식을 최대 2개까지 가진다',
        '간선을 하나 더 추가하면 사이클이 생긴다',
      ],
      answer: 2,
      explanation: `자식이 최대 2개라는 조건은 **이진 트리**의 조건입니다. 일반 트리에서는 한 노드가 자식을 몇 개든 가질 수 있습니다.

나머지는 모두 트리의 성질입니다. 연결되어 있으면서 사이클이 없으므로 간선은 N-1개이고, 두 정점 사이의 경로는 유일합니다. 여기에 간선을 하나 더 넣으면, 이미 있던 경로와 새 간선이 사이클을 이룹니다.`,
      tags: [
        '개념',
      ],
    },
  ],
};

export default content;
