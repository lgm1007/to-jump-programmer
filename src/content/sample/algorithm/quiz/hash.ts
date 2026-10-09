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
      choices: [
        '원소를 크기 순서대로 출력해야 할 때',
        '어떤 값이 이전에 등장했는지 반복해서 확인해야 할 때',
        '남은 원소 중 가장 작은 값을 반복해서 꺼내야 할 때',
        '배열의 구간 합을 반복해서 구해야 할 때',
      ],
      answer: 1,
      explanation: `해시는 '이 값이 있는가?'에 평균 \`O(1)\`로 답합니다. 리스트에서 매번 찾으면 \`O(N)\`이 걸리므로, 확인을 N번 반복하면 \`O(N²)\`과 \`O(N)\`의 차이가 납니다.

- 크기 순서 출력: 해시는 순서가 없으므로 **정렬**이나 트리 기반 자료구조를 씁니다.
- 가장 작은 값 반복 추출: **힙**(우선순위 큐)이 적합합니다.
- 구간 합 반복: **누적 합**이 적합합니다.`,
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
      choices: [
        '`3 0 3`',
        '`3 0 6`',
        '`3 None 3`',
        '`KeyError`가 발생한다',
      ],
      answer: 0,
      explanation: `\`Counter("banana")\`는 각 문자의 등장 횟수 \`{'b': 1, 'a': 3, 'n': 2}\`를 셉니다.

- \`cnt["a"]\`: 3
- \`cnt["z"]\`: 없는 키는 \`KeyError\` 대신 **0**을 반환합니다. 이때 키가 추가되지도 않습니다.
- \`len(cnt)\`: 서로 다른 키의 개수인 3입니다. 전체 문자 수(6)가 아닙니다.

일반 \`dict\`라면 \`d["z"]\`에서 \`KeyError\`가 나므로 \`d.get("z", 0)\`을 씁니다.`,
    },
  ],
};

export default content;
