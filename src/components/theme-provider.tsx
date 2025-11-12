// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';
import { fontMap } from '@/lib/fonts';
import { getContrastingTextColor, hexToHslString } from '@/lib/utils';


export const AVAILABLE_THEMES = [
  { value: 'light', label: 'Claro (Personalizado)', previewClass: 'bg-gradient-to-br from-slate-100 to-slate-300' },
  { value: 'dark', label: 'Oscuro (Personalizado)', previewClass: 'bg-gradient-to-br from-slate-800 to-slate-900' },
  { value: 'terminal', label: 'Terminal', previewClass: 'bg-gradient-to-br from-emerald-500 to-emerald-900' },
  { value: 'sunset', label: 'Atardecer', previewClass: 'bg-gradient-to-br from-orange-400 via-red-500 to-purple-600' },
  { value: 'ocean', label: 'Océano', previewClass: 'bg-gradient-to-br from-sky-400 to-blue-600' },
  { value: 'forest', label: 'Bosque', previewClass: 'bg-gradient-to-br from-lime-500 to-green-800' },
  { value: 'rose', label: 'Cuarzo Rosa', previewClass: 'bg-gradient-to-br from-rose-300 to-fuchsia-500' },
  { value: 'neon', label: 'Neón', previewClass: 'bg-gradient-to-br from-fuchsia-500 to-cyan-400' },
  { value: 'dracula', label: 'Noche Púrpura', previewClass: 'bg-gradient-to-br from-purple-500 to-violet-800' },
  { value: 'coffee', label: 'Café', previewClass: 'bg-gradient-to-br from-amber-700 to-stone-900' },
  { value: 'mint', label: 'Menta', previewClass: 'bg-gradient-to-br from-emerald-300 to-teal-500' },
  { value: 'lavender', label: 'Lavanda', previewClass: 'bg-gradient-to-br from-indigo-400 to-purple-500' },
  { value: 'solarized-light', label: 'Solarizado Claro', previewClass: 'bg-gradient-to-br from-[#fdf6e3] to-[#eee8d5]' },
  { value: 'solarized-dark', label: 'Solarizado Oscuro', previewClass: 'bg-gradient-to-br from-[#002b36] to-[#073642]' },
  { value: 'imperial-gold', label: 'Dorado Imperial', previewClass: 'bg-gradient-to-br from-[#0a192f] to-[#ffaf00]' },
];

/**
 * Componente interno que maneja la inyección de estilos CSS dinámicos
 * basados en la configuración del administrador y el tema actual.
 */
function ThemeInjector() {
  const { settings, isLoading: isAuthLoading } = useAuth();
  const { theme } = useNextTheme();

  React.useEffect(() => {
    if (isAuthLoading || typeof window === 'undefined') return;

    const root = document.documentElement;
    const isCustomizableTheme = theme === 'light' || theme === 'dark';
    
    if (settings) {
      if (isCustomizableTheme) {
        const primaryColor = theme === 'light' ? settings.primaryColor : settings.primaryColorDark;
        const backgroundColor = theme === 'light' ? settings.backgroundColorLight : settings.backgroundColorDark;
        
        const primaryHsl = hexToHslString(primaryColor);
        if (primaryHsl) {
            root.style.setProperty('--primary', primaryHsl);
            // Determinar color de texto con buen contraste
            const foregroundColor = getContrastingTextColor(primaryColor);
            root.style.setProperty('--primary-foreground', foregroundColor === 'white' ? '0 0% 100%' : '0 0% 0%');
        }

        const backgroundHsl = hexToHslString(backgroundColor);
        if(backgroundHsl) root.style.setProperty('--background', backgroundHsl);

        const secondaryHsl = hexToHslString(settings.secondaryColor);
        if(secondaryHsl) root.style.setProperty('--secondary', secondaryHsl);

        const accentHsl = hexToHslString(settings.accentColor);
        if(accentHsl) root.style.setProperty('--accent', accentHsl);

      } else {
         // Si no es un tema personalizable, limpiamos las variables para que el CSS base tome el control.
         ['--primary', '--primary-foreground', '--secondary', '--accent', '--background'].forEach(prop => root.style.removeProperty(prop));
      }

      // Siempre aplicar las fuentes seleccionadas por el admin
      const headlineFontFamily = fontMap[settings.fontHeadline || 'Space Grotesk']?.style.fontFamily || 'sans-serif';
      const bodyFontFamily = fontMap[settings.fontBody || 'Inter']?.style.fontFamily || 'sans-serif';
      
      root.style.setProperty('--font-headline', headlineFontFamily);
      root.style.setProperty('--font-body', bodyFontFamily);
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
      <ThemeInjector />
      {children}
    </NextThemesProvider>
  );
}

export const useTheme = useNextTheme;