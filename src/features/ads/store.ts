import { create } from 'zustand';

export type AdsStatus = 'off' | 'starting' | 'ready';

interface AdsState {
  /** ready 가 되어야 광고를 요청한다 (동의 확인 → SDK 초기화 완료) */
  status: AdsStatus;
  /** EEA 등에서 동의를 다시 고를 수 있는 진입점(설정 화면)이 필요한지 */
  privacyOptionsRequired: boolean;
}

/** 광고 상태 — 매 실행마다 새로 확인하므로 저장하지 않는다 */
export const useAds = create<AdsState>(() => ({ status: 'off', privacyOptionsRequired: false }));
