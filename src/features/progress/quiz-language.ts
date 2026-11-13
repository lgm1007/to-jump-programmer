import type { OutputLanguage } from '@/content';

import { isOutputLanguage } from './code-variant';
import { defaultQuizCodeLanguage } from './course';
import { useProgress } from './store';

/** 출력 맞추기 퀴즈에서 보여줄 코드 언어 — 고른 언어가 있으면 그것, 없으면 코스에 맞춘 기본 언어. 바꾸면 다음 문제 · 다음 실행에도 이어진다 */
export function useQuizCodeLanguage() {
  const saved = useProgress((s) => s.settings.quizCodeLanguage);
  const profile = useProgress((s) => s.profile);
  const updateSettings = useProgress((s) => s.updateSettings);
  // 백업에서 되살린 값이 4개 언어가 아니면 코스 기본 언어로
  const language = isOutputLanguage(saved) ? saved : defaultQuizCodeLanguage(profile);
  const setLanguage = (next: OutputLanguage) => updateSettings({ quizCodeLanguage: next });
  return { language, setLanguage };
}
