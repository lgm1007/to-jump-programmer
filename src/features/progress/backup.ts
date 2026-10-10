/**
 * 학습 기록 백업 파일 (JSON) 만들기 · 읽기.
 * 웹에서는 학습 기록이 브라우저 저장소에만 있어, 브라우저 데이터를 지우거나 iPhone 에서 홈 화면 앱으로
 * 설치할 때(Safari 와 저장 공간이 따로다) 기록을 옮기려면 백업 파일이 필요하다.
 * React Native 를 가져오지 않으므로 Node 테스트(scripts/test-core.ts)에서도 쓴다.
 */
import type { ProgressData } from './store';

export const BACKUP_APP = 'to-jump-programmer';
export const BACKUP_FORMAT = 1;

export interface DraftsData {
  drafts: Record<string, string>;
  lastLanguage: Record<string, string>;
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  format: number;
  exportedAt: string;
  progress: Partial<ProgressData>;
  drafts?: DraftsData;
}

export type ParsedBackup = { ok: true; backup: BackupFile } | { ok: false; error: string };

const RECORD_KEYS = ['quiz', 'cards', 'problems', 'patterns', 'challenges', 'bookmarks', 'activity'] as const;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function createBackup(progress: ProgressData, drafts: DraftsData, now = new Date()): BackupFile {
  const { profile, settings, quiz, cards, problems, patterns, challenges, bookmarks, activity, daily } = progress;
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: now.toISOString(),
    progress: { profile, settings, quiz, cards, problems, patterns, challenges, bookmarks, activity, daily },
    drafts: { drafts: drafts.drafts, lastLanguage: drafts.lastLanguage },
  };
}

/** 예: to-jump-backup-2026-10-10.json */
export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `to-jump-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** 백업 파일 내용을 검사한다. 다른 앱의 파일이나 손상된 파일로 기록을 덮어쓰지 않도록 형태를 확인한다 */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSON 형식이 아니에요. To Jump 에서 내보낸 백업 파일인지 확인해주세요.' };
  }
  if (!isObject(data) || data.app !== BACKUP_APP) {
    return { ok: false, error: 'To Jump 백업 파일이 아니에요.' };
  }
  if (typeof data.format !== 'number' || data.format > BACKUP_FORMAT) {
    return { ok: false, error: '더 새로운 버전의 앱에서 만든 백업이에요. 앱을 새로고침한 뒤 다시 시도해주세요.' };
  }
  const progress = data.progress;
  if (!isObject(progress) || !isObject(progress.profile) || !isObject(progress.settings)) {
    return { ok: false, error: '백업 파일이 손상되었어요. (학습 기록 없음)' };
  }
  for (const key of RECORD_KEYS) {
    if (progress[key] !== undefined && !isObject(progress[key])) {
      return { ok: false, error: `백업 파일이 손상되었어요. (${key})` };
    }
  }
  if (progress.daily !== undefined && progress.daily !== null && !isObject(progress.daily)) {
    return { ok: false, error: '백업 파일이 손상되었어요. (daily)' };
  }
  const drafts = data.drafts;
  if (drafts !== undefined) {
    const valid =
      isObject(drafts) &&
      isObject(drafts.drafts) &&
      isObject(drafts.lastLanguage) &&
      Object.values(drafts.drafts).every((v) => typeof v === 'string');
    if (!valid) return { ok: false, error: '백업 파일이 손상되었어요. (작성 중인 코드)' };
  }
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      format: data.format,
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
      progress: progress as Partial<ProgressData>,
      drafts: drafts as DraftsData | undefined,
    },
  };
}

/** 복원 전에 보여줄 요약 (예: "2026. 10. 10. 백업 · 학습한 날 12일 · 퀴즈 80문항 · 문제 5개") */
export function describeBackup(b: BackupFile): string {
  const count = (v: unknown) => (isObject(v) ? Object.keys(v).length : 0);
  const date = b.exportedAt ? new Date(b.exportedAt) : null;
  const parts = [
    date && !Number.isNaN(date.getTime()) ? `${date.toLocaleDateString('ko-KR')} 백업` : '백업',
    `학습한 날 ${count(b.progress.activity)}일`,
    `퀴즈 ${count(b.progress.quiz)}문항`,
    `코딩 문제 ${count(b.progress.problems)}개`,
    `면접 카드 ${count(b.progress.cards)}장`,
  ];
  return parts.join(' · ');
}
