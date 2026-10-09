// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-django-q01',
      categoryId: 'django',
      type: 'mcq',
      difficulty: 1,
      prompt: 'Django의 MTV 패턴에서 요청을 받아 모델로 필요한 데이터를 다루고, 어떤 응답을 돌려줄지 결정하는 계층은?',
      choices: [
        'Model',
        'Template',
        'View',
        'URLconf',
      ],
      answer: 2,
      explanation: `Django의 **View**는 요청을 받아 비즈니스 로직을 수행하고 \`HttpResponse\`를 반환합니다. MVC로 보면 Controller에 해당합니다.

| MTV | 역할 | MVC 대응 |
| --- | --- | --- |
| Model | 데이터 구조, ORM, 도메인 규칙 | Model |
| Template | 화면 표현(HTML 렌더링) | View |
| View | 요청 처리, 응답 결정 | Controller |

- Template은 View가 넘긴 데이터를 그리기만 합니다. 이름 때문에 MVC의 View와 헷갈리기 쉽습니다.
- URLconf는 URL을 알맞은 View에 연결(라우팅)할 뿐 응답 내용을 정하지 않습니다. Django 문서는 이런 라우팅을 포함한 프레임워크 자체를 Controller로 볼 수 있다고 설명합니다.`,
      tags: [
        'MTV',
        'MVC',
      ],
    },
    {
      id: 'cs-django-q02',
      categoryId: 'django',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 코드에서 DB 쿼리는 총 몇 번 실행되나요?',
      code: {
        language: 'python',
        source: `qs = Post.objects.filter(published=True)
qs = qs.exclude(title="")
qs = qs.order_by("-created_at")

for post in qs:
    print(post.title)

for post in qs:
    print(post.title)`,
      },
      choices: [
        '1번',
        '2번',
        '3번',
        '5번',
      ],
      answer: 0,
      explanation: `QuerySet은 **지연 평가(lazy evaluation)**됩니다. \`filter()\`, \`exclude()\`, \`order_by()\`는 조건만 쌓은 새 QuerySet을 반환할 뿐 DB에 접근하지 않습니다.

- 첫 번째 \`for\`문에서 처음 평가되며 쿼리가 1번 실행되고, 결과는 QuerySet 내부의 결과 캐시에 저장됩니다.
- 같은 \`qs\` 객체를 다시 순회하면 캐시를 재사용하므로 추가 쿼리가 없습니다.

반대로 \`qs.filter(...)\`처럼 새 QuerySet을 만들거나, 평가되지 않은 QuerySet에 \`qs[0]\`처럼 인덱싱하면 그때마다 새 쿼리가 실행됩니다. 결과를 여러 번 쓸 때는 같은 QuerySet 객체를 평가해서 재사용합니다.`,
      tags: [
        'QuerySet',
        '지연 평가',
        '캐싱',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-django-c01',
      categoryId: 'django',
      difficulty: 1,
      question: 'Django에서 HTTP 요청이 들어와 응답이 나가기까지의 흐름을 설명해주세요.',
      answer: `1. Nginx 같은 웹 서버를 거쳐 Gunicorn(WSGI)이나 Uvicorn(ASGI) 같은 애플리케이션 서버가 요청을 받고, Django 핸들러가 \`HttpRequest\` 객체를 만듭니다.
2. \`MIDDLEWARE\` 목록을 **위에서 아래로** 통과하며 보안 헤더, 세션, CSRF, 인증 처리가 적용됩니다.
3. URLconf가 경로에 맞는 뷰(View)를 찾습니다.
4. 뷰가 모델(ORM)로 데이터를 다루고, 템플릿을 렌더링하거나 JSON을 만들어 \`HttpResponse\`를 반환합니다.
5. 응답은 미들웨어를 **아래에서 위로** 거쳐 클라이언트로 나갑니다.

미들웨어는 양파 구조라 순서가 중요합니다. 예를 들어 \`AuthenticationMiddleware\`는 \`SessionMiddleware\` 뒤에 와야 하고, 중간 미들웨어가 응답을 바로 반환하면 안쪽 미들웨어와 뷰는 실행되지 않습니다. 실무에서는 요청 ID 부여나 응답 시간 로깅 같은 공통 처리를 커스텀 미들웨어로 구현합니다.`,
      keywords: [
        'WSGI/ASGI 핸들러',
        '미들웨어 순서',
        'URLconf',
        '뷰(View)',
        '`HttpResponse`',
      ],
      followUps: [
        '커스텀 미들웨어는 어떻게 작성하고, 어떤 용도로 써 봤나요?',
        '`process_view()`와 `process_exception()`은 언제 호출되나요?',
      ],
    },
  ],
};

export default content;
