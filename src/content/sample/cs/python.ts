// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-python-q01',
      categoryId: 'python',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `def add_item(item, bucket=[]):
    bucket.append(item)
    return bucket

a = add_item(1)
b = add_item(2)
print(a, b)`,
      },
      correct: '`[1, 2] [1, 2]`',
      distractors: [
        {
          text: '`[1] [2]`',
          why: '기본값은 호출할 때마다 새로 만들어지지 않고, `def`가 실행될 때 한 번 만든 리스트를 모든 호출이 공유합니다.',
        },
        {
          text: '`[1] [1, 2]`',
          why: '`a = add_item(1)`은 리스트를 복사하지 않고 같은 리스트에 이름을 붙입니다. 두 번째 호출이 그 리스트에 2를 추가하므로 `a`로 봐도 `[1, 2]`입니다.',
        },
        {
          text: '`[2] [2]`',
          why: '기본값은 호출할 때마다 다시 대입되거나 비워지지 않습니다. `append`가 공유 리스트에 덧붙이므로 첫 호출의 1도 남아 있습니다.',
        },
        {
          text: '`TypeError` 발생',
          why: '리스트도 기본값으로 쓸 수 있는 평범한 객체라 에러가 나지 않습니다. 문제는 그 리스트가 호출 사이에 공유된다는 점입니다.',
        },
        {
          text: '함수를 정의하는 시점에 `ValueError` 발생',
          why: '가변 기본값을 정의 시점에 `ValueError`로 거부하는 것은 `@dataclass`의 필드뿐이고, 일반 함수의 기본 인자는 막지 않습니다.',
        },
      ],
      explanation: `기본 인자 값은 함수를 **정의할 때 한 번만** 평가됩니다. 그래서 \`bucket=[]\`로 만든 리스트 하나를 모든 호출이 공유합니다.

\`a\`와 \`b\`는 같은 리스트 객체를 가리키므로(\`a is b\`가 \`True\`) 출력 시점에는 둘 다 \`[1, 2]\`입니다.

가변 객체를 기본값으로 쓰지 말고 \`None\`을 기본값으로 둡니다.

\`\`\`python
def add_item(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
\`\`\``,
      tags: [
        'mutable default',
        '가변 객체',
      ],
    },
    {
      id: 'cs-python-q02',
      categoryId: 'python',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과는?',
      code: {
        language: 'python',
        source: `a = [1, 2, 3]
b = [1, 2, 3]
c = a
print(a == b, a is b, a is c)`,
      },
      correct: '`True False True`',
      distractors: [
        {
          text: '`True True True`',
          why: '내용이 같아도 리스트 리터럴을 따로 쓰면 서로 다른 객체가 만들어져 `a is b`는 `False`입니다. 리스트 같은 가변 객체는 캐싱되지 않습니다.',
        },
        {
          text: '`False False True`',
          why: '`==`는 같은 객체인지가 아니라 **값**이 같은지를 비교하므로, 내용이 같은 `a == b`는 `True`입니다.',
        },
        {
          text: '`True False False`',
          why: '`c = a`는 복사가 아니라 같은 리스트에 이름을 하나 더 붙이는 것이라 `a is c`는 `True`입니다.',
        },
        {
          text: '`False True True`',
          why: '`==`와 `is`의 역할을 반대로 본 답입니다. `==`가 값 비교, `is`가 같은 객체인지 비교입니다.',
        },
        {
          text: '`True True False`',
          why: '따로 만든 두 리스트는 다른 객체라 `a is b`가 `False`이고, 대입으로 이름만 붙인 `c`는 `a`와 같은 객체라 `a is c`가 `True`입니다.',
        },
      ],
      explanation: `\`==\`는 **값이 같은지**(\`__eq__\`), \`is\`는 **같은 객체인지**(\`id\`가 같은지)를 비교합니다.

- \`a\`와 \`b\`는 내용만 같은 서로 다른 리스트입니다. \`a == b\`는 \`True\`, \`a is b\`는 \`False\`입니다.
- \`c = a\`는 복사가 아니라 같은 객체에 이름을 하나 더 붙인 것입니다. 그래서 \`a is c\`는 \`True\`입니다.

\`is\`는 \`x is None\`처럼 싱글턴을 비교할 때만 씁니다. 작은 정수나 짧은 문자열이 \`is\`로 같게 나오는 것은 CPython의 캐싱(구현 세부 사항) 때문이라 믿으면 안 됩니다. Python 3.8부터는 리터럴과 \`is\`로 비교하면 \`SyntaxWarning\`이 발생합니다.`,
      tags: [
        'is',
        '동등성',
        '동일성',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-python-c01',
      categoryId: 'python',
      difficulty: 1,
      question: '리스트(list)와 튜플(tuple)의 차이를 설명해주세요.',
      answer: `리스트는 **가변(mutable)**, 튜플은 **불변(immutable)** 시퀀스입니다.

- 튜플은 만든 뒤 요소를 추가·삭제·교체할 수 없습니다. 그래서 요소가 모두 해시 가능하면 튜플도 해시 가능(hashable)해져 dict의 키나 set의 원소로 쓸 수 있습니다.
- 바뀌지 않는다는 보장이 있어 여러 곳에서 공유해도 안전하고, "고정된 레코드"라는 의도가 드러납니다. 크기가 고정이라 같은 요소의 리스트보다 메모리도 조금 적게 씁니다.
- 단, 불변은 "담고 있는 참조가 바뀌지 않는다"는 뜻입니다. 튜플 안의 리스트는 수정할 수 있고, 그런 튜플은 해시할 수 없습니다.

실무에서는 함수의 다중 반환값, 좌표 같은 고정 레코드, dict의 복합 키에 튜플을 쓰고, 데이터를 계속 추가하거나 정렬할 때는 리스트를 씁니다.`,
      keywords: [
        '가변(mutable)',
        '불변(immutable)',
        '해시 가능(hashable)',
        'dict 키',
        '참조의 불변',
      ],
      followUps: [
        '튜플 안에 리스트가 들어 있으면 그 튜플을 dict 키로 쓸 수 있나요?',
        '파이썬의 불변 타입과 가변 타입을 예로 들어주세요.',
        '함수에 리스트를 넘겨 내부에서 수정하면 호출한 쪽의 리스트도 바뀌는 이유는?',
      ],
    },
  ],
};

export default content;
