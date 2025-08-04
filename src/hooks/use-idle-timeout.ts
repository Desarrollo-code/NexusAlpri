
'use client';

import { useEffect, useRef, useCallback } from 'react';

export const useIdleTimeout = (onTimeout: () => void, timeoutMinutes: number, enabled: boolean) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (enabled) {
      const timeoutMs = timeoutMinutes * 60 * 1000;
      timeoutRef.current = setTimeout(onTimeout, timeoutMs);
    }
  }, [onTimeout, timeoutMinutes, enabled]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }
    
    const events: (keyof WindowEventMap)[] = [
      'mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'
    ];
    const handleActivity = () => resetTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer(); // Start the timer initially

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimer();
    };
  }, [resetTimer, clearTimer, enabled]);

  return clearTimer;
};
