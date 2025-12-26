import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizTimer } from './useQuizTimer';

describe('useQuizTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Timer State', () => {
    it('should not run when timeLimit is 0 (non-timed mode)', () => {
      const onTick = vi.fn();
      const onEnd = vi.fn();

      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 0,
          timeRemaining: 300,
          isActive: true,
          onTick,
          onEnd,
        })
      );

      expect(result.current.isRunning).toBe(false);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onTick).not.toHaveBeenCalled();
      expect(onEnd).not.toHaveBeenCalled();
    });

    it('should not run when isActive is false', () => {
      const onTick = vi.fn();

      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 300,
          timeRemaining: 300,
          isActive: false,
          onTick,
          onEnd: vi.fn(),
        })
      );

      expect(result.current.isRunning).toBe(false);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onTick).not.toHaveBeenCalled();
    });

    it('should not run when timeRemaining is 0', () => {
      const onTick = vi.fn();

      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 300,
          timeRemaining: 0,
          isActive: true,
          onTick,
          onEnd: vi.fn(),
        })
      );

      expect(result.current.isRunning).toBe(false);
    });

    it('should run when all conditions are met', () => {
      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 300,
          timeRemaining: 300,
          isActive: true,
          onTick: vi.fn(),
          onEnd: vi.fn(),
        })
      );

      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('Tick Behavior', () => {
    it('should call onTick every second when running', () => {
      const onTick = vi.fn();

      renderHook(() =>
        useQuizTimer({
          timeLimit: 300,
          timeRemaining: 300,
          isActive: true,
          onTick,
          onEnd: vi.fn(),
        })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onTick).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(onTick).toHaveBeenCalledTimes(3);
    });

    it('should stop calling onTick when isActive becomes false', () => {
      const onTick = vi.fn();

      const { rerender } = renderHook(
        ({ isActive }) =>
          useQuizTimer({
            timeLimit: 300,
            timeRemaining: 300,
            isActive,
            onTick,
            onEnd: vi.fn(),
          }),
        { initialProps: { isActive: true } }
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(onTick).toHaveBeenCalledTimes(2);

      rerender({ isActive: false });

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      // Should still be 2, no new calls
      expect(onTick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Timer End', () => {
    it('should call onEnd when timeRemaining reaches 0', () => {
      const onEnd = vi.fn();

      const { rerender } = renderHook(
        ({ timeRemaining }) =>
          useQuizTimer({
            timeLimit: 300,
            timeRemaining,
            isActive: true,
            onTick: vi.fn(),
            onEnd,
          }),
        { initialProps: { timeRemaining: 5 } }
      );

      expect(onEnd).not.toHaveBeenCalled();

      // Simulate time running out
      rerender({ timeRemaining: 0 });

      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('should not call onEnd multiple times', () => {
      const onEnd = vi.fn();

      const { rerender } = renderHook(
        ({ timeRemaining }) =>
          useQuizTimer({
            timeLimit: 300,
            timeRemaining,
            isActive: true,
            onTick: vi.fn(),
            onEnd,
          }),
        { initialProps: { timeRemaining: 0 } }
      );

      expect(onEnd).toHaveBeenCalledTimes(1);

      // Re-render with same value
      rerender({ timeRemaining: 0 });

      // Should not call again (same dependency values)
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('Time Formatting', () => {
    it('should format time as MM:SS', () => {
      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 300,
          timeRemaining: 125, // 2:05
          isActive: true,
          onTick: vi.fn(),
          onEnd: vi.fn(),
        })
      );

      expect(result.current.formattedTime).toBe('02:05');
    });

    it('should pad single digit minutes and seconds', () => {
      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 300,
          timeRemaining: 65, // 1:05
          isActive: true,
          onTick: vi.fn(),
          onEnd: vi.fn(),
        })
      );

      expect(result.current.formattedTime).toBe('01:05');
    });

    it('should handle zero time', () => {
      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 300,
          timeRemaining: 0,
          isActive: false,
          onTick: vi.fn(),
          onEnd: vi.fn(),
        })
      );

      expect(result.current.formattedTime).toBe('00:00');
    });

    it('should handle large times', () => {
      const { result } = renderHook(() =>
        useQuizTimer({
          timeLimit: 3600,
          timeRemaining: 3661, // 61:01
          isActive: true,
          onTick: vi.fn(),
          onEnd: vi.fn(),
        })
      );

      expect(result.current.formattedTime).toBe('61:01');
    });
  });

  describe('Callback Stability', () => {
    it('should not restart interval when callbacks change', () => {
      const onTick1 = vi.fn();
      const onTick2 = vi.fn();

      const { rerender } = renderHook(
        ({ onTick }) =>
          useQuizTimer({
            timeLimit: 300,
            timeRemaining: 300,
            isActive: true,
            onTick,
            onEnd: vi.fn(),
          }),
        { initialProps: { onTick: onTick1 } }
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(onTick1).toHaveBeenCalledTimes(2);

      // Change callback
      rerender({ onTick: onTick2 });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // New callback should be called
      expect(onTick2).toHaveBeenCalledTimes(2);
    });
  });
});