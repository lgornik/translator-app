/**
 * Application constants
 */

export const APP_CONFIG = {
  name: 'Translator',
  version: '1.0.0',
  description: 'Ucz siÄ™ sÅ‚Ã³wek przez tÅ‚umaczenie',
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
  TIME_LIMIT: 300, // 5 minutes in seconds
  MIN_WORDS: 1,
  MAX_WORDS: 150,
  MIN_TIME: 60, // 1 minute
  MAX_TIME: 3600, // 1 hour
} as const;

export const DIFFICULTY_CONFIG = {
  1: { label: 'Åatwy', emoji: 'â­' },
  2: { label: 'Åšredni', emoji: 'â­â­' },
  3: { label: 'Trudny', emoji: 'â­â­â­' },
} as const;

export const RESULT_MESSAGES = {
  EXCELLENT: { emoji: 'ðŸ†', text: 'Doskonale!', minAccuracy: 90 },
  GREAT: { emoji: 'ðŸ‘', text: 'Åšwietna robota!', minAccuracy: 70 },
  GOOD: { emoji: 'ðŸ’ª', text: 'NieÅºle, Ä‡wicz dalej!', minAccuracy: 50 },
  PRACTICE: { emoji: 'ðŸ“–', text: 'Warto powtÃ³rzyÄ‡!', minAccuracy: 0 },
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
