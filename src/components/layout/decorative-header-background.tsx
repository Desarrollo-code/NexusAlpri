// src/components/layout/decorative-header-background.tsx
'use client';

import { cn } from "@/lib/utils";
import React from 'react';

export const DecorativeHeaderBackground = () => (
  <div className="absolute top-0 left-0 right-0 h-full w-full -z-10 overflow-hidden" aria-hidden="true">
    <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/30 animate-pulse-slow" />
    <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-secondary/40 animate-pulse-slow" style={{ animationDelay: '2s' }} />
    <svg className="absolute inset-0 w-full h-full opacity-80">
        <defs>
            <filter id="grainy-filter">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#grainy-filter)" style={{opacity: 0.04}} />
    </svg>
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background via-transparent to-background" />
  </div>
);
