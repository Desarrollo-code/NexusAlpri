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
        {/* No-op, la decoración ahora es el color de fondo sólido del layout */}
      </div>
    </div>
  );
};
