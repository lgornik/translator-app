/**
 * Application constants
 */
export const APP_CONFIG = {
  name: 'Translator',
  version: '1.0.0',
  description: 'Ucz się słówek przez tłumaczenie',
} as const;

export const ROUTES = {
  HOME: '/',
  QUIZ: '/quiz',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
} as const;

export const QUIZ_DEFAULTS = {
  WORD_LIMIT: 5,
  TIME_LIMIT: 300,
  MIN_WORDS: 1,
  MAX_WORDS: 150,
  MIN_TIME: 60,
  MAX_TIME: 3600,
} as const;

export const DIFFICULTY_CONFIG = {
  1: { label: 'Łatwy', emoji: '⭐' },
  2: { label: 'Średni', emoji: '⭐⭐' },
  3: { label: 'Trudny', emoji: '⭐⭐⭐' },
} as const;

export const RESULT_MESSAGES = {
  EXCELLENT: { emoji: '🏆', text: 'Doskonale!', minAccuracy: 90 },
  GREAT: { emoji: '👍', text: 'Świetna robota!', minAccuracy: 70 },
  GOOD: { emoji: '👊', text: 'Nieźle, ćwicz dalej!', minAccuracy: 50 },
  PRACTICE: { emoji: '📖', text: 'Warto powtórzyć!', minAccuracy: 0 },
} as const;

export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
} as const;

export const LOCAL_STORAGE_KEYS = {
  PREFERRED_MODE: 'translator_preferred_mode',
  PREFERRED_CATEGORY: 'translator_preferred_category',
  PREFERRED_DIFFICULTY: 'translator_preferred_difficulty',
  THEME: 'translator_theme',
} as const;

export const API_CONFIG = {
  GRAPHQL_URL: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
  TIMEOUT: 30000,
} as const;