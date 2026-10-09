import type { SolveLanguage } from '@/content/types';
import type { ColorScheme } from '@/theme/tokens';

export interface CodeEditorHandle {
  insert: (text: string) => void;
  insertPair: (open: string, close: string) => void;
  indent: () => void;
  outdent: () => void;
  undo: () => void;
  redo: () => void;
  blur: () => void;
  focus: () => void;
  setDoc: (doc: string) => void;
  /** 에디터의 현재 코드 (디바운스 없이) */
  getDoc: () => Promise<string>;
}

export interface CodeEditorProps {
  initialDoc: string;
  language: SolveLanguage;
  scheme: ColorScheme;
  fontSize: number;
  onChange: (doc: string) => void;
  onFocusChange?: (focused: boolean) => void;
  onReady?: () => void;
}

export type EditorOutMessage =
  | { type: 'ready' }
  | { type: 'change'; doc: string }
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'doc'; reqId: number; doc: string };
