// src/contexts/title-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface TitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  headerActions: ReactNode | null;
  setHeaderActions: (actions: ReactNode | null) => void;
}

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export const TitleProvider = ({ children }: { children: ReactNode }) => {
  const [pageTitle, setPageTitle] = useState('Panel Principal');
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);

  const setActions = useCallback((actions: ReactNode | null) => {
    setHeaderActions(actions);
  }, []);


  return (
    <TitleContext.Provider value={{ pageTitle, setPageTitle, headerActions, setHeaderActions: setActions }}>
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
