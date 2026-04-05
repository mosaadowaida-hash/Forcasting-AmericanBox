import { useRef, useCallback } from 'react';

/**
 * Hook to handle IME composition events for input/textarea elements.
 * Prevents certain key events (like Enter) from firing during IME composition.
 */
export function useComposition<T extends HTMLElement = HTMLElement>(handlers?: {
  onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  onCompositionStart?: (e: React.CompositionEvent<T>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<T>) => void;
}) {
  const isComposingRef = useRef(false);

  const onCompositionStart = useCallback((e: React.CompositionEvent<T>) => {
    isComposingRef.current = true;
    handlers?.onCompositionStart?.(e);
  }, [handlers]);

  const onCompositionEnd = useCallback((e: React.CompositionEvent<T>) => {
    isComposingRef.current = false;
    handlers?.onCompositionEnd?.(e);
  }, [handlers]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<T>) => {
    if (isComposingRef.current) return;
    handlers?.onKeyDown?.(e);
  }, [handlers]);

  return {
    isComposing: isComposingRef.current,
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
  };
}
