import { useEffect, useRef, useCallback } from "react";

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
 * Uses a persistent interval that checks conditions on each tick,
 * rather than recreating the interval on state changes.
 * This prevents timer freezing during rapid state transitions.
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

  // Store current values in refs so interval callback always has fresh values
  const stateRef = useRef({
    isTimedMode,
    isActive,
    timeRemaining,
    onTick,
    onEnd,
  });

  // Update refs on every render (this is cheap and doesn't cause re-renders)
  useEffect(() => {
    stateRef.current = {
      isTimedMode,
      isActive,
      timeRemaining,
      onTick,
      onEnd,
    };
  });

  // Single persistent interval - only recreate when timeLimit or isActive changes fundamentally
  useEffect(() => {
    // Don't start if not in timed mode
    if (!isTimedMode) {
      return;
    }

    // Don't start if not active at all
    if (!isActive) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Create interval that checks current state on each tick
    intervalRef.current = setInterval(() => {
      const {
        isActive: currentIsActive,
        timeRemaining: currentTime,
        onTick: currentOnTick,
      } = stateRef.current;

      // Only tick if still active and time remaining
      if (currentIsActive && currentTime > 0) {
        currentOnTick();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimedMode, isActive]); // Only restart interval when these change fundamentally

  // Timer end detection
  useEffect(() => {
    if (isTimedMode && isActive && timeRemaining <= 0) {
      onEnd();
    }
  }, [isTimedMode, isActive, timeRemaining, onEnd]);

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    isRunning: shouldRun,
    formattedTime: formatTime(timeRemaining),
  };
}
