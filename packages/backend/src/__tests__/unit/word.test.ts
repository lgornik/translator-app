import { describe, it, expect } from 'vitest';
import { Word, WordData } from '../../domain/entities/Word.js';
import { TranslationMode } from '../../domain/value-objects/TranslationMode.js';
import { Category } from '../../domain/value-objects/Category.js';

describe('Word Entity', () => {
  const validWordData: WordData = {
    id: '1',
    polish: 'kot',
    english: 'cat',
    category: 'Animals',
    difficulty: 1,
  };

  describe('create', () => {
    it('should create valid word', () => {
      const result = Word.create(validWordData);
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value.id.value).toBe('1');
        expect(result.value.polish).toBe('kot');
        expect(result.value.english).toBe('cat');
        expect(result.value.category.name).toBe('Animals');
        expect(result.value.difficulty.value).toBe(1);
      }
    });

    it('should reject empty id', () => {
      const result = Word.create({ ...validWordData, id: '' });
      expect(result.ok).toBe(false);
    });

    it('should reject empty polish', () => {
      const result = Word.create({ ...validWordData, polish: '' });
      expect(result.ok).toBe(false);
    });

    it('should reject empty english', () => {
      const result = Word.create({ ...validWordData, english: '' });
      expect(result.ok).toBe(false);
    });

    it('should reject invalid difficulty', () => {
      const result = Word.create({ ...validWordData, difficulty: 5 });
      expect(result.ok).toBe(false);
    });
  });

  describe('fromTrusted', () => {
    it('should create word without validation', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.polish).toBe('kot');
    });
  });

  describe('getWordToTranslate', () => {
    it('should return english for EN_TO_PL mode', () => {
      const word = Word.fromTrusted(validWordData);
      const mode = TranslationMode.englishToPolish();
      expect(word.getWordToTranslate(mode)).toBe('cat');
    });

    it('should return polish for PL_TO_EN mode', () => {
      const word = Word.fromTrusted(validWordData);
      const mode = TranslationMode.polishToEnglish();
      expect(word.getWordToTranslate(mode)).toBe('kot');
    });
  });

  describe('getCorrectTranslation', () => {
    it('should return polish for EN_TO_PL mode', () => {
      const word = Word.fromTrusted(validWordData);
      const mode = TranslationMode.englishToPolish();
      expect(word.getCorrectTranslation(mode)).toBe('kot');
    });

    it('should return english for PL_TO_EN mode', () => {
      const word = Word.fromTrusted(validWordData);
      const mode = TranslationMode.polishToEnglish();
      expect(word.getCorrectTranslation(mode)).toBe('cat');
    });
  });

  describe('toData', () => {
    it('should return plain object', () => {
      const word = Word.fromTrusted(validWordData);
      const data = word.toData();

      expect(data).toEqual(validWordData);
    });
  });

  describe('toChallenge', () => {
    it('should return challenge object', () => {
      const word = Word.fromTrusted(validWordData);
      const mode = TranslationMode.englishToPolish();
      const challenge = word.toChallenge(mode);

      expect(challenge).toEqual({
        id: '1',
        wordToTranslate: 'cat',
        correctTranslation: 'kot',
        mode: 'EN_TO_PL',
        category: 'Animals',
        difficulty: 1,
      });
    });
  });

  describe('matchesCategory', () => {
    it('should match same category', () => {
      const word = Word.fromTrusted(validWordData);
      const category = Category.fromTrusted('Animals');

      expect(word.matchesCategory(category)).toBe(true);
    });

    it('should not match different category', () => {
      const word = Word.fromTrusted(validWordData);
      const category = Category.fromTrusted('Food');

      expect(word.matchesCategory(category)).toBe(false);
    });

    it('should match null category (no filter)', () => {
      const word = Word.fromTrusted(validWordData);
      expect(word.matchesCategory(null)).toBe(true);
    });
  });
});
