// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-architecture-q01',
      categoryId: 'architecture',
      type: 'mcq',
      difficulty: 1,
      prompt: '트래픽 증가에 대비해 애플리케이션 서버를 1대에서 4대로 늘리고 앞에 로드밸런서를 두었습니다. 그런데 로그인 상태가 요청마다 유지됐다 풀렸다 합니다. 가장 적절한 해결 방향은?',
      choices: [
        '서버 1대의 CPU와 메모리를 늘리는 수직 확장 구조로 되돌려 운영합니다.',
        '로드밸런서 알고리즘을 라운드 로빈에서 최소 연결 방식으로 바꿔 분산합니다.',
        '각 서버의 세션 만료 시간(timeout)을 지금보다 더 길게 늘려 둡니다.',
        '세션을 Redis 같은 공유 저장소로 옮겨 서버를 무상태(Stateless)로 만듭니다.',
      ],
      answer: 3,
      explanation: `세션이 각 서버의 **메모리에만** 저장되어 있어, 로그인한 서버가 아닌 다른 서버로 요청이 가면 세션을 찾지 못하는 상황입니다. 수평 확장(Scale-out)을 하려면 어떤 서버가 요청을 받아도 같은 결과를 내도록 **서버를 무상태(Stateless)로** 만들어야 합니다.

- 세션을 Redis 같은 **공유 저장소**에 두거나, JWT처럼 클라이언트가 상태를 들고 다니게 합니다.
- 수직 확장(Scale-up)은 하드웨어 한계가 있고 단일 장애점(SPOF)이 남습니다.
- 분산 알고리즘이나 만료 시간을 바꿔도 다른 서버에 세션이 없다는 근본 문제는 그대로입니다.

> 스티키 세션(Sticky Session)으로 같은 사용자를 같은 서버에 보내는 방법도 있지만, 그 서버가 죽으면 세션이 사라지고 부하가 고르게 분산되지 않습니다.`,
      tags: [
        '확장성',
        '무상태',
      ],
    },
    {
      id: 'cs-architecture-q02',
      categoryId: 'architecture',
      type: 'mcq',
      difficulty: 1,
      prompt: '아래는 Cache-Aside(Lazy Loading) 패턴으로 상품을 조회하는 코드입니다. 주석 `(A)` 위치에 들어갈 동작으로 가장 적절한 것은?',
      code: {
        language: 'java',
        filename: 'ProductService.java',
        source: `public Product getProduct(Long id) {
    String key = "product:" + id;
    Product cached = cache.get(key);
    if (cached != null) {
        return cached; // 캐시 히트
    }
    Product product = productRepository.findById(id)
        .orElseThrow();
    // (A)
    return product;
}`,
      },
      choices: [
        '아무것도 하지 않고, 다음 요청도 DB에서 직접 읽게 둡니다.',
        'DB에서 읽은 상품을 TTL을 지정해 캐시에 저장합니다.',
        'DB의 상품 데이터를 삭제해, 이후에는 캐시만 바라보게 합니다.',
        '전체 상품을 캐시에 다시 적재하는 배치 작업을 실행합니다.',
      ],
      answer: 1,
      explanation: `Cache-Aside는 애플리케이션이 **먼저 캐시를 보고, 없으면(캐시 미스) DB에서 읽은 뒤 캐시에 채워 넣는** 방식입니다. 그래야 다음 요청부터 캐시에서 바로 응답할 수 있습니다.

- TTL을 두면 오래된 데이터가 무한히 남지 않고, 잘 쓰이지 않는 데이터는 자연스럽게 빠집니다.
- 캐시를 채우지 않으면 매번 DB를 읽게 되어 캐시를 둔 의미가 없습니다.
- 원본은 항상 DB이고, 캐시는 언제든 비워질 수 있는 사본입니다.
- 전체를 미리 적재하는 캐시 워밍(Cache Warming)은 보조 수단이며, 요청마다 할 일이 아닙니다.

> 데이터를 수정할 때는 보통 DB를 먼저 갱신한 뒤 캐시를 **삭제**해, 다음 조회 때 새 값으로 채워지게 합니다.`,
      tags: [
        '캐시',
        'Cache-Aside',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-architecture-c01',
      categoryId: 'architecture',
      difficulty: 1,
      question: '모놀리식 아키텍처와 MSA의 장단점을 비교하고, 언제 MSA를 도입하는 것이 좋은지 말씀해주세요.',
      answer: `**모놀리식**은 하나의 애플리케이션으로 개발·배포하는 구조입니다. 단순하고 트랜잭션 처리와 디버깅이 쉽지만, 규모가 커지면 작은 변경에도 전체를 배포해야 하고 일부 기능만 따로 확장하기 어렵습니다.

**MSA**는 도메인별로 독립 배포 가능한 작은 서비스로 나누는 구조입니다. **독립 배포·독립 확장·장애 격리**가 장점이지만, 네트워크 지연, **분산 트랜잭션**, 모니터링과 배포 인프라 같은 운영 복잡도가 크게 늘어납니다.

그래서 MSA는 기술 유행이 아니라 **조직 규모와 배포 병목**을 보고 결정합니다. 여러 팀이 한 코드베이스 때문에 서로 막히고 도메인 경계가 안정되었을 때, 모듈화된 모놀리식에서 경계가 분명한 도메인부터 점진적으로 분리하는 것이 현실적입니다.`,
      keywords: [
        '독립 배포',
        '독립 확장',
        '장애 격리',
        '운영 복잡도',
        '분산 트랜잭션',
        '점진적 분리',
      ],
      followUps: [
        'MSA에서 API Gateway는 어떤 역할을 하나요?',
        '서비스를 나누는 기준은 무엇으로 잡으시겠어요?',
        '서비스마다 DB를 분리하면 여러 서비스의 데이터를 합쳐 보여주는 조회는 어떻게 처리하나요?',
      ],
    },
  ],
};

export default content;
