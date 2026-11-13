import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  BackendFrameworkId,
  CodeLanguage,
  DevTrack,
  FrameworkId,
  FrontendFrameworkId,
  OutputLanguage,
  SolveLanguage,
  TrackSide,
} from '@/content/types';
import { dayKey } from '@/lib/date';

import type { LessonRecord } from './lessons';
import { migrateProgress, PROGRESS_VERSION } from './migrate';

export type CareerGoal = 'new' | 'career';
export type ThemePreference = 'system' | 'light' | 'dark';
export type CardRating = 'again' | 'hard' | 'good';
export type BookmarkKind = 'question' | 'card' | 'problem' | 'pattern' | 'challenge' | 'algoPattern' | 'lesson';

export interface Profile {
  nickname: string;
  goal: CareerGoal;
  language: SolveLanguage;
  /** 개발자 코스 (백엔드 · 프론트엔드 · 풀스택) */
  track: DevTrack;
  /** 백엔드 프레임워크 (백엔드 · 풀스택 코스) */
  framework: BackendFrameworkId;
  /** 프론트엔드 프레임워크 (프론트엔드 · 풀스택 코스) */
  frontendFramework: FrontendFrameworkId;
  dailyGoal: number;
  onboarded: boolean;
}

export interface Settings {
  theme: ThemePreference;
  haptics: boolean;
  /** 코드 리뷰에서 마지막으로 고른 코드 언어 (예: spring → kotlin). 없으면 풀이 언어를 따른다 */
  reviewLanguage: Partial<Record<FrameworkId, CodeLanguage>>;
  /** 풀스택 코스의 코드 리뷰 탭에서 마지막으로 본 쪽 */
  reviewSide?: TrackSide;
  /** CS 이론 레슨 본문 글자 크기 */
  lessonTextSize?: 'md' | 'lg';
  /** 출력 맞추기 퀴즈에서 고른 코드 언어. 없으면 코스에 맞춘 기본 언어(`defaultQuizCodeLanguage`) */
  quizCodeLanguage?: OutputLanguage;
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

/** 이전 버전의 코딩 문제 풀이 기록 — 풀이 기능은 없어졌지만 기존 기록은 지우지 않고 보존한다 */
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
  /** 퀴즈를 만들 때의 하루 목표 · 코스(courseKey) — 바뀌면 오늘의 퀴즈를 다시 만든다 */
  goal?: number;
  course?: string;
  /** 이전 버전에서 코스 대신 저장한 관심 프레임워크 (더 이상 쓰지 않음) */
  framework?: FrameworkId;
  /** 오늘 공부할 알고리즘 유형 */
  algoPatternId?: string;
  /** 오늘 읽을 CS 이론 레슨 */
  lessonId?: string;
  /** 이전 버전의 오늘의 코딩 문제 (더 이상 쓰지 않음) */
  problemId?: string;
  cardId?: string;
  review?: { kind: 'pattern' | 'challenge'; id: string };
}

export interface ProgressData {
  profile: Profile;
  settings: Settings;
  quiz: Record<string, QuizRecord>;
  cards: Record<string, CardRecord>;
  /** 이전 버전의 코딩 문제 풀이 기록 (보존만 하고 화면에서 쓰지 않음) */
  problems: Record<string, ProblemRecord>;
  /** 코드 리뷰 개선 패턴 id → 학습 완료 시각 */
  patterns: Record<string, number>;
  challenges: Record<string, ChallengeRecord>;
  /** 알고리즘 문제 유형 id → 학습 완료 시각 */
  algoPatterns: Record<string, number>;
  /** CS 이론 레슨 id → 읽기 · 확인 퀴즈 기록 */
  lessons: Record<string, LessonRecord>;
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
  markPatternRead: (id: string) => void;
  markAlgoPatternRead: (id: string) => void;
  /** 레슨을 열었다 (처음이면 '읽는 중') */
  startLesson: (id: string) => void;
  /** 레슨을 끝까지 읽었다 */
  finishLessonReading: (id: string) => void;
  /** 확인 퀴즈를 제출했다 — 레슨 완료 */
  recordLessonCheck: (id: string, correct: number, total: number) => void;
  recordChallenge: (id: string, score: number, note?: string) => void;
  toggleBookmark: (id: string, kind: BookmarkKind) => void;
  setDaily: (plan: DailyPlanRecord) => void;
  resetProgress: () => void;
  /** 백업 파일의 학습 기록으로 모두 바꾼다 (빠진 항목은 기본값) */
  restoreProgress: (data: Partial<ProgressData>) => void;
}

