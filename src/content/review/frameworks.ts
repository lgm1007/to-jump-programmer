import type { FrameworkId, ReviewCategory, ReviewFramework, Severity } from '../types';

export const REVIEW_FRAMEWORKS: ReviewFramework[] = [
  {
    id: 'spring',
    title: 'Spring Boot',
    subtitle: 'Java · Kotlin · Spring Data JPA',
    language: 'java',
    variants: ['kotlin'],
    icon: 'leaf',
    accent: '#16A34A',
  },
  {
    id: 'nest',
    title: 'Node.js · NestJS',
    subtitle: 'TypeScript · Express · TypeORM',
    language: 'typescript',
    icon: 'logo-nodejs',
    accent: '#E0234E',
  },
  {
    id: 'django',
    title: 'Django · Flask',
    subtitle: 'Python · Django ORM · SQLAlchemy',
    language: 'python',
    icon: 'logo-python',
    accent: '#2563EB',
  },
];

export const REVIEW_FRAMEWORK_MAP = Object.fromEntries(
  REVIEW_FRAMEWORKS.map((f) => [f.id, f]),
) as Record<FrameworkId, ReviewFramework>;

export const REVIEW_CATEGORY_LABEL: Record<ReviewCategory, string> = {
  performance: '성능',
  security: '보안',
  design: '설계',
  transaction: '트랜잭션',
  'error-handling': '예외 처리',
  concurrency: '동시성',
  readability: '가독성',
  testing: '테스트',
  'api-design': 'API 설계',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: '치명적',
  major: '중요',
  minor: '사소함',
};
