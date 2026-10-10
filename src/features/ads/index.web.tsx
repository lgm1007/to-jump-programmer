/**
 * 웹 광고 (Google AdSense). API 는 앱(AdMob, index.tsx)과 같다.
 * - AdSense 코드와 사이트 소유 확인 태그는 웹 빌드가 index.html 에 넣는다 (scripts/build-web.mjs).
 *   EXPO_PUBLIC_ADSENSE_CLIENT · EXPO_PUBLIC_ADSENSE_SLOT 이 없으면(개발 서버 등) 광고 없이 동작한다.
 * - 광고는 탭 바 옆에 고정하지 않고 화면 콘텐츠 끝(AdSlot)에만 둔다. 메뉴·버튼 가까이에 둔 광고는
 *   실수 클릭을 부르는 배치로 AdSense 정책 위반이 될 수 있다.
 * - 화면을 옮겨 새 AdSlot 이 생길 때만 광고를 요청하고, 같은 자리를 시간에 따라 새로고침하지 않는다.
 * - 웹에는 전면 광고가 없으므로 학습을 마친 지점에서는 바로 다음 동작을 실행한다.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { spacing } from '@/theme/tokens';

export { useAds } from './store';

const CLIENT = process.env.EXPO_PUBLIC_ADSENSE_CLIENT;
const SLOT = process.env.EXPO_PUBLIC_ADSENSE_SLOT;

declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

/** 탭 바 위 고정 배너는 웹에서 쓰지 않는다 */
export function AdBanner() {
  return null;
}

/** 화면 콘텐츠 끝에 두는 광고 자리. 광고가 채워지지 않으면 공간을 차지하지 않는다 */
export function AdSlot() {
  const ref = useRef<HTMLModElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 개발 모드에서 effect 가 두 번 실행되어도 한 자리에 한 번만 요청한다
    if (!el.getAttribute('data-adsbygoogle-status')) {
      try {
        (window.adsbygoogle = window.adsbygoogle ?? []).push({});
      } catch {
        // 광고 차단 확장 프로그램 등으로 스크립트가 없으면 광고 없이 둔다
      }
    }
    const observer = new MutationObserver(() => setFilled(el.getAttribute('data-ad-status') === 'filled'));
    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });
    return () => observer.disconnect();
  }, []);

  if (!CLIENT || !SLOT) return null;
  return (
    <View style={styles.slot}>
      {filled && (
        <Text variant="small" color="textTertiary">
          광고
        </Text>
      )}
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </View>
  );
}

export function startAds() {}

export function showInterstitialAtBreak(then: () => void) {
  then();
}

/** EEA 등에서 AdSense 동의 메시지(Google CMP)를 설정했다면 사이트에 자체 "개인정보 설정" 링크가 표시된다 */
export function openAdPrivacyOptions(): Promise<void> {
  return Promise.resolve();
}

const styles = StyleSheet.create({
  slot: { gap: 4, marginTop: spacing.xl },
});
