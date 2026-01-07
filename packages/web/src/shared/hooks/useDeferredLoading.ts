import { useState, useEffect, useRef } from 'react';

/**
 * Hook that defers showing loading state to avoid flickering
 * for fast operations.
 * 
 * If the loading completes within the delay threshold,
 * the loading state is never shown to the user.
 * 
 * @param isLoading - The actual loading state
 * @param delay - Minimum time before showing loading (default: 150ms)
 * @returns Deferred loading state
 * 
 * @example
 * const { checkAnswer, isCheckingAnswer } = useQuizGraphQL(...);
 * const showLoading = useDeferredLoading(isCheckingAnswer, 150);
 * // showLoading will only be true if isCheckingAnswer is true for > 150ms
 */
export function useDeferredLoading(isLoading: boolean, delay: number = 150): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start timer to show loading after delay
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      // Loading finished - clear timer and hide loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return showLoading;
}