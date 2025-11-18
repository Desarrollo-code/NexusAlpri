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

  // Usamos refs para que los callbacks siempre tengan la versión más reciente sin causar re-renders
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();

  const finalTimeout = timeoutInMinutes * 60 * 1000;
  // Asegurarnos de que el prompt no se muestre antes de tiempo si el timeout es muy corto
  const promptTimeout = Math.max(0, finalTimeout - (promptInSeconds * 1000));

  // --- Funciones Clave ---
  
  // Limpia todos los temporizadores para evitar ejecuciones múltiples
  const clearAllTimers = useCallback(() => {
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  // Función que se llama para mostrar el modal de advertencia
  const handlePrompt = useCallback(() => {
    setIsIdlePromptVisible(true);
    setCountdown(promptInSeconds); // Reinicia la cuenta regresiva
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          // El temporizador de `onIdle` se encargará del cierre final.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [promptInSeconds]);
  
  // Función para iniciar o reiniciar todos los temporizadores
  const startTimers = useCallback(() => {
    if (!enabled) return;

    clearAllTimers();

    // Establecer el temporizador para mostrar el prompt de advertencia
    promptTimerRef.current = setTimeout(handlePrompt, promptTimeout);
    
    // Establecer el temporizador final para cerrar la sesión
    idleTimerRef.current = setTimeout(onIdle, finalTimeout);
    
  }, [enabled, finalTimeout, promptTimeout, onIdle, handlePrompt, clearAllTimers]);

  // Función que llama el usuario para indicar que "sigue aquí"
  const stay = useCallback(() => {
    clearAllTimers();
    setIsIdlePromptVisible(false);
    startTimers();
  }, [clearAllTimers, startTimers]);

  // --- Efectos para manejar el ciclo de vida ---
  
  // Efecto principal para escuchar la actividad del usuario
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'scroll', 'keypress', 'touchstart'];
    
    const handleActivity = () => stay();

    if (enabled) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      startTimers(); // Iniciar los temporizadores al montar el componente
    }

    // Función de limpieza para eliminar los listeners al desmontar
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearAllTimers();
    };
  }, [enabled, stay, startTimers, clearAllTimers]);
  
  // Reiniciar el temporizador si la ruta de la URL cambia
  useEffect(() => {
    stay();
  }, [pathname, stay]);

  return { isIdlePromptVisible, countdown, stay };
};
