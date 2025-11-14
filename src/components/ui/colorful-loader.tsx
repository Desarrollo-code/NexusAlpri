// src/components/ui/colorful-loader.tsx
'use client';
import { cn } from '@/lib/utils';
import React from 'react';

export const ColorfulLoader = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex h-5 items-center justify-center space-x-1.5" aria-label="Cargando...">
        <div className="h-2 w-2 animate-piller-push-up rounded-full bg-primary [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 animate-piller-push-up rounded-full bg-primary [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 animate-piller-push-up rounded-full bg-primary"></div>
      </div>
    </div>
  );
};
