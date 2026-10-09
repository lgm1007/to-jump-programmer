// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
연속된 구간이나 정렬된 배열을 다룰 때, 이중 반복문 \`O(N²)\`을 \`O(N)\`으로 줄이는 기법들입니다.

- **투 포인터**: 두 인덱스를 한 방향으로만 움직입니다. 각 포인터가 최대 N번 움직이므로 \`O(N)\`입니다.
- **슬라이딩 윈도우**: 구간을 밀면서 새로 들어온 값은 더하고 빠져나간 값은 뺍니다.
- **누적 합**: \`P[i] = a[0] + … + a[i-1]\`을 미리 구해 두면 구간 합을 \`O(1)\`에 구합니다.`,
  questions: [
    {
      id: 'algo-two-pointer-q01',
      categoryId: 'two-pointer',
      type: 'mcq',
      difficulty: 1,
      prompt: '길이 N(≤ 100,000)인 배열 `a`에 대해 "인덱스 `l`부터 `r`까지(양 끝 포함, 0부터 시작)의 합"을 묻는 질의가 Q(≤ 100,000)개 주어집니다. 가장 알맞은 방법은?',
      choices: [
        '질의마다 `l`부터 `r`까지 직접 더한다',
        '누적 합 배열 `P`를 만들고 `P[r + 1] - P[l]`로 답한다',
        '질의마다 배열을 정렬한 뒤 더한다',
        '질의마다 이분 탐색으로 `l`과 `r`의 위치를 찾는다',
      ],
      answer: 1,
      explanation: `직접 더하면 질의 하나에 최대 \`O(N)\`, 전체 \`O(N × Q)\` = 최대 100억 번이라 시간 초과입니다. 누적 합은 \`O(N)\` 전처리 후 질의마다 뺄셈 한 번(\`O(1)\`)이므로 전체 \`O(N + Q)\`입니다.

\`\`\`python
P = [0] * (n + 1)
for i in range(n):
    P[i + 1] = P[i] + a[i]
# a[l] + ... + a[r] = P[r + 1] - P[l]
\`\`\`

- 정렬하면 원소 위치가 바뀌어 구간의 의미가 사라집니다.
- 이분 탐색은 위치를 찾는 도구일 뿐, 합을 빠르게 구해 주지 않습니다.`,
    },
    {
      id: 'algo-two-pointer-q02',
      categoryId: 'two-pointer',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `def solve(nums, k):
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        best = max(best, window)
    return best

print(solve([4, -1, 2, 7, -3, 5, 1], 3))`,
      },
      choices: [
        '`8`',
        '`15`',
        '`9`',
        '`5`',
      ],
      answer: 2,
      explanation: `길이 3인 구간을 한 칸씩 밀면서, 새로 들어온 값을 더하고 빠져나간 값을 빼는 **고정 크기 슬라이딩 윈도우**입니다.

| 구간 | 합 |
|---|---|
| 4, -1, 2 | 5 |
| -1, 2, 7 | 8 |
| 2, 7, -3 | 6 |
| 7, -3, 5 | 9 |
| -3, 5, 1 | 3 |

최댓값은 9입니다. 구간마다 \`sum()\`을 다시 하면 \`O(N × K)\`지만, 이 방식은 \`O(N)\`입니다. \`15\`는 길이 제한 없이 가장 큰 연속 합을 구했을 때의 값입니다.`,
    },
  ],
};

export default content;
