// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
그리디(탐욕법)는 **매 순간 가장 좋아 보이는 선택**을 하고, 그 선택을 되돌리지 않는 방법입니다.

- 한 번 고른 선택은 다시 검토하지 않습니다.
- 대부분 **정렬 + 한 번의 순회**로 끝나서 빠릅니다.
- 하지만 **항상 최적해를 보장하지는 않습니다.**

그리디가 최적해를 보장하려면 두 성질이 모두 필요합니다.

- **탐욕 선택 속성**: 지금 가장 좋아 보이는 선택을 포함하는 최적해가 존재합니다.
- **최적 부분 구조**: 그 선택을 하고 남은 문제의 최적해를 합치면 전체 최적해가 됩니다.`,
  questions: [
    {
      id: 'algo-greedy-q01',
      categoryId: 'greedy',
      type: 'mcq',
      difficulty: 1,
      prompt: '그리디(탐욕법) 알고리즘에 대한 설명으로 옳은 것은?',
      choices: [
        '모든 경우를 확인하므로 항상 최적해를 보장한다',
        '매 단계에서 지금 가장 좋아 보이는 선택을 하고, 그 선택을 되돌리지 않는다',
        '선택이 막히면 직전 단계로 돌아가 다른 선택을 시도한다',
        '부분 문제의 답을 표에 저장해 두고 재사용한다',
      ],
      answer: 1,
      explanation: `그리디는 매 순간의 최선 선택을 확정하고 되돌아가지 않습니다. 그래서 빠르지만, **탐욕 선택 속성**과 **최적 부분 구조**가 성립할 때만 최적해를 보장합니다.

- 모든 경우를 확인하는 것은 **완전 탐색**입니다.
- 막히면 되돌아가 다른 선택을 시도하는 것은 **백트래킹**입니다.
- 부분 문제의 답을 저장해 재사용하는 것은 **동적 계획법(DP)**입니다.`,
      tags: [
        '개념',
      ],
    },
    {
      id: 'algo-greedy-q02',
      categoryId: 'greedy',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력과, 그 값이 8원을 만드는 **최소 동전 개수**인지를 바르게 짝지은 것은?',
      code: {
        language: 'python',
        source: `def greedy_coins(coins, amount):
    count = 0
    for c in sorted(coins, reverse=True):
        count += amount // c
        amount %= c
    return count

print(greedy_coins([1, 4, 6], 8))`,
      },
      choices: [
        '`2` — 최소 개수다',
        '`3` — 최소 개수다',
        '`3` — 최소 개수가 아니다',
        '`4` — 최소 개수가 아니다',
      ],
      answer: 2,
      explanation: `큰 동전부터 고르면 6원 1개를 쓰고, 남은 2원을 1원 2개로 채워 **3**이 출력됩니다. 하지만 4원 2개를 쓰면 **2개**로 8원을 만들 수 있으므로 최소 개수가 아닙니다.

동전 단위가 배수 관계가 아니면 큰 동전부터 고르는 그리디는 최적해를 보장하지 않습니다. 이럴 때는 \`dp[x] = min(dp[x - c] + 1)\` 형태의 DP로 풀어야 합니다.`,
      tags: [
        '반례',
        '거스름돈',
      ],
    },
  ],
};

export default content;
