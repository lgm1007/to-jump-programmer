import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type AdPlacement = 'banner' | 'interstitial';

type UnitIds = Partial<Record<AdPlacement, { android?: string; ios?: string }>>;

/** app.config.ts 가 환경 변수(ADMOB_*)로 채워 넣는 실제 광고 단위 ID */
const LIVE_UNITS = (Constants.expoConfig?.extra?.adUnits ?? {}) as UnitIds;

/**
 * 실서비스 광고 단위 ID. 개발 중이거나 설정되지 않았으면 null → Google 테스트 광고를 쓴다.
 * (개발 중 실제 광고를 누르면 무효 트래픽으로 계정이 정지될 수 있다)
 */
export function liveUnitId(placement: AdPlacement): string | null {
  if (__DEV__) return null;
  const os = Platform.OS === 'ios' ? 'ios' : 'android';
  return LIVE_UNITS[placement]?.[os] ?? null;
}

/** 전면 광고 노출 규칙 — 학습 흐름을 끊지 않도록 보수적으로 잡는다 */
export const INTERSTITIAL_POLICY = {
  /** 앱 실행 직후와 직전 전면 광고 이후 이 시간 동안은 띄우지 않는다 */
  minIntervalMs: 3 * 60 * 1000,
  /** 학습 세션을 이 횟수만큼 마칠 때마다 한 번 */
  everyNthBreak: 2,
} as const;
