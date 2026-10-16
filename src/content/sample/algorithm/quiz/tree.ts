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
      correct: '`DBEACF`',
      distractors: [
        {
          text: '`ABDECF`',
          why: '전위 순회(루트 → 왼쪽 → 오른쪽)의 결과입니다. 이 코드는 왼쪽 재귀가 끝난 뒤에 노드를 추가합니다.',
        },
        {
          text: '`DEBFCA`',
          why: '후위 순회(왼쪽 → 오른쪽 → 루트)의 결과입니다. 이 코드는 오른쪽 재귀보다 먼저 노드를 추가합니다.',
        },
        {
          text: '`ABCDEF`',
          why: '레벨 순회(BFS)의 결과입니다. 이 코드는 재귀로 왼쪽 서브트리를 끝까지 내려가므로 깊이 순서로 방문하지 않습니다.',
        },
        {
          text: '`DBEAFC`',
          why: 'F를 C의 왼쪽 자식으로 본 결과입니다. `(None, \'F\')`에서 F는 오른쪽 자식이므로 C를 추가한 뒤에 방문합니다.',
        },
        {
          text: '`FCAEBD`',
          why: '오른쪽 서브트리부터 방문한(오른쪽 → 루트 → 왼쪽) 결과입니다. 이 코드는 `visit(left, out)`을 먼저 호출합니다.',
        },
      ],
      explanation: `\`out.append(node)\`가 왼쪽 재귀와 오른쪽 재귀 **사이**에 있으므로 **중위 순회**(왼쪽 → 루트 → 오른쪽)입니다.

A의 왼쪽 서브트리(D, B, E)를 먼저 방문하고, 다음으로 A, 마지막으로 오른쪽 서브트리(C, F)를 방문하므로 \`DBEACF\`입니다.`,
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
      correct: '모든 노드는 자식을 최대 2개까지 가진다',
      distractors: [
        {
          text: '간선은 정확히 N-1개이다',
          why: '이 설명은 맞습니다 — 사이클 없이 N개의 정점을 모두 이으려면 간선이 정확히 N-1개 필요합니다.',
        },
        {
          text: '임의의 두 정점 사이의 경로는 하나뿐이다',
          why: '이 설명은 맞습니다 — 경로가 두 개라면 두 경로가 합쳐져 사이클이 생기므로, 트리에서는 경로가 하나뿐입니다.',
        },
        {
          text: '간선을 하나 더 추가하면 사이클이 생긴다',
          why: '이 설명은 맞습니다 — 새 간선의 두 끝은 이미 경로로 이어져 있어, 그 경로와 새 간선이 사이클을 이룹니다.',
        },
        {
          text: '간선을 하나 제거하면 두 개의 연결 요소로 나뉜다',
          why: '이 설명은 맞습니다 — 두 정점을 잇는 경로가 하나뿐이므로, 그 경로의 간선을 끊으면 다른 길이 없어 그래프가 둘로 나뉩니다.',
        },
        {
          text: '정점이 2개 이상이면 리프(간선이 하나만 연결된 정점)가 적어도 2개 있다',
          why: '이 설명은 맞습니다 — 트리에서 가장 긴 경로의 양 끝 정점은 다른 정점과 더 이어질 수 없으므로 리프입니다.',
        },
        {
          text: '어느 정점을 루트로 정해도 트리로 볼 수 있다',
          why: '이 설명은 맞습니다 — 트리는 원래 루트가 정해지지 않은 연결 그래프라, 어느 정점을 루트로 골라도 부모 · 자식 관계를 만들 수 있습니다.',
        },
      ],
      explanation: `자식이 최대 2개라는 조건은 **이진 트리**의 조건입니다. 일반 트리에서는 한 노드가 자식을 몇 개든 가질 수 있습니다.

트리의 조건은 '연결되어 있고 사이클이 없다'는 것뿐이며, 자식 수에는 제한이 없습니다.`,
      tags: [
        '개념',
      ],
    },
  ],
};

export default content;
