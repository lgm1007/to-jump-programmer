// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
해시 테이블은 키를 **해시 함수**로 계산한 위치에 저장해, 삽입·조회·삭제를 평균 \`O(1)\`에 처리합니다.

- 서로 다른 키가 같은 위치에 들어가는 것을 **충돌**이라고 합니다. 충돌이 한곳에 몰리면 최악 \`O(N)\`까지 느려질 수 있습니다.
- 키는 바뀌지 않는(불변) 값이어야 합니다.
- 기본적으로 순서가 없습니다. 정렬된 순서가 필요하면 Java \`TreeMap\`, C++ \`map\`처럼 트리 기반(\`O(log N)\`) 자료구조를 씁니다.`,
  questions: [
    {
      id: 'algo-hash-q01',
      categoryId: 'hash',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 중 해시 셋(`set`)이나 해시 맵(`dict`)을 쓰면 가장 큰 효과를 보는 상황은?',
      correct: '어떤 값이 이전에 등장했는지 반복해서 확인해야 할 때',
      distractors: [
        {
          text: '원소를 크기 순서대로 출력해야 할 때',
          why: '해시는 해시값에 따라 키를 흩어 저장하므로 순서가 없습니다. 크기 순서가 필요하면 **정렬**하거나 Java `TreeMap`, C++ `map` 같은 트리 기반 자료구조를 씁니다.',
        },
        {
          text: '남은 원소 중 가장 작은 값을 반복해서 꺼내야 할 때',
          why: '해시에서 최솟값을 찾으려면 모든 키를 훑어야 해 매번 `O(N)`이 듭니다. 최솟값을 반복해서 꺼낼 때는 **힙**(우선순위 큐)이 적합합니다.',
        },
        {
          text: '배열의 구간 합을 반복해서 구해야 할 때',
          why: '구간 합은 값이 있는지가 아니라 연속된 원소의 합을 묻는 문제라 해시로는 빨라지지 않습니다. **누적 합**을 미리 구해 두면 질의마다 `O(1)`입니다.',
        },
        {
          text: '정렬된 배열에서 어떤 값 이상이 처음 나오는 위치를 찾아야 할 때',
          why: '해시는 정확히 같은 키만 찾을 수 있고, "이상 · 이하" 같은 크기 비교 검색은 하지 못합니다. 정렬된 배열에서는 **이분 탐색**으로 `O(log N)`에 찾습니다.',
        },
        {
          text: '먼저 들어온 작업부터 차례로 꺼내 처리해야 할 때',
          why: '넣은 순서대로 꺼내는 것은 **큐**(`deque`)가 하는 일입니다. 해시의 강점은 값으로 바로 찾는 것이지 순서대로 꺼내는 것이 아닙니다.',
        },
        {
          text: '배열의 `i`번째 원소를 반복해서 읽어야 할 때',
          why: '배열은 인덱스로 원소를 바로 읽을 수 있어 이미 `O(1)`입니다. 해시로 바꿔도 빨라지지 않고 메모리만 더 씁니다.',
        },
      ],
      explanation: `해시는 '이 값이 있는가?'에 평균 \`O(1)\`로 답합니다. 리스트에서 매번 찾으면 \`O(N)\`이 걸리므로, 확인을 N번 반복하면 \`O(N²)\`과 \`O(N)\`의 차이가 납니다.

중복 검사, 방문 체크, 두 수의 합에서 \`target - x\`를 본 적 있는지 확인하는 것이 모두 이 상황입니다.`,
    },
    {
      id: 'algo-hash-q02',
      categoryId: 'hash',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `from collections import Counter

cnt = Counter("banana")
print(cnt["a"], cnt["z"], len(cnt))`,
      },
      correct: '`3 0 3`',
      distractors: [
        {
          text: '`3 0 6`',
          why: '`len(cnt)`는 서로 다른 키의 개수(3)입니다. 전체 문자 수 6은 `sum(cnt.values())`로 구합니다.',
        },
        {
          text: '`3 None 3`',
          why: '`Counter`는 없는 키를 읽으면 `None`이 아니라 0을 돌려줍니다. `None`은 일반 `dict`에서 `d.get("z")`를 썼을 때의 결과입니다.',
        },
        {
          text: '`KeyError`가 발생한다',
          why: '일반 `dict`라면 `d["z"]`에서 `KeyError`가 나지만, `Counter`는 없는 키를 읽으면 오류 대신 0을 돌려줍니다.',
        },
        {
          text: '`3 0 4`',
          why: '`Counter`는 없는 키를 읽어도 0을 돌려줄 뿐 키를 추가하지 않습니다. 읽기만 해도 키가 생기는 것은 `defaultdict`이고, 그 경우라면 4가 나옵니다.',
        },
        {
          text: '`0 0 1`',
          why: '`Counter`에 문자열을 넘기면 문자열 전체가 아니라 **문자 하나하나**를 셉니다. 이 값은 `Counter(["banana"])`처럼 리스트에 담아 넘겼을 때의 결과입니다.',
        },
      ],
      explanation: `\`Counter("banana")\`는 각 문자의 등장 횟수 \`{'b': 1, 'a': 3, 'n': 2}\`를 셉니다.

- \`cnt["a"]\`: 3
- \`cnt["z"]\`: 없는 키는 \`KeyError\` 대신 **0**을 반환합니다. 이때 키가 추가되지도 않습니다.
- \`len(cnt)\`: 서로 다른 키의 개수인 3입니다.

일반 \`dict\`라면 \`d["z"]\`에서 \`KeyError\`가 나므로 \`d.get("z", 0)\`을 씁니다.`,
      output: '3 0 3',
      variants: {
        java: {
          code: {
            language: 'java',
            source: `Map<Character, Integer> cnt = new HashMap<>();
for (char ch : "banana".toCharArray()) {
    cnt.merge(ch, 1, Integer::sum);
}
System.out.println(cnt.get('a') + " " + cnt.get('z') + " " + cnt.size());`,
          },
          output: '3 null 3',
          correct: '`3 null 3`',
          distractors: [
            {
              text: '`3 0 3`',
              why: '`HashMap`의 `get`은 없는 키를 읽으면 0이 아니라 `null`을 돌려줍니다. 0이 필요하면 `cnt.getOrDefault(\'z\', 0)`을 씁니다.',
            },
            {
              text: '`3 null 6`',
              why: '`size()`는 서로 다른 키의 개수(3)입니다. 전체 문자 수 6은 값을 모두 더해야 나옵니다.',
            },
            {
              text: '`NullPointerException`이 발생한다',
              why: '`null`을 문자열에 이어 붙이면 `"null"`이 될 뿐 예외가 나지 않습니다. 예외는 `int z = cnt.get(\'z\');`처럼 `int`로 언박싱할 때 납니다.',
            },
            {
              text: '`3 null 4`',
              why: '`get`은 없는 키를 읽어도 키를 추가하지 않습니다. 없는 키를 새로 만드는 것은 `computeIfAbsent` 같은 메서드입니다.',
            },
            {
              text: '`1 null 3`',
              why: '`merge(ch, 1, Integer::sum)`은 키가 이미 있으면 기존 값에 1을 더합니다. 매번 1로 덮어쓰는 것은 `put(ch, 1)`입니다.',
            },
          ],
          explanation: `\`cnt.merge(ch, 1, Integer::sum)\`은 키가 없으면 1을 넣고, 있으면 기존 값에 1을 더해 각 문자의 등장 횟수 \`{a=3, b=1, n=2}\`를 셉니다.

- \`cnt.get('a')\`: 3
- \`cnt.get('z')\`: 없는 키는 0이 아니라 **\`null\`**을 반환하고, 문자열에 이어 붙이면 \`null\`로 찍힙니다. 이때 키가 추가되지는 않습니다.
- \`cnt.size()\`: 서로 다른 키의 개수인 3입니다.

빈도를 세는 맵이라도 없는 키를 0으로 바꿔 주지 않습니다. 0으로 읽으려면 \`cnt.getOrDefault('z', 0)\`을 씁니다.`,
        },
        kotlin: {
          code: {
            language: 'kotlin',
            source: `val cnt = "banana".groupingBy { it }.eachCount()
println("\${cnt['a']} \${cnt['z']} \${cnt.size}")`,
          },
          output: '3 null 3',
          correct: '`3 null 3`',
          distractors: [
            {
              text: '`3 0 3`',
              why: '`cnt[\'z\']`(`get`)는 없는 키를 읽으면 0이 아니라 `null`을 돌려줍니다. 0이 필요하면 `cnt[\'z\'] ?: 0`처럼 기본값을 붙입니다.',
            },
            {
              text: '`3 null 6`',
              why: '`size`는 서로 다른 키의 개수(3)입니다. 전체 문자 수 6은 `cnt.values.sum()`으로 구합니다.',
            },
            {
              text: '`NoSuchElementException`이 발생한다',
              why: '`cnt[\'z\']`는 없는 키에 예외 대신 `null`을 돌려줍니다. 없는 키에서 예외를 던지는 것은 `cnt.getValue(\'z\')`입니다.',
            },
            {
              text: '컴파일 에러 — `Int?` 값은 문자열 템플릿에 넣을 수 없다',
              why: '문자열 템플릿은 nullable 값도 받아 `null`이면 `"null"`로 바꿉니다. `Int?`가 컴파일 에러가 되는 것은 `cnt[\'z\'] + 1`처럼 바로 계산할 때입니다.',
            },
            {
              text: '`3 null 4`',
              why: '`cnt[\'z\']`는 읽기만 할 뿐 키를 추가하지 않습니다. 없는 키를 새로 만드는 것은 `MutableMap`의 `getOrPut`입니다.',
            },
          ],
          explanation: `\`groupingBy { it }.eachCount()\`는 문자열의 각 문자를 키로 등장 횟수 \`{b=1, a=3, n=2}\`를 셉니다.

- \`cnt['a']\`: 3
- \`cnt['z']\`: 없는 키는 0이 아니라 **\`null\`**을 반환하고(반환 타입 \`Int?\`), 문자열 템플릿에서는 \`null\`로 찍힙니다. 이때 키가 추가되지는 않습니다.
- \`cnt.size\`: 서로 다른 키의 개수인 3입니다.

빈도를 센 맵이라도 없는 키를 0으로 바꿔 주지 않습니다. 0으로 읽으려면 \`cnt['z'] ?: 0\` 또는 \`cnt.getOrDefault('z', 0)\`을 씁니다.`,
        },
        javascript: {
          code: {
            language: 'javascript',
            source: `const cnt = new Map();
for (const ch of "banana") {
  cnt.set(ch, (cnt.get(ch) ?? 0) + 1);
}
console.log(cnt.get("a"), cnt.get("z"), cnt.size);`,
          },
          output: '3 undefined 3',
          correct: '`3 undefined 3`',
          distractors: [
            {
              text: '`3 0 3`',
              why: '`Map`의 `get`은 없는 키를 읽으면 0이 아니라 `undefined`를 돌려줍니다. 0이 필요하면 `cnt.get("z") ?? 0`처럼 기본값을 붙입니다.',
            },
            {
              text: '`3 null 3`',
              why: '`Map.get`이 없는 키에 돌려주는 값은 `null`이 아니라 `undefined`입니다.',
            },
            {
              text: '`3 undefined 6`',
              why: '`size`는 서로 다른 키의 개수(3)입니다. 전체 문자 수 6은 값을 모두 더해야 나옵니다.',
            },
            {
              text: '`3 undefined 4`',
              why: '`get`은 읽기만 할 뿐 키를 추가하지 않습니다. 키는 `set`을 부를 때만 생깁니다.',
            },
            {
              text: '`TypeError`가 발생한다',
              why: '`for...of`는 문자열을 문자 하나씩 돌고, 없는 키를 `get`해도 예외 없이 `undefined`를 돌려줍니다. 코드 어디에서도 오류가 나지 않습니다.',
            },
          ],
          explanation: `반복문이 문자마다 \`(cnt.get(ch) ?? 0) + 1\`을 저장해 \`b\` 1번, \`a\` 3번, \`n\` 2번을 셉니다.

- \`cnt.get("a")\`: 3
- \`cnt.get("z")\`: 없는 키는 0이 아니라 **\`undefined\`**를 반환합니다. 이때 키가 추가되지는 않습니다.
- \`cnt.size\`: 서로 다른 키의 개수인 3입니다.

빈도를 세는 \`Map\`이라도 없는 키를 0으로 바꿔 주지 않습니다. 0으로 읽으려면 \`cnt.get("z") ?? 0\`처럼 기본값을 붙입니다.`,
        },
      },
      tags: [
        'output',
      ],
    },
  ],
};

export default content;
