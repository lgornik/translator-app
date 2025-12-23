import { describe, it, expect } from 'vitest';
import { Word } from '../domain/entities/Word.js';
import { TranslationMode, Difficulty } from '../shared/types/index.js';

describe('Word Entity', () => {
  const validWordData = {
    id: '1',
    polish: 'kot',
    english: 'cat',
    category: 'Animals',
    difficulty: Difficulty.EASY,
  };

  describe('create', () => {
    it('should create a valid word', () => {
      const word = Word.create(validWordData);
      
      expect(word.id).toBe('1');
      expect(word.polish).toBe('kot');
      expect(word.english).toBe('cat');
      expect(word.category).toBe('Animals');
      expect(word.difficulty).toBe(Difficulty.EASY);
    });

    it('should throw on invalid data', () => {
      expect(() => Word.create({ ...validWordData, id: '' })).toThrow();
      expect(() => Word.create({ ...validWordData, polish: '' })).toThrow();
      expect(() => Word.create({ ...validWordData, english: '' })).toThrow();
    });
  });

  describe('getWordToTranslate', () => {
    it('should return english word for EN_TO_PL mode', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.getWordToTranslate(TranslationMode.EN_TO_PL)).toBe('cat');
    });

    it('should return polish word for PL_TO_EN mode', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.getWordToTranslate(TranslationMode.PL_TO_EN)).toBe('kot');
    });
  });

  describe('getCorrectTranslation', () => {
    it('should return polish for EN_TO_PL mode', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.getCorrectTranslation(TranslationMode.EN_TO_PL)).toBe('kot');
    });

    it('should return english for PL_TO_EN mode', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.getCorrectTranslation(TranslationMode.PL_TO_EN)).toBe('cat');
    });
  });

  describe('checkTranslation', () => {
    it('should return true for exact match', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.checkTranslation('kot', TranslationMode.EN_TO_PL)).toBe(true);
    });

    it('should be case insensitive', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.checkTranslation('KOT', TranslationMode.EN_TO_PL)).toBe(true);
      expect(word.checkTranslation('Kot', TranslationMode.EN_TO_PL)).toBe(true);
    });

    it('should trim whitespace', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.checkTranslation('  kot  ', TranslationMode.EN_TO_PL)).toBe(true);
    });

    it('should handle multiple correct answers separated by /', () => {
      const wordWithMultiple = Word.fromTrusted({
        ...validWordData,
        polish: 'ziemniak/kartofel',
      });
      
      expect(wordWithMultiple.checkTranslation('ziemniak', TranslationMode.EN_TO_PL)).toBe(true);
      expect(wordWithMultiple.checkTranslation('kartofel', TranslationMode.EN_TO_PL)).toBe(true);
    });

    it('should return false for wrong answer', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.checkTranslation('pies', TranslationMode.EN_TO_PL)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return plain object', () => {
      const word = Word.fromTrusted(validWordData);
      const json = word.toJSON();
      
      expect(json).toEqual(validWordData);
    });
  });

  describe('toChallenge', () => {
    it('should create challenge with correct structure', () => {
      const word = Word.fromTrusted(validWordData);
      const challenge = word.toChallenge(TranslationMode.EN_TO_PL);
      
      expect(challenge).toEqual({
        id: '1',
        wordToTranslate: 'cat',
        correctTranslation: 'kot',
        mode: TranslationMode.EN_TO_PL,
        category: 'Animals',
        difficulty: Difficulty.EASY,
      });
    });
  });
});
