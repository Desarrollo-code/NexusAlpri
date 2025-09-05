
// src/contexts/title-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface TitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  headerActions: ReactNode | null;
  setHeaderActions: (actions: ReactNode | null) => void;
  showBackButton: boolean; // Nueva propiedad
  setShowBackButton: (show: boolean) => void; // Nueva función
}

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export const TitleProvider = ({ children }: { children: ReactNode }) => {
  const [pageTitle, setPageTitle] = useState('Panel Principal');
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);
  const [showBackButton, setShowBackButton] = useState(false); // Estado para el botón de volver

  const setActions = useCallback((actions: ReactNode | null) => {
    setHeaderActions(actions);
  }, []);
  
  const setBackButttonVisibility = useCallback((show: boolean) => {
    setShowBackButton(show);
  }, []);


  return (
    <TitleContext.Provider value={{ pageTitle, setPageTitle, headerActions, setHeaderActions: setActions, showBackButton, setShowBackButton: setBackButttonVisibility }}>
      {children}
    </TitleContext.Provider>
  );
};

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (context === undefined) {
    throw new Error('useTitle must be used within a TitleProvider');
  }
  return context;
};
