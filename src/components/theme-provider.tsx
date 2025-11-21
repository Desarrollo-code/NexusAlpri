// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';
import { fontMap } from '@/lib/fonts';
import { getContrastingTextColor, hexToHslString } from '@/lib/utils';


export const AVAILABLE_THEMES = [
  { value: 'light', label: 'Claro (Personalizado)', colors: ['#f8fafc', '#6366f1'], previewClass: 'bg-[#f8fafc] border border-slate-200' },
  { value: 'dark', label: 'Oscuro (Personalizado)', colors: ['#020617', '#a5b4fc'], previewClass: 'bg-[#020617] border border-slate-800' },
  { value: 'mint', label: 'Menta Fresca', colors: ['#f0fdfa', '#10b981'], previewClass: 'bg-[#f0fdfa] border border-emerald-200' },
  { value: 'sunset', label: 'Atardecer Suave', colors: ['#fff7ed', '#fb923c'], previewClass: 'bg-[#fff7ed] border border-orange-200' },
  { value: 'lavender', label: 'Cielo Lavanda', colors: ['#f5f3ff', '#8b5cf6'], previewClass: 'bg-[#f5f3ff] border border-violet-200' },
  { value: 'ocean', label: 'Océano Tranquilo', colors: ['#eff6ff', '#3b82f6'], previewClass: 'bg-[#eff6ff] border border-blue-200' },
  { value: 'rose', label: 'Pétalo de Rosa', colors: ['#fff1f2', '#f43f5e'], previewClass: 'bg-[#fff1f2] border border-rose-200' },
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
