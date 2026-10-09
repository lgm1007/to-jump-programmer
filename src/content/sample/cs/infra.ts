// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-infra-q01',
      categoryId: 'infra',
      type: 'mcq',
      difficulty: 1,
      prompt: '컨테이너와 가상 머신(VM)의 차이로 옳은 것은?',
      choices: [
        '컨테이너는 각자 게스트 OS 커널을 가지므로 VM보다 격리 수준이 높다',
        'VM은 하이퍼바이저 위에서 게스트 OS 전체를 실행하고, 컨테이너는 호스트 커널을 공유한다',
        '컨테이너는 하드웨어를 에뮬레이션하므로 VM보다 시작이 느리다',
        '같은 호스트의 컨테이너들은 각자 다른 커널 버전을 쓸 수 있다',
      ],
      answer: 1,
      explanation: `VM은 하이퍼바이저가 만든 가상 하드웨어 위에 **게스트 OS 전체**를 올립니다. 컨테이너는 **호스트의 커널을 공유**하면서, 리눅스 namespace(격리)와 cgroup(자원 제한)으로 프로세스를 분리할 뿐입니다.

| 구분 | VM | 컨테이너 |
|---|---|---|
| 커널 | VM마다 별도 | 호스트와 공유 |
| 시작 시간 | 수십 초 ~ 수 분 | 보통 수 초 이내 |
| 이미지 크기 | GB 단위 | MB 단위 |
| 격리 수준 | 강함 | 상대적으로 약함 |

커널을 공유하므로 같은 호스트의 컨테이너는 모두 같은 커널 위에서 돌고, 커널 취약점의 영향도 함께 받습니다.`,
      tags: [
        'container',
        'vm',
        'docker',
      ],
    },
    {
      id: 'cs-infra-q02',
      categoryId: 'infra',
      type: 'ox',
      difficulty: 1,
      prompt: '12-Factor App 원칙에서는 DB 주소나 API 키 같은 환경별 설정을 `config/prod.json`처럼 환경마다 파일로 나눠 저장소에 커밋해 관리하라고 권장한다.',
      answer: false,
      explanation: `12-Factor App의 **설정(Config)** 원칙은 배포 환경마다 달라지는 값(DB 주소, 외부 API 키 등)을 **코드와 분리해 환경 변수로 주입**하라는 것입니다.

- 환경별 설정 파일을 커밋하면 비밀 값이 저장소 이력에 남고, 환경이 늘 때마다 코드도 바뀝니다.
- 같은 빌드 결과물(이미지)을 개발·스테이징·운영에 그대로 쓰고 설정만 바꿔 주입하는 것이 핵심입니다.

쿠버네티스에서는 ConfigMap과 Secret을 환경 변수로 주입하고, 비밀 값은 AWS Secrets Manager 같은 저장소와 연동하는 방식이 일반적입니다.`,
      tags: [
        '12-factor',
        'config',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-infra-c01',
      categoryId: 'infra',
      difficulty: 1,
      question: '컨테이너와 VM의 차이를 설명하고, Docker를 사용하는 이유를 말해주세요.',
      answer: `VM은 하이퍼바이저 위에서 **게스트 OS 전체**를 실행하고, 컨테이너는 **호스트 OS 커널을 공유**하면서 프로세스를 격리합니다. 리눅스의 namespace로 프로세스·네트워크·파일시스템을 분리하고, cgroup으로 CPU와 메모리 사용량을 제한합니다.

- 컨테이너는 OS 부팅이 없어 수 초 안에 뜨고, 이미지가 가벼워 한 서버에 더 많이 띄울 수 있습니다.
- 대신 커널을 공유하므로 격리 수준은 VM보다 약합니다.

Docker를 쓰는 가장 큰 이유는 **실행 환경을 이미지로 고정**해 "내 PC에서는 되는데" 문제를 없애고, 같은 이미지를 개발·스테이징·운영에 그대로 배포할 수 있기 때문입니다. 이것이 쿠버네티스 같은 오케스트레이션의 기반이 됩니다.`,
      keywords: [
        '하이퍼바이저',
        '커널 공유',
        'namespace·cgroup',
        '이미지로 환경 고정',
        '이식성',
      ],
      followUps: [
        '컨테이너가 VM보다 보안상 불리한 점은 무엇인가요?',
        '맥에서 Docker를 실행하면 내부적으로 어떻게 동작하나요?',
      ],
    },
  ],
};

export default content;
