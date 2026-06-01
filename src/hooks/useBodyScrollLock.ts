import { useEffect } from 'react';

/** Bloquea scroll del body mientras un overlay modal está abierto (webviews in-app). */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prev;
      document.body.style.touchAction = prevTouch;
    };
  }, [locked]);
}
