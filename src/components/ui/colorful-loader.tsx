// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const ColorfulLoader = () => {
  return (
    <div className="relative h-20 w-20" aria-label="Cargando...">
      {/* Each div is a rotating ring */}
      <div className="absolute inset-0 animate-spin-slow">
        <svg viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--chart-1))"
            strokeWidth="4"
            strokeDasharray="40 25"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="absolute inset-0 animate-spin-reverse">
        <svg viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="hsl(var(--chart-2))"
            strokeWidth="4"
            strokeDasharray="30 20"
            strokeLinecap="round"
          />
        </svg>
      </div>
       <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '2s' }}>
        <svg viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="25"
            fill="none"
            stroke="hsl(var(--chart-3))"
            strokeWidth="4"
            strokeDasharray="20 15"
            strokeLinecap="round"
          />
        </svg>
      </div>
       <div className="absolute inset-0 animate-spin-reverse" style={{ animationDuration: '2.5s' }}>
        <svg viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="15"
            fill="none"
            stroke="hsl(var(--chart-4))"
            strokeWidth="4"
            strokeDasharray="10 10"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
