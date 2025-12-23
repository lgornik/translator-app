import { Word, WordData } from '../entities/Word.js';
import { Difficulty } from '../../shared/types/index.js';

/**
 * Word filter options
 */
export interface WordFilters {
  category?: string | null;
  difficulty?: Difficulty | null;
}

/**
 * Word repository interface
 * Allows for easy swapping of data sources (memory, database, etc.)
 */
export interface IWordRepository {
  findAll(): Word[];
  findById(id: string): Word | null;
  findByFilters(filters: WordFilters): Word[];
  getCategories(): string[];
  getDifficulties(): Difficulty[];
  count(filters?: WordFilters): number;
}

/**
 * In-memory word repository implementation
 */
export class InMemoryWordRepository implements IWordRepository {
  private words: Map<string, Word>;

  constructor(wordsData: WordData[]) {
    this.words = new Map(
      wordsData.map((data) => {
        const word = Word.fromTrusted(data);
        return [word.id, word];
      })
    );
  }

  findAll(): Word[] {
    return Array.from(this.words.values());
  }

  findById(id: string): Word | null {
    return this.words.get(id) ?? null;
  }

  findByFilters(filters: WordFilters): Word[] {
    let words = this.findAll();

    if (filters.category) {
      words = words.filter((w) => w.category === filters.category);
    }

    if (filters.difficulty) {
      words = words.filter((w) => w.difficulty === filters.difficulty);
    }

    return words;
  }

  getCategories(): string[] {
    const categories = new Set(this.findAll().map((w) => w.category));
    return Array.from(categories).sort();
  }

  getDifficulties(): Difficulty[] {
    const difficulties = new Set(this.findAll().map((w) => w.difficulty));
    return Array.from(difficulties).sort((a, b) => a - b);
  }

  count(filters?: WordFilters): number {
    if (!filters) {
      return this.words.size;
    }
    return this.findByFilters(filters).length;
  }
}
