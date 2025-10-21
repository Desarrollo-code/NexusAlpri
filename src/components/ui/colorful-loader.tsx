// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const ColorfulLoader = () => {
  return (
    <div className="flex items-end justify-center h-24 w-20 gap-1.5" aria-label="Cargando...">
        <div className="w-4 h-8 rounded-full bg-[hsl(var(--chart-1))] animate-piller-push-up" style={{ animationDelay: '0s' }} />
        <div className="w-4 h-12 rounded-full bg-[hsl(var(--chart-2))] animate-piller-push-up" style={{ animationDelay: '0.1s' }} />
        <div className="w-4 h-16 rounded-full bg-[hsl(var(--chart-3))] animate-piller-push-up" style={{ animationDelay: '0.2s' }} />
        <div className="w-4 h-12 rounded-full bg-[hsl(var(--chart-4))] animate-piller-push-up" style={{ animationDelay: '0.3s' }} />
        <div className="w-4 h-8 rounded-full bg-[hsl(var(--chart-5))] animate-piller-push-up" style={{ animationDelay: '0.4s' }} />
    </div>
  );
};
