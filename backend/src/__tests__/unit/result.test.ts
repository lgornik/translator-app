import { describe, it, expect } from 'vitest';
import { Result } from '../../shared/core/Result.js';

describe('Result Pattern', () => {
  describe('ok', () => {
    it('should create success result', () => {
      const result = Result.ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe('fail', () => {
    it('should create failure result', () => {
      const error = new Error('test error');
      const result = Result.fail(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('isOk', () => {
    it('should return true for success', () => {
      const result = Result.ok(42);
      expect(Result.isOk(result)).toBe(true);
    });

    it('should return false for failure', () => {
      const result = Result.fail(new Error());
      expect(Result.isOk(result)).toBe(false);
    });
  });

  describe('isFail', () => {
    it('should return true for failure', () => {
      const result = Result.fail(new Error());
      expect(Result.isFail(result)).toBe(true);
    });

    it('should return false for success', () => {
      const result = Result.ok(42);
      expect(Result.isFail(result)).toBe(false);
    });
  });

  describe('map', () => {
    it('should map success value', () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, (x) => x * 2);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should not map failure', () => {
      const error = new Error('test');
      const result = Result.fail(error);
      const mapped = Result.map(result, (x: number) => x * 2);
      expect(mapped.ok).toBe(false);
    });
  });

  describe('flatMap', () => {
    it('should flatMap success', () => {
      const result = Result.ok(5);
      const flatMapped = Result.flatMap(result, (x) => Result.ok(x * 2));
      expect(flatMapped.ok).toBe(true);
      if (flatMapped.ok) {
        expect(flatMapped.value).toBe(10);
      }
    });

    it('should propagate failure from flatMap', () => {
      const result = Result.ok(5);
      const flatMapped = Result.flatMap(result, () => Result.fail(new Error('inner')));
      expect(flatMapped.ok).toBe(false);
    });
  });

  describe('getOrElse', () => {
    it('should return value for success', () => {
      const result = Result.ok(42);
      expect(Result.getOrElse(result, 0)).toBe(42);
    });

    it('should return default for failure', () => {
      const result = Result.fail(new Error());
      expect(Result.getOrElse(result, 0)).toBe(0);
    });
  });

  describe('getOrThrow', () => {
    it('should return value for success', () => {
      const result = Result.ok(42);
      expect(Result.getOrThrow(result)).toBe(42);
    });

    it('should throw for failure', () => {
      const error = new Error('test');
      const result = Result.fail(error);
      expect(() => Result.getOrThrow(result)).toThrow('test');
    });
  });

  describe('combine', () => {
    it('should combine all successes', () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const combined = Result.combine(results);
      expect(combined.ok).toBe(true);
      if (combined.ok) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it('should return first failure', () => {
      const error = new Error('fail');
      const results = [Result.ok(1), Result.fail(error), Result.ok(3)];
      const combined = Result.combine(results);
      expect(combined.ok).toBe(false);
      if (!combined.ok) {
        expect(combined.error).toBe(error);
      }
    });
  });

  describe('tryCatch', () => {
    it('should catch success', () => {
      const result = Result.tryCatch(() => 42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should catch errors', () => {
      const result = Result.tryCatch(() => {
        throw new Error('oops');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('oops');
      }
    });
  });

  describe('tryCatchAsync', () => {
    it('should handle async success', async () => {
      const result = await Result.tryCatchAsync(async () => 42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should handle async errors', async () => {
      const result = await Result.tryCatchAsync(async () => {
        throw new Error('async oops');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('async oops');
      }
    });
  });
});
