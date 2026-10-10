/**
 * 웹 앱(PWA) 설치 상태. 앱(iOS · Android)은 install.ts (항상 'unsupported').
 * - Android Chrome · 데스크톱 Chrome/Edge: beforeinstallprompt 이벤트를 받아 두었다가 [앱 설치] 버튼으로 띄운다
 * - iPhone · iPad: 설치 API 가 없어 공유 버튼 → 홈 화면에 추가 방법을 안내한다
 * - 카카오톡 등 앱 안의 브라우저: 설치할 수 없어 다른 브라우저로 열도록 안내한다
 */
import { useSyncExternalStore } from 'react';

import type { InstallHint } from './install';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const IN_APP_BROWSER = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i;

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return false;
  // iPadOS 는 데스크톱 Safari 처럼 MacIntel 로 표시되므로 터치 지원 여부로 구분한다
  return /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** 앱 시작 시 한 번 부른다 (설치 이벤트는 화면이 그려지기 전에 올 수 있다) */
export function initPwa() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });
  // 저장 공간이 부족할 때 브라우저가 학습 기록을 지우지 않도록 영구 저장을 요청한다 (허용 여부는 브라우저가 정한다)
  void navigator.storage?.persist?.().catch(() => false);
}

function getHint(): InstallHint {
  if (typeof window === 'undefined') return 'unsupported';
  if (installed || isStandalone()) return 'installed';
  if (deferred) return 'prompt';
  if (IN_APP_BROWSER.test(navigator.userAgent)) return 'in-app';
  if (isIos()) return 'ios';
  return 'manual';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePwaInstall(): { hint: InstallHint; install: () => Promise<boolean> } {
  const hint = useSyncExternalStore(subscribe, getHint, () => 'unsupported' as InstallHint);
  return { hint, install };
}

async function install(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // 한 번 띄운 이벤트는 다시 쓸 수 없다
  deferred = null;
  emit();
  return outcome === 'accepted';
}

const DISMISS_KEY = 'tj-install-card-dismissed';

export function isInstallCardDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissInstallCard() {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // 저장할 수 없으면 이번 실행 동안만 닫힌다
  }
}
