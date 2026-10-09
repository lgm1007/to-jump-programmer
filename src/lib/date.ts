/** 로컬 시간대 기준 YYYY-MM-DD */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** 오늘(또는 오늘 기록이 없으면 어제)부터 거꾸로 이어지는 연속 학습일 수 */
export function computeStreak(activity: Record<string, number>, today: Date = new Date()): number {
  let cursor = today;
  if (!activity[dayKey(cursor)]) cursor = addDays(cursor, -1);
  let streak = 0;
  while (activity[dayKey(cursor)]) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** 기록 전체에서 가장 긴 연속 학습일 수 */
export function computeBestStreak(activity: Record<string, number>): number {
  const days = Object.keys(activity)
    .filter((k) => activity[k] > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const [y, m, d] = k.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    if (prev && dayKey(addDays(prev, 1)) === k) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

/** 날짜 문자열을 시드로 쓰는 결정적 해시 (오늘의 추천 등) */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 시드 기반 의사 난수 생성기 (mulberry32) */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], random: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}분 ${r}초` : `${m}분`;
}
