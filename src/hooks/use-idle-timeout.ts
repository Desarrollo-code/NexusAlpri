// src/hooks/use-idle-timeout.ts
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface IdleTimeoutProps {
  onIdle: () => void;
  timeoutInMinutes: number;
  promptInSeconds: number;
  enabled: boolean;
}

export const useIdleTimeout = ({
  onIdle,
  timeoutInMinutes,
  promptInSeconds,
  enabled,
}: IdleTimeoutProps) => {
  const [isIdlePromptVisible, setIsIdlePromptVisible] = useState(false);
  const [countdown, setCountdown] = useState(promptInSeconds);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();

  const finalTimeout = timeoutInMinutes * 60 * 1000;
  const promptTimeout = finalTimeout - (promptInSeconds * 1000);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const handlePrompt = useCallback(() => {
    setIsIdlePromptVisible(true);
    setCountdown(promptInSeconds);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [promptInSeconds]);

  const startTimers = useCallback(() => {
    if (!enabled) return;

    clearAllTimers();

    if (promptTimeout > 0) {
      promptTimerRef.current = setTimeout(handlePrompt, promptTimeout);
    }
    
    idleTimerRef.current = setTimeout(onIdle, finalTimeout);
  }, [enabled, finalTimeout, promptTimeout, onIdle, handlePrompt, clearAllTimers]);

  const stay = useCallback(() => {
    clearAllTimers();
    setIsIdlePromptVisible(false);
    startTimers();
  }, [clearAllTimers, startTimers]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'scroll', 'keypress', 'touchstart'];
    
    const handleActivity = () => {
      stay();
    };

    if (enabled) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      startTimers();
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearAllTimers();
    };
  }, [enabled, stay, startTimers, clearAllTimers]);
  
  useEffect(() => {
    stay();
  }, [pathname, stay]);

  return { isIdlePromptVisible, countdown, stay };
};
