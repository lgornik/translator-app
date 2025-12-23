import { z } from 'zod';
import { Difficulty, TranslationMode } from '../../shared/types/index.js';

/**
 * Word validation schema
 */
export const wordSchema = z.object({
  id: z.string().min(1),
  polish: z.string().min(1),
  english: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.nativeEnum(Difficulty),
});

export type WordData = z.infer<typeof wordSchema>;

/**
 * Word entity with domain logic
 */
export class Word {
  readonly id: string;
  readonly polish: string;
  readonly english: string;
  readonly category: string;
  readonly difficulty: Difficulty;

  private constructor(data: WordData) {
    this.id = data.id;
    this.polish = data.polish;
    this.english = data.english;
    this.category = data.category;
    this.difficulty = data.difficulty;
  }

  /**
   * Factory method with validation
   */
  static create(data: unknown): Word {
    const validated = wordSchema.parse(data);
    return new Word(validated);
  }

  /**
   * Create Word from trusted data (skip validation)
   */
  static fromTrusted(data: WordData): Word {
    return new Word(data);
  }

  /**
   * Get word to translate based on mode
   */
  getWordToTranslate(mode: TranslationMode): string {
    return mode === TranslationMode.EN_TO_PL ? this.english : this.polish;
  }

  /**
   * Get correct translation based on mode
   */
  getCorrectTranslation(mode: TranslationMode): string {
    return mode === TranslationMode.EN_TO_PL ? this.polish : this.english;
  }

  /**
   * Check if user answer is correct
   * Supports multiple correct answers separated by "/"
   */
  checkTranslation(userAnswer: string, mode: TranslationMode): boolean {
    const correctAnswer = this.getCorrectTranslation(mode);
    const normalizedUser = this.normalizeAnswer(userAnswer);
    const normalizedCorrect = this.normalizeAnswer(correctAnswer);

    // Exact match
    if (normalizedUser === normalizedCorrect) {
      return true;
    }

    // Check against multiple options (separated by "/")
    const options = correctAnswer
      .split('/')
      .map((opt) => this.normalizeAnswer(opt));

    return options.includes(normalizedUser);
  }

  /**
   * Normalize answer for comparison
   */
  private normalizeAnswer(answer: string): string {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Convert to plain object
   */
  toJSON(): WordData {
    return {
      id: this.id,
      polish: this.polish,
      english: this.english,
      category: this.category,
      difficulty: this.difficulty,
    };
  }

  /**
   * Convert to WordChallenge format for API response
   */
  toChallenge(mode: TranslationMode) {
    return {
      id: this.id,
      wordToTranslate: this.getWordToTranslate(mode),
      correctTranslation: this.getCorrectTranslation(mode),
      mode,
      category: this.category,
      difficulty: this.difficulty,
    };
  }
}
