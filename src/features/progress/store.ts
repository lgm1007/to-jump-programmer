import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FrameworkId, SolveLanguage } from '@/content/types';
import { dayKey } from '@/lib/date';

export type CareerGoal = 'new' | 'career';
export type ThemePreference = 'system' | 'light' | 'dark';
export type CardRating = 'again' | 'hard' | 'good';
export type BookmarkKind = 'question' | 'card' | 'problem' | 'pattern' | 'challenge';

export interface Profile {
  nickname: string;
  goal: CareerGoal;
  language: SolveLanguage;
  framework: FrameworkId;
  dailyGoal: number;
  onboarded: boolean;
}

export interface Settings {
  theme: ThemePreference;
  /** Piston 호환 원격 실행 서버 주소 (Java/C++ 실행용) */
  runnerUrl: string;
  editorFontSize: number;
  haptics: boolean;
}

export interface QuizRecord {
  attempts: number;
  correct: number;
  /** 가장 최근 풀이의 정답 여부 */
  last: boolean;
  lastAt: number;
}

export interface CardRecord {
  rating: CardRating;
  reviews: number;
  lastAt: number;
}

export interface ProblemRecord {
  solved: boolean;
  /** 최고 통과 테스트 수 / 전체 */
  bestPassed: number;
  total: number;
  submissions: number;
  language?: SolveLanguage;
  solvedAt?: number;
  lastAt: number;
}

export interface ChallengeRecord {
  /** 0~100 */
  score: number;
  best: number;
  attempts: number;
  note?: string;
  lastAt: number;
}

export interface DailyPlanRecord {
  key: string;
  questionIds: string[];
  problemId?: string;
  cardId?: string;
  review?: { kind: 'pattern' | 'challenge'; id: string };
}

interface ProgressData {
  profile: Profile;
  settings: Settings;
  quiz: Record<string, QuizRecord>;
  cards: Record<string, CardRecord>;
  problems: Record<string, ProblemRecord>;
  patterns: Record<string, number>;
  challenges: Record<string, ChallengeRecord>;
  bookmarks: Record<string, { kind: BookmarkKind; at: number }>;
  /** YYYY-MM-DD → 학습 횟수 */
  activity: Record<string, number>;
  /** 오늘의 추천 (하루 동안 고정) */
  daily: DailyPlanRecord | null;
}

