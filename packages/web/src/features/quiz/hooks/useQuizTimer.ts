import { useEffect, useRef, useCallback } from 'react';

interface UseQuizTimerOptions {
  /** Time limit in seconds (0 = disabled) */
  timeLimit: number;
  /** Current remaining time */
  timeRemaining: number;
  /** Is quiz currently active */
  isActive: boolean;
  /** Callback for each tick */
  onTick: () => void;
  /** Callback when timer reaches zero */
  onEnd: () => void;
}

interface UseQuizTimerReturn {
  /** Is timer currently running */
  isRunning: boolean;
  /** Formatted time string (MM:SS) */
  formattedTime: string;
}

/**
 * Manages quiz timer with proper lifecycle handling
 * 
 * Responsibilities:
 * - Start/stop interval based on quiz state
 * - Call onTick every second
 * - Detect timer end and call onEnd
 * - Provide formatted display time
 * 
 * @example
 * const timer = useQuizTimer({
 *   timeLimit: 300,
 *   timeRemaining: context.timeRemaining,
 *   isActive: isPlaying,
 *   onTick: () => send({ type: 'TIMER_TICK' }),
 *   onEnd: () => send({ type: 'TIMER_END' }),
 * });
 */
export function useQuizTimer({
  timeLimit,
  timeRemaining,
  isActive,
  onTick,
  onEnd,
}: UseQuizTimerOptions): UseQuizTimerReturn {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTimedMode = timeLimit > 0;
  const shouldRun = isTimedMode && isActive && timeRemaining > 0;

  // Stable callback refs to avoid interval recreation
  const onTickRef = useRef(onTick);
  const onEndRef = useRef(onEnd);
  
  useEffect(() => {
    onTickRef.current = onTick;
    onEndRef.current = onEnd;
  }, [onTick, onEnd]);

  // Main timer interval
  useEffect(() => {
    if (shouldRun) {
      intervalRef.current = setInterval(() => {
        onTickRef.current();
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [shouldRun]);

  // Timer end detection
  useEffect(() => {
    if (isTimedMode && isActive && timeRemaining <= 0) {
      onEndRef.current();
    }
  }, [isTimedMode, isActive, timeRemaining]);

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRunning: shouldRun,
    formattedTime: formatTime(timeRemaining),
  };
}