// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';

export const DecorativeHeaderBackground = () => (
  <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
    <div className="absolute top-[-20rem] left-[-20rem] h-[40rem] w-[40rem] rounded-full bg-primary/10 blur-3xl opacity-40 animate-pulse-slow" />
    <div className="absolute bottom-[-20rem] right-[-20rem] h-[40rem] w-[40rem] rounded-full bg-accent/10 blur-3xl opacity-40 animate-pulse-slow animation-delay-300" />
  </div>
);
