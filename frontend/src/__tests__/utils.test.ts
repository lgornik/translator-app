import { describe, it, expect } from 'vitest';
import {
  formatTime,
  calculateAccuracy,
  shuffleArray,
  generateId,
  clamp,
  isDefined,
  cn,
  safeJsonParse,
} from '../shared/utils';

describe('Utils', () => {
  describe('formatTime', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(300)).toBe('5:00');
      expect(formatTime(3661)).toBe('61:01');
    });

    it('should pad seconds with zero', () => {
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(65)).toBe('1:05');
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateAccuracy(5, 10)).toBe(50);
      expect(calculateAccuracy(7, 10)).toBe(70);
      expect(calculateAccuracy(10, 10)).toBe(100);
      expect(calculateAccuracy(0, 10)).toBe(0);
    });

    it('should return 0 for zero total', () => {
      expect(calculateAccuracy(0, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateAccuracy(1, 3)).toBe(33);
      expect(calculateAccuracy(2, 3)).toBe(67);
    });
  });

  describe('shuffleArray', () => {
    it('should return array of same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled).toHaveLength(arr.length);
    });

    it('should contain all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not modify original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffleArray(arr);
      expect(arr).toEqual(original);
    });
  });

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate non-empty string', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('clamp', () => {
    it('should return value if within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min if value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max if value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('cn', () => {
    it('should join class names', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('should filter out falsy values', () => {
      expect(cn('a', false, 'b', null, 'c', undefined)).toBe('a b c');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
      expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
    });

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true });
      expect(safeJsonParse('', [])).toEqual([]);
    });
  });
});
