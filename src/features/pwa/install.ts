/** 웹 앱(PWA) 설치 — 앱(iOS · Android)에서는 해당 없음. 웹은 install.web.ts */

/**
 * - installed: 홈 화면에 설치한 앱으로 실행 중
 * - prompt: 브라우저의 설치 창을 띄울 수 있음 (Android Chrome 등)
 * - ios: 공유 버튼 → 홈 화면에 추가로 설치
 * - in-app: 카카오톡 등 앱 안의 브라우저라 설치할 수 없음
 * - manual: 브라우저 메뉴에서 직접 설치
 * - unsupported: 앱 등 설치 대상이 아님
 */
export type InstallHint = 'installed' | 'prompt' | 'ios' | 'in-app' | 'manual' | 'unsupported';

export function initPwa() {}

export function usePwaInstall(): { hint: InstallHint; install: () => Promise<boolean> } {
  return { hint: 'unsupported', install: async () => false };
}

export function isInstallCardDismissed(): boolean {
  return true;
}

export function dismissInstallCard() {}
