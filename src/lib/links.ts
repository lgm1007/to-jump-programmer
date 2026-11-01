import { router, type Href } from 'expo-router';
import { Linking, Platform, type GestureResponderEvent } from 'react-native';

export { GITHUB_URL } from '@/content/legal';

/** 외부 링크 열기 — 웹(PWA)은 학습 화면을 벗어나지 않도록 새 탭, 앱은 기본 브라우저 */
export function openExternal(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  void Linking.openURL(url).catch(() => {});
}

/**
 * 앱 안 주소('/interview/lesson/cs-os-l01')를 웹 `<a href>` 값으로 — 정적 페이지 · sitemap(scripts/lib/prerender.ts)과
 * 같은 / 로 끝나는 주소로 만들고, 하위 경로 배포(TJ_WEB_BASE_URL → experiments.baseUrl)면 그 경로를 붙인다 (expo-router Link 와 같은 규칙)
 */
export function webHref(path: string): string {
  const base = process.env.NODE_ENV !== 'development' ? (process.env.EXPO_BASE_URL ?? '').replace(/^\/+|\/+$/g, '') : '';
  const page = path.replace(/\/+$/, '');
  return `${base ? `/${base}` : ''}${page}/`;
}

/** 웹에서 보조 키(새 탭 · 새 창)나 왼쪽이 아닌 버튼으로 누른 링크 — 브라우저 기본 동작에 맡긴다 */
function opensInBrowser(e?: GestureResponderEvent): boolean {
  if (Platform.OS !== 'web' || !e) return false;
  // RN Web 은 onPress 에 click 이벤트(MouseEvent)를 그대로 넘긴다
  const m = e as unknown as Partial<MouseEvent>;
  return !!(m.metaKey || m.ctrlKey || m.shiftKey || m.altKey) || (m.button != null && m.button !== 0);
}

/**
 * 콘텐츠 화면으로 가는 링크의 Pressable 속성. 웹에서는 `<a href>` 로 그려 검색 · 광고 심사 크롤러가 화면 사이를 따라갈 수 있게 하고,
 * 그냥 누르면 페이지를 새로 불러오지 않고 앱 안에서 이동한다. onPress 를 주면 이동은 onPress 가 맡는다 (학습 완료 처리 후 이동 등)
 */
export function linkProps(
  href: string,
  { replace, onPress }: { replace?: boolean; onPress?: (e: GestureResponderEvent) => void } = {},
) {
  return {
    onPress: (e: GestureResponderEvent) => {
      if (opensInBrowser(e)) return;
      e?.preventDefault?.();
      if (onPress) onPress(e);
      else if (replace) router.replace(href as Href);
      else router.push(href as Href);
    },
    // RN Web 은 href 가 있는 View(Pressable)를 <a> 로 그린다. 네이티브 타입에는 없는 속성이라 웹에서만 넘긴다
    webProps: Platform.OS === 'web' ? ({ href: webHref(href) } as object) : {},
  };
}
