import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { EDITOR_HTML } from './editor-html.generated';
import type { CodeEditorHandle, CodeEditorProps, EditorOutMessage } from './types';

/** CodeMirror 6 기반 코드 에디터 (네이티브: WebView) */
export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { initialDoc, language, scheme, fontSize, onChange, onFocusChange, onReady },
  ref,
) {
  const webview = useRef<WebView>(null);
  const ready = useRef(false);
  const [generation, setGeneration] = useState(0);
  const docRequests = useRef(new Map<number, (doc: string) => void>());
  const reqSeq = useRef(0);
  const lastDoc = useRef(initialDoc);
  const latest = useRef({ initialDoc, language, scheme, fontSize, onChange, onFocusChange, onReady });
  latest.current = { initialDoc, language, scheme, fontSize, onChange, onFocusChange, onReady };

  const send = useCallback((msg: object) => {
    if (!ready.current) return;
    webview.current?.injectJavaScript(`window.__tjReceive && window.__tjReceive(${JSON.stringify(msg)}); true;`);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      insert: (text) => send({ type: 'insert', text }),
      insertPair: (open, close) => send({ type: 'insertPair', open, close }),
      indent: () => send({ type: 'indent' }),
      outdent: () => send({ type: 'outdent' }),
      undo: () => send({ type: 'undo' }),
      redo: () => send({ type: 'redo' }),
      blur: () => send({ type: 'blur' }),
      focus: () => send({ type: 'focus' }),
      setDoc: (doc) => {
        lastDoc.current = doc;
        send({ type: 'setDoc', doc });
      },
      getDoc: () =>
        new Promise<string>((resolve) => {
          if (!ready.current) {
            resolve(lastDoc.current);
            return;
          }
          const reqId = ++reqSeq.current;
          const timer = setTimeout(() => {
            docRequests.current.delete(reqId);
            resolve(lastDoc.current);
          }, 1500);
          docRequests.current.set(reqId, (doc) => {
            clearTimeout(timer);
            resolve(doc);
          });
          send({ type: 'getDoc', reqId });
        }),
    }),
    [send],
  );

  useEffect(() => {
    send({ type: 'setLanguage', language });
  }, [language, send]);

  useEffect(() => {
    send({ type: 'setTheme', scheme, fontSize });
  }, [scheme, fontSize, send]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: EditorOutMessage;
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      const l = latest.current;
      switch (msg.type) {
        case 'ready':
          ready.current = true;
          // 재시작(프로세스 종료 후 재로드)된 경우에도 마지막 코드로 복원한다
          send({ type: 'init', doc: lastDoc.current, language: l.language, scheme: l.scheme, fontSize: l.fontSize });
          l.onReady?.();
          break;
        case 'change':
          lastDoc.current = msg.doc;
          l.onChange(msg.doc);
          break;
        case 'focus':
          l.onFocusChange?.(true);
          break;
        case 'blur':
          l.onFocusChange?.(false);
          break;
        case 'doc': {
          const resolve = docRequests.current.get(msg.reqId);
          docRequests.current.delete(msg.reqId);
          lastDoc.current = msg.doc;
          resolve?.(msg.doc);
          break;
        }
      }
    },
    [send],
  );

  return (
    <WebView
      key={generation}
      ref={webview}
      source={{ html: EDITOR_HTML, baseUrl: 'https://localhost/' }}
      originWhitelist={['*']}
      onMessage={onMessage}
      javaScriptEnabled
      hideKeyboardAccessoryView
      keyboardDisplayRequiresUserAction={false}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      textInteractionEnabled
      setBuiltInZoomControls={false}
      onContentProcessDidTerminate={() => {
        ready.current = false;
        setGeneration((g) => g + 1);
      }}
      onRenderProcessGone={() => {
        // Android 는 프로세스가 죽은 WebView 를 재사용할 수 없으므로 새로 만든다
        ready.current = false;
        setGeneration((g) => g + 1);
      }}
      style={[styles.webview, { backgroundColor: scheme === 'dark' ? '#14181D' : '#FFFFFF' }]}
    />
  );
});

const styles = StyleSheet.create({
  webview: { flex: 1 },
});
