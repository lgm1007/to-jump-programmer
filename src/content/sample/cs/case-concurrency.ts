// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-case-concurrency-q01',
      categoryId: 'case-concurrency',
      type: 'mcq',
      difficulty: 1,
      prompt: '서버 2대, MySQL InnoDB 한 대(읽기 복제본 없음)로 운영하는 쇼핑몰에서 재고가 음수인 상품이 발견되었습니다. 차감 코드는 아래와 같고, 해당 상품에는 차감 두 건이 수십 ms 간격으로 기록되어 있습니다. 원인으로 가장 정확한 것은?',
      code: {
        language: 'java',
        filename: 'StockService.java',
        source: `@Transactional
public void decrease(long productId, int qty) {
    int stock = stockRepository.findQty(productId);   // 일반 SELECT
    if (stock < qty) throw new OutOfStockException();
    stockRepository.decrease(productId, qty);         // qty = qty - ?
}`,
      },
      correct: '두 요청이 락 없이 같은 재고를 읽어 둘 다 검사를 통과한 뒤 각각 차감했다',
      distractors: [
        {
          text: '`@Transactional` 때문에 두 요청이 같은 트랜잭션으로 묶여 차감이 두 번 실행됐다',
          why: '요청마다 트랜잭션은 따로 열립니다. 트랜잭션이 따로여도 일반 SELECT는 락을 걸지 않아 검사와 차감 사이의 틈이 남는 것이 문제입니다.',
        },
        {
          text: 'REPEATABLE READ에서는 UPDATE가 스냅샷 값으로 계산되어 앞 요청의 차감을 보지 못했다',
          why: 'InnoDB의 UPDATE는 최신 커밋 값을 기준으로 실행되므로 두 차감이 차례로 모두 반영되었습니다. 낡은 판단을 한 것은 UPDATE가 아니라 그 전의 검사입니다.',
        },
        {
          text: 'JPA 1차 캐시가 다른 요청이 읽어 둔 이전 재고를 돌려줬다',
          why: '1차 캐시(영속성 컨텍스트)는 트랜잭션마다 따로 있어 요청끼리 공유되지 않습니다. 두 요청은 각자 DB에서 같은 값을 읽었습니다.',
        },
        {
          text: '서버가 2대라 두 서버의 커넥션이 서로 다른 DB를 바라봤다',
          why: 'DB는 한 대뿐입니다. 같은 서버의 두 스레드로도 똑같이 재현되므로, 서버 수가 아니라 확인과 변경이 나뉜 구조가 원인입니다.',
        },
        {
          text: '두 번째 요청이 첫 요청의 커밋 전 데이터를 읽는 Dirty Read가 일어났다',
          why: 'REPEATABLE READ는 커밋되지 않은 데이터를 읽지 않습니다. 두 요청 모두 차감 전의 커밋된 재고를 정상적으로 읽은 것입니다.',
        },
        {
          text: '조건 컬럼에 인덱스가 없어 UPDATE가 테이블 전체를 잠갔다',
          why: '잠금 범위가 넓으면 대기가 늘어날 뿐 차감이 더 일어나지는 않습니다. 검사가 락 없이 먼저 끝난 틈은 잠금 범위와 상관없이 남습니다.',
        },
      ],
      explanation: `일반 SELECT는 락을 걸지 않는 스냅샷 읽기라서, 거의 동시에 온 두 요청이 모두 차감 전 재고를 읽고 \`stock < qty\` 검사를 통과합니다. 이어지는 UPDATE는 현재 값에서 빼는 상대 갱신이라 두 차감이 차례로 모두 반영되어 재고가 음수가 됩니다.

이처럼 **확인과 변경이 나뉜(check-then-act)** 코드는 트랜잭션이 있어도 경쟁 조건이 생깁니다. 확인과 변경을 한 문장으로 합치거나(조건부 UPDATE), 확인하기 전에 락을 잡아야 합니다.`,
    },
    {
      id: 'cs-case-concurrency-q02',
      categoryId: 'case-concurrency',
      type: 'mcq',
      difficulty: 2,
      prompt: '포인트 차감 규칙은 "잔액이 차감액 이상이어야 한다" 하나뿐이고, 차감 뒤 외부 호출은 없습니다. 서버는 2대, DB는 MySQL InnoDB 한 대입니다. 정합성을 지키면서 **락 보유 시간과 코드 변경이 가장 적은** 방법과 그 이유로 옳은 것은?',
      correct: '`WHERE balance >= :amount` 조건부 UPDATE — 확인과 차감이 한 문장이라 재시도가 없다',
      distractors: [
        {
          text: '차감 메서드에 `synchronized` — 같은 계정 요청이 서버 안에서 차례로 처리된다',
          why: '`synchronized`는 한 JVM 안에서만 동작해 다른 서버의 요청을 막지 못합니다. 트랜잭션 커밋보다 먼저 락이 풀려 같은 서버 안에서도 틈이 남습니다.',
        },
        {
          text: '`SELECT … FOR UPDATE`로 잠근 뒤 검사 · 차감 — 락을 잡으니 가장 안전하다',
          why: '정합성은 지키지만 커밋까지 락을 쥐고 조회 · 검사 코드도 그대로 남습니다. 규칙이 한 문장으로 표현되는 지금은 조건부 UPDATE보다 락이 길고 변경도 큽니다.',
        },
        {
          text: '`@Version` 낙관적 락 — 락 대기가 없으니 어떤 경우에도 가장 가볍다',
          why: '충돌하면 예외가 나서 재시도나 실패 안내 코드가 더 필요합니다. 요청이 거의 같은 순간에 몰리는 패턴에서는 실패가 잦습니다.',
        },
        {
          text: '격리 수준을 SERIALIZABLE로 — 트랜잭션이 하나씩 차례로 실행된다',
          why: 'InnoDB의 SERIALIZABLE은 트랜잭션을 줄 세우는 것이 아니라 일반 SELECT를 공유 락 읽기로 바꿉니다. 두 요청이 공유 락을 함께 쥔 채 UPDATE하려다 데드락이 나기 쉽습니다.',
        },
        {
          text: 'Redis 분산 락으로 계정별 락 — DB보다 빠르니 락 시간이 준다',
          why: 'DB 한 문장으로 끝나는 일에 외부 저장소와 락 만료 문제를 더합니다. 락을 쥔 동안 DB 작업도 그대로 해야 해 락 보유 시간이 오히려 깁니다.',
        },
        {
          text: '잔액을 캐시에 올려 두고 캐시에서 검사 — DB 조회가 줄어 경합도 준다',
          why: '캐시에서 읽어도 검사와 차감 사이의 틈은 그대로이고, 캐시와 DB가 어긋나는 문제까지 생깁니다.',
        },
      ],
      explanation: `규칙이 한 행의 조건으로 표현되면 확인과 차감을 한 문장으로 합칠 수 있습니다.

\`\`\`sql
UPDATE point_wallet SET balance = balance - :amount
WHERE user_id = :userId AND balance >= :amount;
\`\`\`

InnoDB의 UPDATE는 최신 커밋 값을 읽고 행에 배타 락을 겁니다. 동시에 온 뒤 요청은 앞 요청의 커밋을 기다렸다가 바뀐 잔액으로 조건을 다시 평가해 0건이 되므로, 영향받은 행이 0이면 잔액 부족으로 처리하면 됩니다. 트랜잭션에 이 문장과 이력 INSERT만 있으면 락은 아주 짧게 유지되고, 충돌해도 예외가 아니라 0건이라 재시도 코드가 필요 없습니다.`,
    },
  ],
  cards: [
    {
      id: 'cs-case-concurrency-c01',
      categoryId: 'case-concurrency',
      difficulty: 1,
      question: '동시에 들어온 요청 때문에 데이터 정합성이 깨진 경험이 있나요? 어떻게 해결했나요?',
      answer: `주문 시 포인트를 차감하는 기능에서 잔액이 음수가 된 계정이 발견된 적이 있습니다. 포인트 이력을 시간순으로 보니 같은 계정의 차감 요청이 수십 ms 간격으로 겹쳐 있었고, 잔액을 조회해 검사한 뒤 따로 차감하는 구조라 두 요청이 같은 잔액을 보고 모두 통과한 것이 원인이었습니다. 먼저 실제 DB를 쓰는 통합 테스트에서 두 요청을 동시에 출발시켜 음수가 되는 것을 재현했습니다. 차감 규칙이 "잔액이 차감액 이상" 하나뿐이라 락을 따로 잡지 않고 \`WHERE balance >= 차감액\` 조건을 붙인 UPDATE 한 문장으로 바꾸고, 영향받은 행이 0이면 잔액 부족으로 처리했습니다. 같은 테스트를 100건 동시 요청으로 키워 정확히 잔액만큼만 성공하는 것을 확인했고, 음수 잔액을 세는 대사 쿼리를 알림에 연결해 재발을 지켜봤습니다. 규칙이 여러 행에 걸쳤다면 기준 행을 \`SELECT … FOR UPDATE\`로 잠그는 방식을 골랐을 것입니다.

> 경험이 없다면: "조회 → 검사 → 변경"이 나뉜 코드에서 생기는 경쟁 조건을 설명하고, 재고나 쿠폰 수량 같은 가상 시나리오로 조건부 UPDATE · 비관적 락 · 낙관적 락 중 무엇을 왜 고를지 말하면 됩니다. 동시 요청 테스트를 직접 짜서 재현해 봤다면 그 과정을 함께 말하면 좋습니다.`,
      keywords: [
        '경쟁 조건',
        '확인과 변경 사이의 틈',
        '조건부 UPDATE',
        '영향받은 행 수',
        '동시 요청 재현 테스트',
      ],
      followUps: [
        '비관적 락이나 낙관적 락 대신 조건부 UPDATE를 고른 이유는 무엇인가요?',
        '서버가 한 대라면 synchronized로 충분하지 않나요?',
        '같은 요청이 두 번 들어오는 중복 요청은 어떻게 막았나요?',
      ],
    },
  ],
};

export default content;
