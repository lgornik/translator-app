/**
 * Translation check result
 */
export interface TranslationCheckResult {
  isCorrect: boolean;
  correctTranslation: string;
  userTranslation: string;
  similarity?: number; // For partial matching in future
}

/**
 * Translation Checker - Domain Service
 * Handles the logic of checking if a translation is correct
 * Separated from Word entity to follow SRP
 */
export class TranslationChecker {
  /**
   * Check if user's answer matches the correct translation
   */
  check(
    correctAnswer: string,
    userAnswer: string
  ): TranslationCheckResult {
    const normalizedUser = this.normalizeAnswer(userAnswer);

    // Generate all valid variants of the correct answer
    const validVariants = this.generateValidVariants(correctAnswer);

    const isCorrect = validVariants.includes(normalizedUser);

    return {
      isCorrect,
      correctTranslation: correctAnswer,
      userTranslation: userAnswer,
    };
  }

  /**
   * Generate all valid answer variants
   * Handles "/" for multiple options and "()" for optional parts
   */
  private generateValidVariants(answer: string): string[] {
    const variants: string[] = [];

    // Split by "/" for multiple correct answers
    const options = answer.split('/').map((opt) => opt.trim());

    for (const option of options) {
      // Variant 1: without parenthetical content
      const withoutParenthetical = option
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      variants.push(withoutParenthetical);

      // Variant 2: with parenthetical content but without the parentheses themselves
      const withParenthetical = option
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (withParenthetical !== withoutParenthetical) {
        variants.push(withParenthetical);
      }
    }

    return [...new Set(variants)];
  }

  /**
   * Normalize answer for comparison
   * - Convert to lowercase
   * - Trim whitespace
   * - Normalize multiple spaces to single space
   */
  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Calculate similarity score between two strings (Levenshtein-based)
   * Can be used for "close enough" matching in future
   */
  calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeAnswer(str1);
    const s2 = this.normalizeAnswer(str2);

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j - 1]! + cost
        );
      }
    }

    return matrix[str1.length]![str2.length]!;
  }
}
