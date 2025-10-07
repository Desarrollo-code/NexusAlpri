// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const DecorativeHeaderBackground = () => {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden bg-background"
      aria-hidden="true"
    >
      <div className="absolute inset-0">
        {/* Curva 1 - La más grande y de fondo */}
        <div
          className="absolute bottom-[-40%] left-[-20%] h-[100%] w-[140%] rounded-[50%] bg-primary/5 blur-3xl"
        />
        {/* Curva 2 */}
        <div
          className="absolute bottom-[-30%] right-[-30%] h-[80%] w-[120%] rounded-[50%] bg-primary/10 blur-3xl"
        />
        {/* Curva 3 - Superior */}
        <div
          className="absolute top-[-50%] left-[10%] h-[100%] w-[80%] rounded-[50%] bg-accent/5 blur-2xl"
        />
         {/* Curva 4 - Más sutil */}
        <div
          className="absolute bottom-[-20%] left-[20%] h-[60%] w-[60%] rounded-[50%] bg-primary/5 blur-3xl"
        />
      </div>
    </div>
  );
};
