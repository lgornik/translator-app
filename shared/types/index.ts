/**
 * Shared Types - Single Source of Truth
 * These types are used by both backend and frontend
 * to ensure consistency across the entire application.
 */

// ============================================================================
// Translation Mode
// ============================================================================

/**
 * Translation direction modes
 * Used in GraphQL schema, backend domain, and frontend
 */
export const TranslationMode = {
  EN_TO_PL: 'EN_TO_PL',
  PL_TO_EN: 'PL_TO_EN',
} as const;

export type TranslationMode = (typeof TranslationMode)[keyof typeof TranslationMode];

/**
 * Type guard for TranslationMode
 */
export function isTranslationMode(value: unknown): value is TranslationMode {
  return value === TranslationMode.EN_TO_PL || value === TranslationMode.PL_TO_EN;
}

// ============================================================================
// Difficulty
// ============================================================================

/**
 * Difficulty levels (1=Easy, 2=Medium, 3=Hard)
 */
export const Difficulty = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

/**
 * Type guard for Difficulty
 */
export function isDifficulty(value: unknown): value is Difficulty {
  return value === Difficulty.EASY || value === Difficulty.MEDIUM || value === Difficulty.HARD;
}

/**
 * Difficulty labels for display
 */
export const DifficultyLabels: Record<Difficulty, string> = {
  [Difficulty.EASY]: 'Łatwy',
  [Difficulty.MEDIUM]: 'Średni',
  [Difficulty.HARD]: 'Trudny',
};

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Word challenge returned from API (without correct answer for security)
 */
export interface WordChallenge {
  id: string;
  wordToTranslate: string;
  mode: TranslationMode;
  category: string;
  difficulty: Difficulty;
}

/**
 * Full word data (used in dictionary listing)
 */
export interface DictionaryWord {
  id: string;
  polish: string;
  english: string;
  category: string;
  difficulty: Difficulty;
}

/**
 * Translation check result
 */
export interface TranslationResult {
  isCorrect: boolean;
  correctTranslation: string;
  userTranslation: string;
}

/**
 * Word count response
 */
export interface WordCount {
  count: number;
}

// ============================================================================
// Error Codes
// ============================================================================

/**
 * API Error codes for consistent error handling
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  NO_WORDS_AVAILABLE: 'NO_WORDS_AVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
