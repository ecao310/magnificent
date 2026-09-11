import { useCallback, useSyncExternalStore } from 'react';

/** Whether `matchMedia` is there to ask: not on a server, and not in jsdom. */
const canAsk = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/**
 * Whether a media query holds, kept current as the window changes: rotate a
 * phone and the answer moves. Where there is no `matchMedia` to ask — a
 * server, a test — the answer is `fallback`: no by default, which is the
 * wide layout, the one the markup is written for.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      if (!canAsk()) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const read = useCallback(
    (): boolean => (canAsk() ? window.matchMedia(query).matches : fallback),
    [query, fallback],
  );
  return useSyncExternalStore(subscribe, read, () => fallback);
}
