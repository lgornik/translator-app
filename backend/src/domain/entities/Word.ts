import { Entity } from "../../shared/core/Entity.js";
import { Result } from "../../shared/core/Result.js";
import { ValidationError } from "../../shared/errors/DomainErrors.js";
import { WordId } from "../value-objects/WordId.js";
import { Difficulty } from "../value-objects/Difficulty.js";
import { Category } from "../value-objects/Category.js";
import { TranslationMode } from "../value-objects/TranslationMode.js";
import { z } from "zod";

/**
 * Word properties for creation
 */
export interface WordProps {
  polish: string;
  english: string;
  category: Category;
  difficulty: Difficulty;
}

/**
 * Raw word data (for persistence/API)
 */
export interface WordData {
  id: string;
  polish: string;
  english: string;
  category: string;
  difficulty: number;
}

/**
 * Validation schema for raw input
 */
const wordDataSchema = z.object({
  id: z.string().min(1),
  polish: z.string().min(1),
  english: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
});

/**
 * Word Entity
 * Represents a word pair for translation practice
 * Pure data entity - business logic is in domain services
 */
export class Word extends Entity<WordId> {
  private readonly _polish: string;
  private readonly _english: string;
  private readonly _category: Category;
  private readonly _difficulty: Difficulty;

  private constructor(id: WordId, props: WordProps) {
    super(id);
    this._polish = props.polish;
    this._english = props.english;
    this._category = props.category;
    this._difficulty = props.difficulty;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get polish(): string {
    return this._polish;
  }

  get english(): string {
    return this._english;
  }

  get category(): Category {
    return this._category;
  }

  get difficulty(): Difficulty {
    return this._difficulty;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new Word with validation
   */
  static create(data: unknown): Result<Word, ValidationError> {
    const parseResult = wordDataSchema.safeParse(data);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return Result.fail(
        new ValidationError(
          firstError?.message || "Invalid word data",
          firstError?.path.join(".") || "unknown",
        ),
      );
    }

    const { id, polish, english, category, difficulty } = parseResult.data;

    const difficultyResult = Difficulty.create(difficulty);
    if (!difficultyResult.ok) {
      return Result.fail(difficultyResult.error);
    }

    const categoryResult = Category.create(category);
    if (!categoryResult.ok) {
      return Result.fail(categoryResult.error);
    }

    const wordIdResult = WordId.create(id);
    if (!wordIdResult.ok) {
      return Result.fail(wordIdResult.error);
    }

    return Result.ok(
      new Word(wordIdResult.value, {
        polish: polish.trim(),
        english: english.trim(),
        category: categoryResult.value,
        difficulty: difficultyResult.value,
      }),
    );
  }

  /**
   * Create from trusted data source (e.g., database)
   * Skips validation for performance
   */
  static fromTrusted(data: WordData): Word {
    return new Word(WordId.fromTrusted(data.id), {
      polish: data.polish,
      english: data.english,
      category: Category.fromTrusted(data.category),
      difficulty: Difficulty.fromTrusted(data.difficulty),
    });
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get the word to translate based on mode
   */
  getWordToTranslate(mode: TranslationMode): string {
    return mode.isFromEnglish() ? this._english : this._polish;
  }

  /**
   * Get the correct translation based on mode
   */
  getCorrectTranslation(mode: TranslationMode): string {
    return mode.isFromEnglish() ? this._polish : this._english;
  }

  /**
   * Check if word matches category filter
   */
  matchesCategory(category: Category | null): boolean {
    if (category === null) return true;
    return this._category.equals(category);
  }

  /**
   * Check if word matches difficulty filter
   */
  matchesDifficulty(difficulty: Difficulty | null): boolean {
    if (difficulty === null) return true;
    return this._difficulty.equals(difficulty);
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to plain object for persistence/API
   */
  toData(): WordData {
    return {
      id: this._id.toString(),
      polish: this._polish,
      english: this._english,
      category: this._category.name,
      difficulty: this._difficulty.value,
    };
  }

  /**
   * Convert to challenge format for API response
   */
  toChallenge(mode: TranslationMode): WordChallenge {
    return {
      id: this._id.toString(),
      wordToTranslate: this.getWordToTranslate(mode),
      correctTranslation: this.getCorrectTranslation(mode),
      mode: mode.toString(),
      category: this._category.name,
      difficulty: this._difficulty.value,
    };
  }
}

/**
 * Word challenge DTO for API responses
 */
export interface WordChallenge {
  id: string;
  wordToTranslate: string;
  correctTranslation: string;
  mode: string;
  category: string;
  difficulty: number;
}
