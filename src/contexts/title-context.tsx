// src/contexts/title-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface TitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export const TitleProvider = ({ children }: { children: ReactNode }) => {
  const [pageTitle, setPageTitle] = useState('Panel Principal');

  return (
    <TitleContext.Provider value={{ pageTitle, setPageTitle }}>
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
