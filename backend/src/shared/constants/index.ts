/**
 * Application constants
 */

export const DEFAULTS = {
  WORD_LIMIT: 50,
  TIME_LIMIT: 300, // 5 minutes in seconds
  MAX_WORD_LIMIT: 150,
  MIN_WORD_LIMIT: 1,
} as const;

export const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NO_WORDS_AVAILABLE: 'NO_WORDS_AVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
} as const;

/**
 * GraphQL operation names for logging/metrics
 */
export const OPERATIONS = {
  GET_RANDOM_WORD: 'getRandomWord',
  GET_ALL_WORDS: 'getAllWords',
  GET_CATEGORIES: 'getCategories',
  GET_DIFFICULTIES: 'getDifficulties',
  GET_WORD_COUNT: 'getWordCount',
  CHECK_TRANSLATION: 'checkTranslation',
  RESET_SESSION: 'resetSession',
} as const;
