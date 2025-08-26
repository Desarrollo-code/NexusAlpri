// src/contexts/tour-context.tsx
'use client';
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { TourStep } from '@/lib/tour-steps';

interface TourContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  startTour: (tourKey: string, steps: TourStep[]) => void;
  stopTour: () => void;
  nextStep: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [activeTourKey, setActiveTourKey] = useState<string | null>(null);

  const startTour = useCallback((tourKey: string, tourSteps: TourStep[]) => {
    // No iniciar el tour si ya fue completado u omitido
    if (typeof window !== 'undefined' && localStorage.getItem(`tour_completed_${tourKey}`)) {
      return;
    }
    setSteps(tourSteps);
    setCurrentStepIndex(0);
    setIsTourActive(true);
    setActiveTourKey(tourKey);
  }, []);

  const stopTour = useCallback(() => {
    if (activeTourKey && typeof window !== 'undefined') {
        localStorage.setItem(`tour_completed_${activeTourKey}`, 'true');
    }
    setIsTourActive(false);
    setCurrentStepIndex(0);
    setSteps([]);
    setActiveTourKey(null);
  }, [activeTourKey]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopTour();
    }
  }, [currentStepIndex, steps.length, stopTour]);

  const value = {
    isTourActive,
    currentStepIndex,
    steps,
    startTour,
    stopTour,
    nextStep,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
