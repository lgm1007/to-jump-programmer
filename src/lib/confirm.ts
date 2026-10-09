import { Alert, Platform } from 'react-native';

/** 확인/취소 대화상자 (웹에서는 window.confirm) */
export function confirmAsync(title: string, message: string, okText = '확인', destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: okText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** 단순 알림 */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
