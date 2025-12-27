import { describe, it, expect } from 'vitest';
import { Difficulty, DifficultyLevel } from '../../domain/value-objects/Difficulty.js';
import { TranslationMode, TranslationDirection } from '../../domain/value-objects/TranslationMode.js';
import { Category } from '../../domain/value-objects/Category.js';
import { WordId } from '../../domain/value-objects/WordId.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';

describe('Value Objects', () => {
  describe('Difficulty', () => {
    it('should create valid difficulty', () => {
      const result = Difficulty.create(1);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(DifficultyLevel.EASY);
        expect(result.value.label).toBe('Easy');
      }
    });

    it('should reject invalid difficulty', () => {
      const result = Difficulty.create(5);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should support factory methods', () => {
      expect(Difficulty.easy().value).toBe(DifficultyLevel.EASY);
      expect(Difficulty.medium().value).toBe(DifficultyLevel.MEDIUM);
      expect(Difficulty.hard().value).toBe(DifficultyLevel.HARD);
    });

    it('should compare difficulties correctly', () => {
      const easy = Difficulty.easy();
      const hard = Difficulty.hard();

      expect(easy.isEasierThan(hard)).toBe(true);
      expect(hard.isHarderThan(easy)).toBe(true);
      expect(easy.isHarderThan(hard)).toBe(false);
    });

    it('should support equality', () => {
      const d1 = Difficulty.easy();
      const d2 = Difficulty.easy();
      const d3 = Difficulty.hard();

      expect(d1.equals(d2)).toBe(true);
      expect(d1.equals(d3)).toBe(false);
    });
  });

  describe('TranslationMode', () => {
    it('should create valid mode', () => {
      const result = TranslationMode.create('EN_TO_PL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.direction).toBe(TranslationDirection.EN_TO_PL);
        expect(result.value.sourceLanguage).toBe('en');
        expect(result.value.targetLanguage).toBe('pl');
      }
    });

    it('should reject invalid mode', () => {
      const result = TranslationMode.create('INVALID');
      expect(result.ok).toBe(false);
    });

    it('should support factory methods', () => {
      const enToPl = TranslationMode.englishToPolish();
      const plToEn = TranslationMode.polishToEnglish();

      expect(enToPl.isFromEnglish()).toBe(true);
      expect(plToEn.isFromPolish()).toBe(true);
    });

    it('should reverse correctly', () => {
      const mode = TranslationMode.englishToPolish();
      const reversed = mode.reverse();

      expect(reversed.direction).toBe(TranslationDirection.PL_TO_EN);
    });

    it('should display correctly', () => {
      const mode = TranslationMode.englishToPolish();
      expect(mode.toDisplayString()).toBe('English → Polish');
    });
  });

  describe('Category', () => {
    it('should create valid category', () => {
      const result = Category.create('Animals');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Animals');
      }
    });

    it('should trim whitespace', () => {
      const result = Category.create('  Animals  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Animals');
      }
    });

    it('should reject empty category', () => {
      const result = Category.create('');
      expect(result.ok).toBe(false);
    });

    it('should reject whitespace-only category', () => {
      const result = Category.create('   ');
      expect(result.ok).toBe(false);
    });
  });

  describe('WordId', () => {
    it('should create valid ID', () => {
      const result = WordId.create('word-123');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe('word-123');
      }
    });

    it('should reject empty ID', () => {
      const result = WordId.create('');
      expect(result.ok).toBe(false);
    });

    it('should generate unique IDs', () => {
      const id1 = WordId.generate();
      const id2 = WordId.generate();
      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('SessionId', () => {
    it('should create valid session ID', () => {
      const result = SessionId.create('session-123');
      expect(result.ok).toBe(true);
    });

    it('should identify default session', () => {
      const defaultSession = SessionId.default();
      expect(defaultSession.isDefault()).toBe(true);

      const customSession = SessionId.fromTrusted('custom');
      expect(customSession.isDefault()).toBe(false);
    });

    it('should generate unique session IDs', () => {
      const id1 = SessionId.generate();
      const id2 = SessionId.generate();
      expect(id1.value).not.toBe(id2.value);
    });
  });
});
