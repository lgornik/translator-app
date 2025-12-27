import { describe, it, expect } from 'vitest';
import { TranslationChecker } from '../../domain/services/TranslationChecker.js';
import { TranslationMode } from '../../domain/value-objects/TranslationMode.js';

describe('TranslationChecker', () => {
  const checker = new TranslationChecker();
  const mode = TranslationMode.englishToPolish();

  describe('check', () => {
    it('should return correct for exact match', () => {
      const result = checker.check('kot', 'kot', mode);
      expect(result.isCorrect).toBe(true);
      expect(result.correctTranslation).toBe('kot');
      expect(result.userTranslation).toBe('kot');
    });

    it('should be case insensitive', () => {
      expect(checker.check('kot', 'KOT', mode).isCorrect).toBe(true);
      expect(checker.check('kot', 'Kot', mode).isCorrect).toBe(true);
      expect(checker.check('KOT', 'kot', mode).isCorrect).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(checker.check('kot', '  kot  ', mode).isCorrect).toBe(true);
      expect(checker.check('  kot  ', 'kot', mode).isCorrect).toBe(true);
    });

    it('should normalize multiple spaces', () => {
      expect(checker.check('make a decision', 'make  a  decision', mode).isCorrect).toBe(true);
    });

    it('should handle multiple correct answers with /', () => {
      expect(checker.check('ziemniak/kartofel', 'ziemniak', mode).isCorrect).toBe(true);
      expect(checker.check('ziemniak/kartofel', 'kartofel', mode).isCorrect).toBe(true);
    });

    it('should return incorrect for wrong answer', () => {
      const result = checker.check('kot', 'pies', mode);
      expect(result.isCorrect).toBe(false);
      expect(result.correctTranslation).toBe('kot');
      expect(result.userTranslation).toBe('pies');
    });

    it('should handle empty user answer', () => {
      const result = checker.check('kot', '', mode);
      expect(result.isCorrect).toBe(false);
    });

    it('should handle optional parts in parentheses', () => {
      expect(checker.check('pogodzić się z (czymś)', 'pogodzić się z', mode).isCorrect).toBe(true);
      expect(checker.check('pogodzić się z (czymś)', 'pogodzić się z czymś', mode).isCorrect).toBe(true);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(checker.calculateSimilarity('kot', 'kot')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(checker.calculateSimilarity('abc', 'xyz')).toBeLessThan(0.5);
    });

    it('should return high similarity for similar strings', () => {
      const similarity = checker.calculateSimilarity('kot', 'kott');
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should return 0 for empty strings', () => {
      expect(checker.calculateSimilarity('', 'test')).toBe(0);
      expect(checker.calculateSimilarity('test', '')).toBe(0);
    });
  });
});
