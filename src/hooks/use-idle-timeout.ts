// src/hooks/use-idle-timeout.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface IdleTimeoutProps {
  onIdle: () => void;
  onPrompt: () => void;
  timeout: number; // in minutes
  promptBeforeIdle: number; // in seconds
  enabled: boolean;
}

export const useIdleTimeout = ({
  onIdle,
  onPrompt,
  timeout,
  promptBeforeIdle,
  enabled,
}: IdleTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const timeoutMs = timeout * 60 * 1000;
  const promptMs = Math.max(0, timeoutMs - (promptBeforeIdle * 1000));

  const clearTimers = useCallback(() => {
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const startTimers = useCallback(() => {
    if (!enabled) {
      clearTimers();
      return;
    }
    
    clearTimers();
    
    if (promptMs > 0 && promptMs < timeoutMs) {
      promptTimeoutRef.current = setTimeout(onPrompt, promptMs);
    }
    timeoutRef.current = setTimeout(onIdle, timeoutMs);
  }, [enabled, clearTimers, onPrompt, onIdle, promptMs, timeoutMs]);
  
  const stay = useCallback(() => {
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      'mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'
    ];

    const handleActivity = () => {
      startTimers();
    };

    if (enabled) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      startTimers();
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
  }, [enabled, startTimers, clearTimers]);
  
  // Reset on route change
  useEffect(() => {
      startTimers();
  }, [pathname, startTimers]);


  return { stay };
};
