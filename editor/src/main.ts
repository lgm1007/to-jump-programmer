/**
 * 앱 내장 코드 에디터 (CodeMirror 6).
 * scripts/build-editor.mjs 가 이 파일을 번들링해 src/features/editor/editor-html.generated.ts 로 만든다.
 *
 * 메시지 프로토콜
 *   앱 → 에디터: init / setDoc / setLanguage / setTheme / insert / insertPair / indent / undo / redo / blur / focus / getDoc
 *   에디터 → 앱: ready / change / focus / blur / doc
 */
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore, indentWithTab, redo, undo } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

type Lang = 'python' | 'java' | 'cpp' | 'javascript';
type Scheme = 'light' | 'dark';

interface InMessage {
  type: string;
  doc?: string;
  language?: Lang;
  scheme?: Scheme;
  fontSize?: number;
  text?: string;
  open?: string;
  close?: string;
  reqId?: number;
}

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
    __tjReceive?: (msg: InMessage) => void;
  }
}

function post(msg: Record<string, unknown>) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  else window.parent?.postMessage({ __tjEditor: true, ...msg }, '*');
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const PALETTE = {
  light: {
    bg: '#FFFFFF',
    fg: '#1F2328',
    gutter: '#8C959F',
    gutterBg: '#FFFFFF',
    activeLine: '#F3F6FA',
    selection: '#CFE3FF',
    cursor: '#3182F6',
    keyword: '#CF222E',
    string: '#0A3069',
    comment: '#6E7781',
    number: '#0550AE',
    func: '#8250DF',
    type: '#953800',
    meta: '#116329',
    matching: '#D4E8FF',
  },
  dark: {
    bg: '#14181D',
    fg: '#E6EDF3',
    gutter: '#6E7681',
    gutterBg: '#14181D',
    activeLine: '#1C2128',
    selection: '#264F78',
    cursor: '#4D94FF',
    keyword: '#FF7B72',
    string: '#A5D6FF',
    comment: '#8B949E',
    number: '#79C0FF',
    func: '#D2A8FF',
    type: '#FFA657',
    meta: '#7EE787',
    matching: '#2F3B4A',
  },
};

function highlightFor(scheme: Scheme) {
  const p = PALETTE[scheme];
  return HighlightStyle.define([
    { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword, t.modifier], color: p.keyword },
    { tag: [t.string, t.special(t.string), t.character, t.regexp], color: p.string },
    { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: p.comment, fontStyle: 'italic' },
    { tag: [t.number, t.bool, t.null, t.atom], color: p.number },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: p.func },
    { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: p.type },
    { tag: [t.meta, t.annotation, t.processingInstruction], color: p.meta },
    { tag: [t.self, t.special(t.variableName)], color: p.keyword },
  ]);
}

function themeFor(scheme: Scheme, fontSize: number) {
  const p = PALETTE[scheme];
  return [
    EditorView.theme(
      {
        '&': { backgroundColor: p.bg, color: p.fg, height: '100%', fontSize: `${fontSize}px` },
        '&.cm-focused': { outline: 'none' },
        '.cm-scroller': { fontFamily: MONO, lineHeight: '1.6', overscrollBehavior: 'contain' },
        '.cm-content': { caretColor: p.cursor, padding: '10px 0 40vh 0' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: p.cursor, borderLeftWidth: '2px' },
        '.cm-gutters': { backgroundColor: p.gutterBg, color: p.gutter, border: 'none', paddingLeft: '4px' },
        '.cm-activeLine': { backgroundColor: p.activeLine },
        '.cm-activeLineGutter': { backgroundColor: p.activeLine, color: p.fg },
        '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection':
          { backgroundColor: `${p.selection} !important` },
        '.cm-matchingBracket': { backgroundColor: p.matching, outline: 'none' },
        '.cm-tooltip': { backgroundColor: p.bg, border: `1px solid ${p.gutter}` },
        '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: p.selection, color: p.fg },
      },
      { dark: scheme === 'dark' },
    ),
    syntaxHighlighting(highlightFor(scheme)),
  ];
}

