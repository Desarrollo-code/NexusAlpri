// src/components/layout/decorative-header-background.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const DecorativeHeaderBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden">
        {/* Este componente está ahora vacío para un fondo blanco, pero se mantiene por si se quiere reactivar en el futuro */}
    </div>
  );
};
