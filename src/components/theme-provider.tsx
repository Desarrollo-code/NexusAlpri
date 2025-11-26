// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';
import { fontMap } from '@/lib/fonts';
import { getContrastingTextColor, hexToHslString } from '@/lib/utils';


export const AVAILABLE_THEMES = [
  { value: 'peach-dune', label: 'Duna Melocotón', colors: ['#f97316', '#fdba74'], },
  { value: 'fresh-mint', label: 'Menta Fresca', colors: ['#16a34a', '#86efac'], },
  { value: 'summer-sky', label: 'Cielo de Verano', colors: ['#3b82f6', '#93c5fd'], },
  { value: 'vanilla-mint', label: 'Vainilla Menta', colors: ['#10b981', '#fef3c7'], },
  { value: 'sky-turquoise', label: 'Cielo Turquesa', colors: ['#06b6d4', '#67e8f9'], },
  { value: 'sunset-pink', label: 'Atardecer Rosa', colors: ['#ec4899', '#fda4af'], },
  { value: 'lavender-dream', label: 'Campo de Lavanda', colors: ['#8b5cf6', '#ddd6fe'], },
  { value: 'vibrant-neon', label: 'Neón Vibrante', colors: ['#d946ef', '#f0abfc'], },
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
