import { useEffect, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';

/**
 * 소프트 키보드 높이 (숨김이면 0).
 * Android 는 edge-to-edge 라서 창이 줄어들지 않으므로 화면에서 직접 여백을 준다.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) => setHeight(e.endCoordinates?.height ?? 0);
    const onHide = () => setHeight(0);
    const subs = [
      Keyboard.addListener(showEvent, onShow),
      Keyboard.addListener(hideEvent, onHide),
      Keyboard.addListener('keyboardDidChangeFrame', (e) => {
        if (Platform.OS === 'ios' && e.endCoordinates) setHeight((h) => (h > 0 ? e.endCoordinates.height : h));
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);
  return height;
}