function languageFor(lang: Lang) {
  switch (lang) {
    case 'python':
      return python();
    case 'java':
      return java();
    case 'cpp':
      return cpp();
    default:
      return javascript();
  }
}

const languageConf = new Compartment();
const themeConf = new Compartment();
let view: EditorView | null = null;
let scheme: Scheme = 'light';
let fontSize = 14;
let changeTimer: ReturnType<typeof setTimeout> | null = null;

function emitChange() {
  if (changeTimer) clearTimeout(changeTimer);
  changeTimer = setTimeout(() => {
    if (view) post({ type: 'change', doc: view.state.doc.toString() });
  }, 250);
}

let language: Lang = 'python';

function createState(doc: string): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion({ activateOnTyping: false }),
      indentUnit.of('    '),
      EditorState.tabSize.of(4),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
      languageConf.of(languageFor(language)),
      themeConf.of(themeFor(scheme, fontSize)),
      EditorView.contentAttributes.of({
        autocapitalize: 'off',
        autocorrect: 'off',
        autocomplete: 'off',
        spellcheck: 'false',
        'aria-label': '코드 편집기',
      }),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) emitChange();
        if (u.focusChanged) post({ type: u.view.hasFocus ? 'focus' : 'blur' });
      }),
    ],
  });
}

function init(msg: InMessage) {
  scheme = msg.scheme ?? 'light';
  fontSize = msg.fontSize ?? 14;
  language = msg.language ?? 'python';
  document.body.style.backgroundColor = PALETTE[scheme].bg;
  view?.destroy();
  view = new EditorView({ parent: document.getElementById('editor')!, state: createState(msg.doc ?? '') });
}

function replaceSelection(open: string, close = '') {
  if (!view) return;
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: { from, to, insert: open + selected + close },
    selection: { anchor: from + open.length + selected.length },
    scrollIntoView: true,
    userEvent: 'input',
  });
  view.focus();
}

function handle(msg: InMessage) {
  switch (msg.type) {
    case 'init':
      init(msg);
      break;
    case 'setDoc':
      // 언어 전환·초기화: 실행 취소 기록까지 새로 시작해 다른 언어의 코드가 되살아나지 않게 한다
      if (view) {
        view.setState(createState(msg.doc ?? ''));
        emitChange();
      }
      break;
    case 'setLanguage':
      language = msg.language ?? language;
      view?.dispatch({ effects: languageConf.reconfigure(languageFor(language)) });
      break;
    case 'setTheme':
      scheme = msg.scheme ?? scheme;
      fontSize = msg.fontSize ?? fontSize;
      document.body.style.backgroundColor = PALETTE[scheme].bg;
      view?.dispatch({ effects: themeConf.reconfigure(themeFor(scheme, fontSize)) });
      break;
    case 'insert':
      replaceSelection(msg.text ?? '');
      break;
    case 'insertPair':
      replaceSelection(msg.open ?? '', msg.close ?? '');
      break;
    case 'indent':
      if (view) {
        const sel = view.state.selection.main;
        if (sel.empty) replaceSelection('    ');
        else indentMore(view);
        view.focus();
      }
      break;
    case 'outdent':
      if (view) {
        indentLess(view);
        view.focus();
      }
      break;
    case 'undo':
      if (view) undo(view);
      break;
    case 'redo':
      if (view) redo(view);
      break;
    case 'blur':
      view?.contentDOM.blur();
      break;
    case 'focus':
      view?.focus();
      break;
    case 'getDoc':
      post({ type: 'doc', reqId: msg.reqId, doc: view ? view.state.doc.toString() : '' });
      break;
  }
}

window.__tjReceive = handle;
window.addEventListener('message', (e: MessageEvent) => {
  const data = e.data as InMessage & { __tjHost?: boolean };
  if (data && typeof data === 'object' && data.__tjHost) handle(data);
});
post({ type: 'ready' });
