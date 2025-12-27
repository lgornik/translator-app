import { describe, it, expect, beforeEach } from 'vitest';
import { resolvers } from '../../infrastructure/graphql/resolvers.js';
import { createContext, GraphQLContext } from '../../infrastructure/graphql/context.js';
import { InMemoryWordRepository } from '../../infrastructure/persistence/InMemoryWordRepository.js';
import { InMemorySessionRepository } from '../../infrastructure/persistence/InMemorySessionRepository.js';
import { NullLogger } from '../../infrastructure/logging/Logger.js';
import { WordData } from '../../domain/entities/Word.js';

describe('GraphQL Resolvers', () => {
  const testWords: WordData[] = [
    { id: '1', polish: 'kot', english: 'cat', category: 'Animals', difficulty: 1 },
    { id: '2', polish: 'pies', english: 'dog', category: 'Animals', difficulty: 1 },
    { id: '3', polish: 'dom', english: 'house', category: 'Objects', difficulty: 2 },
    { id: '4', polish: 'trudne słowo', english: 'difficult word', category: 'Objects', difficulty: 3 },
  ];

  let ctx: GraphQLContext;
  let wordRepository: InMemoryWordRepository;
  let sessionRepository: InMemorySessionRepository;

  beforeEach(() => {
    wordRepository = new InMemoryWordRepository(testWords);
    sessionRepository = new InMemorySessionRepository();
    ctx = createContext(
      {
        wordRepository,
        sessionRepository,
        logger: new NullLogger(),
        startTime: Date.now(),
      },
      'test-request-id',
      'test-session-id'
    );
  });

  describe('Query.info', () => {
    it('should return API info', () => {
      const result = resolvers.Query.info({}, {}, ctx);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result.status).toBe('ok');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('Query.health', () => {
    it('should return health status', () => {
      const result = resolvers.Query.health({}, {}, ctx);

      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.uptime).toBe('number');
      expect(result.sessionCount).toBe(0);
      expect(result.wordCount).toBe(testWords.length);
    });
  });

  describe('Query.getRandomWord', () => {
    it('should return a random word', () => {
      const result = resolvers.Query.getRandomWord(
        {},
        { mode: 'EN_TO_PL' },
        ctx
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('wordToTranslate');
      expect(result).toHaveProperty('correctTranslation');
      expect(result.mode).toBe('EN_TO_PL');
    });

    it('should filter by category', () => {
      const result = resolvers.Query.getRandomWord(
        {},
        { mode: 'EN_TO_PL', category: 'Animals' },
        ctx
      );

      expect(result.category).toBe('Animals');
    });

    it('should filter by difficulty', () => {
      const result = resolvers.Query.getRandomWord(
        {},
        { mode: 'EN_TO_PL', difficulty: 3 },
        ctx
      );

      expect(result.difficulty).toBe(3);
    });

    it('should throw error for invalid mode', () => {
      expect(() => {
        resolvers.Query.getRandomWord(
          {},
          { mode: 'INVALID' },
          ctx
        );
      }).toThrow();
    });

    it('should throw error when no words available', () => {
      expect(() => {
        resolvers.Query.getRandomWord(
          {},
          { mode: 'EN_TO_PL', category: 'NonExistent' },
          ctx
        );
      }).toThrow();
    });
  });

  describe('Query.getAllWords', () => {
    it('should return all words', () => {
      const result = resolvers.Query.getAllWords({}, {}, ctx);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(testWords.length);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('polish');
      expect(result[0]).toHaveProperty('english');
    });
  });

  describe('Query.getCategories', () => {
    it('should return unique categories', () => {
      const result = resolvers.Query.getCategories({}, {}, ctx);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('Animals');
      expect(result).toContain('Objects');
      expect(result.length).toBe(2);
    });
  });

  describe('Query.getDifficulties', () => {
    it('should return available difficulties', () => {
      const result = resolvers.Query.getDifficulties({}, {}, ctx);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
    });
  });

  describe('Query.getWordCount', () => {
    it('should return total count without filters', () => {
      const result = resolvers.Query.getWordCount({}, {}, ctx);

      expect(result.count).toBe(testWords.length);
    });

    it('should return filtered count by category', () => {
      const result = resolvers.Query.getWordCount(
        {},
        { category: 'Animals' },
        ctx
      );

      expect(result.count).toBe(2);
    });

    it('should return filtered count by difficulty', () => {
      const result = resolvers.Query.getWordCount(
        {},
        { difficulty: 1 },
        ctx
      );

      expect(result.count).toBe(2);
    });

    it('should return filtered count with both filters', () => {
      const result = resolvers.Query.getWordCount(
        {},
        { category: 'Animals', difficulty: 1 },
        ctx
      );

      expect(result.count).toBe(2);
    });
  });

  describe('Mutation.checkTranslation', () => {
    it('should return correct for right answer', () => {
      const result = resolvers.Mutation.checkTranslation(
        {},
        { wordId: '1', userTranslation: 'kot', mode: 'EN_TO_PL' },
        ctx
      );

      expect(result.isCorrect).toBe(true);
      expect(result.correctTranslation).toBe('kot');
      expect(result.userTranslation).toBe('kot');
    });

    it('should return incorrect for wrong answer', () => {
      const result = resolvers.Mutation.checkTranslation(
        {},
        { wordId: '1', userTranslation: 'pies', mode: 'EN_TO_PL' },
        ctx
      );

      expect(result.isCorrect).toBe(false);
      expect(result.correctTranslation).toBe('kot');
    });

    it('should handle PL_TO_EN mode', () => {
      const result = resolvers.Mutation.checkTranslation(
        {},
        { wordId: '1', userTranslation: 'cat', mode: 'PL_TO_EN' },
        ctx
      );

      expect(result.isCorrect).toBe(true);
      expect(result.correctTranslation).toBe('cat');
    });

    it('should throw error for non-existent word', () => {
      expect(() => {
        resolvers.Mutation.checkTranslation(
          {},
          { wordId: 'non-existent', userTranslation: 'test', mode: 'EN_TO_PL' },
          ctx
        );
      }).toThrow();
    });
  });

  describe('Mutation.resetSession', () => {
    it('should reset session successfully', () => {
      // First get a word to create session state
      resolvers.Query.getRandomWord({}, { mode: 'EN_TO_PL' }, ctx);

      const result = resolvers.Mutation.resetSession({}, {}, ctx);

      expect(result).toBe(true);
    });

    it('should succeed even for non-existent session', () => {
      const result = resolvers.Mutation.resetSession({}, {}, ctx);

      expect(result).toBe(true);
    });
  });
});
