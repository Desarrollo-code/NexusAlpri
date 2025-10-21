// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const ColorfulLoader = () => {
  return (
    <div className="relative h-24 w-24" aria-label="Cargando...">
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Orbit Path */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />

        {/* Orbiting Dots */}
        <g>
          <circle
            cx="50"
            cy="10"
            r="5"
            fill="hsl(var(--chart-2))"
            className="animate-orbit"
            style={{ animationDuration: '3s', animationDelay: '0s' }}
          />
          <circle
            cx="50"
            cy="10"
            r="5"
            fill="hsl(var(--chart-3))"
            className="animate-orbit"
            style={{ animationDuration: '3s', animationDelay: '-1s' }}
          />
          <circle
            cx="50"
            cy="10"
            r="5"
            fill="hsl(var(--chart-4))"
            className="animate-orbit"
            style={{ animationDuration: '3s', animationDelay: '-2s' }}
          />
        </g>
      </svg>
    </div>
  );
};
