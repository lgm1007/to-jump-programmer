// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
이분 탐색은 **정렬되어 있거나 단조로운** 범위를 절반씩 줄여 가며 답을 찾습니다. 비교할 때마다 후보가 절반이 되므로 \`O(log N)\`이고, N = 1,000,000이어도 약 20번이면 충분합니다.

코딩 테스트에서는 두 가지 형태로 나옵니다.

1. **값 탐색**: 정렬된 배열에서 x의 위치나 x 이상이 처음 나오는 위치 찾기
2. **파라메트릭 서치**: "조건을 만족하는 최솟값(최댓값)"을 **답의 범위**에 대해 이분 탐색`,
  questions: [
    {
      id: 'algo-binary-search-q01',
      categoryId: 'binary-search',
      type: 'mcq',
      difficulty: 1,
      prompt: '이분 탐색을 적용하기 위해 반드시 필요한 조건은?',
      choices: [
        '배열의 원소가 모두 서로 달라야 한다',
        '배열의 크기가 2의 거듭제곱이어야 한다',
        '탐색 대상이 정렬되어 있거나, 판정 결과가 한 지점을 기준으로 한 번만 바뀌어야 한다',
        '원소가 모두 양의 정수여야 한다',
      ],
      answer: 2,
      explanation: `이분 탐색은 \`mid\`를 확인한 뒤 '답은 왼쪽(또는 오른쪽)에만 있다'고 단정할 수 있어야 합니다. 그러려면 값이 정렬되어 있거나, \`check(x)\`의 결과가 \`F F F T T T\`처럼 한 번만 바뀌는 **단조성**이 필요합니다.

- 중복 값이 있어도 lower/upper bound로 문제없이 탐색할 수 있습니다.
- 배열 크기나 원소의 부호는 상관없습니다.`,
    },
    {
      id: 'algo-binary-search-q02',
      categoryId: 'binary-search',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `from bisect import bisect_left, bisect_right

arr = [1, 3, 3, 3, 5, 8]
print(bisect_left(arr, 3), bisect_right(arr, 3))`,
      },
      choices: [
        '`1 3`',
        '`1 4`',
        '`2 4`',
        '`0 3`',
      ],
      answer: 1,
      explanation: `\`bisect_left\`는 3 **이상**이 처음 나오는 위치(1), \`bisect_right\`는 3 **초과**가 처음 나오는 위치(4)를 반환합니다. 두 값의 차이 \`4 - 1 = 3\`이 배열에 있는 3의 개수입니다.

- \`1 3\`: 마지막 3의 인덱스(3)와 헷갈린 답입니다. \`bisect_right\`는 마지막 3의 **다음** 위치를 돌려줍니다.
- 두 함수 모두 \`O(log N)\`이며, 정렬된 리스트에서만 올바르게 동작합니다.`,
    },
  ],
};

export default content;
