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
  
  // Ref para el requestAnimationFrame de la cuenta regresiva
  const countdownAnimationRef = useRef<number | null>(null);
  const countdownStartTimeRef = useRef<number | null>(null);

  const pathname = usePathname();

  const finalTimeout = timeoutInMinutes * 60 * 1000;
  const promptTimeout = Math.max(0, finalTimeout - (promptInSeconds * 1000));
  
  const clearAllTimers = useCallback(() => {
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownAnimationRef.current) cancelAnimationFrame(countdownAnimationRef.current);
    countdownStartTimeRef.current = null;
  }, []);

  const runCountdown = useCallback((timestamp: number) => {
      if (countdownStartTimeRef.current === null) {
        countdownStartTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - countdownStartTimeRef.current;
      const newCountdown = Math.max(0, promptInSeconds - Math.floor(elapsed / 1000));

      setCountdown(newCountdown);

      if (newCountdown > 0) {
        countdownAnimationRef.current = requestAnimationFrame(runCountdown);
      }
  }, [promptInSeconds]);
  
  const handlePrompt = useCallback(() => {
    setIsIdlePromptVisible(true);
    countdownStartTimeRef.current = null; // Reinicia el tiempo de inicio
    countdownAnimationRef.current = requestAnimationFrame(runCountdown);
  }, [runCountdown]);
  
  const startTimers = useCallback(() => {
    if (!enabled) return;

    clearAllTimers();

    promptTimerRef.current = setTimeout(handlePrompt, promptTimeout);
    idleTimerRef.current = setTimeout(onIdle, finalTimeout);
    
  }, [enabled, finalTimeout, promptTimeout, onIdle, handlePrompt, clearAllTimers]);
  
  const stay = useCallback(() => {
    clearAllTimers();
    setIsIdlePromptVisible(false);
    startTimers();
  }, [clearAllTimers, startTimers]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'scroll', 'keypress', 'touchstart'];
    
    const handleActivity = () => stay();

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
