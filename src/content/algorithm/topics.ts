import type { AlgoTopic } from '../types';

/** 개념 퀴즈 토픽 (코딩 문제의 topics 태그로도 사용) */
export const ALGO_TOPICS: AlgoTopic[] = [
  {
    id: 'complexity',
    title: '시간 복잡도',
    description: 'Big-O 표기법과 입력 크기별 허용 복잡도',
    icon: 'speedometer-outline',
  },
  {
    id: 'sorting',
    title: '정렬',
    description: '정렬 알고리즘 비교와 커스텀 정렬 기준',
    icon: 'swap-vertical-outline',
  },
  {
    id: 'binary-search',
    title: '이분 탐색',
    description: 'lower/upper bound, 파라메트릭 서치',
    icon: 'search-outline',
  },
  {
    id: 'stack-queue',
    title: '스택 · 큐 · 덱',
    description: 'LIFO/FIFO, 모노토닉 스택, 괄호 문제',
    icon: 'albums-outline',
  },
  {
    id: 'hash',
    title: '해시',
    description: '해시맵·셋으로 O(1) 조회, 빈도 세기',
    icon: 'key-outline',
  },
  {
    id: 'heap',
    title: '힙 · 우선순위 큐',
    description: '최소/최대 힙, Top-K, 스케줄링',
    icon: 'podium-outline',
  },
  {
    id: 'two-pointer',
    title: '투 포인터 · 누적 합',
    description: '슬라이딩 윈도우, 구간 합 최적화',
    icon: 'resize-outline',
  },
  {
    id: 'greedy',
    title: '그리디',
    description: '탐욕적 선택 속성과 정당성 증명',
    icon: 'flash-outline',
  },
  {
    id: 'brute-force',
    title: '완전 탐색 · 백트래킹',
    description: '순열·조합, 가지치기',
    icon: 'git-branch-outline',
  },
  {
    id: 'bfs-dfs',
    title: 'DFS · BFS',
    description: '그래프/격자 탐색, 연결 요소, 최단 거리',
    icon: 'share-social-outline',
  },
  {
    id: 'dp',
    title: '동적 계획법',
    description: '점화식 세우기, 메모이제이션, 배낭 문제',
    icon: 'grid-outline',
  },
  {
    id: 'shortest-path',
    title: '최단 경로',
    description: '다익스트라, 벨만-포드, 플로이드-워셜',
    icon: 'navigate-outline',
  },
  {
    id: 'union-find',
    title: '유니온 파인드 · MST',
    description: '서로소 집합, 크루스칼, 사이클 판별',
    icon: 'link-outline',
  },
  {
    id: 'tree',
    title: '트리',
    description: '트리 순회, 이진 탐색 트리, LCA 기초',
    icon: 'git-merge-outline',
  },
];

/** 코딩 문제에서만 쓰는 보조 태그 */
export const EXTRA_PROBLEM_TAGS: Record<string, string> = {
  implementation: '구현',
  string: '문자열',
  math: '수학',
};

export const ALGO_TOPIC_MAP: Record<string, AlgoTopic> = Object.fromEntries(
  ALGO_TOPICS.map((t) => [t.id, t]),
);

export function topicLabel(id: string): string {
  return ALGO_TOPIC_MAP[id]?.title ?? EXTRA_PROBLEM_TAGS[id] ?? id;
}
