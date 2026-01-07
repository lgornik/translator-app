import { Word } from '../entities/Word.js';
import { WordId } from '../value-objects/WordId.js';
import { Category } from '../value-objects/Category.js';
import { Difficulty } from '../value-objects/Difficulty.js';

/**
 * Word filter criteria
 */
export interface WordFilters {
  category?: Category | null;
  difficulty?: Difficulty | null;
}

/**
 * Word Repository Interface (Port)
 * Defines the contract for word persistence
 * Implementations are in the infrastructure layer
 */
export interface IWordRepository {
  /**
   * Find all words
   */
  findAll(): Promise<Word[]>;

  /**
   * Find word by ID
   */
  findById(id: WordId): Promise<Word | null>;

  /**
   * Find words matching filters
   */
  findByFilters(filters: WordFilters): Promise<Word[]>;

  /**
   * Get all unique categories
   */
  getCategories(): Promise<Category[]>;

  /**
   * Get all unique difficulties
   */
  getDifficulties(): Promise<Difficulty[]>;

  /**
   * Count words (optionally filtered)
   */
  count(filters?: WordFilters): Promise<number>;

  /**
   * Check if repository has any words
   */
  isEmpty(): Promise<boolean>;
}