export type ProgressState = ProgressData & ProgressActions;

const DEFAULT_PROFILE: Profile = {
  nickname: '',
  goal: 'new',
  language: 'python',
  track: 'backend',
  framework: 'spring',
  frontendFramework: 'react',
  dailyGoal: 10,
  onboarded: false,
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  haptics: true,
  reviewLanguage: {},
};

const EMPTY_PROGRESS = {
  quiz: {},
  cards: {},
  problems: {},
  patterns: {},
  challenges: {},
  algoPatterns: {},
  lessons: {},
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

      markPatternRead: (id) =>
        set((s) =>
          s.patterns[id]
            ? {}
            : { patterns: { ...s.patterns, [id]: Date.now() }, activity: bumpActivity(s.activity) },
        ),

      markAlgoPatternRead: (id) =>
        set((s) =>
          s.algoPatterns[id]
            ? {}
            : { algoPatterns: { ...s.algoPatterns, [id]: Date.now() }, activity: bumpActivity(s.activity) },
        ),

      startLesson: (id) =>
        set((s) => {
          const prev = s.lessons[id] as LessonRecord | undefined;
          const now = Date.now();
          return { lessons: { ...s.lessons, [id]: { ...prev, startedAt: prev?.startedAt ?? now, lastAt: now } } };
        }),

      finishLessonReading: (id) =>
        set((s) => {
          const prev = s.lessons[id] as LessonRecord | undefined;
          if (prev?.readAt) return {};
          const now = Date.now();
          return {
            lessons: { ...s.lessons, [id]: { ...prev, startedAt: prev?.startedAt ?? now, readAt: now, lastAt: now } },
            activity: bumpActivity(s.activity),
          };
        }),

      recordLessonCheck: (id, correct, total) =>
        set((s) => {
          const prev = s.lessons[id] as LessonRecord | undefined;
          const now = Date.now();
          const rec = { ...prev, startedAt: prev?.startedAt ?? now, readAt: prev?.readAt ?? now };
          return { lessons: { ...s.lessons, [id]: { ...rec, completedAt: now, correct, total, lastAt: now } } };
        }),

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

      restoreProgress: (data) =>
        set({
          ...EMPTY_PROGRESS,
          ...data,
          profile: { ...DEFAULT_PROFILE, ...data.profile },
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
        }),
    }),
    {
      name: 'tj-progress',
      version: PROGRESS_VERSION,
      // 이전 버전 기록에 새 필드의 기본값을 채운다 (기존 기록은 그대로 둔다)
      migrate: (persisted, version) => migrateProgress(persisted, version) as ProgressState,
      storage: createJSONStorage(() => AsyncStorage),
      // 저장된 데이터가 손상되어 읽을 수 없으면 비우고 새로 시작한다
      onRehydrateStorage: () => (_state, error) => {
        if (error) void AsyncStorage.removeItem('tj-progress').catch(() => {});
      },
      partialize: ({ profile, settings, quiz, cards, problems, patterns, challenges, algoPatterns, lessons, bookmarks, activity, daily }) => ({
        profile,
        settings,
        quiz,
        cards,
        problems,
        patterns,
        challenges,
        algoPatterns,
        lessons,
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
