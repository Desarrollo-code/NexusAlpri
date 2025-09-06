// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const DecorativeHeaderBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-[radial-gradient(circle_farthest-side,hsl(var(--primary)/0.25),transparent)] animate-aurora-1" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-[radial-gradient(circle_farthest-side,hsl(var(--accent)/0.25),transparent)] animate-aurora-2" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/3 h-1/3 rounded-full bg-[radial-gradient(circle_farthest-side,hsl(var(--primary)/0.2),transparent)] animate-aurora-3" />
    </div>
  );
};
