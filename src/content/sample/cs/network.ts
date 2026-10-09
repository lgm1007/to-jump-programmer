// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-network-q01',
      categoryId: 'network',
      type: 'mcq',
      difficulty: 1,
      prompt: 'OSI 7계층과 각 계층의 역할·프로토콜을 연결한 것 중 **잘못된** 것은?',
      choices: [
        '응용 계층(L7) — HTTP, DNS',
        '전송 계층(L4) — TCP, UDP, 포트 번호로 프로세스 구분',
        '네트워크 계층(L3) — MAC 주소로 같은 네트워크 안에서 프레임 전달',
        '데이터 링크 계층(L2) — 이더넷, 스위치',
      ],
      answer: 2,
      explanation: `네트워크 계층(L3)은 **IP 주소**로 서로 다른 네트워크 사이의 경로를 찾는(라우팅) 계층이고, 대표 장비는 라우터입니다. MAC 주소로 같은 네트워크 안에서 프레임을 전달하는 것은 데이터 링크 계층(L2)의 역할입니다.

나머지는 올바른 연결입니다. 실무에서 많이 쓰는 TCP/IP 4계층 모델과 비교하면 다음과 같습니다.

| TCP/IP 4계층 | OSI 7계층 | 예 |
|---|---|---|
| 응용 | L5~L7 | HTTP, DNS, TLS |
| 전송 | L4 | TCP, UDP |
| 인터넷 | L3 | IP, ICMP |
| 네트워크 접근 | L1~L2 | 이더넷, Wi-Fi |

'L4 로드밸런서', 'L7 로드밸런서'라는 이름도 이 계층 구분에서 나왔습니다.`,
    },
    {
      id: 'cs-network-q02',
      categoryId: 'network',
      type: 'mcq',
      difficulty: 1,
      prompt: 'TCP와 UDP에 대한 설명으로 **옳지 않은** 것은?',
      choices: [
        'TCP는 3-way handshake로 연결을 맺은 뒤 데이터를 보낸다',
        'UDP는 연결 설정 없이 데이터그램을 바로 보내므로 지연이 적다',
        'TCP는 손실된 세그먼트를 재전송하고 순서를 보장한다',
        'UDP는 체크섬이 없어 전송 중 데이터가 손상돼도 수신 측이 알 수 없다',
      ],
      answer: 3,
      explanation: `UDP 헤더(8바이트)에도 **체크섬** 필드가 있어 손상된 데이터그램을 감지하고 버릴 수 있습니다. IPv4에서는 체크섬 사용이 선택이지만 보통 사용하며, IPv6에서는 필수입니다. UDP에 없는 것은 체크섬이 아니라 **재전송, 순서 보장, 흐름·혼잡 제어**입니다. 즉 손상을 감지는 하지만 복구는 하지 않습니다.

나머지 설명은 모두 맞습니다. 그래서 정확성이 중요한 웹 API·DB 통신은 TCP를, 지연이 중요한 DNS 질의·실시간 스트리밍·게임은 UDP를 주로 사용합니다.`,
    },
  ],
  cards: [
    {
      id: 'cs-network-c01',
      categoryId: 'network',
      difficulty: 1,
      question: 'TCP와 UDP의 차이를 설명해주세요.',
      answer: `둘 다 전송 계층(L4) 프로토콜이지만, 신뢰성과 지연 사이에서 다른 선택을 했습니다.

- **TCP**: 3-way handshake로 연결을 맺고 순서 보장, 재전송, 흐름 제어, 혼잡 제어를 제공합니다. 데이터는 경계 없는 바이트 스트림으로 전달됩니다.
- **UDP**: 연결 없이 데이터그램 단위로 보내고, 재전송과 순서 보장이 없습니다. 대신 헤더가 8바이트로 작고 지연이 적습니다.

그래서 웹 API나 DB 연결처럼 데이터가 정확해야 하는 곳에는 TCP를, DNS 질의, 실시간 음성·영상, 게임처럼 약간의 손실보다 지연이 중요한 곳에는 UDP를 씁니다. HTTP/3의 QUIC처럼 UDP 위에 필요한 신뢰성을 직접 구현하기도 합니다.`,
      keywords: [
        '연결 지향 vs 비연결',
        '순서 보장·재전송',
        '흐름·혼잡 제어',
        '바이트 스트림 vs 데이터그램',
        '낮은 지연',
      ],
      followUps: [
        'UDP를 쓰면서 신뢰성이 필요하면 어떻게 하나요?',
        'DNS는 왜 주로 UDP를 사용하나요?',
      ],
    },
  ],
};

export default content;
