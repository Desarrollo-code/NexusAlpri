// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';

export const ColorfulLoader = () => {
  return (
    <div className="flex items-center justify-center">
      <span className="loader" aria-label="Cargando..."></span>
    </div>
  );
};
