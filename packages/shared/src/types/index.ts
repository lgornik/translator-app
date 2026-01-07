// ============================================================
// Shared Types - uzywane przez backend, web i mobile
// ============================================================

// User and Auth
export interface User {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

export type AuthProvider = 'email' | 'google' | 'facebook';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Quiz
export type TranslationMode = 'EN_TO_PL' | 'PL_TO_EN';

export type Difficulty = 1 | 2 | 3;

export interface WordChallenge {
  id: string;
  wordToTranslate: string;
  mode: TranslationMode;
  category: string;
  difficulty: Difficulty;
}

export interface TranslationResult {
  isCorrect: boolean;
  correctTranslation: string;
  userTranslation: string;
}

export interface QuizStats {
  correct: number;
  incorrect: number;
}

export interface QuizSettings {
  mode: TranslationMode;
  category: string | null;
  difficulty: Difficulty | null;
  wordLimit: number;
  timeLimit: number;
  reinforceMode: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Word data (for admin/management)
export interface Word {
  id: string;
  polish: string;
  english: string;
  category: string;
  difficulty: Difficulty;
}
