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
      correct: '친구 관계가 계속 추가될 때, 두 사람이 같은 친구 무리인지 매번 확인하기',
      distractors: [
        {
          text: '가중치 그래프에서 두 정점 사이의 최단 거리 구하기',
          why: '유니온 파인드는 연결 여부만 알 뿐 거리를 저장하지 않습니다. 최단 거리는 다익스트라 같은 최단 경로 알고리즘으로 구합니다.',
        },
        {
          text: '방향 그래프에서 위상 정렬 순서 구하기',
          why: '위상 정렬은 진입 차수와 큐(또는 DFS)를 사용합니다. 유니온 파인드는 간선의 방향을 구분하지 않습니다.',
        },
        {
          text: '배열에서 k번째로 작은 수 찾기',
          why: 'k번째 수는 정렬, 힙, 퀵 셀렉트 등으로 구합니다. 그룹을 합치고 확인하는 연산과는 관계가 없습니다.',
        },
        {
          text: '방향 그래프에 사이클이 있는지 확인하기',
          why: '유니온 파인드는 간선의 방향을 무시하므로 무방향 그래프의 사이클만 판별할 수 있습니다. 방향 그래프는 DFS나 위상 정렬로 판별합니다.',
        },
        {
          text: '친구 관계가 계속 끊어질 때, 두 사람이 여전히 같은 무리인지 확인하기',
          why: '유니온 파인드는 그룹을 합치는 연산만 있고 나누는 연산이 없어, 관계가 끊어지는 것을 그대로 반영할 수 없습니다.',
        },
        {
          text: '두 정점을 잇는 실제 경로를 출력하기',
          why: '유니온 파인드 트리의 부모 관계는 실제 간선과 다르므로 경로를 알 수 없습니다. 경로는 BFS · DFS로 부모를 기록해 되짚어 구합니다.',
        },
      ],
      explanation: `유니온 파인드는 '두 그룹 합치기(union)'와 '같은 그룹인지 확인(find)'을 거의 O(1)에 처리합니다. 관계가 계속 추가되면서 연결 여부를 반복해서 묻는 문제에 딱 맞습니다.

친구 관계가 생길 때마다 \`union(a, b)\`, 같은 무리인지 물을 때마다 \`find(a) == find(b)\`를 확인하면 됩니다.`,
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
      output: '2',
      correct: '`2`',
      distractors: [
        {
          text: '`1`',
          why: '(4, 5)는 0~3 쪽과 한 번도 이어지지 않으므로 모든 원소가 한 그룹이 될 수 없습니다.',
        },
        {
          text: '`3`',
          why: '`len(set(parent))`처럼 `parent` 값을 그대로 센 결과입니다. 합친 직후 `parent`는 `[0, 0, 0, 2, 4, 4]`라 3이 중간 노드 2를 가리키지만, 3의 루트는 0입니다.',
        },
        {
          text: '`4`',
          why: '성공한 union 횟수와 그룹 수를 혼동한 값입니다. union이 성공할 때마다 그룹이 하나씩 줄어 6 - 4 = 2개가 남습니다.',
        },
        {
          text: '`6`',
          why: '`union` 안의 `parent[b] = a`는 전역 리스트의 원소를 바꾸므로, `global` 선언이 없어도 합친 결과가 그대로 남습니다.',
        },
        {
          text: '`UnboundLocalError`가 발생한다',
          why: '함수 안에서 `parent = ...`처럼 이름 자체에 대입할 때만 지역 변수가 됩니다. `parent[x] = ...`는 전역 리스트의 원소를 바꾸는 것이라 오류가 나지 않습니다.',
        },
      ],
      explanation: `합쳐지는 과정을 따라가 보면 다음과 같습니다.

- (0, 1) → {0, 1}
- (2, 3) → {2, 3}
- (1, 3) → 1과 3의 루트(0과 2)가 달라 합쳐져 {0, 1, 2, 3}
- (4, 5) → {4, 5}

최종 그룹은 {0, 1, 2, 3}, {4, 5}로 **2개**입니다.

> 그룹 수는 서로 다른 \`find(x)\` 값의 개수로 셉니다. \`parent[x]\`는 루트가 아닌 중간 노드를 가리킬 수 있기 때문입니다.`,
      variants: {
        java: {
          code: {
            language: 'java',
            source: `import java.util.*;

public class Main {
    static int[] parent = {0, 1, 2, 3, 4, 5};

    static int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    static void union(int a, int b) {
        a = find(a);
        b = find(b);
        if (a != b) parent[b] = a;
    }

    public static void main(String[] args) {
        int[][] pairs = {{0, 1}, {2, 3}, {1, 3}, {4, 5}};
        for (int[] p : pairs) union(p[0], p[1]);
        Set<Integer> roots = new HashSet<>();
        for (int x = 0; x < 6; x++) roots.add(find(x));
        System.out.println(roots.size());
    }
}`,
          },
          output: '2',
          distractors: [
            {
              text: '`1`',
              why: '(4, 5)는 0~3 쪽과 한 번도 이어지지 않으므로 모든 원소가 한 그룹이 될 수 없습니다.',
            },
            {
              text: '`3`',
              why: '`parent` 배열에 든 서로 다른 값을 그대로 센 결과입니다. 합친 직후 `parent`는 `[0, 0, 0, 2, 4, 4]`라 3이 중간 노드 2를 가리키지만, 3의 루트는 0입니다.',
            },
            {
              text: '`4`',
              why: '성공한 union 횟수와 그룹 수를 혼동한 값입니다. union이 성공할 때마다 그룹이 하나씩 줄어 6 - 4 = 2개가 남습니다.',
            },
            {
              text: '`6`',
              why: '`union` 안에서 매개변수 `a`, `b`에 다시 대입하는 것은 바깥에 영향이 없지만, `parent[b] = a`는 `static` 배열의 원소를 직접 바꾸므로 합친 결과가 그대로 남습니다.',
            },
            {
              text: '`StackOverflowError`가 발생한다',
              why: '`find`의 재귀는 `parent[x] == x`인 루트에서 멈춥니다. 이 트리들은 높이가 낮아 재귀가 깊어지지 않습니다.',
            },
          ],
        },
        kotlin: {
          code: {
            language: 'kotlin',
            source: `val parent = IntArray(6) { it }

fun find(x: Int): Int {
    if (parent[x] != x) parent[x] = find(parent[x])
    return parent[x]
}

fun union(a: Int, b: Int) {
    val ra = find(a)
    val rb = find(b)
    if (ra != rb) parent[rb] = ra
}

fun main() {
    for ((a, b) in listOf(0 to 1, 2 to 3, 1 to 3, 4 to 5)) union(a, b)
    println((0 until 6).map { find(it) }.toSet().size)
}`,
          },
          output: '2',
          distractors: [
            {
              text: '`1`',
              why: '(4, 5)는 0~3 쪽과 한 번도 이어지지 않으므로 모든 원소가 한 그룹이 될 수 없습니다.',
            },
            {
              text: '`3`',
              why: '`parent.toSet().size`처럼 `parent` 값을 그대로 센 결과입니다. 합친 직후 `parent`는 `[0, 0, 0, 2, 4, 4]`라 3이 중간 노드 2를 가리키지만, 3의 루트는 0입니다.',
            },
            {
              text: '`4`',
              why: '성공한 union 횟수와 그룹 수를 혼동한 값입니다. union이 성공할 때마다 그룹이 하나씩 줄어 6 - 4 = 2개가 남습니다.',
            },
            {
              text: '`6`',
              why: '매개변수는 바꿀 수 없어 루트를 `ra`, `rb`에 따로 담지만, `parent[rb] = ra`는 바깥 배열의 원소를 직접 바꾸므로 합친 결과가 그대로 남습니다.',
            },
            {
              text: '컴파일 에러 — `val`로 선언한 배열의 원소는 바꿀 수 없다',
              why: '`val`은 `parent`가 다른 배열을 가리키지 못하게 막을 뿐, 배열 원소에 대입하는 것은 막지 않습니다.',
            },
          ],
        },
        javascript: {
          code: {
            language: 'javascript',
            source: `const parent = [0, 1, 2, 3, 4, 5];

function find(x) {
  if (parent[x] !== x) parent[x] = find(parent[x]);
  return parent[x];
}

function union(a, b) {
  a = find(a);
  b = find(b);
  if (a !== b) parent[b] = a;
}

for (const [a, b] of [[0, 1], [2, 3], [1, 3], [4, 5]]) union(a, b);
const roots = new Set();
for (let x = 0; x < 6; x++) roots.add(find(x));
console.log(roots.size);`,
          },
          output: '2',
          distractors: [
            {
              text: '`1`',
              why: '(4, 5)는 0~3 쪽과 한 번도 이어지지 않으므로 모든 원소가 한 그룹이 될 수 없습니다.',
            },
            {
              text: '`3`',
              why: '`new Set(parent).size`처럼 `parent` 값을 그대로 센 결과입니다. 합친 직후 `parent`는 `[0, 0, 0, 2, 4, 4]`라 3이 중간 노드 2를 가리키지만, 3의 루트는 0입니다.',
            },
            {
              text: '`4`',
              why: '성공한 union 횟수와 그룹 수를 혼동한 값입니다. union이 성공할 때마다 그룹이 하나씩 줄어 6 - 4 = 2개가 남습니다.',
            },
            {
              text: '`6`',
              why: '`union` 안에서 매개변수 `a`, `b`에 다시 대입하는 것은 바깥에 영향이 없지만, `parent[b] = a`는 바깥 배열의 원소를 직접 바꾸므로 합친 결과가 그대로 남습니다.',
            },
            {
              text: '`TypeError`가 발생한다 — `const` 배열의 원소를 바꿨다',
              why: '`const`는 `parent`에 다른 값을 다시 대입하는 것만 막고, 배열의 원소를 바꾸는 것은 허용합니다.',
            },
          ],
        },
      },
      tags: [
        '코드 읽기',
        '그룹 개수',
        'output',
      ],
    },
  ],
};

export default content;
