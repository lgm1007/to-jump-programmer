// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-java-q01',
      categoryId: 'java',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드에서 `new Order(1000)`으로 생성한 객체와 지역 변수 `order`는 JVM 런타임 데이터 영역 중 각각 어디에 저장될까요?',
      code: {
        language: 'java',
        filename: 'OrderService.java',
        source: `public class OrderService {
    public int total() {
        Order order = new Order(1000);
        return order.price();
    }
}`,
      },
      correct: '객체는 **힙**, `order` 변수(참조값)는 **스택**',
      distractors: [
        {
          text: '객체는 **스택**, `order` 변수는 **힙**',
          why: '두 영역을 반대로 짝지었습니다. `new`로 만든 객체는 힙에 할당되고, 지역 변수는 메서드 호출마다 생기는 스택 프레임에 들어갑니다.',
        },
        {
          text: '객체와 `order` 변수 모두 **메서드 영역**',
          why: '메서드 영역에는 클래스 메타데이터, 런타임 상수 풀, 메서드 바이트코드처럼 클래스 단위 정보가 들어갑니다. 실행 중에 만든 객체나 지역 변수는 들어가지 않습니다.',
        },
        {
          text: '객체는 **힙**, `order` 변수는 **PC 레지스터**',
          why: 'PC 레지스터는 스레드가 지금 실행 중인 바이트코드 명령의 위치만 담습니다. 지역 변수는 스택 프레임에 저장됩니다.',
        },
        {
          text: '객체와 `order` 변수 모두 **힙**',
          why: '힙에 있는 것은 객체뿐입니다. 변수 `order`는 객체를 가리키는 참조값을 담는 지역 변수라, 메서드를 호출할 때 생기는 스택 프레임에 저장되고 메서드가 끝나면 프레임과 함께 사라집니다.',
        },
        {
          text: '객체는 **메서드 영역(Metaspace)**, `order` 변수는 **스택**',
          why: '메서드 영역(HotSpot은 Java 8부터 Metaspace)에는 `Order` 클래스의 정보가 올라갈 뿐, `new Order(1000)`으로 만든 인스턴스는 힙에 생깁니다.',
        },
        {
          text: '객체는 **힙**, `order` 변수는 **메서드 영역**',
          why: '메서드 영역은 클래스 단위 정보를 담는 곳입니다. 지역 변수는 호출할 때마다 새로 생기는 값이라 그 호출의 스택 프레임에 저장됩니다.',
        },
      ],
      explanation: `\`new\`로 만든 객체는 모든 스레드가 공유하는 **힙(Heap)**에 할당됩니다. 지역 변수 \`order\`에는 그 객체를 가리키는 참조값만 담기며, 메서드를 호출할 때마다 생기는 **JVM 스택의 프레임**에 저장됩니다.

스택·PC 레지스터는 스레드마다 따로 있고, 힙·메서드 영역은 모든 스레드가 공유합니다. 그래서 지역 변수는 다른 스레드와 공유되지 않지만, 힙의 객체는 여러 스레드가 함께 볼 수 있습니다.

> JIT 컴파일러의 탈출 분석(Escape Analysis)으로 메서드 밖으로 나가지 않는 객체는 힙 할당이 생략될 수도 있지만, 기본 답은 "객체는 힙, 지역 변수는 스택"입니다.`,
      tags: [
        'jvm',
        'runtime-data-area',
      ],
    },
    {
      id: 'cs-java-q02',
      categoryId: 'java',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드의 출력 결과로 옳은 것은? (위에서부터 순서대로)',
      code: {
        language: 'java',
        source: `String a = "java";
String b = "java";
String c = new String("java");

System.out.println(a == b);
System.out.println(a == c);
System.out.println(a.equals(c));
System.out.println(a == c.intern());`,
      },
      correct: '`true` / `false` / `true` / `true`',
      distractors: [
        {
          text: '`true` / `true` / `true` / `true`',
          why: '`new String("java")`는 String Pool과 별개로 힙에 새 객체를 만들므로 `a == c`는 `false`입니다.',
        },
        {
          text: '`true` / `false` / `true` / `false`',
          why: '`intern()`은 풀에 같은 내용의 문자열이 있으면 풀의 객체를 돌려줍니다. 그 객체가 바로 `a`가 가리키는 리터럴이라 `a == c.intern()`은 `true`입니다.',
        },
        {
          text: '`false` / `false` / `true` / `true`',
          why: '같은 문자열 리터럴은 String Pool의 한 객체를 공유하므로 `a`와 `b`는 같은 객체이고 `a == b`는 `true`입니다.',
        },
        {
          text: '`true` / `false` / `false` / `true`',
          why: '`equals()`는 참조가 아니라 문자열 내용을 비교하므로, 서로 다른 객체여도 내용이 같은 `a.equals(c)`는 `true`입니다.',
        },
        {
          text: '`false` / `false` / `true` / `false`',
          why: '문자열을 만들 때마다 새 객체가 생긴다고 본 결과입니다. 리터럴은 String Pool에서 공유되므로 `a == b`가 `true`이고, `intern()`도 풀의 같은 객체를 돌려줍니다.',
        },
      ],
      explanation: `- \`a == b\` → \`true\`: 문자열 리터럴은 **String Pool**에 한 번만 저장되므로 \`a\`와 \`b\`는 같은 객체를 가리킵니다.
- \`a == c\` → \`false\`: \`new String()\`은 풀과 별개로 힙에 **새 객체**를 만듭니다.
- \`a.equals(c)\` → \`true\`: \`equals()\`는 문자열 내용을 비교합니다.
- \`a == c.intern()\` → \`true\`: \`intern()\`은 풀에 같은 내용의 문자열이 있으면 풀의 참조를 반환합니다.

\`==\`는 참조(주소) 비교, \`equals()\`는 값 비교입니다. String Pool은 Java 7부터 힙 영역에 있으며, 문자열 비교에는 항상 \`equals()\`를 사용해야 합니다.`,
      tags: [
        'string',
        'string-pool',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-java-c01',
      categoryId: 'java',
      difficulty: 1,
      question: 'JVM의 구조와 Java 코드가 실행되는 과정을 설명해주세요.',
      answer: `Java 소스는 \`javac\`가 **바이트코드(.class)**로 컴파일하고, JVM이 이 바이트코드를 실행합니다. 그래서 OS와 상관없이 같은 바이트코드를 실행할 수 있습니다.

- **클래스 로더**: 필요한 클래스를 런타임에 동적으로 로딩·링크·초기화합니다.
- **런타임 데이터 영역**: 모든 스레드가 공유하는 힙·메서드 영역과, 스레드마다 생기는 JVM 스택·PC 레지스터·네이티브 메서드 스택으로 나뉩니다.
- **실행 엔진**: 인터프리터가 바이트코드를 해석해 실행하다가, 자주 실행되는(hot) 코드는 **JIT 컴파일러**가 네이티브 코드로 컴파일해 캐시합니다.
- **GC**: 힙에서 더 이상 참조되지 않는 객체를 회수합니다.

실무에서는 \`OutOfMemoryError\`가 힙 문제인지 Metaspace 문제인지 구분하거나, 배포 직후 JIT 워밍업 전에 응답이 느린 현상을 이해할 때 이 구조 지식이 쓰입니다.`,
      keywords: [
        '바이트코드',
        '클래스 로더',
        '런타임 데이터 영역',
        '실행 엔진',
        'JIT 컴파일러',
        'GC',
      ],
      followUps: [
        '클래스 로더의 부모 위임 모델(Parent Delegation)은 무엇인가요?',
        'static 변수와 String Pool은 어느 메모리 영역에 저장되나요?',
        'Java 8에서 PermGen이 Metaspace로 바뀐 이유는 무엇인가요?',
      ],
    },
  ],
};

export default content;
