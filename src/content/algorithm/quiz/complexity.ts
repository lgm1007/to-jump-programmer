// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
시간 복잡도는 입력 크기 N이 커질 때 **연산 횟수가 늘어나는 정도**를 나타냅니다. 코딩 테스트에서는 보통 **최악의 경우**를 Big-O로 표기합니다.

- 상수 배와 낮은 차수 항은 버립니다: \`3N² + 5N + 7\` → \`O(N²)\`
- 차례로 실행되는 단계는 가장 큰 항만 남깁니다: \`O(N) + O(N log N)\` → \`O(N log N)\`
- 중첩된 반복은 곱합니다: N번 × M번 → \`O(N × M)\`
- 범위가 매번 절반으로 줄면 \`O(log N)\`입니다.

| 복잡도 | N = 1,000,000일 때 연산 수 |
|---|---|
| \`O(log N)\` | 약 20 |
| \`O(N)\` | 100만 |
| \`O(N log N)\` | 약 2,000만 |
| \`O(N²)\` | 1조 |`,
  questions: [
    {
      id: 'algo-complexity-q01',
      categoryId: 'complexity',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 함수의 시간 복잡도는?',
      code: {
        language: 'python',
        source: `def solution(n):
    count = 0
    i = 1
    while i < n:
        i *= 2
        count += 1
    return count`,
      },
      choices: [
        '`O(1)`',
        '`O(log N)`',
        '`O(N)`',
        '`O(N log N)`',
      ],
      answer: 1,
      explanation: `\`i\`가 1, 2, 4, 8, …처럼 **두 배씩** 커지므로 반복 횟수는 약 log₂N번입니다. N = 1,000,000이어도 20번만 반복합니다.

- \`O(1)\`: 반복 횟수가 N에 따라 늘어나므로 상수 시간이 아닙니다.
- \`O(N)\`: \`i += 1\`처럼 1씩 증가할 때의 복잡도입니다.
- \`O(N log N)\`: 바깥에 N번 도는 반복문이 하나 더 있어야 합니다.`,
    },
    {
      id: 'algo-complexity-q02',
      categoryId: 'complexity',
      type: 'mcq',
      difficulty: 1,
      prompt: '배열의 길이 N이 최대 100,000이고 시간 제한이 1초입니다. 다음 중 **시간 초과**가 날 가능성이 가장 높은 풀이는?',
      choices: [
        '배열을 정렬한 뒤 한 번 순회한다',
        '해시맵에 값을 담으며 한 번 순회한다',
        '모든 두 원소 쌍을 이중 반복문으로 비교한다',
        '원소마다 정렬된 배열에서 이분 탐색을 한다',
      ],
      answer: 2,
      explanation: `모든 쌍을 비교하면 약 N²/2 = 50억 번의 연산이 필요합니다. 1초에 약 1억 번을 기준으로 하면 수십 초가 걸립니다.

- 정렬 후 순회: \`O(N log N)\` ≈ 170만 번
- 해시맵 순회: 평균 \`O(N)\` = 10만 번
- 원소마다 이분 탐색: \`O(N log N)\` ≈ 170만 번

> N ≤ 100,000이면 \`O(N log N)\` 이하의 풀이를 먼저 떠올리세요.`,
    },
  ],
};

export default content;
