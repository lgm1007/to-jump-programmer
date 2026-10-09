// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { AlgoTopicContent } from '@/content/types';

const content: AlgoTopicContent = {
  primer: `### 핵심 개념
| 자료구조 | 규칙 | 주요 연산 |
|---|---|---|
| 스택 | 후입선출(LIFO) | push, pop, top: \`O(1)\` |
| 큐 | 선입선출(FIFO) | 뒤에 넣기, 앞에서 꺼내기: \`O(1)\` |
| 덱 | 양쪽 끝 모두 사용 | 앞뒤 삽입·삭제: \`O(1)\` |`,
  questions: [
    {
      id: 'algo-stack-queue-q01',
      categoryId: 'stack-queue',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `stack = []
for x in [1, 2, 3]:
    stack.append(x)
stack.pop()
stack.append(4)
stack.append(5)
stack.pop()
print(stack)`,
      },
      choices: [
        '`[1, 2, 5]`',
        '`[3, 4, 5]`',
        '`[1, 2, 4, 5]`',
        '`[1, 2, 4]`',
      ],
      answer: 3,
      explanation: `\`list\`의 \`append\`와 \`pop()\`은 모두 **맨 뒤**에서 동작하므로 스택(LIFO)처럼 쓸 수 있습니다.

1. \`[1, 2, 3]\`에서 \`pop()\` → 3 제거 → \`[1, 2]\`
2. 4, 5 추가 → \`[1, 2, 4, 5]\`
3. \`pop()\` → 가장 나중에 넣은 5 제거 → \`[1, 2, 4]\`

\`[3, 4, 5]\`는 앞에서 꺼내는 큐(FIFO)로 착각했을 때의 결과입니다.`,
    },
    {
      id: 'algo-stack-queue-q02',
      categoryId: 'stack-queue',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 중 **큐**(FIFO)를 사용하기에 가장 알맞은 상황은?',
      choices: [
        '괄호 문자열의 짝이 맞는지 검사하기',
        '웹 브라우저의 뒤로 가기 기능',
        '요청이 들어온 순서대로 처리하는 프린터 대기열',
        '재귀 함수를 반복문으로 바꾸기',
      ],
      answer: 2,
      explanation: `먼저 들어온 요청을 먼저 처리하는 것은 **선입선출**(FIFO)인 큐의 전형적인 쓰임입니다. BFS도 가까운 정점부터 차례로 방문하기 위해 큐를 사용합니다.

나머지는 모두 **가장 최근 것**을 먼저 처리하는 스택(LIFO) 상황입니다.

- 괄호 검사: 가장 최근에 연 괄호부터 닫혀야 합니다.
- 뒤로 가기: 가장 최근에 방문한 페이지로 돌아갑니다.
- 재귀 → 반복문: 함수 호출 스택을 직접 만든 스택으로 흉내 냅니다.`,
    },
  ],
};

export default content;