interface ProgressActions {
  completeOnboarding: (profile: Omit<Profile, 'onboarded'>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  recordQuiz: (id: string, correct: boolean) => void;
  rateCard: (id: string, rating: CardRating) => void;
  recordSubmission: (id: string, result: { passed: number; total: number; language: SolveLanguage }) => void;
  markPatternRead: (id: string) => void;
  recordChallenge: (id: string, score: number, note?: string) => void;
  toggleBookmark: (id: string, kind: BookmarkKind) => void;
  setDaily: (plan: DailyPlanRecord) => void;
  resetProgress: () => void;
}

export type ProgressState = ProgressData & ProgressActions;

const DEFAULT_PROFILE: Profile = {
  nickname: '',
  goal: 'new',
  language: 'python',
  framework: 'spring',
  dailyGoal: 10,
  onboarded: false,
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  runnerUrl: process.env.EXPO_PUBLIC_RUNNER_URL ?? '',
  editorFontSize: 14,
  haptics: true,
};

const EMPTY_PROGRESS = {
  quiz: {},
  cards: {},
  problems: {},
  patterns: {},
  challenges: {},
  bookmarks: {},
  activity: {},
  daily: null,
} satisfies Omit<ProgressData, 'profile' | 'settings'>;

function bumpActivity(activity: Record<string, number>, by = 1): Record<string, number> {
  const key = dayKey();
  return { ...activity, [key]: (activity[key] ?? 0) + by };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      settings: DEFAULT_SETTINGS,
      ...EMPTY_PROGRESS,

      completeOnboarding: (profile) => set({ profile: { ...profile, onboarded: true } }),
      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      recordQuiz: (id, correct) =>
        set((s) => {
          const prev = s.quiz[id];
          return {
            quiz: {
              ...s.quiz,
              [id]: {
                attempts: (prev?.attempts ?? 0) + 1,
                correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
                last: correct,
                lastAt: Date.now(),
              },
            },
            activity: bumpActivity(s.activity),
          };
        }),

      rateCard: (id, rating) =>
        set((s) => ({
          cards: {
            ...s.cards,
            [id]: { rating, reviews: (s.cards[id]?.reviews ?? 0) + 1, lastAt: Date.now() },
          },
          activity: bumpActivity(s.activity),
        })),

      recordSubmission: (id, { passed, total, language }) =>
        set((s) => {
          const prev = s.problems[id];
          const solved = passed === total && total > 0;
          return {
            problems: {
              ...s.problems,
              [id]: {
                solved: (prev?.solved ?? false) || solved,
                bestPassed: Math.max(prev?.bestPassed ?? 0, passed),
                total,
                submissions: (prev?.submissions ?? 0) + 1,
                language: solved ? language : (prev?.language ?? language),
                solvedAt: prev?.solvedAt ?? (solved ? Date.now() : undefined),
                lastAt: Date.now(),
              },
            },
            activity: bumpActivity(s.activity),
          };
        }),

      markPatternRead: (id) =>
        set((s) =>
          s.patterns[id]
            ? {}
            : { patterns: { ...s.patterns, [id]: Date.now() }, activity: bumpActivity(s.activity) },
        ),

      recordChallenge: (id, score, note) =>
        set((s) => {
          const prev = s.challenges[id];
          return {
            challenges: {
              ...s.challenges,
              [id]: {
                score,
                best: Math.max(prev?.best ?? 0, score),
                attempts: (prev?.attempts ?? 0) + 1,
                note: note ?? prev?.note,
                lastAt: Date.now(),
              },
            },
            activity: bumpActivity(s.activity),
          };
        }),

      toggleBookmark: (id, kind) =>
        set((s) => {
          const next = { ...s.bookmarks };
          if (next[id]) delete next[id];
          else next[id] = { kind, at: Date.now() };
          return { bookmarks: next };
        }),

      setDaily: (plan) => set({ daily: plan }),

      resetProgress: () => set({ ...EMPTY_PROGRESS }),
    }),
    {
      name: 'tj-progress',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // 저장된 데이터가 손상되어 읽을 수 없으면 비우고 새로 시작한다
      onRehydrateStorage: () => (_state, error) => {
        if (error) void AsyncStorage.removeItem('tj-progress').catch(() => {});
      },
      partialize: ({ profile, settings, quiz, cards, problems, patterns, challenges, bookmarks, activity, daily }) => ({
        profile,
        settings,
        quiz,
        cards,
        problems,
        patterns,
        challenges,
        bookmarks,
        activity,
        daily,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressData>;
        return {
          ...current,
          ...p,
          profile: { ...current.profile, ...p.profile },
          settings: { ...current.settings, ...p.settings },
        };
      },
    },
  ),
);

/** 오늘 학습량 */
export function useTodayCount(): number {
  return useProgress((s) => s.activity[dayKey()] ?? 0);
}

/* ------------------------------------------------------------------ */
/* 코드 초안 (문제·언어별) — 자주 바뀌므로 별도 저장소                  */
/* ------------------------------------------------------------------ */

interface DraftState {
  drafts: Record<string, string>;
  /** 문제별 마지막으로 사용한 언어 */
  lastLanguage: Record<string, SolveLanguage>;
  setDraft: (problemId: string, lang: SolveLanguage, code: string) => void;
  clearDraft: (problemId: string, lang: SolveLanguage) => void;
  setLastLanguage: (problemId: string, lang: SolveLanguage) => void;
}

export const draftKey = (problemId: string, lang: SolveLanguage) => `${problemId}:${lang}`;

export const useDrafts = create<DraftState>()(
  persist(
    (set) => ({
      drafts: {},
      lastLanguage: {},
      setLastLanguage: (problemId, lang) => set((s) => ({ lastLanguage: { ...s.lastLanguage, [problemId]: lang } })),
      setDraft: (problemId, lang, code) =>
        set((s) => ({ drafts: { ...s.drafts, [draftKey(problemId, lang)]: code } })),
      clearDraft: (problemId, lang) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[draftKey(problemId, lang)];
          return { drafts: next };
        }),
    }),
    {
      name: 'tj-drafts',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) void AsyncStorage.removeItem('tj-drafts').catch(() => {});
      },
    },
  ),
);
