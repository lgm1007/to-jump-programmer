// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-database-q01',
      categoryId: 'database',
      type: 'mcq',
      difficulty: 1,
      prompt: 'MySQL InnoDB, PostgreSQL 등 대부분의 RDBMS가 기본 인덱스 구조로 **B+Tree**를 사용하는 이유로 가장 적절한 것은?',
      choices: [
        '등호(`=`) 검색에서는 해시 인덱스보다 항상 빠르기 때문입니다.',
        '모든 노드에 데이터를 저장해, 루트 근처에서 값을 찾을 확률이 높기 때문입니다.',
        '트리 높이가 낮아 디스크 I/O가 적고, 연결된 리프 노드로 범위 검색이 빠르기 때문입니다.',
        '자식이 최대 2개인 이진 트리라서, 삽입·삭제 시 재정렬 비용이 없기 때문입니다.',
      ],
      answer: 2,
      explanation: `B+Tree는 한 노드(페이지)에 수백 개의 키를 담아 **팬아웃이 크고 높이가 낮습니다**. 그래서 수천만 건이어도 보통 3~4번의 페이지 접근으로 원하는 행에 도달합니다. 또 리프 노드끼리 연결되어 있어 \`BETWEEN\`, \`>\`, \`ORDER BY\` 같은 **범위 검색과 정렬**에 유리합니다.

- 등호 검색만 보면 해시가 더 빠를 수 있지만, 해시는 범위 검색과 정렬을 지원하지 못합니다.
- 모든 노드에 데이터를 두는 것은 B-Tree의 특징이고, B+Tree는 **리프 노드에만** 데이터(또는 데이터 위치)를 둡니다.
- B+Tree는 자식이 여러 개인 **다진(Multi-way) 트리**이며, 삽입·삭제 시 노드 분할·병합 비용이 있습니다.`,
      tags: [
        '인덱스',
        'B+Tree',
      ],
    },
    {
      id: 'cs-database-q02',
      categoryId: 'database',
      type: 'mcq',
      difficulty: 1,
      prompt: '`orders` 테이블의 `created_at` 컬럼에 단일 인덱스가 있습니다. 다음 중 이 인덱스로 **범위 탐색을 할 수 있는** 조건은? (MySQL 8.0, 함수 기반 인덱스는 없다고 가정)',
      choices: [
        '`WHERE DATE(created_at) BETWEEN \'2025-03-01\' AND \'2025-03-07\'`',
        '`WHERE created_at >= \'2025-03-01\' AND created_at < \'2025-03-08\'`',
        '`WHERE YEAR(created_at) = 2025 AND MONTH(created_at) = 3`',
        '`WHERE created_at + INTERVAL 7 DAY > \'2025-03-08 00:00:00\'`',
      ],
      answer: 1,
      explanation: `인덱스는 **컬럼의 원래 값** 순서로 정렬되어 있습니다. 컬럼에 함수나 연산을 적용하면 가공된 값의 순서를 알 수 없으므로 인덱스 범위 탐색을 하지 못하고, 풀 스캔(또는 인덱스 풀 스캔)이 됩니다.

- \`DATE()\`, \`YEAR()\`, \`MONTH()\`처럼 함수를 씌우거나 \`+ INTERVAL\`처럼 연산을 하면 컬럼이 가공되어 인덱스를 타지 못합니다.
- 같은 의미라도 **컬럼은 그대로 두고 상수 쪽을 범위로** 바꾸면 인덱스를 탑니다.

> 비슷한 함정: MySQL에서 VARCHAR 컬럼을 숫자와 비교하면(\`WHERE user_code = 1001\`) 묵시적 형변환 때문에 인덱스를 못 탑니다. \`LIKE '%kim'\`처럼 앞쪽이 와일드카드인 경우도 탐색 시작 위치를 알 수 없어 마찬가지입니다.`,
      tags: [
        '인덱스',
        '쿼리 튜닝',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-database-c01',
      categoryId: 'database',
      difficulty: 1,
      question: '인덱스란 무엇이고, 왜 B+Tree를 주로 사용하나요?',
      answer: `인덱스는 테이블 전체를 훑지 않고도 원하는 행을 빠르게 찾도록, **컬럼 값을 정렬해 행의 위치와 함께 저장한 별도의 자료구조**입니다. 책 뒤의 색인과 비슷합니다.

대부분의 RDBMS는 **B+Tree**를 사용합니다. 한 노드에 많은 키를 담아 트리 높이가 낮으므로 **디스크 I/O가 적고**, 리프 노드가 서로 연결되어 있어 **범위 검색과 정렬**도 효율적으로 처리합니다.

다만 인덱스는 공짜가 아닙니다. INSERT·UPDATE·DELETE마다 인덱스도 갱신해야 하고 저장 공간도 차지하므로, 실제 조회 패턴과 선택도를 보고 필요한 곳에만 만드는 것이 중요합니다.`,
      keywords: [
        '정렬된 자료구조',
        'B+Tree',
        '디스크 I/O',
        '범위 검색',
        '쓰기 비용',
      ],
      followUps: [
        '해시 인덱스는 어떤 경우에 유리하고, 왜 기본으로 쓰지 않나요?',
        '클러스터드 인덱스와 세컨더리 인덱스는 어떻게 다른가요?',
        '인덱스를 만들었는데도 사용되지 않는 경우는 언제인가요?',
      ],
    },
  ],
};

export default content;
