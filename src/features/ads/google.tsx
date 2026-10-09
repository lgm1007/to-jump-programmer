/**
 * Google AdMob 연동 (react-native-google-mobile-ads).
 * 네이티브 모듈이 필요하므로 index.tsx 가 개발 빌드·스토어 빌드에서만 불러온다. (Expo Go·웹 제외)
 *
 * 초기화 순서: 동의 확인(UMP) → iOS 앱 추적 투명성(ATT) → SDK 초기화 → 광고 요청
 */
import { setStatusBarHidden } from 'expo-status-bar';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  MaxAdContentRating,
  TestIds,
  useForeground,
  type AdsConsentInfo,
} from 'react-native-google-mobile-ads';

import { useColors } from '@/theme/theme-provider';

import { INTERSTITIAL_POLICY, liveUnitId } from './config';
import { useAds } from './store';

const UNIT_IDS = {
  banner: liveUnitId('banner') ?? TestIds.ADAPTIVE_BANNER,
  interstitial: liveUnitId('interstitial') ?? TestIds.INTERSTITIAL,
};

const RETRY_MIN_MS = 30_000;
const RETRY_MAX_MS = 10 * 60_000;
const BANNER_RETRY_MS = 60_000;

let starting: Promise<void> | null = null;

/** 광고를 준비한다. 여러 번 불러도 한 번만 실행된다. */
export function startAds(): Promise<void> {
  starting ??= initialize().catch((e: unknown) => {
    console.warn('[ads] 초기화 실패', e);
    useAds.setState({ status: 'off' });
  });
  return starting;
}

async function initialize() {
  useAds.setState({ status: 'starting' });

  // 1) 동의 — EEA·영국·스위스 사용자에게만 양식이 뜬다. 실패하면 지난 실행의 동의 상태를 쓴다.
  const info = await AdsConsent.gatherConsent().catch(() => AdsConsent.getConsentInfo().catch(() => null));
  syncConsent(info);
  if (!info?.canRequestAds) {
    useAds.setState({ status: 'off' });
    return;
  }

  // 2) iOS 앱 추적 투명성 — 거부해도 비맞춤형 광고는 그대로 나온다
  if (Platform.OS === 'ios') await requestTracking();

  // 3) SDK 초기화 (요청 설정은 초기화 전에). 앱 연령 등급(전체 이용가)에 맞게 광고 콘텐츠 등급을 제한한다.
  await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG });
  await mobileAds().initialize();
  useAds.setState({ status: 'ready' });
  loadInterstitial();
}

function syncConsent(info: AdsConsentInfo | null) {
  useAds.setState({
    privacyOptionsRequired: info?.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
  });
}

async function requestTracking() {
  try {
    // GDPR 지역에서 기기 정보 저장·접근(목적 1)에 동의하지 않았다면 추적 권한을 묻지 않는다
    if (await AdsConsent.getGdprApplies()) {
      const purposes = await AdsConsent.getPurposeConsents();
      if (!purposes.startsWith('1')) return;
    }
    const { status } = await getTrackingPermissionsAsync();
    if (status !== PermissionStatus.UNDETERMINED) return;
    // iOS 는 앱이 활성 상태일 때만 팝업을 띄운다 (실행 직후에 요청하면 팝업 없이 지나갈 수 있다)
    await whenActive();
    await requestTrackingPermissionsAsync();
  } catch {
    // 권한 요청이 실패해도 광고는 비맞춤형으로 나온다
  }
}

function whenActive(): Promise<void> {
  if (AppState.currentState === 'active') return Promise.resolve();
  return new Promise((resolve) => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      sub.remove();
      resolve();
    });
  });
}

/** 광고 개인정보 옵션(동의 변경) 양식을 연다 — EEA 등 필요한 지역에서만 설정 화면에 노출 */
export async function openAdPrivacyOptions(): Promise<void> {
  syncConsent(await AdsConsent.showPrivacyOptionsForm());
}

// ─── 전면 광고 ──────────────────────────────────────────

let interstitial: InterstitialAd | null = null;
let afterClose: (() => void) | null = null;
let lastShownAt = Date.now();
let breaks = 0;
let retryMs = RETRY_MIN_MS;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

function finishBreak() {
  const then = afterClose;
  afterClose = null;
  then?.();
}

function loadInterstitial() {
  if (!interstitial) {
    const ad = InterstitialAd.createForAdRequest(UNIT_IDS.interstitial);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      retryMs = RETRY_MIN_MS;
    });
    ad.addAdEventListener(AdEventType.ERROR, (error) => {
      if (error.phase === 'show') finishBreak();
      // 재고 없음·네트워크 오류 — 간격을 늘려가며 다시 요청한다
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => ad.load(), retryMs);
      retryMs = Math.min(retryMs * 2, RETRY_MAX_MS);
    });
    ad.addAdEventListener(AdEventType.OPENED, () => {
      // iOS: 상태 표시줄이 광고의 닫기 버튼을 가리지 않게 숨긴다
      if (Platform.OS === 'ios') setStatusBarHidden(true, 'none');
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (Platform.OS === 'ios') setStatusBarHidden(false, 'none');
      finishBreak();
      ad.load();
    });
    interstitial = ad;
  }
  interstitial.load();
}

/**
 * 학습 세션을 마친 지점(자연스러운 쉼표)에서 부른다.
 * 노출 규칙(INTERSTITIAL_POLICY)을 만족하고 광고가 준비되어 있으면 전면 광고를 띄우고 닫힌 뒤 then 을,
 * 아니면 바로 then 을 실행한다.
 */
export function showInterstitialAtBreak(then: () => void) {
  breaks += 1;
  const ad = interstitial;
  const due =
    breaks % INTERSTITIAL_POLICY.everyNthBreak === 0 && Date.now() - lastShownAt >= INTERSTITIAL_POLICY.minIntervalMs;
  if (!ad?.loaded || !due || afterClose) {
    then();
    return;
  }
  afterClose = then;
  lastShownAt = Date.now();
  ad.show().catch(() => finishBreak());
}

// ─── 배너 ──────────────────────────────────────────────

/** 하단 고정 배너(적응형). 광고가 준비되기 전이나 불러오지 못하면 공간을 차지하지 않는다. */
export function AdBanner() {
  const c = useColors();
  const ready = useAds((s) => s.status === 'ready');
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<BannerAd>(null);
  const retry = useRef<{ timer?: ReturnType<typeof setTimeout> }>({});

  // iOS 는 백그라운드에서 광고 WebView 가 종료되면 빈 배너가 남으므로 복귀할 때 다시 요청한다
  useForeground(() => {
    if (Platform.OS === 'ios') ref.current?.load();
  });
  useEffect(() => {
    const r = retry.current;
    return () => clearTimeout(r.timer);
  }, []);

  if (!ready) return null;
  return (
    <View style={loaded && [styles.slot, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <BannerAd
        ref={ref}
        unitId={UNIT_IDS.banner}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => {
          clearTimeout(retry.current.timer);
          retry.current.timer = setTimeout(() => ref.current?.load(), BANNER_RETRY_MS);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});
