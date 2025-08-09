'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export const AVAILABLE_THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Nebula Oscuro' },
  { value: 'sunset', label: 'Atardecer Púrpura' },
  { value: 'forest', label: 'Bosque Esmeralda' },
  { value: 'oceanic', label: 'Oceánico' },
  { value: 'rose-gold', label: 'Oro Rosado' },
];

export function ThemeProvider({ children, ...props }: Omit<ThemeProviderProps, 'themes'>) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      themes={AVAILABLE_THEMES.map(t => t.value)}
    >
      {children}
    </NextThemesProvider>
  );
}
