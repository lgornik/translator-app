import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CachedWordRepository } from '../../infrastructure/persistence/CachedWordRepository.js';
import { InMemoryWordRepository } from '../../infrastructure/persistence/InMemoryWordRepository.js';
import { NullLogger } from '../../infrastructure/logging/Logger.js';
import { WordId } from '../../domain/value-objects/WordId.js';
import { Category } from '../../domain/value-objects/Category.js';
import { Difficulty } from '../../domain/value-objects/Difficulty.js';
import { WordData } from '../../domain/entities/Word.js';

describe('CachedWordRepository', () => {
  const testWords: WordData[] = [
    { id: '1', polish: 'kot', english: 'cat', category: 'Animals', difficulty: 1 },
    { id: '2', polish: 'pies', english: 'dog', category: 'Animals', difficulty: 1 },
    { id: '3', polish: 'dom', english: 'house', category: 'Objects', difficulty: 2 },
    { id: '4', polish: 'samochód', english: 'car', category: 'Objects', difficulty: 3 },
  ];

  let baseRepository: InMemoryWordRepository;
  let cachedRepository: CachedWordRepository;
  let logger: NullLogger;

  beforeEach(() => {
    vi.useFakeTimers();
    baseRepository = new InMemoryWordRepository(testWords);
    logger = new NullLogger();
    cachedRepository = new CachedWordRepository(baseRepository, logger, {
      ttlMs: 5000, // 5 seconds for testing
      maxSize: 100,
      enableStats: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('findAll', () => {
    it('should return all words from base repository', async () => {
      const words = await cachedRepository.findAll();
      expect(words).toHaveLength(4);
    });

    it('should cache results and not call base repository again', async () => {
      const findAllSpy = vi.spyOn(baseRepository, 'findAll');

      await cachedRepository.findAll();
      await cachedRepository.findAll();
      await cachedRepository.findAll();

      expect(findAllSpy).toHaveBeenCalledTimes(1);
    });

    it('should refetch after TTL expires', async () => {
      const findAllSpy = vi.spyOn(baseRepository, 'findAll');

      await cachedRepository.findAll();
      expect(findAllSpy).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      vi.advanceTimersByTime(6000);

      await cachedRepository.findAll();
      expect(findAllSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('should return word by ID', async () => {
      const wordId = WordId.fromTrusted('1');
      const word = await cachedRepository.findById(wordId);
      
      expect(word).not.toBeNull();
      expect(word?.polish).toBe('kot');
    });

    it('should cache individual word lookups', async () => {
      const findByIdSpy = vi.spyOn(baseRepository, 'findById');
      const wordId = WordId.fromTrusted('1');

      await cachedRepository.findById(wordId);
      await cachedRepository.findById(wordId);

      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent word', async () => {
      const wordId = WordId.fromTrusted('999');
      const word = await cachedRepository.findById(wordId);
      
      expect(word).toBeNull();
    });
  });

  describe('findByFilters', () => {
    it('should filter by category', async () => {
      const category = Category.fromTrusted('Animals');
      const words = await cachedRepository.findByFilters({ category });
      
      expect(words).toHaveLength(2);
      expect(words.every(w => w.category.name === 'Animals')).toBe(true);
    });

    it('should filter by difficulty', async () => {
      const difficulty = Difficulty.fromTrusted(1);
      const words = await cachedRepository.findByFilters({ difficulty });
      
      expect(words).toHaveLength(2);
      expect(words.every(w => w.difficulty.value === 1)).toBe(true);
    });

    it('should cache filtered results separately', async () => {
      const findByFiltersSpy = vi.spyOn(baseRepository, 'findByFilters');
      const category = Category.fromTrusted('Animals');
      const difficulty = Difficulty.fromTrusted(1);

      await cachedRepository.findByFilters({ category });
      await cachedRepository.findByFilters({ category });
      await cachedRepository.findByFilters({ difficulty });
      await cachedRepository.findByFilters({ difficulty });

      // Should call base repo twice (once for each unique filter combination)
      expect(findByFiltersSpy).toHaveBeenCalledTimes(2);
    });

    it('should use findAll cache when no filters provided', async () => {
      const findAllSpy = vi.spyOn(baseRepository, 'findAll');
      const findByFiltersSpy = vi.spyOn(baseRepository, 'findByFilters');

      await cachedRepository.findByFilters({});

      expect(findAllSpy).toHaveBeenCalledTimes(1);
      expect(findByFiltersSpy).not.toHaveBeenCalled();
    });
  });

  describe('getCategories', () => {
    it('should return all unique categories', async () => {
      const categories = await cachedRepository.getCategories();
      
      expect(categories).toHaveLength(2);
      expect(categories.map(c => c.name)).toContain('Animals');
      expect(categories.map(c => c.name)).toContain('Objects');
    });

    it('should cache categories', async () => {
      const getCategoriesSpy = vi.spyOn(baseRepository, 'getCategories');

      await cachedRepository.getCategories();
      await cachedRepository.getCategories();

      expect(getCategoriesSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      const count = await cachedRepository.count();
      expect(count).toBe(4);
    });

    it('should cache count results', async () => {
      const countSpy = vi.spyOn(baseRepository, 'count');

      await cachedRepository.count();
      await cachedRepository.count();

      expect(countSpy).toHaveBeenCalledTimes(1);
    });

    it('should cache filtered counts separately', async () => {
      const countSpy = vi.spyOn(baseRepository, 'count');
      const category = Category.fromTrusted('Animals');

      await cachedRepository.count();
      await cachedRepository.count({ category });
      await cachedRepository.count({ category });

      expect(countSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate all cache entries', async () => {
      const findAllSpy = vi.spyOn(baseRepository, 'findAll');

      await cachedRepository.findAll();
      expect(findAllSpy).toHaveBeenCalledTimes(1);

      cachedRepository.invalidateAll();

      await cachedRepository.findAll();
      expect(findAllSpy).toHaveBeenCalledTimes(2);
    });

    it('should invalidate specific cache key', async () => {
      const getCategoriesSpy = vi.spyOn(baseRepository, 'getCategories');

      await cachedRepository.getCategories();
      cachedRepository.invalidate('categories');
      await cachedRepository.getCategories();

      expect(getCategoriesSpy).toHaveBeenCalledTimes(2);
    });

    it('should invalidate word-related caches only', async () => {
      const findAllSpy = vi.spyOn(baseRepository, 'findAll');
      const getCategoriesSpy = vi.spyOn(baseRepository, 'getCategories');

      await cachedRepository.findAll();
      await cachedRepository.getCategories();

      cachedRepository.invalidateWords();

      await cachedRepository.findAll();
      await cachedRepository.getCategories();

      expect(findAllSpy).toHaveBeenCalledTimes(2);
      expect(getCategoriesSpy).toHaveBeenCalledTimes(1); // Categories not invalidated
    });
  });

  describe('warmUp', () => {
    it('should preload common data into cache', async () => {
      const findAllSpy = vi.spyOn(baseRepository, 'findAll');
      const getCategoriesSpy = vi.spyOn(baseRepository, 'getCategories');
      const getDifficultiesSpy = vi.spyOn(baseRepository, 'getDifficulties');
      const countSpy = vi.spyOn(baseRepository, 'count');

      await cachedRepository.warmUp();

      expect(findAllSpy).toHaveBeenCalledTimes(1);
      expect(getCategoriesSpy).toHaveBeenCalledTimes(1);
      expect(getDifficultiesSpy).toHaveBeenCalledTimes(1);
      expect(countSpy).toHaveBeenCalledTimes(1);

      // Subsequent calls should use cache
      await cachedRepository.findAll();
      await cachedRepository.getCategories();

      expect(findAllSpy).toHaveBeenCalledTimes(1);
      expect(getCategoriesSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats', () => {
    it('should track hits and misses', async () => {
      await cachedRepository.findAll(); // miss
      await cachedRepository.findAll(); // hit
      await cachedRepository.findAll(); // hit

      const stats = cachedRepository.getStats();

      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(2);
      expect(stats.hitRate).toBe('66.7%');
    });
  });

  describe('max size eviction', () => {
    it('should evict oldest entries when max size reached', async () => {
      const smallCacheRepo = new CachedWordRepository(baseRepository, logger, {
        ttlMs: 5000,
        maxSize: 2, // Very small cache
        enableStats: false,
      });

      // Fill cache beyond max size
      await smallCacheRepo.findAll();
      await smallCacheRepo.getCategories();
      await smallCacheRepo.getDifficulties();

      const stats = smallCacheRepo.getStats();
      expect(stats.size).toBeLessThanOrEqual(2);
      expect(stats.evictions).toBeGreaterThan(0);
    });
  });
});