// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const ColorfulLoader = () => {
  const barClasses = "w-4 h-full rounded-lg bg-current";
  const colors = [
    "text-chart-1",
    "text-chart-2",
    "text-chart-3",
    "text-chart-4",
    "text-chart-5",
  ];

  return (
    <div className="flex h-20 w-32 items-end justify-center gap-2" aria-label="Cargando...">
      {colors.map((color, i) => (
        <div
          key={i}
          className={cn(barClasses, color)}
          style={{
            animationDelay: `${i * 100}ms`,
            animationDuration: '1.2s',
            animationName: 'piller-push-up',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
          }}
        />
      ))}
    </div>
  );
};
