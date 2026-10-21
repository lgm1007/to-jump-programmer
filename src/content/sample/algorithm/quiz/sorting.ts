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
      correct: '`[1, 10, 100, 25, 5]`',
      distractors: [
        {
          text: '`[1, 5, 10, 25, 100]`',
          why: '숫자 크기순으로 정렬하려면 `arr.sort((a, b) => a - b)`처럼 비교 함수를 넘겨야 합니다. 비교 함수가 없으면 문자열로 비교합니다.',
        },
        {
          text: '`[100, 25, 10, 5, 1]`',
          why: '`sort()`의 기본 방향은 오름차순이고, 숫자 크기가 아니라 문자열 사전순으로 비교합니다.',
        },
        {
          text: '`[10, 1, 5, 25, 100]`',
          why: '`sort()`는 새 배열을 만들지 않고 원본 배열 자체를 정렬하므로 `arr`의 순서가 바뀝니다.',
        },
        {
          text: '`[5, 25, 100, 10, 1]`',
          why: '문자열 사전순 **내림차순**의 결과입니다. 기본 정렬은 오름차순이라 `\'1\'`로 시작하는 값이 앞에 옵니다.',
        },
        {
          text: '`[\'1\', \'10\', \'100\', \'25\', \'5\']`',
          why: '순서를 정할 때만 문자열로 바꿔 비교할 뿐, 배열의 원소는 숫자 그대로 남습니다.',
        },
      ],
      explanation: `비교 함수 없이 \`sort()\`를 호출하면 원소를 **문자열로 바꿔 사전순**으로 비교합니다. \`'1' < '10' < '100' < '25' < '5'\` 순서가 되므로 \`[1, 10, 100, 25, 5]\`가 출력됩니다.

\`\`\`javascript
arr.sort((a, b) => a - b); // 오름차순
arr.sort((a, b) => b - a); // 내림차순
\`\`\``,
    },
    {
      id: 'algo-sorting-q02',
      categoryId: 'sorting',
      type: 'mcq',
      difficulty: 1,
      prompt: '`students`의 원소는 `(이름, 점수)` 튜플입니다. **점수 내림차순**, 점수가 같으면 **이름 오름차순**으로 정렬하려면 `students.sort(...)`에 무엇을 넘겨야 할까요?',
      correct: '`key=lambda s: (-s[1], s[0])`',
      distractors: [
        {
          text: '`key=lambda s: (s[1], s[0])`',
          why: '점수가 **오름차순**이 되어 낮은 점수가 먼저 옵니다.',
        },
        {
          text: '`key=lambda s: (s[1], s[0])`, `reverse=True`',
          why: '`reverse=True`는 튜플 비교 결과 전체를 뒤집어서, 점수뿐 아니라 이름까지 **내림차순**이 됩니다. 같은 점수면 `park`가 `kim`보다 앞에 옵니다.',
        },
        {
          text: '`key=lambda s: (-s[1], -s[0])`',
          why: '문자열에는 `-`를 붙일 수 없어 `TypeError`가 발생합니다.',
        },
        {
          text: '`key=lambda s: (s[0], -s[1])`',
          why: '튜플은 앞 원소부터 비교하므로 이름순 정렬이 되고, 점수는 이름이 같을 때만 비교합니다.',
        },
        {
          text: '`key=lambda s: -s[1]`',
          why: '점수 내림차순은 맞지만 이름을 기준에 넣지 않아, 점수가 같으면 이름순이 아니라 입력된 순서 그대로 남습니다.',
        },
        {
          text: '`key=lambda s: (-s[1], s[0])`, `reverse=True`',
          why: '올바른 기준을 다시 통째로 뒤집어서 점수 **오름차순**, 이름 **내림차순**이 됩니다.',
        },
      ],
      explanation: `튜플은 앞 원소부터 차례로 비교합니다. 점수에 \`-\`를 붙이면 큰 점수가 먼저 오고, 이름은 그대로 두면 오름차순이 됩니다.

> 문자열 같은 기준을 내림차순으로 정렬해야 한다면, 안정 정렬을 이용해 **덜 중요한 기준부터** 여러 번 정렬하거나 \`cmp_to_key\`를 사용합니다.`,
    },
  ],
};

export default content;
