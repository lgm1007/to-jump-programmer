// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
코딩 테스트에서 정렬은 직접 구현하기보다 **내장 정렬 + 정렬 기준 설계**가 핵심입니다. 정렬 자체가 답이기보다 그리디, 투 포인터, 이분 탐색을 위한 **전처리**로 자주 쓰입니다.

- 내장 정렬은 \`O(N log N)\`이라 N이 100만 정도여도 부담이 적습니다.
- **안정 정렬**(stable sort): 정렬 기준이 같은 원소끼리 원래 순서를 유지합니다.`,
  questions: [
    {
      id: 'algo-sorting-q01',
      categoryId: 'sorting',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 JavaScript 코드의 출력 결과는?',
      code: {
        language: 'javascript',
        source: `const arr = [10, 1, 5, 25, 100];
arr.sort();
console.log(arr);`,
      },
      choices: [
        '`[1, 5, 10, 25, 100]`',
        '`[1, 10, 100, 25, 5]`',
        '`[100, 25, 10, 5, 1]`',
        '`[10, 1, 5, 25, 100]`',
      ],
      answer: 1,
      explanation: `비교 함수 없이 \`sort()\`를 호출하면 원소를 **문자열로 바꿔 사전순**으로 비교합니다. \`'1' < '10' < '100' < '25' < '5'\` 순서가 되므로 \`[1, 10, 100, 25, 5]\`가 출력됩니다.

\`\`\`javascript
arr.sort((a, b) => a - b); // 오름차순
arr.sort((a, b) => b - a); // 내림차순
\`\`\`

\`sort()\`는 원본 배열 자체를 정렬하므로 원래 순서가 그대로 출력되지도 않습니다.`,
    },
    {
      id: 'algo-sorting-q02',
      categoryId: 'sorting',
      type: 'mcq',
      difficulty: 1,
      prompt: '`students`의 원소는 `(이름, 점수)` 튜플입니다. **점수 내림차순**, 점수가 같으면 **이름 오름차순**으로 정렬하려면 `students.sort(...)`에 무엇을 넘겨야 할까요?',
      choices: [
        '`key=lambda s: (s[1], s[0])`',
        '`key=lambda s: (s[1], s[0])`, `reverse=True`',
        '`key=lambda s: (-s[1], s[0])`',
        '`key=lambda s: (-s[1], -s[0])`',
      ],
      answer: 2,
      explanation: `튜플은 앞 원소부터 차례로 비교합니다. 점수에 \`-\`를 붙이면 큰 점수가 먼저 오고, 이름은 그대로 두면 오름차순이 됩니다.

- \`(s[1], s[0])\`: 점수 **오름차순**입니다.
- \`reverse=True\`: 점수뿐 아니라 이름까지 **내림차순**이 되어 \`park\`가 \`kim\`보다 앞에 옵니다.
- \`-s[0]\`: 문자열에는 \`-\`를 붙일 수 없어 \`TypeError\`가 발생합니다.

> 문자열 같은 기준을 내림차순으로 정렬해야 한다면, 안정 정렬을 이용해 **덜 중요한 기준부터** 여러 번 정렬하거나 \`cmp_to_key\`를 사용합니다.`,
    },
  ],
};

export default content;
