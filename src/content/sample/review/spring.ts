// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { ReviewFrameworkContent } from '@/content/types';

const content: ReviewFrameworkContent = {
  patterns: [
    {
      id: 'spring-p-n-plus-one',
      framework: 'spring',
      subFramework: 'Spring Data JPA',
      category: 'performance',
      difficulty: 2,
      title: 'JPA N+1 문제',
      summary: '목록을 순회하며 연관 엔티티를 지연 로딩하면 쿼리가 N번 더 실행됩니다.',
      problem: `주문 목록 API에서 주문마다 **회원 이름**과 **주문 상품명**을 함께 내려줍니다.

- \`Order\`는 \`member\`(\`@ManyToOne\`, LAZY)와 \`orderItems\`(\`@OneToMany\`) 연관관계를 가집니다.
- 로컬에서는 데이터가 적어 문제가 보이지 않았습니다.
- 운영에서 주문 100건을 조회하자 SQL이 최대 201개까지 실행되며 응답이 수 초로 느려졌습니다.

목록 조회 쿼리 1번 뒤에 연관 데이터 조회가 주문 수(N)만큼 따라붙는 전형적인 **N+1 문제**입니다.`,
      before: {
        language: 'java',
        filename: 'OrderQueryService.java',
        source: `@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderQueryService {

    private final OrderRepository orderRepository;

    public List<OrderSummary> findOrders(LocalDateTime from) {
        // 1번: 주문 목록 조회
        List<Order> orders = orderRepository.findByOrderedAtAfter(from);

        return orders.stream()
                .map(order -> new OrderSummary(
                        order.getId(),
                        // 주문마다 회원 조회 (최대 N번)
                        order.getMember().getName(),
                        // 주문마다 주문상품 조회 (N번)
                        order.getOrderItems().stream()
                                .map(OrderItem::getProductName)
                                .toList()))
                .toList();
    }
}

// OrderRepository.java
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByOrderedAtAfter(LocalDateTime from);
}`,
      },
      after: {
        language: 'java',
        filename: 'OrderQueryService.java',
        source: `@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderQueryService {

    private final OrderRepository orderRepository;

    public List<OrderSummary> findOrders(LocalDateTime from) {
        // 1번: 주문 + 회원을 fetch join으로 함께 조회
        List<Order> orders =
                orderRepository.findWithMemberByOrderedAtAfter(from);

        // orderItems는 default_batch_fetch_size 설정으로
        // IN 절에 묶여 한 번에 조회됩니다 (1번)
        return orders.stream()
                .map(OrderSummary::from)
                .toList();
    }
}

// OrderRepository.java
public interface OrderRepository extends JpaRepository<Order, Long> {

    // ToOne 관계는 fetch join으로 한 번에 가져옵니다
    @Query("""
            select o from Order o
            join fetch o.member
            where o.orderedAt > :from
            """)
    List<Order> findWithMemberByOrderedAtAfter(
            @Param("from") LocalDateTime from);
}`,
      },
      explanation: `### 왜 빨라졌나

- **ToOne 관계(member)**: fetch join으로 주문과 회원을 조인 쿼리 1번에 가져옵니다. \`@EntityGraph(attributePaths = "member")\`로도 같은 효과를 낼 수 있습니다.
- **컬렉션(orderItems)**: \`default_batch_fetch_size\`를 설정하면 지연 로딩 시점에 여러 주문의 상품을 \`IN (...)\` 쿼리로 묶어 가져옵니다.
- 결과적으로 주문 100건 기준 쿼리가 최대 201개에서 **2개**로 줄어듭니다.

\`\`\`yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 100
\`\`\`

### 컬렉션까지 fetch join 하지 않은 이유

- 컬렉션 fetch join에 페이징을 함께 쓰면 Hibernate가 **전체 결과를 메모리에 올린 뒤** 페이징합니다(경고 로그 HHH90003004).
- \`List\` 타입 컬렉션 둘 이상을 fetch join 하면 \`MultipleBagFetchException\`이 발생합니다.
- 참고로 Hibernate 6부터는 컬렉션 fetch join 시 중복 엔티티를 자동으로 걸러주므로 \`distinct\`를 붙이지 않아도 됩니다.

> \`FetchType.EAGER\`로 바꾸는 것은 해결책이 아닙니다. JPQL로 조회한 뒤 연관 엔티티를 즉시 추가 조회하므로 N+1이 그대로 발생하고, 연관 데이터가 필요 없는 곳에서도 항상 조회하게 됩니다.

화면 전용 조회라면 필요한 컬럼만 DTO로 바로 조회(프로젝션)하는 방법도 좋은 대안입니다.`,
      checklist: [
        '반복문·stream 안에서 연관 엔티티의 getter를 호출하는가',
        'ToOne 연관은 fetch join이나 `@EntityGraph`로 함께 조회하는가',
        '컬렉션 fetch join과 페이징을 함께 쓰지 않았는가',
        '`default_batch_fetch_size`가 설정되어 있는가',
        'SQL 로그로 실제 실행되는 쿼리 수를 확인했는가',
      ],
    },
    {
      id: 'spring-p-self-invocation',
      framework: 'spring',
      subFramework: 'Spring Framework',
      category: 'transaction',
      difficulty: 2,
      title: '@Transactional 내부 호출(self-invocation)',
      summary: '같은 클래스 안에서 this로 호출한 @Transactional 메서드에는 트랜잭션이 적용되지 않습니다.',
      problem: `엑셀로 상품을 일괄 등록하는 기능입니다. 요구사항은 다음과 같습니다.

- 행 하나가 실패해도 나머지 행은 등록되어야 합니다.
- 한 행 안에서 상품과 옵션은 **함께 저장되거나 함께 실패**해야 합니다.

그래서 행 단위 메서드 \`register()\`에 \`@Transactional\`을 붙였습니다. 그런데 운영에서 **옵션 없는 상품**이 쌓이고, 실패한 행을 다시 업로드하면 상품이 중복 등록되는 문제가 생겼습니다.`,
      before: {
        language: 'java',
        filename: 'ProductBulkService.java',
        source: `@Service
@RequiredArgsConstructor
public class ProductBulkService {

    private final ProductRepository productRepository;
    private final ProductOptionRepository optionRepository;

    public BulkResult registerAll(List<ProductRow> rows) {
        BulkResult result = new BulkResult();
        for (ProductRow row : rows) {
            try {
                register(row);  // this.register() 내부 호출
                result.success(row.rowNumber());
            } catch (RuntimeException e) {
                result.fail(row.rowNumber(), e.getMessage());
            }
        }
        return result;
    }

    @Transactional
    public void register(ProductRow row) {
        Product product = productRepository.save(row.toProduct());
        // 옵션 저장이 실패하면 상품도 롤백되기를 기대
        optionRepository.saveAll(row.toOptions(product));
    }
}`,
      },
      after: {
        language: 'java',
        filename: 'ProductBulkService.java',
        source: `@Service
@RequiredArgsConstructor
public class ProductBulkService {

    // 트랜잭션 경계가 필요한 로직을 별도 빈으로 분리
    private final ProductRegisterService registerService;

    public BulkResult registerAll(List<ProductRow> rows) {
        BulkResult result = new BulkResult();
        for (ProductRow row : rows) {
            try {
                registerService.register(row);  // 프록시를 거침
                result.success(row.rowNumber());
            } catch (RuntimeException e) {
                result.fail(row.rowNumber(), e.getMessage());
            }
        }
        return result;
    }
}

// ProductRegisterService.java
@Service
@RequiredArgsConstructor
public class ProductRegisterService {

    private final ProductRepository productRepository;
    private final ProductOptionRepository optionRepository;

    @Transactional
    public void register(ProductRow row) {
        Product product = productRepository.save(row.toProduct());
        optionRepository.saveAll(row.toOptions(product));
    }
}`,
      },
      explanation: `### 왜 트랜잭션이 적용되지 않았나

스프링의 \`@Transactional\`은 **프록시**가 메서드 호출을 가로채 트랜잭션을 시작하는 방식입니다.

- 외부에서 \`registerAll()\`을 호출하면 프록시를 거치지만, \`registerAll()\`에는 트랜잭션 설정이 없습니다.
- 그 안에서 부르는 \`register()\`는 \`this.register()\`, 즉 프록시가 아닌 **실제 객체의 메서드를 직접 호출**하므로 \`@Transactional\`이 무시됩니다.
- 결국 \`save()\`와 \`saveAll()\`이 각자 리포지토리의 트랜잭션으로 따로 커밋되어, 옵션 저장이 실패해도 상품은 이미 저장된 상태로 남습니다.

### 개선 방법

- 트랜잭션 경계가 필요한 메서드를 **별도 빈으로 분리**하는 것이 가장 명확합니다.
- 클래스 분리가 과하다면 \`TransactionTemplate\`으로 경계를 코드에 직접 표현할 수 있습니다.

\`\`\`java
transactionTemplate.executeWithoutResult(status -> {
    Product product = productRepository.save(row.toProduct());
    optionRepository.saveAll(row.toOptions(product));
});
\`\`\`

- 자기 자신을 주입(self-injection)하거나 \`AopContext.currentProxy()\`를 쓰는 방법도 있지만, 의도가 잘 드러나지 않아 권장하지 않습니다.

> \`private\` 메서드에 붙인 \`@Transactional\`도 프록시가 가로챌 수 없어 같은 이유로 동작하지 않습니다. 트랜잭션 적용 여부는 \`TransactionSynchronizationManager.isActualTransactionActive()\`로 확인할 수 있습니다.`,
      checklist: [
        '`@Transactional` 메서드를 같은 클래스 안에서 호출하고 있지 않은가',
        '`private` 메서드에 `@Transactional`을 붙이지 않았는가',
        '함께 커밋·롤백되어야 할 작업이 하나의 트랜잭션 경계 안에 있는가',
        '테스트로 실패 시 실제 롤백되는지 확인했는가',
      ],
    },
  ],
  challenges: [
    {
      id: 'spring-c01',
      framework: 'spring',
      subFramework: 'Spring Data JPA',
      difficulty: 1,
      title: '회원가입 API 리뷰',
      context: `신규 서비스의 회원가입 API입니다.

- 이메일, 비밀번호, 닉네임을 받아 회원을 생성합니다.
- 이미 가입된 이메일이면 가입을 거절해야 합니다.
- 현재 회원은 약 50만 명이고 꾸준히 늘고 있습니다.
- 가입이 끝나면 생성된 회원 정보를 응답으로 돌려줍니다.

\`SignUpRequest\`(record)에는 Bean Validation이 적용되어 있고, DB의 \`users.email\` 컬럼에는 유니크 제약이 있습니다.`,
      code: {
        language: 'java',
        filename: 'UserService.java',
        source: `@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @PostMapping
    public User signUp(@Valid @RequestBody SignUpRequest request) {
        return userService.signUp(request);
    }
}

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User signUp(SignUpRequest request) {
        boolean duplicated = userRepository.findAll().stream()
                .anyMatch(u -> u.getEmail().equals(request.email()));
        if (duplicated) {
            throw new DuplicateEmailException(request.email());
        }

        User user = new User(
                request.email(),
                request.password(),
                request.nickname());
        return userRepository.save(user);
    }
}

@Entity
@Getter
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String nickname;

    public User(String email, String password, String nickname) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
    }
}`,
      },
      issues: [
        {
          lines: [
            30,
          ],
          category: 'security',
          severity: 'critical',
          title: '비밀번호를 평문으로 저장',
          description: `요청으로 받은 비밀번호를 그대로 \`User\`에 넣어 DB에 저장합니다.

- DB 백업 파일 유출이나 SQL Injection 등으로 데이터가 새어 나가면 모든 회원의 비밀번호가 그대로 드러납니다.
- 여러 서비스에서 같은 비밀번호를 쓰는 사용자가 많아, 다른 서비스 계정까지 위험해집니다.
- 국내 개인정보 안전성 확보조치 기준에서도 비밀번호는 일방향 암호화(해시)해 저장하도록 요구합니다.`,
          suggestion: `Spring Security의 \`PasswordEncoder\`로 해시한 값을 저장합니다.

\`\`\`java
User user = new User(
        request.email(),
        passwordEncoder.encode(request.password()),
        request.nickname());
\`\`\`

\`PasswordEncoderFactories.createDelegatingPasswordEncoder()\`나 \`BCryptPasswordEncoder\`를 빈으로 등록해 사용합니다. 솔트가 자동으로 적용되어 같은 비밀번호도 매번 다른 해시가 만들어집니다.`,
        },
        {
          lines: [
            9,
            21,
          ],
          category: 'api-design',
          severity: 'major',
          title: '엔티티를 그대로 응답으로 반환',
          description: `컨트롤러와 서비스가 \`User\` 엔티티를 그대로 반환해 JSON으로 직렬화됩니다.

- \`password\` 필드까지 응답에 포함되어, 지금 코드에서는 **평문 비밀번호가 응답으로 노출**됩니다.
- 엔티티에 필드를 추가하거나 이름을 바꾸면 의도치 않게 API 응답 형식도 바뀝니다.
- 나중에 지연 로딩 연관관계가 추가되면 직렬화 중 예외나 추가 쿼리가 발생할 수 있습니다.`,
          suggestion: `응답 전용 DTO를 만들어 공개할 필드만 담습니다.

\`\`\`java
public record UserResponse(Long id, String email, String nickname) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getEmail(), user.getNickname());
    }
}
\`\`\`

생성 API라면 \`201 Created\`와 \`Location\` 헤더를 함께 응답하면 더 좋습니다.`,
        },
        {
          lines: [
            22,
            23,
          ],
          category: 'performance',
          severity: 'major',
          title: '중복 확인을 위해 전체 회원 조회',
          description: `\`findAll()\`로 회원 50만 명을 모두 엔티티로 불러온 뒤 메모리에서 이메일을 비교합니다.

- 가입 요청마다 수십만 건을 조회하므로 DB와 네트워크 부하가 크고 응답이 느립니다.
- 조회한 엔티티가 모두 영속성 컨텍스트에 올라가 힙 사용량이 급증하고, 가입이 몰리면 OOM 위험이 있습니다.
- 회원 수에 비례해 계속 느려지는 구조입니다.`,
          suggestion: `DB에서 존재 여부만 확인하는 쿼리를 사용합니다. \`email\` 유니크 인덱스를 타므로 가벼운 조회 한 번으로 끝납니다.

\`\`\`java
// UserRepository
boolean existsByEmail(String email);

// UserService
if (userRepository.existsByEmail(request.email())) {
    throw new DuplicateEmailException(request.email());
}
\`\`\``,
        },
      ],
      question: {
        prompt: '이 코드에서 개선이 필요한 점을 모두 고르세요.',
        options: [
          {
            text: '비밀번호를 해시하지 않고 평문으로 저장한다',
            correct: true,
          },
          {
            text: '필드 주입(`@Autowired`)을 사용해 테스트하기 어렵다',
            correct: false,
          },
          {
            text: '엔티티를 그대로 응답해 비밀번호까지 노출된다',
            correct: true,
          },
          {
            text: '사용자 입력을 SQL 문자열에 이어 붙여 SQL Injection에 취약하다',
            correct: false,
          },
          {
            text: '이메일 중복 확인을 위해 전체 회원을 조회한다',
            correct: true,
          },
          {
            text: '트랜잭션 안에서 외부 메일 API를 호출한다',
            correct: false,
          },
        ],
      },
      improved: {
        language: 'java',
        filename: 'UserService.java',
        source: `@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> signUp(
            @Valid @RequestBody SignUpRequest request) {
        UserResponse response = userService.signUp(request);
        return ResponseEntity
                .created(URI.create("/api/users/" + response.id()))
                .body(response);
    }
}

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse signUp(SignUpRequest request) {
        // email 유니크 인덱스를 타는 존재 여부 쿼리 1번
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nickname());
        return UserResponse.from(userRepository.save(user));
    }
}

// 응답에는 공개해도 되는 값만 담습니다
public record UserResponse(Long id, String email, String nickname) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getEmail(), user.getNickname());
    }
}

// UserRepository.java
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
}`,
      },
      summary: `### 총평

기능은 동작하지만 **보안**과 **확장성** 측면에서 그대로 배포하기 어려운 코드입니다. 특히 평문 저장과 엔티티 응답이 겹쳐, 가입 직후 응답으로 비밀번호가 그대로 돌아간다는 점이 가장 치명적입니다.

### 한 걸음 더

동시에 같은 이메일로 가입하면 두 요청 모두 중복 확인을 통과할 수 있습니다. 이 코드는 DB 유니크 제약이 최종 방어선이라 중복 데이터는 생기지 않지만, 늦게 들어온 요청은 \`DataIntegrityViolationException\`으로 500 에러를 받습니다. 이 예외를 409 응답으로 변환해 주면 더 친절합니다.

### 리뷰 코멘트 작성 팁

- 여러 문제가 있을 때는 **심각도 순**(보안 → 데이터 정합성 → 성능)으로 정리합니다.
- "해시가 필요합니다"에서 끝내지 말고 \`PasswordEncoder\` 사용 예시처럼 **구체적인 대안**을 함께 제시합니다.`,
    },
  ],
};

export default content;
