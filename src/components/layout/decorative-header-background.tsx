// src/components/layout/decorative-header-background.tsx
'use client';

import { cn } from "@/lib/utils";
import React from 'react';

export const DecorativeHeaderBackground = () => (
  <div className="absolute top-0 left-0 right-0 h-48 -z-0 overflow-hidden" aria-hidden="true">
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="grad1" cx="50%" cy="0%" r="90%" fx="50%" fy="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary) / 0.15)' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary) / 0)' }} />
        </radialGradient>
        <radialGradient id="grad2" cx="100%" cy="50%" r="70%" fx="100%" fy="50%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--accent) / 0.1)' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent) / 0)' }} />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)" />
      <rect width="100%" height="100%" fill="url(#grad2)" />
      <path
        d="M-200 0 C -50 150, 200 50, 500 200 L 500 0 Z"
        fill="hsl(var(--primary) / 0.05)"
        className="animate-pulse-slow"
      />
      <path
        d="M300 200 C 450 50, 700 250, 1000 100 L 1000 200 Z"
        fill="hsl(var(--accent) / 0.05)"
        className="animate-pulse-slow animation-delay-500"
      />
    </svg>
  </div>
);
