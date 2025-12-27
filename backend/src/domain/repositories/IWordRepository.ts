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
  findAll(): Word[];

  /**
   * Find word by ID
   */
  findById(id: WordId): Word | null;

  /**
   * Find words matching filters
   */
  findByFilters(filters: WordFilters): Word[];

  /**
   * Get all unique categories
   */
  getCategories(): Category[];

  /**
   * Get all unique difficulties
   */
  getDifficulties(): Difficulty[];

  /**
   * Count words (optionally filtered)
   */
  count(filters?: WordFilters): number;

  /**
   * Check if repository has any words
   */
  isEmpty(): boolean;
}
