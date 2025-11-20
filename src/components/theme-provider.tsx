// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';
import { fontMap } from '@/lib/fonts';
import { getContrastingTextColor, hexToHslString } from '@/lib/utils';


export const AVAILABLE_THEMES = [
  { value: 'light', label: 'Claro (Personalizado)', colors: ['#f8fafc', '#6366f1'] },
  { value: 'dark', label: 'Oscuro (Personalizado)', colors: ['#020617', '#a5b4fc'] },
  { value: 'terminal', label: 'Terminal', colors: ['#1A241F', '#4ade80'] },
  { value: 'sunset', label: 'Atardecer', colors: ['#301934', '#FF5F6D'] },
  { value: 'ocean', label: 'Océano', colors: ['#F0F9FF', '#0EA5E9'] },
  { value: 'forest', label: 'Bosque', colors: ['#F0FFF4', '#228B22'] },
  { value: 'rose', label: 'Cuarzo Rosa', colors: ['#FFF1F2', '#F43F5E'] },
  { value: 'neon', label: 'Neón', colors: ['#1E1B4B', '#BE185D'] },
  { value: 'dracula', label: 'Noche Púrpura', colors: ['#282a36', '#bd93f9'] },
  { value: 'coffee', label: 'Café', colors: ['#f5f2eb', '#7f5539'] },
  { value: 'mint', label: 'Menta', colors: ['#F0FDF4', '#10B981'] },
  { value: 'lavender', label: 'Lavanda', colors: ['#2E2B54', '#A78BFA'] },
  { value: 'solarized-light', label: 'Solarizado Claro', colors: ['#fdf6e3', '#268bd2'] },
  { value: 'solarized-dark', label: 'Solarizado Oscuro', colors: ['#002b36', '#b58900'] },
  { value: 'imperial-gold', label: 'Dorado Imperial', colors: ['#0a192f', '#ffaf00'] },
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
