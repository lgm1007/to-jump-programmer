/**
 * 백업 파일 저장 · 열기 — 앱(iOS · Android)은 아직 지원하지 않는다. 웹은 backup-file.web.ts.
 * (앱은 기록이 기기 저장소에 남아 있어 웹만큼 필요하지 않다. 지원하려면 expo-sharing · expo-document-picker 가 필요)
 */

export const BACKUP_SUPPORTED = false;

export async function saveBackupFile(_text: string, _fileName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  return 'cancelled';
}

export async function pickBackupFile(): Promise<string | null> {
  return null;
}
