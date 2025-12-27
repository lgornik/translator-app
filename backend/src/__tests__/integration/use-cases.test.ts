import { describe, it, expect, beforeEach } from 'vitest';
import { GetRandomWordUseCase } from '../../application/use-cases/GetRandomWordUseCase.js';
import { CheckTranslationUseCase } from '../../application/use-cases/CheckTranslationUseCase.js';
import { GetWordCountUseCase } from '../../application/use-cases/GetWordCountUseCase.js';
import { ResetSessionUseCase } from '../../application/use-cases/ResetSessionUseCase.js';
import { InMemoryWordRepository } from '../../infrastructure/persistence/InMemoryWordRepository.js';
import { InMemorySessionRepository } from '../../infrastructure/persistence/InMemorySessionRepository.js';
import { RandomWordPicker } from '../../domain/services/RandomWordPicker.js';
import { TranslationChecker } from '../../domain/services/TranslationChecker.js';
import { NullLogger } from '../../infrastructure/logging/Logger.js';
import { WordData } from '../../domain/entities/Word.js';

describe('Use Cases Integration', () => {
  const testWords: WordData[] = [
    { id: '1', polish: 'kot', english: 'cat', category: 'Animals', difficulty: 1 },
    { id: '2', polish: 'pies', english: 'dog', category: 'Animals', difficulty: 1 },
    { id: '3', polish: 'dom', english: 'house', category: 'Objects', difficulty: 2 },
    { id: '4', polish: 'trudne słowo', english: 'difficult word', category: 'Objects', difficulty: 3 },
  ];

  let wordRepository: InMemoryWordRepository;
  let sessionRepository: InMemorySessionRepository;
  let logger: NullLogger;

  beforeEach(() => {
    wordRepository = new InMemoryWordRepository(testWords);
    sessionRepository = new InMemorySessionRepository();
    logger = new NullLogger();
  });

  describe('GetRandomWordUseCase', () => {
    it('should return a random word', () => {
      const useCase = new GetRandomWordUseCase(
        wordRepository,
        sessionRepository,
        new RandomWordPicker(),
        logger
      );

      const result = useCase.execute({
        mode: 'EN_TO_PL',
        sessionId: 'test-session',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveProperty('id');
        expect(result.value).toHaveProperty('wordToTranslate');
        expect(result.value.mode).toBe('EN_TO_PL');
      }
    });

    it('should filter by category', () => {
      const useCase = new GetRandomWordUseCase(
        wordRepository,
        sessionRepository,
        new RandomWordPicker(),
        logger
      );

      const result = useCase.execute({
        mode: 'EN_TO_PL',
        category: 'Animals',
        sessionId: 'test-session',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.category).toBe('Animals');
      }
    });

    it('should filter by difficulty', () => {
      const useCase = new GetRandomWordUseCase(
        wordRepository,
        sessionRepository,
        new RandomWordPicker(),
        logger
      );

      const result = useCase.execute({
        mode: 'EN_TO_PL',
        difficulty: 3,
        sessionId: 'test-session',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.difficulty).toBe(3);
      }
    });

    it('should return error for invalid mode', () => {
      const useCase = new GetRandomWordUseCase(
        wordRepository,
        sessionRepository,
        new RandomWordPicker(),
        logger
      );

      const result = useCase.execute({
        mode: 'INVALID',
        sessionId: 'test-session',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return error for non-existent category', () => {
      const useCase = new GetRandomWordUseCase(
        wordRepository,
        sessionRepository,
        new RandomWordPicker(),
        logger
      );

      const result = useCase.execute({
        mode: 'EN_TO_PL',
        category: 'NonExistent',
        sessionId: 'test-session',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NO_WORDS_AVAILABLE');
      }
    });

    it('should track used words per session', () => {
      const useCase = new GetRandomWordUseCase(
        wordRepository,
        sessionRepository,
        new RandomWordPicker(),
        logger
      );

      const sessionId = 'unique-session';
      const usedIds = new Set<string>();

      // Get all words
      for (let i = 0; i < testWords.length; i++) {
        const result = useCase.execute({
          mode: 'EN_TO_PL',
          sessionId,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(usedIds.has(result.value.id)).toBe(false);
          usedIds.add(result.value.id);
        }
      }

      expect(usedIds.size).toBe(testWords.length);
    });
  });

  describe('CheckTranslationUseCase', () => {
    it('should return correct for right answer', () => {
      const useCase = new CheckTranslationUseCase(
        wordRepository,
        new TranslationChecker(),
        logger
      );

      const result = useCase.execute({
        wordId: '1',
        userTranslation: 'kot',
        mode: 'EN_TO_PL',
        sessionId: 'test',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isCorrect).toBe(true);
        expect(result.value.correctTranslation).toBe('kot');
      }
    });

    it('should return incorrect for wrong answer', () => {
      const useCase = new CheckTranslationUseCase(
        wordRepository,
        new TranslationChecker(),
        logger
      );

      const result = useCase.execute({
        wordId: '1',
        userTranslation: 'pies',
        mode: 'EN_TO_PL',
        sessionId: 'test',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isCorrect).toBe(false);
      }
    });

    it('should return error for non-existent word', () => {
      const useCase = new CheckTranslationUseCase(
        wordRepository,
        new TranslationChecker(),
        logger
      );

      const result = useCase.execute({
        wordId: 'non-existent',
        userTranslation: 'test',
        mode: 'EN_TO_PL',
        sessionId: 'test',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('GetWordCountUseCase', () => {
    it('should return total count without filters', () => {
      const useCase = new GetWordCountUseCase(wordRepository);
      const result = useCase.execute({});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.count).toBe(testWords.length);
      }
    });

    it('should return filtered count by category', () => {
      const useCase = new GetWordCountUseCase(wordRepository);
      const result = useCase.execute({ category: 'Animals' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.count).toBe(2);
      }
    });

    it('should return filtered count by difficulty', () => {
      const useCase = new GetWordCountUseCase(wordRepository);
      const result = useCase.execute({ difficulty: 1 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.count).toBe(2);
      }
    });
  });

  describe('ResetSessionUseCase', () => {
    it('should reset session successfully', () => {
      const useCase = new ResetSessionUseCase(sessionRepository, logger);
      const result = useCase.execute({ sessionId: 'test-session' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.success).toBe(true);
      }
    });

    it('should succeed even for non-existent session', () => {
      const useCase = new ResetSessionUseCase(sessionRepository, logger);
      const result = useCase.execute({ sessionId: 'non-existent' });

      expect(result.ok).toBe(true);
    });
  });
});
