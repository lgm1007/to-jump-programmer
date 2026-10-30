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
      correct: 'View',
      distractors: [
        {
          text: 'Model',
          why: 'Model은 데이터 구조와 도메인 규칙, ORM을 맡습니다. 요청을 받거나 어떤 응답을 돌려줄지 정하지 않고, View가 Model을 불러 데이터를 다룹니다.',
        },
        {
          text: 'Template',
          why: 'Template은 View가 넘긴 데이터를 HTML로 그리기만 합니다. 이름 때문에 MVC의 View와 헷갈리기 쉽지만 화면 표현만 맡습니다.',
        },
        {
          text: 'URLconf',
          why: 'URLconf(`urls.py`)는 URL을 알맞은 View에 연결(라우팅)할 뿐 응답 내용을 정하지 않습니다. Django 문서는 이런 라우팅을 포함한 프레임워크 자체를 Controller로 볼 수 있다고 설명합니다.',
        },
        {
          text: 'Middleware',
          why: '미들웨어는 MTV의 구성 요소가 아니라 모든 요청 · 응답을 감싸는 공통 처리 계층입니다. 세션 · 인증 · CSRF 같은 공통 처리를 할 뿐, 경로별로 데이터를 다뤄 응답을 정하는 것은 View입니다.',
        },
        {
          text: 'Form',
          why: '폼은 입력값을 검증하고 정리(`cleaned_data`)하는 도구입니다. 검증 결과에 따라 무엇을 저장하고 어떤 응답을 줄지는 폼을 사용하는 View가 정합니다.',
        },
      ],
      explanation: `Django의 **View**는 요청을 받아 비즈니스 로직을 수행하고 \`HttpResponse\`를 반환합니다. 이름은 View지만 MVC로 보면 Controller에 해당합니다.

| MTV | 역할 | MVC 대응 |
| --- | --- | --- |
| Model | 데이터 구조, ORM, 도메인 규칙 | Model |
| Template | 화면 표현(HTML 렌더링) | View |
| View | 요청 처리, 응답 결정 | Controller |`,
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
      correct: '1번',
      distractors: [
        {
          text: '2번',
          why: '`for`문마다 쿼리가 나간다고 본 값입니다. 평가된 QuerySet은 결과를 내부에 캐시하므로, 같은 `qs` 객체를 다시 순회하면 추가 쿼리가 없습니다.',
        },
        {
          text: '3번',
          why: '`filter()` · `exclude()` · `order_by()`를 호출할 때마다 쿼리가 나간다고 본 값입니다. 이 메서드들은 조건만 쌓은 새 QuerySet을 돌려줄 뿐 DB에 접근하지 않습니다.',
        },
        {
          text: '4번',
          why: '체이닝 메서드 세 번과 첫 순회에서 각각 쿼리가 나간다고 본 값입니다. 체이닝하는 동안에는 DB에 가지 않고, 결과가 처음 필요한 첫 순회에서 한 번만 실행됩니다.',
        },
        {
          text: '5번',
          why: '체이닝 메서드 세 번과 두 번의 순회를 모두 센 값입니다. QuerySet은 지연 평가되고, 한 번 평가된 결과는 캐시되어 재사용됩니다.',
        },
        {
          text: '게시글 수 + 1번',
          why: '`title`은 `Post` 테이블의 일반 컬럼이라 목록을 조회할 때 함께 가져옵니다. 객체마다 추가 쿼리가 나가는 것은 FK 같은 관계 필드에 처음 접근할 때입니다.',
        },
      ],
      explanation: `QuerySet은 **지연 평가(lazy evaluation)**됩니다. \`filter()\`, \`exclude()\`, \`order_by()\`는 조건만 쌓은 새 QuerySet을 반환할 뿐 DB에 접근하지 않습니다.

- 첫 \`for\`문에서 처음 평가되며 쿼리가 1번 실행되고, 결과는 QuerySet 내부의 결과 캐시에 저장됩니다.
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
        {
          question: '커스텀 미들웨어는 어떻게 작성하고, 어떤 용도로 써 봤나요?',
          answer: '`get_response`를 받아 저장하는 `__init__`과, 요청을 받아 응답을 돌려주는 `__call__`을 가진 클래스(또는 같은 구조의 함수 팩토리)를 만들어 `MIDDLEWARE`에 등록합니다. 대표적인 용도는 요청 ID입니다. 요청 단계에서 `X-Request-ID` 헤더를 읽거나 새로 만들어 `contextvars`에 넣고 로깅 필터가 모든 로그에 찍게 한 뒤, 응답 단계에서 같은 값을 응답 헤더로 돌려주면 장애 때 한 요청의 로그를 묶어 추적할 수 있습니다. 미들웨어는 모든 요청에서 실행되므로 DB 조회 같은 무거운 일은 넣지 않습니다.',
          followUps: [
            {
              question: '요청 ID를 `contextvars` 대신 `threading.local`에 담으면 안 되나요?',
              answer: 'WSGI 동기 워커에서는 요청 하나가 스레드 하나에서 끝나므로 동작하지만, ASGI나 async 뷰에서는 여러 요청이 한 스레드의 이벤트 루프에서 번갈아 실행되어 값이 섞입니다. `contextvars`는 태스크마다 컨텍스트가 분리되고 `sync_to_async`로 스레드를 넘어갈 때도 복사되므로 두 환경 모두에서 안전합니다.',
            },
          ],
        },
        {
          question: '`process_view()`와 `process_exception()`은 언제 호출되나요?',
          answer: '`process_view()`는 URLconf가 뷰를 정한 뒤 **뷰를 호출하기 직전**에 불리고, 실행될 뷰 함수와 인자를 받으므로 뷰에 붙은 표시(예: `csrf_exempt`)를 보고 처리를 바꿀 수 있습니다. `CsrfViewMiddleware`가 실제로 이 훅에서 토큰을 검사합니다. 여기서 응답을 반환하면 뷰는 호출되지 않습니다. `process_exception()`은 **뷰가 예외를 던졌을 때만** 불리며, `HttpResponse`를 반환하면 그 응답이 쓰이고 `None`이면 다른 미들웨어나 Django 기본 예외 처리로 넘어갑니다.',
        },
      ],
    },
  ],
};

export default content;
