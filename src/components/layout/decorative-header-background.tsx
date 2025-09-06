
// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';

// Componente simplificado para un fondo limpio. No renderiza nada, 
// permitiendo que el color de fondo definido en globals.css sea el protagonista.
export const DecorativeHeaderBackground = () => {
  return (
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--primary-rgb),0.08),rgba(255,255,255,0))]"></div>
        <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--accent-rgb),0.08),rgba(255,255,255,0))]"></div>
    </div>
  );
};
