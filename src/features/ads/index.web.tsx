/** 웹에는 AdMob 이 없으므로 광고 없이 동작한다. (API 는 index.tsx 와 같다) */
export { useAds } from './store';

export function AdBanner() {
  return null;
}

export function startAds() {}

export function showInterstitialAtBreak(then: () => void) {
  then();
}

export function openAdPrivacyOptions(): Promise<void> {
  return Promise.resolve();
}
