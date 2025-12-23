/**
 * Shared types for backend
 * These mirror the shared types but are local to avoid monorepo import issues
 */

export enum TranslationMode {
  EN_TO_PL = 'EN_TO_PL',
  PL_TO_EN = 'PL_TO_EN',
}

export enum Difficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
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

export interface WordFilters {
  category?: string | null;
  difficulty?: Difficulty | null;
}
