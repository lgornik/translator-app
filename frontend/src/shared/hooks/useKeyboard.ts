import { useEffect, useCallback } from 'react';
import { KEYBOARD_KEYS } from '@/shared/constants';

type KeyHandler = () => void;

interface UseKeyboardOptions {
  onEnter?: KeyHandler;
  onEscape?: KeyHandler;
  enabled?: boolean;
}

/**
 * Hook for keyboard event handling
 */
export function useKeyboard(options: UseKeyboardOptions) {
  const { onEnter, onEscape, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case KEYBOARD_KEYS.ENTER:
          onEnter?.();
          break;
        case KEYBOARD_KEYS.ESCAPE:
          onEscape?.();
          break;
      }
    },
    [enabled, onEnter, onEscape]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Hook specifically for Enter key handling
 */
export function useEnterKey(handler: KeyHandler, enabled = true) {
  useKeyboard({ onEnter: handler, enabled });
}

/**
 * Hook specifically for Escape key handling  
 */
export function useEscapeKey(handler: KeyHandler, enabled = true) {
  useKeyboard({ onEscape: handler, enabled });
}
