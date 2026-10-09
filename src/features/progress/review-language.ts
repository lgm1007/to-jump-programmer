import { reviewLanguages, type CodeLanguage, type FrameworkId, type SolveLanguage } from '@/content';

import { useProgress } from './store';

/**
 * 코드 리뷰에서 보여줄 코드 언어.
 * 직접 고른 언어 → 풀이 언어(그 프레임워크가 지원하면, 예: Kotlin 으로 푸는 사람은 Spring 도 Kotlin) → 프레임워크 대표 언어
 */
export function pickReviewLanguage(
  framework: FrameworkId,
  saved: CodeLanguage | undefined,
  solveLanguage: SolveLanguage,
): CodeLanguage {
  const languages = reviewLanguages(framework);
  if (saved && languages.includes(saved)) return saved;
  if (languages.includes(solveLanguage)) return solveLanguage;
  return languages[0];
}

/** 화면 밖(목록 제목 등)에서 쓰는 현재 선택 언어 */
export function useReviewLanguageMap(): (framework: FrameworkId) => CodeLanguage {
  const saved = useProgress((s) => s.settings.reviewLanguage);
  const solveLanguage = useProgress((s) => s.profile.language);
  return (framework) => pickReviewLanguage(framework, saved?.[framework], solveLanguage);
}

export function useReviewLanguage(framework: FrameworkId) {
  const saved = useProgress((s) => s.settings.reviewLanguage?.[framework]);
  const solveLanguage = useProgress((s) => s.profile.language);
  const updateSettings = useProgress((s) => s.updateSettings);
  const language = pickReviewLanguage(framework, saved, solveLanguage);
  const setLanguage = (next: CodeLanguage) =>
    updateSettings({ reviewLanguage: { ...useProgress.getState().settings.reviewLanguage, [framework]: next } });
  return { language, languages: reviewLanguages(framework), setLanguage };
}
