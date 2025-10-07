// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';

export const DecorativeHeaderBackground = () => {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0">
        <div className="animate-aurora-1 absolute -top-1/4 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="animate-aurora-2 absolute top-0 -left-1/4 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(119,198,120,0.3),rgba(255,255,255,0))]"></div>
        <div className="animate-aurora-3 absolute top-0 left-1/4 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(198,119,119,0.3),rgba(255,255,255,0))]"></div>
      </div>
    </div>
  );
};
