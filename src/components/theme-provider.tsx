// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';
import { fontMap } from '@/lib/fonts';
import { getContrastingTextColor, hexToHslString } from '@/lib/utils';


export const AVAILABLE_THEMES = [
  { value: 'ruby', label: 'Rubí', colors: ['#e11d48', '#fecdd3'], },
  { value: 'sunset', label: 'Atardecer', colors: ['#fb923c', '#fed7aa'], },
  { value: 'ocean', label: 'Océano', colors: ['#3b82f6', '#bfdbfe'], },
  { value: 'lavender', label: 'Lavanda', colors: ['#8b5cf6', '#ddd6fe'], },
  { value: 'mint', label: 'Menta', colors: ['#10b981', '#a7f3d0'], },
  { value: 'forest', label: 'Bosque', colors: ['#16a34a', '#bbf7d0'], },
  { value: 'sunrise', label: 'Amanecer', colors: ['#f97316', '#fcd34d'], },
  { value: 'graphite', label: 'Grafito', colors: ['#06b6d4', '#6b7280'], },
];

/**
 * Componente interno que maneja la inyección de estilos CSS dinámicos
 * y el favicon, basados en la configuración del administrador y el tema actual.
 */
function DynamicStyleInjector() {
  const { settings, isLoading: isAuthLoading } = useAuth();
  const { theme } = useNextTheme();

  React.useEffect(() => {
    if (isAuthLoading || typeof window === 'undefined') return;

    const root = document.documentElement;
    const head = document.head;
    const isCustomizableTheme = theme === 'light' || theme === 'dark';
    
    // --- Inyección de Estilos y Fuentes ---
    if (settings) {
      if (isCustomizableTheme) {
        const primaryColor = theme === 'light' ? settings.primaryColor : settings.primaryColorDark;
        const backgroundColor = theme === 'light' ? settings.backgroundColorLight : settings.backgroundColorDark;
        
        const primaryHsl = hexToHslString(primaryColor);
        if (primaryHsl) {
            root.style.setProperty('--primary', primaryHsl);
            const foregroundColor = getContrastingTextColor(primaryColor);
            root.style.setProperty('--primary-foreground', foregroundColor === 'white' ? '0 0% 100%' : '0 0% 0%');
        }

        const backgroundHsl = hexToHslString(backgroundColor);
        if(backgroundHsl) root.style.setProperty('--background', backgroundHsl);
        if(hexToHslString(settings.secondaryColor)) root.style.setProperty('--secondary', hexToHslString(settings.secondaryColor));
        if(hexToHslString(settings.accentColor)) root.style.setProperty('--accent', hexToHslString(settings.accentColor));
      } else {
         ['--primary', '--primary-foreground', '--secondary', '--accent', '--background'].forEach(prop => root.style.removeProperty(prop));
      }

      const headlineFontFamily = fontMap[settings.fontHeadline || 'Space Grotesk']?.style.fontFamily || 'sans-serif';
      const bodyFontFamily = fontMap[settings.fontBody || 'Inter']?.style.fontFamily || 'sans-serif';
      root.style.setProperty('--font-headline', headlineFontFamily);
      root.style.setProperty('--font-body', bodyFontFamily);
      
      let faviconLink = head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (faviconLink) {
        if (settings.faviconUrl) {
            faviconLink.href = settings.faviconUrl;
        } else {
            faviconLink.href = '/favicon.png'; 
        }
      }
    }
    
  }, [settings, theme, isAuthLoading]);

  return null;
}


export function ThemeProvider({ children, ...props }: Omit<ThemeProviderProps, 'themes' | 'defaultTheme'>) {
  return (
    <NextThemesProvider
      {...props}
      attribute="data-theme"
      enableSystem={false}
      disableTransitionOnChange={false}
      themes={AVAILABLE_THEMES.map(t => t.value)}
    >
      <DynamicStyleInjector />
      {children}
    </NextThemesProvider>
  );
}

export const useTheme = useNextTheme;
