// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-oop-q01',
      categoryId: 'oop',
      type: 'mcq',
      difficulty: 1,
      prompt: '객체지향의 4대 특성에 대한 설명으로 **옳지 않은** 것은?',
      choices: [
        '캡슐화: 데이터와 그 데이터를 다루는 동작을 하나로 묶고, 내부 구현을 숨긴다',
        '추상화: 여러 대상의 공통적이고 핵심적인 특징만 뽑아 단순하게 표현한다',
        '다형성: 같은 메시지를 보내도 실제 객체의 타입에 따라 다르게 동작한다',
        '상속: 하위 클래스가 상위 클래스의 `private` 필드에도 직접 접근할 수 있게 한다',
      ],
      answer: 3,
      explanation: `하위 클래스도 상위 클래스의 **\`private\` 멤버에는 직접 접근할 수 없습니다.** 필드 자체는 하위 객체 안에 존재하지만, 접근은 상위 클래스가 공개한 \`public\`·\`protected\` 메서드를 통해서만 가능합니다. 상속 관계에서도 캡슐화가 유지되는 방식입니다.

나머지는 모두 올바른 설명입니다.
- 캡슐화의 핵심은 getter/setter를 만드는 것이 아니라, 객체가 스스로 자기 상태를 책임지게 하는 것입니다.
- 다형성은 오버라이딩(동적 바인딩)과 인터페이스로 구현되며, 조건문 없이 동작을 바꿀 수 있게 해 줍니다.`,
      tags: [
        'oop-principles',
        'encapsulation',
        'inheritance',
      ],
    },
    {
      id: 'cs-oop-q02',
      categoryId: 'oop',
      type: 'mcq',
      difficulty: 1,
      prompt: '새로운 회원 등급이 생길 때마다 아래 메서드를 수정해야 합니다. 가장 직접적으로 위반한 SOLID 원칙은?',
      code: {
        language: 'java',
        source: `public int discount(Member member, int price) {
    switch (member.getGrade()) {
        case "VIP":  return price * 20 / 100;
        case "GOLD": return price * 10 / 100;
        default:     return 0;
    }
}`,
      },
      choices: [
        'SRP (단일 책임 원칙)',
        'OCP (개방-폐쇄 원칙)',
        'LSP (리스코프 치환 원칙)',
        'ISP (인터페이스 분리 원칙)',
      ],
      answer: 1,
      explanation: `**OCP(Open-Closed Principle)**는 "확장에는 열려 있고, 변경에는 닫혀 있어야 한다"는 원칙입니다. 등급이 추가될 때마다 기존 \`switch\` 문을 고쳐야 하므로 변경에 닫혀 있지 않습니다.

다형성으로 조건문을 제거하면, 새 등급은 **구현 클래스를 추가하는 것만으로** 확장할 수 있습니다.

\`\`\`java
public interface DiscountPolicy {
    int discount(int price);
}

public class VipDiscount implements DiscountPolicy {
    @Override
    public int discount(int price) {
        return price * 20 / 100;
    }
}
\`\`\`

- 등급별 정책 객체를 \`Map\`이나 \`enum\`에 등록해 두고 꺼내 쓰면, 할인을 계산하는 쪽 코드는 바뀌지 않습니다.
- SRP, LSP, ISP 위반으로 볼 근거는 이 코드에 직접 드러나지 않습니다.`,
      tags: [
        'solid',
        'ocp',
        'polymorphism',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-oop-c01',
      categoryId: 'oop',
      difficulty: 1,
      question: '객체지향 프로그래밍의 특징(4대 특성)을 설명해주세요.',
      answer: `객체지향 프로그래밍은 프로그램을 **상태와 행동을 가진 객체들의 협력**으로 구성하는 방식입니다. 대표적인 특성은 네 가지입니다.

- **캡슐화**: 데이터와 이를 다루는 메서드를 묶고 내부 구현을 숨겨, 객체가 스스로 상태를 책임지게 합니다.
- **추상화**: 공통적이고 핵심적인 특징만 뽑아 인터페이스나 상위 타입으로 표현합니다.
- **상속**: 상위 타입의 특성을 물려받아 확장합니다. 코드 재사용보다 **타입 계층**을 만드는 데 의미가 있습니다.
- **다형성**: 같은 메시지에 객체마다 다르게 응답하는 성질로, 오버라이딩과 인터페이스로 구현합니다.

이 특성 덕분에 변경의 영향 범위를 객체 내부로 좁힐 수 있습니다. 예를 들어 \`PaymentGateway\` 인터페이스에 의존하면, 결제사가 바뀌어도 새 구현체만 추가하면 됩니다.`,
      keywords: [
        '캡슐화',
        '추상화',
        '상속',
        '다형성',
        '객체 간 협력',
      ],
      followUps: [
        '오버로딩과 오버라이딩의 차이는 무엇인가요?',
        '절차지향 프로그래밍과 비교했을 때 장단점은 무엇인가요?',
      ],
    },
  ],
};

export default content;
