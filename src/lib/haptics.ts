import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useProgress } from '@/features/progress/store';

type HapticKind = 'selection' | 'light' | 'success' | 'error' | 'warning';

/** 설정에서 끈 경우 / 웹에서는 무시 */
export function haptic(kind: HapticKind) {
  if (Platform.OS === 'web') return;
  if (!useProgress.getState().settings.haptics) return;
  try {
    switch (kind) {
      case 'selection':
        void Haptics.selectionAsync();
        break;
      case 'light':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'success':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  } catch {
    // 햅틱 미지원 기기
  }
}
