// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const ColorfulLoader = () => {
  return (
    <div 
      className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
      aria-label="Cargando..."
    />
  );
};
