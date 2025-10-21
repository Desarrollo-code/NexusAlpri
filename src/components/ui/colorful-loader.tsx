// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const ColorfulLoader = () => {
  return (
    <div 
        className="animate-spin h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary"
        aria-label="Cargando..."
    />
  );
};
