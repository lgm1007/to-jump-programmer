// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { ReviewFrameworkContent } from '@/content/types';

const content: ReviewFrameworkContent = {
  patterns: [
    {
      id: 'django-p-n-plus-one',
      framework: 'django',
      subFramework: 'Django',
      category: 'performance',
      difficulty: 2,
      title: 'ORM N+1 쿼리: select_related와 prefetch_related',
      summary: '반복문에서 연관 객체에 접근할 때 생기는 N+1 쿼리를 JOIN과 IN 쿼리로 줄입니다.',
      problem: `Django ORM은 연관 객체를 **지연 로딩(lazy loading)** 합니다. \`order.customer\`처럼 연관 필드에 처음 접근하는 순간 쿼리가 실행됩니다.

아래 뷰는 주문 50건을 조회한 뒤 반복문에서 연관 데이터에 접근합니다.

- 주문 목록 조회 1번
- 주문마다 고객 조회 50번
- 주문마다 주문상품 조회 50번
- 주문상품마다 상품 조회 (주문상품 수만큼)

주문상품이 평균 3개라면 쿼리가 **250번 이상** 실행됩니다. 개발 DB에서는 금방 끝나 티가 나지 않다가 운영 환경에서 응답 지연의 주범이 되는 대표적인 패턴입니다.`,
      before: {
        language: 'python',
        filename: 'views.py',
        source: `# Order.customer    → ForeignKey(Customer)
# OrderItem.order   → ForeignKey(Order, related_name="items")
# OrderItem.product → ForeignKey(Product)
from django.http import JsonResponse

from .models import Order


def recent_orders(request):
    orders = Order.objects.filter(status="PAID").order_by("-created_at")[:50]

    data = []
    for order in orders:
        data.append({
            "id": order.id,
            # 주문마다 SELECT ... FROM customer
            "customer": order.customer.name,
            "items": [
                {
                    # 주문상품마다 SELECT ... FROM product
                    "product": item.product.name,
                    "quantity": item.quantity,
                }
                # 주문마다 SELECT ... FROM order_item
                for item in order.items.all()
            ],
        })
    return JsonResponse({"orders": data})`,
      },
      after: {
        language: 'python',
        filename: 'views.py',
        source: `from django.db.models import Prefetch
from django.http import JsonResponse

from .models import Order, OrderItem


def recent_orders(request):
    # 쿼리 2번으로 고정
    # 1) 주문 JOIN 고객  2) 주문상품 JOIN 상품 WHERE order_id IN (...)
    orders = (
        Order.objects.filter(status="PAID")
        .select_related("customer")  # 정방향 FK → JOIN
        .prefetch_related(
            Prefetch(  # 역참조 → IN 쿼리 + 파이썬에서 연결
                "items",
                queryset=OrderItem.objects.select_related("product"),
            )
        )
        .order_by("-created_at")[:50]
    )

    data = [
        {
            "id": order.id,
            "customer": order.customer.name,
            "items": [
                {"product": item.product.name, "quantity": item.quantity}
                for item in order.items.all()  # 프리패치 캐시 사용
            ],
        }
        for order in orders
    ]
    return JsonResponse({"orders": data})`,
      },
      explanation: `### 무엇이 달라졌나
- \`select_related\`: 정방향 FK·OneToOne을 **SQL JOIN**으로 함께 가져옵니다.
- \`prefetch_related\`: 역참조 FK·M2M을 **별도 쿼리 한 번**(\`WHERE order_id IN (...)\`)으로 가져와 파이썬에서 연결합니다.
- \`Prefetch\` 객체로 프리패치에 쓸 쿼리셋을 직접 지정해, 주문상품의 상품까지 JOIN으로 가져옵니다.

데이터 양과 관계없이 쿼리 수가 **2번**으로 고정됩니다.

### 주의할 점
- 프리패치 결과는 \`.all()\`로 접근할 때만 쓰입니다. \`order.items.filter(...)\`처럼 조건을 새로 붙이면 다시 쿼리가 실행됩니다. 조건이 필요하면 \`Prefetch("items", queryset=..., to_attr="paid_items")\`로 미리 걸러 둡니다.
- \`select_related\`는 역참조 FK·M2M에는 쓸 수 없습니다. 1:N 컬렉션은 \`prefetch_related\`가 담당합니다.
- 쓰지 않는 관계까지 미리 불러오면 오히려 낭비입니다. 응답에서 실제로 사용하는 관계만 지정합니다.

> 개발 중에는 django-debug-toolbar로 쿼리 수를 확인하고, 테스트에서는 \`assertNumQueries\`로 쿼리 수를 고정해 회귀를 막습니다.`,
      checklist: [
        '반복문 안에서 FK 필드나 역참조 관계(`order.items.all()`)에 접근하는지 확인합니다',
        '정방향 FK·OneToOne은 `select_related`, 역참조·M2M은 `prefetch_related`를 사용합니다',
        '프리패치한 관계에 `.filter()`를 다시 걸어 캐시를 무시하지 않는지 봅니다',
        '목록 API는 `assertNumQueries`로 쿼리 수를 테스트에 고정합니다',
      ],
    },
    {
      id: 'django-p-count-exists',
      framework: 'django',
      subFramework: 'Django',
      category: 'performance',
      difficulty: 1,
      title: 'QuerySet 평가 비용: count()와 exists() 활용',
      summary: '개수나 존재 여부만 필요할 때 모든 행을 가져오지 않도록 계산을 DB에 맡깁니다.',
      problem: `QuerySet은 **평가(evaluation)** 되는 순간 쿼리를 실행합니다. \`len(qs)\`, \`bool(qs)\`, \`if qs:\`, \`list(qs)\`는 모두 조건에 맞는 **모든 행**을 가져와 모델 객체로 만듭니다.

아래 뷰에 실제로 필요한 값은 숫자 하나, 참/거짓 하나, ID 하나입니다. 그런데도 알림·쿠폰·주문 테이블에서 해당 회원의 행을 전부 읽습니다.

알림이 수천 건 쌓인 회원이 마이페이지를 열 때마다 DB 전송량, 파이썬 메모리, 객체 생성 비용이 함께 늘어납니다.`,
      before: {
        language: 'python',
        filename: 'views.py',
        source: `from django.http import JsonResponse

from .models import Coupon, Notification


def my_page_summary(request):
    user = request.user

    # 알림 행을 전부 가져와 파이썬에서 센다
    unread = Notification.objects.filter(user=user, is_read=False)
    unread_count = len(unread)

    # 쿠폰 행을 전부 가져와 참/거짓만 판단한다
    coupons = Coupon.objects.filter(user=user, used_at__isnull=True)
    has_coupon = True if coupons else False

    # 주문 전체를 리스트로 만든 뒤 첫 번째 ID만 쓴다
    orders = list(user.orders.order_by("-created_at"))
    last_order_id = orders[0].id if orders else None

    return JsonResponse({
        "unread_count": unread_count,
        "has_coupon": has_coupon,
        "last_order_id": last_order_id,
    })`,
      },
      after: {
        language: 'python',
        filename: 'views.py',
        source: `from django.http import JsonResponse

from .models import Coupon, Notification


def my_page_summary(request):
    user = request.user

    # SELECT COUNT(*) ... → 숫자 하나만 전송
    unread_count = Notification.objects.filter(
        user=user, is_read=False
    ).count()

    # SELECT 1 ... LIMIT 1 → 한 행을 찾으면 바로 종료
    has_coupon = Coupon.objects.filter(
        user=user, used_at__isnull=True
    ).exists()

    # SELECT id ... ORDER BY created_at DESC LIMIT 1
    last_order_id = (
        user.orders.order_by("-created_at")
        .values_list("id", flat=True)
        .first()
    )

    return JsonResponse({
        "unread_count": unread_count,
        "has_coupon": has_coupon,
        "last_order_id": last_order_id,
    })`,
      },
      explanation: `- \`count()\`는 \`SELECT COUNT(*)\`로 숫자 하나만 받아옵니다.
- \`exists()\`는 \`LIMIT 1\` 쿼리라 한 행만 찾으면 끝납니다.
- \`values_list("id", flat=True).first()\`는 필요한 컬럼 하나를 \`LIMIT 1\`로 가져오고, 결과가 없으면 \`None\`을 돌려줍니다.

### 반대로 하면 손해인 경우
데이터를 **어차피 사용할** 거라면 한 번만 평가하고 결과를 재사용하는 편이 낫습니다.

\`\`\`python
coupons = list(Coupon.objects.filter(user=user))  # 쿼리 1번
if coupons:  # 추가 쿼리 없음
    names = [c.name for c in coupons]
\`\`\`

\`if qs.exists():\` 다음에 \`for c in qs:\`를 쓰면 쿼리가 2번 나갑니다. "개수·존재 여부만 필요한가, 데이터도 필요한가"를 기준으로 고르세요.

> 이미 평가되어 캐시된 QuerySet에 \`count()\`나 \`exists()\`를 호출하면 Django가 캐시를 사용하므로 추가 쿼리가 나가지 않습니다.`,
      checklist: [
        '`len(qs)`나 `if qs:`가 개수·존재 확인만을 위해 쓰였는지 확인합니다',
        '첫 번째 값만 필요하면 `first()`나 슬라이싱으로 `LIMIT`이 붙는지 봅니다',
        '데이터를 이후에 사용한다면 `exists()` 후 재조회하지 말고 한 번만 평가합니다',
        '일부 컬럼만 쓴다면 `values_list()`나 `only()`로 조회 컬럼을 줄입니다',
      ],
    },
  ],
  challenges: [
    {
      id: 'django-c01',
      framework: 'django',
      subFramework: 'DRF',
      difficulty: 1,
      title: '게시글 목록 API 리뷰',
      context: `커뮤니티 앱 메인 화면에서 호출하는 **게시글 목록 API**입니다. 설명을 위해 모델·시리얼라이저·뷰를 한 파일에 모았습니다(\`Tag\` 모델은 생략).

- 게시글마다 작성자 닉네임, 댓글 수, 태그 목록을 함께 보여 줍니다. 목록 화면에는 본문이 필요 없습니다.
- 게시글은 약 50만 건이며 하루 수천 건씩 늘어납니다.
- 앱을 열 때마다 호출되는, 트래픽이 가장 많은 API입니다.
- 프로젝트 기본 설정에는 \`PageNumberPagination\`(페이지당 20건)이 지정되어 있습니다.`,
      code: {
        language: 'python',
        filename: 'posts.py',
        source: `from django.db import models
from rest_framework import generics, serializers


class Post(models.Model):
    author = models.ForeignKey("users.User", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    tags = models.ManyToManyField("Tag", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="comments"
    )
    body = models.TextField()


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.nickname")
    comment_count = serializers.SerializerMethodField()
    tags = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="name"
    )

    class Meta:
        model = Post
        fields = [
            "id", "title", "author_name",
            "comment_count", "tags", "created_at",
        ]

    def get_comment_count(self, obj):
        return obj.comments.count()


class PostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    pagination_class = None  # 앱에서 한 번에 받아 쓰기 편하도록

    def get_queryset(self):
        return Post.objects.order_by("-created_at")`,
      },
      issues: [
        {
          lines: [
            21,
            23,
            35,
            43,
          ],
          category: 'performance',
          severity: 'major',
          title: '직렬화 과정에서 게시글마다 추가 쿼리 발생 (N+1)',
          description: `DRF는 게시글을 하나씩 직렬화하면서 연관 데이터에 접근합니다. 쿼리셋(43행)에 연관 데이터를 미리 불러오는 설정이 없어 게시글마다 쿼리가 추가됩니다.

- \`author.nickname\`(21행): 작성자 조회 1번
- \`tags\`(23행): 태그 조회 1번
- \`obj.comments.count()\`(35행): COUNT 쿼리 1번

게시글이 N개면 쿼리가 \`1 + 3N\`번 실행됩니다.`,
          suggestion: `작성자는 \`select_related\`, 태그는 \`prefetch_related\`, 댓글 수는 \`annotate\`로 목록 쿼리에 포함합니다.

\`\`\`python
def get_queryset(self):
    return (
        Post.objects.select_related("author")
        .prefetch_related("tags")
        .annotate(comment_count=Count("comments"))
    )
\`\`\`

\`comment_count\`는 \`SerializerMethodField\` 대신 \`IntegerField(read_only=True)\`로 바꿔 어노테이션 값을 그대로 읽습니다.`,
        },
        {
          lines: [
            40,
          ],
          category: 'api-design',
          severity: 'critical',
          title: '페이지네이션을 꺼서 전체 게시글을 한 번에 응답',
          description: `\`pagination_class = None\`이 프로젝트 기본 페이지네이션까지 꺼 버려, 요청마다 **50만 건 전체**를 조회하고 직렬화합니다.

- DB 부하, 애플리케이션 메모리, 응답 크기가 데이터 양에 비례해 커지다가 결국 타임아웃이 납니다.
- 가장 많이 호출되는 API라 장애가 서비스 전체로 번지기 쉽습니다.
- 클라이언트가 전체 목록을 받는 형태로 만들어지므로, 나중에 페이지네이션을 넣으면 응답 형식이 바뀌어 API 계약이 깨집니다.`,
          suggestion: `목록 API에는 항상 페이지네이션을 적용합니다. 무한 스크롤 화면에 데이터가 많다면 \`COUNT(*)\`와 큰 OFFSET이 필요 없는 \`CursorPagination\`이 적합합니다.

\`\`\`python
class PostCursorPagination(CursorPagination):
    page_size = 20
    ordering = "-created_at"
\`\`\`

커서의 기준이 되는 \`created_at\` 컬럼에는 인덱스를 추가합니다.`,
        },
      ],
      question: {
        prompt: '이 코드에서 개선이 필요한 점을 모두 고르세요.',
        options: [
          {
            text: '`get_queryset()`의 결과가 클래스 수준에 캐시되어 새 게시글이 목록에 보이지 않습니다',
            correct: false,
          },
          {
            text: '게시글마다 작성자·태그·댓글 수를 가져오는 쿼리가 추가로 실행됩니다',
            correct: true,
          },
          {
            text: '`SlugRelatedField`에 `read_only=True`를 지정해 응답에서 태그가 빠집니다',
            correct: false,
          },
          {
            text: '페이지네이션이 꺼져 있어 전체 게시글을 한 번에 조회·응답합니다',
            correct: true,
          },
          {
            text: '`ListAPIView`가 POST도 허용해 누구나 게시글을 생성할 수 있습니다',
            correct: false,
          },
          {
            text: '`Comment`에 `related_name`이 없어 `obj.comments`에서 `AttributeError`가 납니다',
            correct: false,
          },
        ],
      },
      improved: {
        language: 'python',
        filename: 'posts.py',
        source: `from django.db import models
from django.db.models import Count
from rest_framework import generics, serializers
from rest_framework.pagination import CursorPagination


class Post(models.Model):
    author = models.ForeignKey("users.User", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    tags = models.ManyToManyField("Tag", blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class Comment(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="comments"
    )
    body = models.TextField()


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.nickname")
    # annotate()로 계산한 값을 그대로 읽는다
    comment_count = serializers.IntegerField(read_only=True)
    tags = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="name"
    )

    class Meta:
        model = Post
        fields = [
            "id", "title", "author_name",
            "comment_count", "tags", "created_at",
        ]


class PostCursorPagination(CursorPagination):
    page_size = 20
    ordering = "-created_at"  # COUNT(*)·OFFSET 없이 다음 페이지 조회


class PostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    pagination_class = PostCursorPagination

    def get_queryset(self):
        # 페이지당 쿼리 2번: (게시글+작성자+댓글 수), (태그)
        return (
            Post.objects.select_related("author")
            .prefetch_related("tags")
            .annotate(comment_count=Count("comments"))
        )`,
      },
      summary: `### 총평
목록 API에서 가장 흔한 문제 두 가지가 함께 들어 있습니다. 데이터가 적은 개발 환경에서는 둘 다 드러나지 않지만, 게시글 50만 건 환경에서는 곧바로 응답 지연과 타임아웃으로 이어집니다.

- 직렬화에서 쓰는 연관 데이터는 \`select_related\`·\`prefetch_related\`·\`annotate\`로 미리 불러와 쿼리 수를 고정합니다.
- 목록 API에는 항상 페이지네이션을 적용합니다.

개선안은 페이지당 쿼리가 2번으로 고정됩니다. \`CursorPagination\`은 전체 개수를 세지 않으므로 \`COUNT(*)\` 쿼리도 없습니다. \`db_index=True\` 추가에는 마이그레이션이 필요합니다.

> 한 걸음 더: \`annotate(Count(...))\`는 GROUP BY 집계가 LIMIT보다 먼저 수행되므로, 게시글이 아주 많으면 이 집계 자체가 무거워질 수 있습니다. 실행 계획(\`EXPLAIN\`)을 확인하고, 필요하면 댓글 수를 \`Post\`의 카운터 컬럼으로 관리(비정규화)하거나 서브쿼리로 계산하는 방법을 검토합니다.

### 리뷰 코멘트 작성 팁
- 쿼리 수를 근거로 들면 설득력이 높아집니다. 예: "게시글 20건 기준 쿼리 61번 → 2번"
- \`assertNumQueries\` 테스트를 함께 제안하면 같은 문제가 다시 생기는 것을 막을 수 있습니다.
- 페이지네이션 방식(커서/오프셋)은 응답 형식이 바뀌는 API 계약이므로 앱 개발자와 함께 정하자고 제안합니다.`,
    },
  ],
};

export default content;
