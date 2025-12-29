import { eq, and, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { words, categories } from './schema.js';
import { Word } from '../../../domain/entities/Word.js';
import { WordId } from '../../../domain/value-objects/WordId.js';
import { Category } from '../../../domain/value-objects/Category.js';
import { Difficulty } from '../../../domain/value-objects/Difficulty.js';
import { IWordRepository, WordFilters } from '../../../domain/repositories/IWordRepository.js';

/**
 * PostgreSQL Word Repository
 * Production-ready implementation using Drizzle ORM
 */
export class PostgresWordRepository implements IWordRepository {
  constructor(private db: PostgresJsDatabase) {}

  async findAll(): Promise<Word[]> {
    const rows = await this.db
      .select({
        id: words.id,
        polish: words.polish,
        english: words.english,
        category: categories.name,
        difficulty: words.difficulty,
      })
      .from(words)
      .innerJoin(categories, eq(words.categoryId, categories.id));

    return rows.map((row) =>
      Word.fromTrusted({
        id: String(row.id),
        polish: row.polish,
        english: row.english,
        category: row.category,
        difficulty: row.difficulty,
      })
    );
  }

  async findById(id: WordId): Promise<Word | null> {
    const numericId = parseInt(id.value, 10);
    if (isNaN(numericId)) return null;

    const rows = await this.db
      .select({
        id: words.id,
        polish: words.polish,
        english: words.english,
        category: categories.name,
        difficulty: words.difficulty,
      })
      .from(words)
      .innerJoin(categories, eq(words.categoryId, categories.id))
      .where(eq(words.id, numericId))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0]!;
    return Word.fromTrusted({
      id: String(row.id),
      polish: row.polish,
      english: row.english,
      category: row.category,
      difficulty: row.difficulty,
    });
  }

  async findByFilters(filters: WordFilters): Promise<Word[]> {
    const conditions = [];

    if (filters.category) {
      conditions.push(eq(categories.name, filters.category.name));
    }
    if (filters.difficulty) {
      conditions.push(eq(words.difficulty, filters.difficulty.value));
    }

    const query = this.db
      .select({
        id: words.id,
        polish: words.polish,
        english: words.english,
        category: categories.name,
        difficulty: words.difficulty,
      })
      .from(words)
      .innerJoin(categories, eq(words.categoryId, categories.id));

    const rows =
      conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;

    return rows.map((row) =>
      Word.fromTrusted({
        id: String(row.id),
        polish: row.polish,
        english: row.english,
        category: row.category,
        difficulty: row.difficulty,
      })
    );
  }

  async getCategories(): Promise<Category[]> {
    const rows = await this.db
      .select({ name: categories.name })
      .from(categories)
      .orderBy(categories.name);

    return rows.map((row) => Category.fromTrusted(row.name));
  }

  async getDifficulties(): Promise<Difficulty[]> {
    const rows = await this.db
      .selectDistinct({ difficulty: words.difficulty })
      .from(words)
      .orderBy(words.difficulty);

    return rows.map((row) => Difficulty.fromTrusted(row.difficulty));
  }

  async count(filters?: WordFilters): Promise<number> {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(categories.name, filters.category.name));
    }
    if (filters?.difficulty) {
      conditions.push(eq(words.difficulty, filters.difficulty.value));
    }

    const query = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(words)
      .innerJoin(categories, eq(words.categoryId, categories.id));

    const result =
      conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;

    return result[0]?.count ?? 0;
  }

  async isEmpty(): Promise<boolean> {
    const count = await this.count();
    return count === 0;
  }
}
