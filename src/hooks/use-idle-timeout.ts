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
    
    // El prompt se activa ANTES del timeout final.
    if (promptMs > 0 && promptMs < timeoutMs) {
      promptTimeoutRef.current = setTimeout(onPrompt, promptMs);
    }

    // El cierre de sesión se activa DESPUÉS del tiempo de inactividad completo.
    timeoutRef.current = setTimeout(onIdle, timeoutMs);
  }, [enabled, clearTimers, onPrompt, onIdle, promptMs, timeoutMs]);
  
  // La función 'stay' ahora es simplemente un alias para 'startTimers', que reinicia todo.
  const stay = useCallback(() => {
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      'mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'
    ];

    // Cada vez que hay actividad, se reinician los contadores.
    const handleActivity = () => {
      startTimers();
    };

    if (enabled) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      startTimers(); // Inicia los contadores al montar el componente
    }

    // Limpieza al desmontar el componente
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
  }, [enabled, startTimers, clearTimers]);
  
  // Reinicia los contadores también en cada cambio de ruta.
  useEffect(() => {
      startTimers();
  }, [pathname, startTimers]);


  return { stay };
};
