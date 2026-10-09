/**
 * 광고 진입점 (iOS · Android). 웹은 index.web.tsx.
 * 광고 SDK 는 네이티브 모듈이라 Expo Go 에는 없으므로, 그때는 광고 없이 동작한다.
 */
import { isRunningInExpoGo } from 'expo';

import type * as Google from './google';

export { useAds } from './store';

function loadGoogle(): typeof Google | null {
  if (isRunningInExpoGo()) return null;
  try {
    // 네이티브 모듈이 없는 빌드에서도 앱이 죽지 않도록 필요할 때만 불러온다
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./google') as typeof Google;
  } catch (e) {
    console.warn('[ads] 광고 모듈을 불러오지 못했습니다. 개발 빌드를 다시 만들어주세요.', e);
    return null;
  }
}

const google = loadGoogle();

function NoBanner() {
  return null;
}

export const AdBanner = google?.AdBanner ?? NoBanner;

/** 광고를 준비한다 (동의 → 추적 권한 → SDK 초기화). 여러 번 불러도 한 번만 실행된다. */
export function startAds() {
  void google?.startAds();
}

/** 학습 세션을 마친 지점에서 부른다. 조건이 맞으면 전면 광고를 띄우고, 닫힌 뒤 then 을 실행한다. */
export function showInterstitialAtBreak(then: () => void) {
  if (google) google.showInterstitialAtBreak(then);
  else then();
}

export function openAdPrivacyOptions(): Promise<void> {
  return google?.openAdPrivacyOptions() ?? Promise.resolve();
}
