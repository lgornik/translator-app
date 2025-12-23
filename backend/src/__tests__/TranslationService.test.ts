import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationService } from '../domain/services/TranslationService.js';
import { InMemoryWordRepository } from '../domain/repositories/WordRepository.js';
import { TranslationMode, Difficulty } from '../shared/types/index.js';
import { NoWordsAvailableError, NotFoundError } from '../shared/errors/index.js';

describe('TranslationService', () => {
  let service: TranslationService;
  
  const testWords = [
    { id: '1', polish: 'podjąć decyzję', english: 'make a decision', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
    { id: '2', polish: 'dojść do wniosku', english: 'reach a conclusion', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
    { id: '3', polish: 'pogodzić się z (czymś)', english: 'come to terms with', category: 'kolokacje', difficulty: Difficulty.HARD },
    { id: '4', polish: 'dom', english: 'house', category: 'A1', difficulty: Difficulty.EASY },
    { id: '5', polish: 'rodzina', english: 'family', category: 'A1', difficulty: Difficulty.EASY },
  ];

  beforeEach(() => {
    const repository = new InMemoryWordRepository(testWords);
    service = new TranslationService(repository);
  });

  describe('getRandomWord', () => {
    it('should return a word challenge', () => {
      const challenge = service.getRandomWord(TranslationMode.EN_TO_PL);
      
      expect(challenge).toHaveProperty('id');
      expect(challenge).toHaveProperty('wordToTranslate');
      expect(challenge).toHaveProperty('correctTranslation');
      expect(challenge).toHaveProperty('mode', TranslationMode.EN_TO_PL);
    });

    it('should filter by category', () => {
      const challenge = service.getRandomWord(
        TranslationMode.EN_TO_PL,
        { category: 'A1' }
      );
      
      expect(challenge.category).toBe('A1');
    });

    it('should filter by difficulty', () => {
      const challenge = service.getRandomWord(
        TranslationMode.EN_TO_PL,
        { difficulty: Difficulty.EASY }
      );
      
      expect(challenge.difficulty).toBe(Difficulty.EASY);
    });

    it('should throw NoWordsAvailableError for non-existent category', () => {
      expect(() => 
        service.getRandomWord(TranslationMode.EN_TO_PL, { category: 'NonExistent' })
      ).toThrow(NoWordsAvailableError);
    });

    it('should track used words per session', () => {
      const sessionId = 'test-session';
      const usedIds = new Set<string>();
      
      // Get all available words
      for (let i = 0; i < testWords.length; i++) {
        const challenge = service.getRandomWord(TranslationMode.EN_TO_PL, {}, sessionId);
        expect(usedIds.has(challenge.id)).toBe(false);
        usedIds.add(challenge.id);
      }
      
      expect(usedIds.size).toBe(testWords.length);
    });

    it('should reset when all words are used', () => {
      const sessionId = 'test-session';
      
      // Use all words
      for (let i = 0; i < testWords.length; i++) {
        service.getRandomWord(TranslationMode.EN_TO_PL, {}, sessionId);
      }
      
      // Should still be able to get a word (session resets)
      const challenge = service.getRandomWord(TranslationMode.EN_TO_PL, {}, sessionId);
      expect(challenge).toBeDefined();
    });
  });

  describe('checkTranslation', () => {
    it('should return correct result for right answer', () => {
      const result = service.checkTranslation('1', 'make a decision', TranslationMode.EN_TO_PL);
      
      expect(result.isCorrect).toBe(true);
      expect(result.correctTranslation).toBe('podjąć decyzję');
      expect(result.userTranslation).toBe('make a decision');
    });

    it('should return incorrect result for wrong answer', () => {
      const result = service.checkTranslation('1', 'wrong answer', TranslationMode.EN_TO_PL);
      
      expect(result.isCorrect).toBe(false);
      expect(result.correctTranslation).toBe('podjąć decyzję');
      expect(result.userTranslation).toBe('wrong answer');
    });

    it('should throw NotFoundError for non-existent word', () => {
      expect(() => 
        service.checkTranslation('999', 'test', TranslationMode.EN_TO_PL)
      ).toThrow(NotFoundError);
    });
  });

  describe('getAllWords', () => {
    it('should return all words', () => {
      const words = service.getAllWords();
      expect(words).toHaveLength(testWords.length);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', () => {
      const categories = service.getCategories();
      
      expect(categories).toContain('kolokacje');
      expect(categories).toContain('A1');
      expect(categories).toHaveLength(2);
    });
  });

  describe('getDifficulties', () => {
    it('should return unique difficulties', () => {
      const difficulties = service.getDifficulties();
      
      expect(difficulties).toContain(Difficulty.EASY);
      expect(difficulties).toContain(Difficulty.MEDIUM);
      expect(difficulties).toContain(Difficulty.HARD);
    });
  });

  describe('getWordCount', () => {
    it('should return total count without filters', () => {
      expect(service.getWordCount()).toBe(testWords.length);
    });

    it('should return filtered count by category', () => {
      expect(service.getWordCount({ category: 'kolokacje' })).toBe(3);
      expect(service.getWordCount({ category: 'A1' })).toBe(2);
    });

    it('should return filtered count by difficulty', () => {
      expect(service.getWordCount({ difficulty: Difficulty.EASY })).toBe(2);
      expect(service.getWordCount({ difficulty: Difficulty.MEDIUM })).toBe(2);
    });

    it('should return filtered count by both', () => {
      expect(service.getWordCount({ 
        category: 'kolokacje', 
        difficulty: Difficulty.MEDIUM 
      })).toBe(2);
    });
  });

  describe('resetSession', () => {
    it('should reset session state', () => {
      const sessionId = 'test-session';
      
      // Use some words
      service.getRandomWord(TranslationMode.EN_TO_PL, {}, sessionId);
      service.getRandomWord(TranslationMode.EN_TO_PL, {}, sessionId);
      
      // Reset
      const result = service.resetSession(sessionId);
      expect(result).toBe(true);
      
      // Should be able to get all words again
      const usedIds = new Set<string>();
      for (let i = 0; i < testWords.length; i++) {
        const challenge = service.getRandomWord(TranslationMode.EN_TO_PL, {}, sessionId);
        usedIds.add(challenge.id);
      }
      expect(usedIds.size).toBe(testWords.length);
    });
  });
});
