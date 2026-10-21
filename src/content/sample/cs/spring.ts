// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-spring-q01',
      categoryId: 'spring',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 서비스 코드의 문제점으로 가장 적절한 것은?',
      code: {
        language: 'java',
        filename: 'DiscountService.java',
        source: `@Service
public class DiscountService {
    private int discountAmount;

    public int apply(int price, int rate) {
        discountAmount = price * rate / 100;
        return price - discountAmount;
    }
}`,
      },
      correct: '싱글톤 빈의 필드를 여러 요청 스레드가 공유해, 동시 요청 시 다른 요청의 값이 섞일 수 있다',
      distractors: [
        {
          text: '요청마다 `DiscountService`가 새로 생성되어 메모리가 낭비된다',
          why: '빈의 기본 스코프는 싱글톤이라 컨테이너에 인스턴스가 하나만 만들어지고, 모든 요청이 그 하나를 함께 씁니다.',
        },
        {
          text: '`int` 필드를 초기화하지 않아 `NullPointerException`이 발생할 수 있다',
          why: '`int` 같은 기본형 필드는 자동으로 0으로 초기화되며 `null`이 될 수 없습니다.',
        },
        {
          text: '`@Service` 빈의 기본 스코프는 `prototype`이라 상태를 가져도 안전하다',
          why: '`@Service`를 포함한 빈의 기본 스코프는 `prototype`이 아니라 `singleton`입니다. 그래서 필드에 요청별 상태를 두면 위험합니다.',
        },
        {
          text: '`discountAmount`가 `final`이 아니라서 빈을 생성할 때 예외가 발생한다',
          why: '빈의 필드가 `final`일 필요는 없으므로 빈은 문제없이 만들어집니다. 문제는 실행 중에 여러 스레드가 이 필드를 함께 고친다는 점입니다.',
        },
        {
          text: '메서드가 끝나도 `discountAmount`에 값이 남아 메모리 누수가 생긴다',
          why: '`int` 필드 하나는 값이 바뀔 때마다 덮어써질 뿐 메모리가 쌓이지 않습니다. 남은 값이 문제가 되는 것은 다른 요청이 그 값을 읽거나 덮어쓸 때입니다.',
        },
        {
          text: '스프링이 싱글톤 빈의 메서드 호출을 한 줄로 세워 처리하므로, 동시 요청의 응답이 느려진다',
          why: '스프링은 싱글톤 빈의 메서드 호출을 줄 세우지 않습니다. 여러 요청 스레드가 같은 객체의 메서드를 동시에 실행하기 때문에 필드 값이 섞입니다.',
        },
      ],
      explanation: `스프링 빈의 기본 스코프는 **싱글톤(singleton)**이라 컨테이너에 인스턴스가 하나만 있고, 모든 요청 스레드가 이를 공유합니다. 요청 A가 \`discountAmount\`에 값을 쓴 직후 요청 B가 덮어쓰면, A는 B의 값으로 계산하게 됩니다(경쟁 상태, race condition).

상태는 필드 대신 **지역 변수**로 다루면 됩니다. 지역 변수는 스레드마다 별도의 스택에 생기기 때문입니다.

\`\`\`java
public int apply(int price, int rate) {
    int discount = price * rate / 100;
    return price - discount;
}
\`\`\`

> 싱글톤 빈은 무상태(stateless)로 설계하는 것이 원칙입니다. 생성 후 바뀌지 않는 \`final\` 의존성 필드는 괜찮습니다.`,
      tags: [
        'bean-scope',
        'singleton',
        'thread-safety',
      ],
    },
    {
      id: 'cs-spring-q02',
      categoryId: 'spring',
      type: 'mcq',
      difficulty: 1,
      prompt: 'Spring MVC에서 `@RestController`로 들어온 요청이 처리되는 순서로 옳은 것은?',
      correct: '`Filter` → `DispatcherServlet` → `HandlerMapping` → `Interceptor.preHandle()` → 컨트롤러',
      distractors: [
        {
          text: '`DispatcherServlet` → `Filter` → `HandlerMapping` → 컨트롤러 → `Interceptor.preHandle()`',
          why: '필터는 서블릿 컨테이너 영역이라 `DispatcherServlet`보다 먼저 실행됩니다. 또 `preHandle()`은 컨트롤러 **전**에 호출되고, 컨트롤러 뒤에 호출되는 것은 `postHandle()`입니다.',
        },
        {
          text: '`Interceptor.preHandle()` → `Filter` → `DispatcherServlet` → 컨트롤러',
          why: '인터셉터는 `DispatcherServlet` 안(스프링 MVC 영역)에서 동작하므로, 그 앞에서 실행되는 필터보다 먼저 실행될 수 없습니다.',
        },
        {
          text: '`Filter` → `HandlerMapping` → `DispatcherServlet` → `Interceptor.preHandle()` → 컨트롤러',
          why: '`HandlerMapping`은 `DispatcherServlet`이 요청을 받은 뒤 핸들러를 찾으려고 호출하는 구성 요소라 `DispatcherServlet`보다 먼저 실행되지 않습니다.',
        },
        {
          text: '`Filter` → `DispatcherServlet` → `Interceptor.preHandle()` → `HandlerMapping` → 컨트롤러',
          why: '어떤 인터셉터를 적용할지는 `HandlerMapping`이 핸들러와 함께 찾아 줍니다. 그래서 `preHandle()`은 `HandlerMapping` 뒤에 호출됩니다.',
        },
        {
          text: '`DispatcherServlet` → `HandlerMapping` → `Filter` → `Interceptor.preHandle()` → 컨트롤러',
          why: '필터는 요청이 `DispatcherServlet`에 들어가기 전, 서블릿 컨테이너에서 먼저 실행됩니다. 스프링 MVC 내부 단계 사이에 끼어들 수 없습니다.',
        },
        {
          text: '`Filter` → `DispatcherServlet` → `HandlerMapping` → 컨트롤러 → `Interceptor.preHandle()`',
          why: '`preHandle()`은 이름처럼 핸들러(컨트롤러) 실행 **전**에 호출되며, `false`를 반환하면 컨트롤러를 실행하지 않습니다.',
        },
      ],
      explanation: `1. **Filter**: 서블릿 컨테이너(톰캣) 영역에서 \`DispatcherServlet\`보다 먼저 실행됩니다.
2. **DispatcherServlet**: 모든 요청을 받는 프론트 컨트롤러입니다.
3. **HandlerMapping**: URL에 맞는 핸들러(컨트롤러 메서드)와 적용할 인터셉터 목록을 찾습니다.
4. **Interceptor \`preHandle()\`**: 핸들러를 실행할 \`HandlerAdapter\`를 찾은 뒤 호출되며, \`false\`를 반환하면 처리를 중단합니다.
5. **HandlerAdapter → 컨트롤러**: \`ArgumentResolver\`가 파라미터를 만들고, 반환값은 \`HttpMessageConverter\`가 JSON으로 바꿔 응답 바디에 씁니다.
6. 이후 \`postHandle()\` → \`afterCompletion()\` 순으로 인터셉터가 마무리됩니다.

인터셉터는 \`DispatcherServlet\` 내부(스프링 MVC 영역)에서 동작하므로 항상 필터보다 나중에 실행됩니다.`,
      tags: [
        'dispatcher-servlet',
        'filter',
        'interceptor',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-spring-c01',
      categoryId: 'spring',
      difficulty: 1,
      question: 'IoC와 DI가 무엇인지, 그리고 생성자 주입을 권장하는 이유를 설명해주세요.',
      answer: `**IoC(제어의 역전)**는 객체의 생성과 의존 관계 연결을 개발자가 아닌 스프링 컨테이너가 맡는 것이고, **DI(의존성 주입)**는 필요한 객체를 외부에서 넣어 주는 IoC의 구현 방식입니다. 덕분에 클래스는 구체 구현이 아닌 인터페이스에 의존하고, 구현을 바꿔도 사용하는 코드를 고칠 필요가 없습니다.

주입 방식에는 생성자·setter·필드 주입이 있으며, **생성자 주입**을 권장하는 이유는 다음과 같습니다.
- 필드를 \`final\`로 선언해 **불변**을 보장하고, 의존성 누락을 객체 생성 시점에 바로 알 수 있습니다.
- 스프링 없이 \`new\`로 생성할 수 있어 **단위 테스트**가 쉽습니다.
- 생성자 주입끼리 **순환 참조**가 있으면 애플리케이션 시작 시점에 실패해 바로 발견할 수 있습니다. (Spring Boot 2.6부터는 순환 참조 자체가 기본 금지)
- 생성자 파라미터가 많아지면 클래스의 책임이 과하다는 신호가 됩니다.

생성자가 하나면 \`@Autowired\`를 생략할 수 있어, 실무에서는 Lombok의 \`@RequiredArgsConstructor\`와 함께 많이 씁니다.`,
      keywords: [
        '제어의 역전',
        '스프링 컨테이너',
        '의존성 주입',
        '생성자 주입',
        'final 불변',
        '순환 참조',
      ],
      followUps: [
        '같은 타입의 빈이 여러 개면 어떻게 주입하나요?',
        '빈 생명주기 콜백(@PostConstruct, @PreDestroy)은 언제 호출되나요?',
        '싱글톤 외에 어떤 빈 스코프가 있고, 언제 사용하나요?',
      ],
    },
  ],
};

export default content;
