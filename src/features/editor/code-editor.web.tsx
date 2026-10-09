import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { EDITOR_HTML } from './editor-html.generated';
import type { CodeEditorHandle, CodeEditorProps, EditorOutMessage } from './types';

/** CodeMirror 6 기반 코드 에디터 (웹: iframe) */
export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { initialDoc, language, scheme, fontSize, onChange, onFocusChange, onReady },
  ref,
) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const docRequests = useRef(new Map<number, (doc: string) => void>());
  const reqSeq = useRef(0);
  const lastDoc = useRef(initialDoc);
  const latest = useRef({ initialDoc, language, scheme, fontSize, onChange, onFocusChange, onReady });
  latest.current = { initialDoc, language, scheme, fontSize, onChange, onFocusChange, onReady };

  const send = useCallback((msg: object) => {
    if (!ready.current) return;
    frame.current?.contentWindow?.postMessage({ __tjHost: true, ...msg }, '*');
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
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const msg = e.data as EditorOutMessage & { __tjEditor?: boolean };
      if (!msg || !msg.__tjEditor) return;
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
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [send]);

  useEffect(() => {
    send({ type: 'setLanguage', language });
  }, [language, send]);

  useEffect(() => {
    send({ type: 'setTheme', scheme, fontSize });
  }, [scheme, fontSize, send]);

  return (
    <iframe
      ref={frame}
      title="코드 편집기"
      srcDoc={EDITOR_HTML}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        backgroundColor: scheme === 'dark' ? '#14181D' : '#FFFFFF',
      }}
    />
  );
});
