/**
 * Application Layer DTOs
 * Data Transfer Objects for use case input/output
 */

// ============================================================================
// GetRandomWord
// ============================================================================

export interface GetRandomWordInput {
  mode: string;
  category?: string | null;
  difficulty?: number | null;
  sessionId: string;
}

/**
 * Internal output with all word data (used within application layer)
 */
export interface GetRandomWordOutput {
  id: string;
  wordToTranslate: string;
  correctTranslation: string;
  mode: string;
  category: string;
  difficulty: number;
}

/**
 * Public API response - correctTranslation is hidden for security
 * This prevents users from seeing the answer before submitting
 */
export interface GetRandomWordApiResponse {
  id: string;
  wordToTranslate: string;
  mode: string;
  category: string;
  difficulty: number;
}

/**
 * Converts internal output to public API response
 * Strips correctTranslation to prevent cheating
 */
export function toApiResponse(
  output: GetRandomWordOutput,
): GetRandomWordApiResponse {
  return {
    id: output.id,
    wordToTranslate: output.wordToTranslate,
    mode: output.mode,
    category: output.category,
    difficulty: output.difficulty,
  };
}

// ============================================================================
// CheckTranslation
// ============================================================================

export interface CheckTranslationInput {
  wordId: string;
  userTranslation: string;
  mode: string;
  sessionId: string;
}

export interface CheckTranslationOutput {
  isCorrect: boolean;
  correctTranslation: string;
  userTranslation: string;
}

// ============================================================================
// GetWordCount
// ============================================================================

export interface GetWordCountInput {
  category?: string | null;
  difficulty?: number | null;
}

export interface GetWordCountOutput {
  count: number;
}

// ============================================================================
// GetCategories
// ============================================================================

export interface GetCategoriesOutput {
  categories: string[];
}

// ============================================================================
// GetDifficulties
// ============================================================================

export interface GetDifficultiesOutput {
  difficulties: number[];
}

// ============================================================================
// ResetSession
// ============================================================================

export interface ResetSessionInput {
  sessionId: string;
}

export interface ResetSessionOutput {
  success: boolean;
}

// ============================================================================
// GetAllWords
// ============================================================================

export interface GetAllWordsOutput {
  words: Array<{
    id: string;
    polish: string;
    english: string;
    category: string;
    difficulty: number;
  }>;
}
