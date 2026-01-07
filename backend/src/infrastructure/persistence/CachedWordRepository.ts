import { Word } from '../../domain/entities/Word.js';
import { WordId } from '../../domain/value-objects/WordId.js';
import { Category } from '../../domain/value-objects/Category.js';
import { Difficulty } from '../../domain/value-objects/Difficulty.js';
import { IWordRepository, WordFilters } from '../../domain/repositories/IWordRepository.js';
import { ILogger } from '../../application/interfaces/ILogger.js';

/**
 * Cache entry with TTL support
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttlMs: number;
  /** Maximum cache size (default: 10000 entries) */
  maxSize: number;
  /** Enable cache statistics logging (default: true) */
  enableStats: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 10000,
  enableStats: true,
};

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}

/**
 * Cached Word Repository (Decorator Pattern)
 * 
 * Wraps any IWordRepository implementation with an in-memory cache.
 * Uses the Decorator pattern to add caching without modifying the original repository.
 * 
 * Features:
 * - TTL-based expiration
 * - LRU eviction when max size reached
 * - Cache invalidation methods
 * - Statistics tracking
 * 
 * @example
 * ```typescript
 * const postgresRepo = new PostgresWordRepository(db);
 * const cachedRepo = new CachedWordRepository(postgresRepo, logger, {
 *   ttlMs: 10 * 60 * 1000, // 10 minutes
 * });
 * ```
 */
export class CachedWordRepository implements IWordRepository {
  private readonly cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly config: CacheConfig;
  private readonly stats: CacheStats = { hits: 0, misses: 0, evictions: 0 };
  
  // Cache keys
  private static readonly KEYS = {
    ALL_WORDS: 'all_words',
    CATEGORIES: 'categories',
    DIFFICULTIES: 'difficulties',
    COUNT_ALL: 'count_all',
    wordById: (id: string) => `word:${id}`,
    wordsByFilters: (filters: WordFilters) => {
      const parts = ['words'];
      if (filters.category) parts.push(`cat:${filters.category.name}`);
      if (filters.difficulty) parts.push(`diff:${filters.difficulty.value}`);
      return parts.join(':');
    },
    countByFilters: (filters: WordFilters) => {
      const parts = ['count'];
      if (filters.category) parts.push(`cat:${filters.category.name}`);
      if (filters.difficulty) parts.push(`diff:${filters.difficulty.value}`);
      return parts.join(':');
    },
  };

  constructor(
    private readonly repository: IWordRepository,
    private readonly logger: ILogger,
    config: Partial<CacheConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.logger.info('CachedWordRepository initialized', {
      ttlMs: this.config.ttlMs,
      maxSize: this.config.maxSize,
    });
  }

  // ============================================================================
  // IWordRepository Implementation
  // ============================================================================

  async findAll(): Promise<Word[]> {
    return this.getOrSet(
      CachedWordRepository.KEYS.ALL_WORDS,
      () => this.repository.findAll()
    );
  }

  async findById(id: WordId): Promise<Word | null> {
    return this.getOrSet(
      CachedWordRepository.KEYS.wordById(id.value),
      () => this.repository.findById(id)
    );
  }

  async findByFilters(filters: WordFilters): Promise<Word[]> {
    // Jeśli nie ma filtrów, użyj cache dla wszystkich słów
    if (!filters.category && !filters.difficulty) {
      return this.findAll();
    }

    return this.getOrSet(
      CachedWordRepository.KEYS.wordsByFilters(filters),
      () => this.repository.findByFilters(filters)
    );
  }

  async getCategories(): Promise<Category[]> {
    return this.getOrSet(
      CachedWordRepository.KEYS.CATEGORIES,
      () => this.repository.getCategories()
    );
  }

  async getDifficulties(): Promise<Difficulty[]> {
    return this.getOrSet(
      CachedWordRepository.KEYS.DIFFICULTIES,
      () => this.repository.getDifficulties()
    );
  }

  async count(filters?: WordFilters): Promise<number> {
    if (!filters || (!filters.category && !filters.difficulty)) {
      return this.getOrSet(
        CachedWordRepository.KEYS.COUNT_ALL,
        () => this.repository.count(filters)
      );
    }

    return this.getOrSet(
      CachedWordRepository.KEYS.countByFilters(filters),
      () => this.repository.count(filters)
    );
  }

  async isEmpty(): Promise<boolean> {
    const count = await this.count();
    return count === 0;
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Get from cache or fetch and cache
   */
  private async getOrSet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      this.stats.hits++;
      this.logStats('hit', key);
      return cached;
    }

    this.stats.misses++;
    this.logStats('miss', key);
    
    const data = await fetcher();
    this.set(key, data);
    
    return data;
  }

  /**
   * Get value from cache if not expired
   */
  private get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  private set<T>(key: string, data: T): void {
    // Evict if at max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.config.ttlMs,
    });
  }

  /**
   * Evict the oldest entry (simple LRU approximation)
   */
  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Log cache statistics periodically
   */
  private logStats(event: 'hit' | 'miss', key: string): void {
    if (!this.config.enableStats) return;

    const total = this.stats.hits + this.stats.misses;
    
    // Log every 100 operations
    if (total % 100 === 0 && total > 0) {
      const hitRate = ((this.stats.hits / total) * 100).toFixed(1);
      this.logger.info('Cache statistics', {
        hits: this.stats.hits,
        misses: this.stats.misses,
        evictions: this.stats.evictions,
        hitRate: `${hitRate}%`,
        cacheSize: this.cache.size,
      });
    }

    this.logger.debug(`Cache ${event}`, { key });
  }

  // ============================================================================
  // Public Cache Control Methods
  // ============================================================================

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info('Cache invalidated', { entriesCleared: size });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cache key invalidated', { key });
    }
    return deleted;
  }

  /**
   * Invalidate all word-related caches (useful after data changes)
   */
  invalidateWords(): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith('word') || key === CachedWordRepository.KEYS.ALL_WORDS) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    this.logger.info('Word caches invalidated', { keysCleared: keysToDelete.length });
  }

  /**
   * Warm up cache by preloading common data
   */
  async warmUp(): Promise<void> {
    this.logger.info('Warming up cache...');
    
    const startTime = Date.now();
    
    await Promise.all([
      this.findAll(),
      this.getCategories(),
      this.getDifficulties(),
      this.count(),
    ]);

    const duration = Date.now() - startTime;
    this.logger.info('Cache warm-up complete', { 
      duration,
      cacheSize: this.cache.size,
    });
  }

  /**
   * Get current cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
    };
  }
}