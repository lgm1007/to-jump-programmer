/**
 * 출력 맞추기 퀴즈의 코드 언어 고르기 — 문제마다 대표 언어(`code`)와 다른 언어 버전(`variants`)이 있고,
 * 사용자가 고른 언어 버전이 있으면 그 코드 · 보기 · 해설로 바꿔 보여준다.
 * 퀴즈 화면 · 결과 · 오답 노트가 모두 이 함수를 거쳐 문제를 읽는다(화면에서 `q.code` · 보기 · 해설을 직접 읽지 않는다).
 * React Native 를 가져오지 않으므로 Node 테스트(scripts/test-core.ts)에서도 쓴다.
 */
import type { CodeLanguage, OutputLanguage, QuizQuestion } from '@/content/types';

/** 선택 UI 에 보여 줄 순서 */
export const OUTPUT_LANGUAGES: OutputLanguage[] = ['python', 'javascript', 'java', 'kotlin'];

export const isOutputLanguage = (l: CodeLanguage | string | undefined): l is OutputLanguage =>
  OUTPUT_LANGUAGES.includes(l as OutputLanguage);

export interface ResolvedQuestion {
  /** 고른 언어 버전으로 바꾼 문제 (버전이 없으면 원래 문제) */
  question: QuizQuestion;
  /** 지금 보여 주는 코드 언어 — 코드가 없거나 4개 언어가 아니면 undefined */
  language?: OutputLanguage;
  /** 바꿔 볼 수 있는 언어 (대표 언어 + 다른 언어 버전, 선택 UI 순서). 2개 이상일 때만 선택 UI 를 그린다 */
  languages: OutputLanguage[];
  /** 고른 언어 버전이 없어 대표 언어로 보여 주는지 ("이 문제는 Python 으로만 제공돼요") */
  fallback: boolean;
  /** 보기 구성 시드 키 — 언어 버전이 보기를 바꾸면 언어를 넣어, 같은 언어로 보는 동안은 보기 구성이 그대로다 */
  shuffleKey: string;
}

/** 문제를 `language` 버전으로 바꾼다. 그 언어 버전이 없으면 원래 문제 그대로 */
export function resolveQuestionVariant(q: QuizQuestion, language: OutputLanguage | undefined): ResolvedQuestion {
  const base = isOutputLanguage(q.code?.language) ? q.code.language : undefined;
  const variants = base ? (q.variants ?? {}) : {};
  const languages = OUTPUT_LANGUAGES.filter((l) => l === base || variants[l]);
  const v = language && language !== base ? variants[language] : undefined;
  if (!v || !language) {
    return { question: q, language: base, languages, fallback: !!base && !!language && language !== base, shuffleKey: q.id };
  }
  const shared = {
    code: v.code,
    output: v.output ?? q.output,
    prompt: v.prompt ?? q.prompt,
    explanation: v.explanation ?? q.explanation,
  };
  let question: QuizQuestion;
  let optionsChanged = false;
  if (q.type === 'ox') {
    question = { ...q, ...shared, answer: typeof v.answer === 'boolean' ? v.answer : q.answer };
    optionsChanged = typeof v.answer === 'boolean' && v.answer !== q.answer;
  } else if (q.correct !== undefined) {
    question = { ...q, ...shared, correct: v.correct ?? q.correct, distractors: v.distractors ?? q.distractors };
    optionsChanged = v.correct !== undefined || v.distractors !== undefined;
  } else {
    question = { ...q, ...shared, choices: v.choices ?? q.choices, answer: typeof v.answer === 'number' ? v.answer : q.answer };
    optionsChanged = v.choices !== undefined || typeof v.answer === 'number';
  }
  return { question, language, languages, fallback: false, shuffleKey: optionsChanged ? `${q.id}@${language}` : q.id };
}
