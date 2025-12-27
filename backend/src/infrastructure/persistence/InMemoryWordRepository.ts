import { Word, WordData } from '../../domain/entities/Word.js';
import { WordId } from '../../domain/value-objects/WordId.js';
import { Category } from '../../domain/value-objects/Category.js';
import { Difficulty } from '../../domain/value-objects/Difficulty.js';
import { IWordRepository, WordFilters } from '../../domain/repositories/IWordRepository.js';

/**
 * In-Memory Word Repository
 * Stores words in memory - suitable for development and testing
 * In production, replace with database implementation
 */
export class InMemoryWordRepository implements IWordRepository {
  private readonly words: Map<string, Word>;
  private readonly categoriesCache: Category[];
  private readonly difficultiesCache: Difficulty[];

  constructor(wordsData: WordData[]) {
    this.words = new Map();

    // Build word map
    for (const data of wordsData) {
      const word = Word.fromTrusted(data);
      this.words.set(word.id.value, word);
    }

    // Pre-compute categories and difficulties for performance
    this.categoriesCache = this.computeCategories();
    this.difficultiesCache = this.computeDifficulties();
  }

  findAll(): Word[] {
    return Array.from(this.words.values());
  }

  findById(id: WordId): Word | null {
    return this.words.get(id.value) ?? null;
  }

  findByFilters(filters: WordFilters): Word[] {
    let words = this.findAll();

    if (filters.category) {
      words = words.filter((w) => w.matchesCategory(filters.category!));
    }

    if (filters.difficulty) {
      words = words.filter((w) => w.matchesDifficulty(filters.difficulty!));
    }

    return words;
  }

  getCategories(): Category[] {
    return this.categoriesCache;
  }

  getDifficulties(): Difficulty[] {
    return this.difficultiesCache;
  }

  count(filters?: WordFilters): number {
    if (!filters || (!filters.category && !filters.difficulty)) {
      return this.words.size;
    }
    return this.findByFilters(filters).length;
  }

  isEmpty(): boolean {
    return this.words.size === 0;
  }

  private computeCategories(): Category[] {
    const seen = new Set<string>();
    const categories: Category[] = [];

    for (const word of this.words.values()) {
      const name = word.category.name;
      if (!seen.has(name)) {
        seen.add(name);
        categories.push(word.category);
      }
    }

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  private computeDifficulties(): Difficulty[] {
    const seen = new Set<number>();
    const difficulties: Difficulty[] = [];

    for (const word of this.words.values()) {
      const value = word.difficulty.value;
      if (!seen.has(value)) {
        seen.add(value);
        difficulties.push(word.difficulty);
      }
    }

    return difficulties.sort((a, b) => a.value - b.value);
  }
}
