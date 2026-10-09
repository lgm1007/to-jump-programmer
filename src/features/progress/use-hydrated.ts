import { useEffect, useState } from 'react';

import { useDrafts, useProgress } from './store';

/** 저장소가 응답하지 않을 때 무한 스플래시를 막기 위한 최대 대기 시간 */
const HYDRATION_TIMEOUT_MS = 4000;

/** AsyncStorage 에서 학습 기록을 모두 불러왔는지 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    () => useProgress.persist.hasHydrated() && useDrafts.persist.hasHydrated(),
  );
  useEffect(() => {
    // 한 번 준비되면 되돌리지 않는다 (타임아웃 이후 늦게 끝난 복원으로 화면이 사라지지 않게)
    const check = () =>
      setHydrated((prev) => prev || (useProgress.persist.hasHydrated() && useDrafts.persist.hasHydrated()));
    const unsubs = [useProgress.persist.onFinishHydration(check), useDrafts.persist.onFinishHydration(check)];
    check();
    const timer = setTimeout(() => setHydrated(true), HYDRATION_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
      unsubs.forEach((u) => u());
    };
  }, []);
  return hydrated;
}
