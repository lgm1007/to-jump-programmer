import type { CsCategory, CsGroupId } from '../types';

export const CS_GROUPS: { id: CsGroupId; title: string; description: string }[] = [
  { id: 'fundamentals', title: 'CS 기초', description: '운영체제 · 네트워크 · 자료구조 · DB · 보안' },
  { id: 'language', title: '언어', description: 'Java · JavaScript/TypeScript · Python' },
  { id: 'framework', title: '프레임워크', description: 'Spring · Node.js/NestJS · Django/Flask' },
  { id: 'architecture', title: '아키텍처 · 인프라', description: '시스템 설계 · 클라우드 · DevOps' },
  { id: 'practice', title: '개발 실무', description: '객체지향 · 디자인 패턴 · 협업 · 테스트' },
];

export const CS_CATEGORIES: CsCategory[] = [
  {
    id: 'os',
    group: 'fundamentals',
    title: '운영체제',
    description: '프로세스·스레드, 스케줄링, 동기화, 메모리 관리',
    icon: 'hardware-chip-outline',
  },
  {
    id: 'network',
    group: 'fundamentals',
    title: '네트워크',
    description: 'TCP/IP, HTTP/HTTPS, DNS, 로드밸런싱',
    icon: 'globe-outline',
  },
  {
    id: 'datastructure',
    group: 'fundamentals',
    title: '자료구조',
    description: '배열·리스트, 해시 테이블, 트리, 힙, 그래프',
    icon: 'git-network-outline',
  },
  {
    id: 'database',
    group: 'fundamentals',
    title: '데이터베이스',
    description: '인덱스, 트랜잭션·격리 수준, 정규화, 락, NoSQL',
    icon: 'server-outline',
  },
  {
    id: 'security',
    group: 'fundamentals',
    title: '보안',
    description: '인증·인가, JWT·OAuth, OWASP Top 10, 암호화',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'java',
    group: 'language',
    title: 'Java · JVM',
    description: 'JVM 구조, GC, 컬렉션, 동시성, 최신 문법',
    icon: 'cafe-outline',
  },
  {
    id: 'javascript',
    group: 'language',
    title: 'JavaScript · TypeScript',
    description: '이벤트 루프, 클로저, 프로미스, 타입 시스템',
    icon: 'logo-javascript',
  },
  {
    id: 'python',
    group: 'language',
    title: 'Python',
    description: 'GIL, 제너레이터, 데코레이터, 메모리 모델',
    icon: 'logo-python',
  },
  {
    id: 'spring',
    group: 'framework',
    title: 'Spring · JPA',
    description: 'IoC/DI, AOP, 트랜잭션, Spring Boot, JPA',
    icon: 'leaf-outline',
  },
  {
    id: 'nestjs',
    group: 'framework',
    title: 'Node.js · NestJS',
    description: 'Node 런타임, Express, NestJS 모듈·DI·파이프라인',
    icon: 'logo-nodejs',
  },
  {
    id: 'django',
    group: 'framework',
    title: 'Django · Flask',
    description: 'ORM, 미들웨어, 요청 생명주기, WSGI/ASGI',
    icon: 'flask-outline',
  },
  {
    id: 'architecture',
    group: 'architecture',
    title: '아키텍처 · 시스템 설계',
    description: 'MSA, 캐시, 메시지 큐, 확장성, 분산 시스템',
    icon: 'layers-outline',
  },
  {
    id: 'infra',
    group: 'architecture',
    title: '인프라 · DevOps',
    description: 'Docker, Kubernetes, CI/CD, 클라우드, 모니터링',
    icon: 'cloud-outline',
  },
  {
    id: 'oop',
    group: 'practice',
    title: '객체지향 · 디자인 패턴',
    description: 'SOLID, 캡슐화·다형성, GoF 패턴, 클린 코드',
    icon: 'cube-outline',
  },
  {
    id: 'practice',
    group: 'practice',
    title: '개발 실무',
    description: 'Git, 테스트, 코드 리뷰, 장애 대응, 협업',
    icon: 'briefcase-outline',
  },
];

export const CS_CATEGORY_MAP: Record<string, CsCategory> = Object.fromEntries(
  CS_CATEGORIES.map((c) => [c.id, c]),
);
