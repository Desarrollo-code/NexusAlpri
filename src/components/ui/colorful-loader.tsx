// src/components/ui/colorful-loader.tsx
'use client';
import { cn } from '@/lib/utils';
import React from 'react';

export const ColorfulLoader = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="loader" aria-label="Cargando..."></div>
    </div>
  );
};
