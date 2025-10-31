// src/hooks/use-idle-timeout.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
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
  // Asegurarnos de que el prompt no se active con tiempo negativo
  const promptMs = Math.max(0, timeoutMs - (promptBeforeIdleSeconds * 1000));

  const clearTimers = useCallback(() => {
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
      promptTimeoutRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    if (enabled) {
      if (promptMs > 0 && promptMs < timeoutMs) {
        promptTimeoutRef.current = setTimeout(onPrompt, promptMs);
      }
      timeoutRef.current = setTimeout(onTimeout, timeoutMs);
    }
  }, [onTimeout, onPrompt, timeoutMs, promptMs, enabled, clearTimers]);
  
  // La función `stay` ahora simplemente reinicia los temporizadores,
  // lo cual es lo mismo que cualquier otra actividad del usuario.
  const stay = useCallback(() => {
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    const handleActivity = () => {
      startTimers();
    };
    
    if (!enabled) {
      clearTimers();
      return;
    }

    const events: (keyof WindowEventMap)[] = [
      'mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'
    ];

    events.forEach(event => window.addEventListener(event, handleActivity));
    startTimers(); // Iniciar los temporizadores al montar o cuando se habilita

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
  }, [startTimers, clearTimers, enabled]);

  // Reiniciar el temporizador también en cada cambio de ruta
  useEffect(() => {
    if (enabled) {
      startTimers();
    }
  }, [pathname, startTimers, enabled]);

  return { stay };
};
