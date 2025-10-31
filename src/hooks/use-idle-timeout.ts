
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * A custom hook to handle user idle timeout with a preceding prompt.
 * @param onTimeout Callback function to execute when the final timeout is reached.
 * @param onPrompt Callback function to execute when the prompt timeout is reached.
 * @param timeoutMinutes Total inactivity time in minutes before final timeout.
 * @param promptBeforeIdleSeconds How many seconds before the final timeout to show the prompt.
 * @param enabled Whether the idle timer is active.
 * @returns An object with a `stay` function to reset the timers.
 */
export const useIdleTimeout = (
  onTimeout: () => void,
  onPrompt: () => void,
  timeoutMinutes: number,
  promptBeforeIdleSeconds: number,
  enabled: boolean
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const promptMs = timeoutMs - (promptBeforeIdleSeconds * 1000);

  const clearTimers = useCallback(() => {
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    if (enabled && promptMs > 0) {
      promptTimeoutRef.current = setTimeout(onPrompt, promptMs);
    }
    if (enabled) {
      timeoutRef.current = setTimeout(onTimeout, timeoutMs);
    }
  }, [onTimeout, onPrompt, timeoutMs, promptMs, enabled, clearTimers]);
  
  // This is the function the user calls to "stay" active
  const stay = useCallback(() => {
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    const handleActivity = () => startTimers();
    
    if (!enabled) {
      clearTimers();
      return;
    }

    const events: (keyof WindowEventMap)[] = [
      'mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'
    ];

    events.forEach(event => window.addEventListener(event, handleActivity));
    startTimers();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
  }, [startTimers, clearTimers, enabled]);

  // Reset timer on route change
  useEffect(() => {
    if (enabled) {
      startTimers();
    }
  }, [pathname, startTimers, enabled]);

  return { stay };
};
