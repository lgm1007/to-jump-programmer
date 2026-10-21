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
      correct: '`[1, 2, 4]`',
      distractors: [
        {
          text: '`[1, 2, 5]`',
          why: '`pop()`은 가장 나중에 넣은 원소를 꺼냅니다. 4와 5 중 나중에 넣은 5가 제거됩니다.',
        },
        {
          text: '`[3, 4, 5]`',
          why: '앞에서 꺼내는 큐(FIFO)로 착각한 결과입니다. `list.pop()`은 인자가 없으면 맨 뒤에서 꺼냅니다.',
        },
        {
          text: '`[1, 2, 4, 5]`',
          why: '두 번째 `pop()`을 빠뜨린 결과입니다. 5를 넣은 뒤에도 `pop()`이 한 번 더 실행됩니다.',
        },
        {
          text: '`[1, 2, 3, 4, 5]`',
          why: '`pop()`은 값을 읽기만 하는 것이 아니라 꺼내서 지웁니다. 반환값을 쓰지 않아도 원소는 사라집니다.',
        },
        {
          text: '`[4, 2, 1]`',
          why: '`print`는 리스트를 앞(바닥)에서 뒤(꼭대기) 순서로 출력합니다. 스택의 꼭대기부터 거꾸로 보여 주지 않습니다.',
        },
      ],
      explanation: `\`list\`의 \`append\`와 \`pop()\`은 모두 **맨 뒤**에서 동작하므로 스택(LIFO)처럼 쓸 수 있습니다.

1. \`[1, 2, 3]\`에서 \`pop()\` → 3 제거 → \`[1, 2]\`
2. 4, 5 추가 → \`[1, 2, 4, 5]\`
3. \`pop()\` → 가장 나중에 넣은 5 제거 → \`[1, 2, 4]\``,
    },
    {
      id: 'algo-stack-queue-q02',
      categoryId: 'stack-queue',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 중 **큐**(FIFO)를 사용하기에 가장 알맞은 상황은?',
      correct: '요청이 들어온 순서대로 처리하는 프린터 대기열',
      distractors: [
        {
          text: '괄호 문자열의 짝이 맞는지 검사하기',
          why: '가장 최근에 연 괄호부터 닫혀야 하므로 스택(LIFO)을 씁니다.',
        },
        {
          text: '웹 브라우저의 뒤로 가기 기능',
          why: '가장 최근에 방문한 페이지로 돌아가므로 스택(LIFO)을 씁니다.',
        },
        {
          text: '재귀 함수를 반복문으로 바꾸기',
          why: '함수 호출 스택을 직접 만든 스택으로 흉내 내므로 스택(LIFO)을 씁니다.',
        },
        {
          text: '문서 편집기의 실행 취소(Undo)',
          why: '가장 최근에 한 작업부터 되돌리므로 스택(LIFO)을 씁니다.',
        },
        {
          text: '후위 표기식(`3 4 + 2 *`) 계산하기',
          why: '연산자를 만나면 가장 최근에 넣은 피연산자 두 개를 꺼내 계산하므로 스택(LIFO)을 씁니다.',
        },
        {
          text: '각 원소의 오른쪽에서 처음 나오는 더 큰 수 구하기',
          why: '아직 답을 못 찾은 원소를 쌓아 두고 가장 최근 것부터 비교하는 모노토닉 스택을 씁니다.',
        },
      ],
      explanation: `먼저 들어온 요청을 먼저 처리하는 것은 **선입선출**(FIFO)인 큐의 전형적인 쓰임입니다. BFS도 가까운 정점부터 차례로 방문하기 위해 큐를 사용합니다.

반대로 **가장 최근 것**을 먼저 처리해야 하는 상황에는 스택(LIFO)을 씁니다.`,
    },
  ],
};

export default content;
