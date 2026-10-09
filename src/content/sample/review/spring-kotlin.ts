// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { ReviewVariantContent } from '@/content/types';

const content: ReviewVariantContent = {
  language: 'kotlin',
  patterns: {
    'spring-p-n-plus-one': {
      before: {
        language: 'kotlin',
        filename: 'OrderQueryService.kt',
        source: `@Service
@Transactional(readOnly = true)
class OrderQueryService(
    private val orderRepository: OrderRepository,
) {

    fun findOrders(from: LocalDateTime): List<OrderSummary> {
        // 1번: 주문 목록 조회
        val orders = orderRepository.findByOrderedAtAfter(from)

        return orders.map { order ->
            OrderSummary(
                orderId = order.id,
                // 주문마다 회원 조회 (최대 N번)
                memberName = order.member.name,
                // 주문마다 주문상품 조회 (N번)
                productNames = order.orderItems.map { it.productName },
            )
        }
    }
}

// OrderRepository.kt
interface OrderRepository : JpaRepository<Order, Long> {

    fun findByOrderedAtAfter(from: LocalDateTime): List<Order>
}`,
      },
      after: {
        language: 'kotlin',
        filename: 'OrderQueryService.kt',
        source: `@Service
@Transactional(readOnly = true)
class OrderQueryService(
    private val orderRepository: OrderRepository,
) {

    fun findOrders(from: LocalDateTime): List<OrderSummary> {
        // 1번: 주문 + 회원을 fetch join으로 함께 조회
        val orders = orderRepository.findWithMemberByOrderedAtAfter(from)

        // orderItems는 default_batch_fetch_size 설정으로
        // IN 절에 묶여 한 번에 조회됩니다 (1번)
        return orders.map { OrderSummary.from(it) }
    }
}

// OrderRepository.kt
interface OrderRepository : JpaRepository<Order, Long> {

    // ToOne 관계는 fetch join으로 한 번에 가져옵니다
    @Query("""
        select o from Order o
        join fetch o.member
        where o.orderedAt > :from
    """)
    fun findWithMemberByOrderedAtAfter(
        @Param("from") from: LocalDateTime,
    ): List<Order>
}`,
      },
      explanation: `### 왜 빨라졌나

- **ToOne 관계(member)**: fetch join으로 주문과 회원을 조인 쿼리 1번에 가져옵니다. \`@EntityGraph(attributePaths = ["member"])\`로도 같은 효과를 낼 수 있습니다.
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

### Kotlin 엔티티에서 주의할 점

- Kotlin 클래스는 기본이 \`final\`이라, 엔티티가 열려 있지 않으면 Hibernate가 지연 로딩용 프록시(엔티티를 상속한 클래스)를 만들 수 없습니다. 이때 \`LAZY\`는 오류 없이 무시되고, 주문을 조회하자마자 회원을 한 건씩 추가 조회합니다.
- \`kotlin-jpa\`(no-arg) 플러그인은 기본 생성자만 만들어 줄 뿐 클래스를 열어 주지 않습니다. \`allOpen\` 설정에 \`jakarta.persistence.Entity\`, \`MappedSuperclass\`, \`Embeddable\`이 등록되어 있는지 확인합니다.
- 엔티티를 \`data class\`로 만들면 자동 생성된 \`toString()\`, \`hashCode()\`가 지연 로딩 연관까지 건드려, 로그 한 줄에 쿼리가 실행되거나 양방향 연관에서 무한 재귀가 생길 수 있습니다.

> \`FetchType.EAGER\`로 바꾸는 것은 해결책이 아닙니다. JPQL로 조회한 뒤 연관 엔티티를 즉시 추가 조회하므로 N+1이 그대로 발생하고, 연관 데이터가 필요 없는 곳에서도 항상 조회하게 됩니다.

화면 전용 조회라면 필요한 컬럼만 DTO로 바로 조회(프로젝션)하는 방법도 좋은 대안입니다.`,
      checklist: [
        '반복문이나 `map` 안에서 연관 엔티티의 프로퍼티에 접근하는가',
        'ToOne 연관은 fetch join이나 `@EntityGraph`로 함께 조회하는가',
        '컬렉션 fetch join과 페이징을 함께 쓰지 않았는가',
        '`default_batch_fetch_size`가 설정되어 있는가',
        '엔티티 클래스가 `allOpen`으로 열려 있어 지연 로딩 프록시가 만들어지는가',
        'SQL 로그로 실제 실행되는 쿼리 수를 확인했는가',
      ],
    },
    'spring-p-self-invocation': {
      before: {
        language: 'kotlin',
        filename: 'ProductBulkService.kt',
        source: `@Service
class ProductBulkService(
    private val productRepository: ProductRepository,
    private val optionRepository: ProductOptionRepository,
) {

    fun registerAll(rows: List<ProductRow>): BulkResult {
        val result = BulkResult()
        for (row in rows) {
            try {
                register(row)  // this.register() 내부 호출
                result.success(row.rowNumber)
            } catch (e: RuntimeException) {
                result.fail(row.rowNumber, e.message)
            }
        }
        return result
    }

    @Transactional
    fun register(row: ProductRow) {
        val product = productRepository.save(row.toProduct())
        // 옵션 저장이 실패하면 상품도 롤백되기를 기대
        optionRepository.saveAll(row.toOptions(product))
    }
}`,
      },
      after: {
        language: 'kotlin',
        filename: 'ProductBulkService.kt',
        source: `@Service
class ProductBulkService(
    // 트랜잭션 경계가 필요한 로직을 별도 빈으로 분리
    private val registerService: ProductRegisterService,
) {

    fun registerAll(rows: List<ProductRow>): BulkResult {
        val result = BulkResult()
        for (row in rows) {
            try {
                registerService.register(row)  // 프록시를 거침
                result.success(row.rowNumber)
            } catch (e: RuntimeException) {
                result.fail(row.rowNumber, e.message)
            }
        }
        return result
    }
}

// ProductRegisterService.kt
@Service
class ProductRegisterService(
    private val productRepository: ProductRepository,
    private val optionRepository: ProductOptionRepository,
) {

    @Transactional
    fun register(row: ProductRow) {
        val product = productRepository.save(row.toProduct())
        optionRepository.saveAll(row.toOptions(product))
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

\`\`\`kotlin
transactionTemplate.executeWithoutResult {
    val product = productRepository.save(row.toProduct())
    optionRepository.saveAll(row.toOptions(product))
}
\`\`\`

- 자기 자신을 주입(self-injection)하거나 \`AopContext.currentProxy()\`를 쓰는 방법도 있지만, 의도가 잘 드러나지 않아 권장하지 않습니다.

### Kotlin에서 함께 알아둘 점

- Kotlin 클래스와 함수는 기본이 \`final\`이라 CGLIB가 상속해서 프록시를 만들 수 없습니다. \`kotlin-spring\` 플러그인이 \`@Component\`(\`@Service\` 포함), \`@Transactional\` 등이 붙은 클래스와 그 멤버를 \`open\`으로 바꿔 주기 때문에 프록시가 동작합니다.
- 플러그인 없이 \`final\` 클래스에 \`@Transactional\`을 쓰면 애플리케이션 시작 시 \`Could not generate CGLIB subclass\` 오류로 빈 생성에 실패합니다.
- 플러그인으로 프록시가 만들어져도 **같은 클래스 안의 호출은 여전히 프록시를 거치지 않습니다**. 언어와 상관없는 프록시 방식의 한계입니다.

> \`private fun\`에 붙인 \`@Transactional\`도 프록시가 가로챌 수 없어 같은 이유로 동작하지 않습니다. 트랜잭션 적용 여부는 \`TransactionSynchronizationManager.isActualTransactionActive()\`로 확인할 수 있습니다.`,
      checklist: [
        '`@Transactional` 함수를 같은 클래스 안에서 호출하고 있지 않은가',
        '`private fun`에 `@Transactional`을 붙이지 않았는가',
        '`kotlin-spring` 플러그인으로 프록시 대상 클래스와 함수가 열려 있는가',
        '함께 커밋·롤백되어야 할 작업이 하나의 트랜잭션 경계 안에 있는가',
        '테스트로 실패 시 실제 롤백되는지 확인했는가',
      ],
    },
  },
  challenges: {
    'spring-c01': {
      context: `신규 서비스의 회원가입 API입니다.

- 이메일, 비밀번호, 닉네임을 받아 회원을 생성합니다.
- 이미 가입된 이메일이면 가입을 거절해야 합니다.
- 현재 회원은 약 50만 명이고 꾸준히 늘고 있습니다.
- 가입이 끝나면 생성된 회원 정보를 응답으로 돌려줍니다.

\`SignUpRequest\`(data class)에는 Bean Validation(\`@field:NotBlank\` 등)이 적용되어 있고, DB의 \`users.email\` 컬럼에는 유니크 제약이 있습니다.`,
      code: {
        language: 'kotlin',
        filename: 'UserService.kt',
        source: `@RestController
@RequestMapping("/api/users")
class UserController(private val userService: UserService) {

    @PostMapping
    fun signUp(@Valid @RequestBody request: SignUpRequest): User {
        return userService.signUp(request)
    }
}

@Service
class UserService(private val userRepository: UserRepository) {

    @Transactional
    fun signUp(request: SignUpRequest): User {
        val duplicated = userRepository.findAll()
            .any { it.email == request.email }
        if (duplicated) {
            throw DuplicateEmailException(request.email)
        }

        val user = User(
            email = request.email,
            password = request.password,
            nickname = request.nickname,
        )
        return userRepository.save(user)
    }
}

@Entity
@Table(name = "users")
class User(
    @Column(nullable = false, unique = true)
    var email: String,

    @Column(nullable = false)
    var password: String,

    var nickname: String,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
)`,
      },
      issues: [
        {
          lines: [
            24,
          ],
          suggestion: `Spring Security의 \`PasswordEncoder\`로 해시한 값을 저장합니다.

\`\`\`kotlin
val user = User(
    email = request.email,
    password = passwordEncoder.encode(request.password),
    nickname = request.nickname,
)
\`\`\`

\`PasswordEncoderFactories.createDelegatingPasswordEncoder()\`나 \`BCryptPasswordEncoder\`를 빈으로 등록해 사용합니다. 솔트가 자동으로 적용되어 같은 비밀번호도 매번 다른 해시가 만들어집니다.`,
        },
        {
          lines: [
            6,
            15,
          ],
          suggestion: `응답 전용 DTO를 만들어 공개할 필드만 담습니다.

\`\`\`kotlin
data class UserResponse(
    val id: Long,
    val email: String,
    val nickname: String,
) {
    companion object {
        fun from(user: User) = UserResponse(
            id = requireNotNull(user.id),
            email = user.email,
            nickname = user.nickname,
        )
    }
}
\`\`\`

엔티티의 \`id\`는 저장한 뒤에야 채워지는 \`Long?\`이므로 \`!!\` 대신 \`requireNotNull\`로 꺼냅니다. 생성 API라면 \`201 Created\`와 \`Location\` 헤더를 함께 응답하면 더 좋습니다.`,
        },
        {
          lines: [
            16,
            17,
          ],
          suggestion: `DB에서 존재 여부만 확인하는 쿼리를 사용합니다. \`email\` 유니크 인덱스를 타므로 가벼운 조회 한 번으로 끝납니다.

\`\`\`kotlin
// UserRepository
fun existsByEmail(email: String): Boolean

// UserService
if (userRepository.existsByEmail(request.email)) {
    throw DuplicateEmailException(request.email)
}
\`\`\``,
        },
      ],
      improved: {
        language: 'kotlin',
        filename: 'UserService.kt',
        source: `@RestController
@RequestMapping("/api/users")
class UserController(private val userService: UserService) {

    @PostMapping
    fun signUp(
        @Valid @RequestBody request: SignUpRequest,
    ): ResponseEntity<UserResponse> {
        val response = userService.signUp(request)
        return ResponseEntity
            .created(URI.create("/api/users/\${response.id}"))
            .body(response)
    }
}

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {

    @Transactional
    fun signUp(request: SignUpRequest): UserResponse {
        // email 유니크 인덱스를 타는 존재 여부 쿼리 1번
        if (userRepository.existsByEmail(request.email)) {
            throw DuplicateEmailException(request.email)
        }

        val user = User(
            email = request.email,
            password = passwordEncoder.encode(request.password),
            nickname = request.nickname,
        )
        return UserResponse.from(userRepository.save(user))
    }
}

// 응답에는 공개해도 되는 값만 담습니다
data class UserResponse(
    val id: Long,
    val email: String,
    val nickname: String,
) {
    companion object {
        fun from(user: User) = UserResponse(
            id = requireNotNull(user.id),
            email = user.email,
            nickname = user.nickname,
        )
    }
}

// UserRepository.kt
interface UserRepository : JpaRepository<User, Long> {

    fun existsByEmail(email: String): Boolean
}`,
      },
    },
  },
};

export default content;
