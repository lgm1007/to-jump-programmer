// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
완전 탐색(브루트 포스)은 **가능한 모든 경우를 하나씩 확인**해 답을 찾는 방법입니다.

- 구현이 단순하고 실수가 적어, 입력이 작으면 가장 먼저 고려합니다.
- 코드를 쓰기 전에 **경우의 수가 시간 안에 처리 가능한지** 먼저 계산합니다.

**백트래킹**은 재귀로 선택을 하나씩 쌓아 가다가, 답이 될 수 없는 분기를 만나면 더 들어가지 않고 되돌아오는(**가지치기**) 방법입니다.`,
  questions: [
    {
      id: 'algo-brute-force-q01',
      categoryId: 'brute-force',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `from itertools import combinations

picks = list(combinations(range(5), 3))
print(len(picks))`,
      },
      choices: [
        '`10`',
        '`60`',
        '`125`',
        '`243`',
      ],
      answer: 0,
      explanation: `\`combinations\`는 **순서를 구분하지 않고** 뽑으므로 5C3 = 5! / (3! × 2!) = **10**입니다.

- \`60\`은 순서를 구분하는 순열 5P3 = 5 × 4 × 3입니다. (\`permutations(range(5), 3)\`)
- \`125\`는 같은 원소를 다시 뽑을 수 있는 중복 순열 5^3입니다. (\`product(range(5), repeat=3)\`)
- \`243\`은 3^5로, 이 코드와 관계없는 값입니다.`,
      tags: [
        '조합',
        'itertools',
      ],
    },
    {
      id: 'algo-brute-force-q02',
      categoryId: 'brute-force',
      type: 'mcq',
      difficulty: 1,
      prompt: 'N = 20일 때, 일반적인 시간 제한(1~2초) 안에 완전 탐색할 수 있는 것은?',
      choices: [
        'N개 원소를 나열하는 모든 순열 확인하기',
        'N개 원소의 모든 부분집합 확인하기',
        'N개 원소로 만들 수 있는 길이 N의 모든 중복 순열 확인하기',
        '모든 부분집합마다 그 원소들을 모든 순서로 나열해 확인하기',
      ],
      answer: 1,
      explanation: `부분집합은 2^20 = 1,048,576개(약 100만)라 충분히 확인할 수 있습니다.

- 모든 순열은 20! ≈ 2.4 × 10^18개로 불가능합니다.
- 길이 20의 중복 순열은 20^20개로 순열보다도 많습니다.
- 부분집합마다 모든 순서를 나열하면 전체 순열 수보다도 많아집니다.

> 순열은 N ≤ 10, 부분집합은 N ≤ 20 정도가 완전 탐색의 한계라고 기억해 두세요.`,
      tags: [
        '경우의 수',
        '입력 크기',
      ],
    },
  ],
};

export default content;
