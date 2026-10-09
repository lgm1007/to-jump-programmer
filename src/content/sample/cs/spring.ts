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
      choices: [
        '요청마다 `DiscountService`가 새로 생성되어 메모리가 낭비된다',
        '`int` 필드를 초기화하지 않아 `NullPointerException`이 발생할 수 있다',
        '싱글톤 빈의 필드를 여러 요청 스레드가 공유해, 동시 요청 시 다른 요청의 값이 섞일 수 있다',
        '`@Service` 빈의 기본 스코프는 `prototype`이라 상태를 가져도 안전하다',
      ],
      answer: 2,
      explanation: `스프링 빈의 기본 스코프는 **싱글톤(singleton)**이라 컨테이너에 인스턴스가 하나만 있고, 모든 요청 스레드가 이를 공유합니다. 요청 A가 \`discountAmount\`에 값을 쓴 직후 요청 B가 덮어쓰면, A는 B의 값으로 계산하게 됩니다(경쟁 상태, race condition).

상태는 필드 대신 **지역 변수**로 다루면 됩니다. 지역 변수는 스레드마다 별도의 스택에 생기기 때문입니다.

\`\`\`java
public int apply(int price, int rate) {
    int discount = price * rate / 100;
    return price - discount;
}
\`\`\`

- **A**, **D**: 기본 스코프는 \`prototype\`이 아니라 \`singleton\`이므로 객체는 하나만 생성됩니다.
- **B**: \`int\` 같은 기본형 필드는 0으로 초기화되며 null이 될 수 없습니다.

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
      choices: [
        '`Filter` → `DispatcherServlet` → `HandlerMapping` → `Interceptor.preHandle()` → 컨트롤러',
        '`DispatcherServlet` → `Filter` → `HandlerMapping` → 컨트롤러 → `Interceptor.preHandle()`',
        '`Interceptor.preHandle()` → `Filter` → `DispatcherServlet` → 컨트롤러',
        '`Filter` → `HandlerMapping` → `DispatcherServlet` → `Interceptor.preHandle()` → 컨트롤러',
      ],
      answer: 0,
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
