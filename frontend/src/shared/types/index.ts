/**
 * Frontend types
 * Local type definitions to avoid monorepo import issues
 */

// ============================================================================
// Enums
// ============================================================================

export enum TranslationMode {
  EN_TO_PL = 'EN_TO_PL',
  PL_TO_EN = 'PL_TO_EN',
}

export enum Difficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

export enum QuizMode {
  STANDARD = 'STANDARD',
  TIMED = 'TIMED',
  CUSTOM = 'CUSTOM',
}

export enum GameState {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

// ============================================================================
// Core Types
// ============================================================================

export interface Word {
  id: string;
  polish: string;
  english: string;
  category: string;
  difficulty: Difficulty;
}

export interface WordChallenge {
  id: string;
  wordToTranslate: string;
  correctTranslation: string;
  mode: TranslationMode;
  category: string;
  difficulty: Difficulty;
}

export interface TranslationResult {
  isCorrect: boolean;
  correctTranslation: string;
  userTranslation: string;
}

// ============================================================================
// Quiz Types
// ============================================================================

export interface QuizSettings {
  mode: TranslationMode;
  quizMode: QuizMode;
  wordLimit: number;
  timeLimit: number;
  reinforceMode: boolean;
  category: string | null;
  difficulty: Difficulty | null;
}

export interface QuizFilters {
  category: string | null;
  difficulty: Difficulty | null;
}

export interface QuizProgress {
  currentWord: number;
  totalWords: number;
  round: number;
}

export interface QuizStats {
  correct: number;
  incorrect: number;
}

// ============================================================================
// User Types (prepared for future)
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
