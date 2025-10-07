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
        <div 
          className="absolute inset-0 bg-[radial-gradient(40%_100%_at_100%_0%,_rgba(56,189,248,0.2)_0%,_rgba(56,189,248,0)_100%)]" 
        />
        <div 
          className="absolute inset-0 bg-[radial-gradient(100%_40%_at_0%_100%,_rgba(59,130,246,0.15)_0%,_rgba(59,130,246,0)_100%)]"
        />
      </div>
    </div>
  );
};
