import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { sandbox, type SandboxEvent } from './sandbox/client';
import { RUNNER_HTML } from './sandbox/runner-html';

/**
 * 코드 실행용 숨김 WebView (네이티브).
 * 앱 전체에서 하나만 유지해 Python 런타임을 재사용한다.
 * WebView 프로세스가 죽으면 (Android 는 같은 WebView 를 재사용할 수 없으므로) key 를 바꿔 새로 만든다.
 */
export function RunnerHost() {
  const ref = useRef<WebView>(null);
  const [generation, setGeneration] = useState(0);

  const restart = useCallback(() => {
    sandbox.detach();
    setGeneration((g) => g + 1);
  }, []);

  useEffect(() => sandbox.onRestartRequest(restart), [restart]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let msg: SandboxEvent;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      sandbox.attach((m) => {
        ref.current?.injectJavaScript(`window.__tjReceive && window.__tjReceive(${JSON.stringify(m)}); true;`);
      });
      return;
    }
    sandbox.receive(msg);
  }, []);

  return (
    <View pointerEvents="none" style={styles.hidden} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WebView
        key={generation}
        ref={ref}
        source={{ html: RUNNER_HTML, baseUrl: 'https://localhost/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        onMessage={onMessage}
        onContentProcessDidTerminate={restart}
        onRenderProcessGone={restart}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10, overflow: 'hidden' },
  webview: { width: 1, height: 1, backgroundColor: 'transparent' },
});
