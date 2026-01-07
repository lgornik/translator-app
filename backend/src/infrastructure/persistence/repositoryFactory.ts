import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { ILogger } from '../../application/interfaces/ILogger.js';
import { InMemoryWordRepository } from './InMemoryWordRepository.js';
import { InMemorySessionRepository } from './InMemorySessionRepository.js';
import { PostgresWordRepository } from './postgres/PostgresWordRepository.js';
import { PostgresSessionRepository } from './postgres/PostgresSessionRepository.js';
import { CachedWordRepository, CacheConfig } from './CachedWordRepository.js';
import { dictionaryData } from '../data/dictionary.js';
import { NullLogger } from '../logging/Logger.js';

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: string;
}

/**
 * Database health check result
 */
export interface DatabaseHealthCheck {
  ok: boolean;
  latency: number;
  error?: string;
}

/**
 * Repository instances
 */
export interface Repositories {
  wordRepository: IWordRepository;
  sessionRepository: ISessionRepository;
  cleanup?: () => Promise<void>;
  /** Warm up caches (call after startup) */
  warmUp?: () => Promise<void>;
  /** Invalidate all caches */
  invalidateCaches?: () => void;
  /** Get cache statistics */
  getCacheStats?: () => CacheStats;
  /** Check database connectivity */
  checkDatabase: () => Promise<DatabaseHealthCheck>;
  /** Get session count */
  getSessionCount: () => Promise<number>;
}

/**
 * Repository creation options
 */
export interface RepositoryOptions {
  /** Enable caching for word repository (default: true) */
  enableCache?: boolean;
  /** Cache configuration */
  cacheConfig?: Partial<CacheConfig>;
  /** Logger instance */
  logger?: ILogger;
}

const DEFAULT_OPTIONS: RepositoryOptions = {
  enableCache: true,
  cacheConfig: {
    ttlMs: 5 * 60 * 1000, // 5 minutes
    maxSize: 10000,
    enableStats: true,
  },
};

/**
 * Create repositories based on configuration
 */
export function createRepositories(
  databaseUrl?: string,
  options: RepositoryOptions = {}
): Repositories {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const logger = opts.logger ?? new NullLogger();

  let baseWordRepository: IWordRepository;
  let sessionRepository: ISessionRepository;
  let cleanup: (() => Promise<void>) | undefined;
  let checkDatabase: () => Promise<DatabaseHealthCheck>;
  let db: PostgresJsDatabase | undefined;

  if (databaseUrl) {
    const client = postgres(databaseUrl);
    db = drizzle(client);

    baseWordRepository = new PostgresWordRepository(db);
    sessionRepository = new PostgresSessionRepository(db);
    
    cleanup = async () => {
      await client.end();
    };

    // PostgreSQL health check - runs SELECT 1
    checkDatabase = async (): Promise<DatabaseHealthCheck> => {
      const startTime = Date.now();
      try {
        await db!.execute(sql`SELECT 1`);
        return {
          ok: true,
          latency: Date.now() - startTime,
        };
      } catch (error) {
        return {
          ok: false,
          latency: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    };
  } else {
    // InMemory repositories
    baseWordRepository = new InMemoryWordRepository(dictionaryData);
    sessionRepository = new InMemorySessionRepository();
    
    // InMemory is always "healthy"
    checkDatabase = async (): Promise<DatabaseHealthCheck> => ({
      ok: true,
      latency: 0,
    });
  }

  // Wrap with cache if enabled
  let wordRepository: IWordRepository = baseWordRepository;
  let warmUp: (() => Promise<void>) | undefined;
  let invalidateCaches: (() => void) | undefined;
  let getCacheStats: (() => CacheStats) | undefined;

  if (opts.enableCache) {
    const cachedRepo = new CachedWordRepository(
      baseWordRepository,
      logger,
      opts.cacheConfig
    );
    wordRepository = cachedRepo;
    warmUp = () => cachedRepo.warmUp();
    invalidateCaches = () => cachedRepo.invalidateAll();
    getCacheStats = () => cachedRepo.getStats();
  }

  // Build result object (handling exactOptionalPropertyTypes)
  const result: Repositories = {
    wordRepository,
    sessionRepository,
    checkDatabase,
    getSessionCount: () => sessionRepository.count(),
  };

  if (cleanup) {
    result.cleanup = cleanup;
  }
  if (warmUp) {
    result.warmUp = warmUp;
  }
  if (invalidateCaches) {
    result.invalidateCaches = invalidateCaches;
  }
  if (getCacheStats) {
    result.getCacheStats = getCacheStats;
  }

  return result;
}

/**
 * Create PostgreSQL database connection
 */
export function createDatabase(databaseUrl: string): PostgresJsDatabase {
  const client = postgres(databaseUrl);
  return drizzle(client);
}