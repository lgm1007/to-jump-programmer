/** 백업 파일 저장 · 열기 (웹). 앱(iOS · Android)은 backup-file.ts */

export const BACKUP_SUPPORTED = true;

function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
}

/**
 * 휴대폰에서는 공유 시트로 내보내 Google Drive · 파일 앱 · 메신저 등에 바로 저장하게 하고,
 * 공유를 지원하지 않거나 컴퓨터라면 파일로 내려받는다.
 */
export async function saveBackupFile(text: string, fileName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([text], fileName, { type: 'application/json' });
  if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled';
      // 공유에 실패하면 내려받기로 넘어간다
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

/** 백업 파일을 골라 내용을 읽는다. 고르지 않으면 null */
export function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}
