import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { InMemoryWordRepository } from './InMemoryWordRepository.js';
import { InMemorySessionRepository } from './InMemorySessionRepository.js';
import { PostgresWordRepository } from './postgres/PostgresWordRepository.js';
import { PostgresSessionRepository } from './postgres/PostgresSessionRepository.js';
import { dictionaryData } from '../data/dictionary.js';

/**
 * Repository instances
 */
export interface Repositories {
  wordRepository: IWordRepository;
  sessionRepository: ISessionRepository;
  cleanup?: () => Promise<void>;
}

/**
 * Create repositories based on configuration
 *
 * @param databaseUrl - PostgreSQL connection string (optional)
 *                      If not provided, uses InMemory repositories
 *
 * @example
 * // InMemory (development/testing)
 * const repos = createRepositories();
 *
 * // PostgreSQL (production)
 * const repos = createRepositories(process.env.DATABASE_URL);
 */
export function createRepositories(databaseUrl?: string): Repositories {
  if (databaseUrl) {
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    return {
      wordRepository: new PostgresWordRepository(db),
      sessionRepository: new PostgresSessionRepository(db),
      cleanup: async () => {
        await client.end();
      },
    };
  }

  // Fallback to InMemory (development/testing)
  return {
    wordRepository: new InMemoryWordRepository(dictionaryData),
    sessionRepository: new InMemorySessionRepository(),
  };
}

/**
 * Create PostgreSQL database connection
 * Use this if you need direct access to the database
 */
export function createDatabase(databaseUrl: string): PostgresJsDatabase {
  const client = postgres(databaseUrl);
  return drizzle(client);
}
