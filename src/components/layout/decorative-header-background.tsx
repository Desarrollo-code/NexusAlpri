// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const DecorativeHeaderBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden">
        <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--primary),0.15),rgba(255,255,255,0))] animate-aurora-1"></div>
        <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--accent),0.15),rgba(255,255,255,0))] animate-aurora-2"></div>
        <div className="absolute bottom-0 left-[20%] top-[10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--primary),0.1),rgba(255,255,255,0))] animate-aurora-3"></div>
    </div>
  );
};
