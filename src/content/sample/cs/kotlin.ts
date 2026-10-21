// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-kotlin-q01',
      categoryId: 'kotlin',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과로 옳은 것은? (위에서부터 순서대로)',
      code: {
        language: 'kotlin',
        source: `val nick: String? = null
val len = nick?.length ?: -1
println(len)

val name: String? = "kotlin"
println(name?.uppercase() ?: "none")`,
      },
      correct: '`-1` / `KOTLIN`',
      distractors: [
        {
          text: '`null` / `KOTLIN`',
          why: '안전 호출의 결과(null)에서 끝난다고 본 결과입니다. 엘비스 연산자가 왼쪽의 null 을 오른쪽 값 `-1` 로 바꿉니다.',
        },
        {
          text: '`0` / `KOTLIN`',
          why: 'null 의 길이를 0으로 바꿔 주는 규칙은 없습니다. 왼쪽이 null 일 때 쓰이는 값은 `?:` 오른쪽에 쓴 `-1` 입니다.',
        },
        {
          text: '첫 번째 `println` 전에 `NullPointerException` 이 발생한다',
          why: '안전 호출 `?.` 은 수신 객체가 null 이면 호출하지 않고 null 을 돌려줄 뿐 NPE 를 던지지 않습니다. NPE 가 나는 것은 `nick!!.length` 처럼 `!!` 를 썼을 때입니다.',
        },
        {
          text: '`-1` / `none`',
          why: '`name` 은 null 이 아니므로 `uppercase()` 가 호출되어 `KOTLIN` 이 됩니다. 엘비스의 오른쪽 `"none"` 은 왼쪽이 null 일 때만 평가됩니다.',
        },
        {
          text: '컴파일 에러 — `String?` 타입에는 `length` 를 호출할 수 없다',
          why: 'nullable 타입에 검사 없이 `.` 으로 호출하면 컴파일 에러지만, 안전 호출 `?.` 은 허용됩니다. 결과 타입이 `Int?` 가 되고 엘비스가 이를 `Int` 로 바꿉니다.',
        },
      ],
      explanation: `\`nick?.length\` 는 \`nick\` 이 null 이라 \`length\` 를 호출하지 않고 **null** 을 돌려줍니다. 엘비스 연산자 \`?:\` 는 왼쪽이 null 일 때 오른쪽 값을 쓰므로 \`len\` 은 \`-1\` 입니다. \`name\` 은 null 이 아니어서 \`uppercase()\` 가 호출되어 \`KOTLIN\` 이 출력되고, 오른쪽의 \`"none"\` 은 평가되지 않습니다.

이처럼 \`?.\` 와 \`?:\` 를 함께 쓰면 null 일 때의 기본값을 한 줄로 지정할 수 있습니다.`,
      tags: [
        'null-safety',
        'elvis',
      ],
    },
    {
      id: 'cs-kotlin-q02',
      categoryId: 'kotlin',
      type: 'mcq',
      difficulty: 2,
      prompt: '다음 함수에서 **컴파일 에러**가 발생하는 줄은?',
      code: {
        language: 'kotlin',
        source: `class Profile(var nickname: String?)

fun printLength(p: Profile, s: String?) {
    if (s != null) println(s.length)                    // (1)
    val nick = p.nickname
    if (nick != null) println(nick.length)              // (2)
    if (p.nickname != null) println(p.nickname.length)  // (3)
    println(p.nickname?.length ?: 0)                    // (4)
}`,
      },
      correct: '`(3)`',
      distractors: [
        {
          text: '`(1)`',
          why: '매개변수 `s` 는 다시 대입할 수 없으므로, null 검사를 통과하면 그 범위 안에서 `String` 으로 스마트 캐스트됩니다.',
        },
        {
          text: '`(2)`',
          why: '프로퍼티 값을 지역 `val` 에 복사하면 그 값은 더 이상 바뀌지 않으므로 스마트 캐스트가 됩니다. (3)을 고치는 대표적인 방법입니다.',
        },
        {
          text: '`(4)`',
          why: '안전 호출 `?.` 과 엘비스 `?:` 로 null 을 처리했으므로 스마트 캐스트가 필요 없고 문제없이 컴파일됩니다.',
        },
        {
          text: '`(1)`과 `(3)`',
          why: '매개변수는 함수 안에서 다시 대입할 수 없어 검사 후 값이 바뀔 일이 없으므로, (1)은 스마트 캐스트가 됩니다.',
        },
        {
          text: '`(2)`와 `(3)`',
          why: '(2)는 프로퍼티를 지역 `val` 로 복사한 뒤 검사하므로 스마트 캐스트가 됩니다. 문제는 프로퍼티를 직접 검사하고 쓰는 (3)뿐입니다.',
        },
        {
          text: '없음 — `(3)`도 null 검사 뒤라 스마트 캐스트되어 모두 컴파일된다',
          why: '`p.nickname` 은 클래스의 `var` 프로퍼티라 검사 직후 다른 코드가 null 로 바꿀 수 있어, 컴파일러가 스마트 캐스트를 허용하지 않습니다.',
        },
      ],
      explanation: `스마트 캐스트는 **null 검사와 사용 사이에 값이 바뀔 수 없다고 컴파일러가 확신할 때만** 동작합니다. \`p.nickname\` 은 클래스의 \`var\` 프로퍼티라, 검사 직후 다른 코드(다른 스레드)가 null 로 바꿀 수 있습니다. 그래서 (3)의 \`p.nickname.length\` 는 여전히 \`String?\` 에 대한 호출로 보고 "smart cast to 'String' is impossible" 컴파일 에러를 냅니다.

고치려면 프로퍼티 값을 지역 \`val\` 에 복사한 뒤 검사하거나, \`p.nickname?.let { println(it.length) }\` 처럼 안전 호출을 씁니다.`,
      tags: [
        'smart-cast',
        'null-safety',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-kotlin-c01',
      categoryId: 'kotlin',
      difficulty: 1,
      question: 'Kotlin 의 널 안전성(null safety)은 어떻게 동작하나요? Java 와 비교해 설명해주세요.',
      answer: `Java 는 모든 참조 타입이 null 을 가질 수 있지만 타입만 보고는 알 수 없어서, NPE 가 실행 중에야 드러납니다. Kotlin 은 \`String\` 과 \`String?\` 처럼 **null 가능 여부를 타입에 포함**시켜, nullable 값을 검사 없이 사용하면 컴파일 에러를 냅니다.

- nullable 값은 \`?.\` 로 안전하게 호출하고, \`?:\` 로 기본값이나 예외를 지정합니다.
- \`if (x != null)\` 로 검사한 뒤에는 스마트 캐스트 덕분에 바로 non-null 처럼 씁니다.
- \`!!\` 는 null 이면 NPE 를 던지므로 거의 쓰지 않습니다.

다만 Java 코드에서 받은 값은 플랫폼 타입이라 컴파일러가 검사하지 않으므로, 경계에서 nullable 로 받아 처리합니다. 실무에서는 \`findByIdOrNull(id) ?: throw NotFoundException(id)\` 같은 패턴을 자주 씁니다.`,
      keywords: [
        'nullable 타입',
        '안전 호출 ?.',
        '엘비스 ?:',
        '스마트 캐스트',
        '!! 지양',
        '플랫폼 타입',
      ],
      followUps: [
        'Kotlin 코드에서도 NPE 가 발생할 수 있는 경우를 말해 보세요.',
        '스마트 캐스트가 동작하지 않는 경우는 언제인가요?',
      ],
    },
  ],
};

export default content;
