// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';

export const DecorativeHeaderBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-background">
      {/* Gradiente radial sutil para replicar el efecto de la imagen */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(224, 71%, 15%), hsl(224, 71%, 10%) 70%)',
        }}
      />
    </div>
  </div>
);
