/**
 * Frontend types
 * Re-exports shared types and adds frontend-specific types
 */

// Re-export all shared types (Single Source of Truth)
export {
  TranslationMode,
  isTranslationMode,
  Difficulty,
  isDifficulty,
  DifficultyLabels,
  QuizMode,
  GameState,
  ErrorCode,
  type WordChallenge,
  type DictionaryWord,
  type TranslationResult,
  type WordCount,
  type QuizSettings,
  type QuizFilters,
  type QuizProgress,
  type QuizStats,
} from '@translator-app/shared';

// ============================================================================
// Frontend-specific types (UI only, not shared with backend)
// ============================================================================

/**
 * Word data interface (alias for backwards compatibility)
 */
export interface Word {
  id: string;
  polish: string;
  english: string;
  category: string;
  difficulty: number;
}

// ============================================================================
// User Types (prepared for future auth)
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface UserStats {
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  streak: number;
  bestStreak: number;
  lastPractice: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;

// ============================================================================
// UI Component Types
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FieldState<T> {
  value: T;
  error: string | null;
  touched: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface TimerState {
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface WordQueue {
  current: WordChallenge | null;
  toRepeat: WordChallenge[];
  mastered: string[];
}
