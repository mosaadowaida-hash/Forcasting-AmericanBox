import { useRef, useCallback } from 'react';

/**
 * Hook that returns a stable function reference that always calls the latest version.
 * Useful for callbacks passed to event handlers or effects that shouldn't trigger re-renders.
 */
export function usePersistFn<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useCallback((...args: any[]) => {
    return fnRef.current(...args);
  }, []) as T;

  return persistFn;
}
