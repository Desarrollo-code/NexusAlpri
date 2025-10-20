// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';
import { fontMap } from '@/lib/fonts';

export const AVAILABLE_THEMES = [
  { value: 'light', label: 'Claro', previewClass: 'bg-slate-100' },
  { value: 'dark', label: 'Oscuro', previewClass: 'bg-slate-900' },
  { value: 'matrix', label: 'Matrix', previewClass: 'bg-emerald-900' },
  { value: 'sunset', label: 'Atardecer', previewClass: 'bg-rose-900' },
  { value: 'ocean', label: 'Océano', previewClass: 'bg-sky-100' },
  { value: 'forest', label: 'Bosque', previewClass: 'bg-green-900' },
  { value: 'rose', label: 'Rosa', previewClass: 'bg-rose-100' },
  { value: 'cyberpunk', label: 'Cyberpunk', previewClass: 'bg-fuchsia-900' },
  { value: 'dracula', label: 'Drácula', previewClass: 'bg-violet-900' },
  { value: 'coffee', label: 'Café', previewClass: 'bg-amber-950' },
  { value: 'mint', label: 'Menta', previewClass: 'bg-emerald-100' },
  { value: 'grape', label: 'Uva', previewClass: 'bg-purple-900' },
  { value: 'solarized-light', label: 'Solarized Claro', previewClass: 'bg-yellow-50' },
  { value: 'solarized-dark', label: 'Solarized Oscuro', previewClass: 'bg-cyan-950' },
  { value: 'royal', label: 'Realeza', previewClass: 'bg-indigo-900' },
];

const hexToHsl = (hex: string): string | null => {
    if (!hex) return null;
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    } else {
        return null;
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const StyleInjector = () => {
    const { settings } = useAuth();
    
    React.useEffect(() => {
        if (!settings || typeof window === 'undefined') return;

        const root = document.documentElement;

        const cssVariables = `
          :root {
            ${settings.primaryColor ? `--primary: ${hexToHsl(settings.primaryColor)};` : ''}
            ${settings.secondaryColor ? `--secondary: ${hexToHsl(settings.secondaryColor)};` : ''}
            ${settings.accentColor ? `--accent: ${hexToHsl(settings.accentColor)};` : ''}
            ${settings.backgroundColorLight ? `--background: ${hexToHsl(settings.backgroundColorLight)};` : ''}
          }
          .dark {
            ${settings.primaryColorDark ? `--primary: ${hexToHsl(settings.primaryColorDark)};` : ''}
            ${settings.backgroundColorDark ? `--background: ${hexToHsl(settings.backgroundColorDark)};` : ''}
          }
        `.trim().replace(/\s+/g, ' ');

        let styleTag = document.getElementById('dynamic-theme-styles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-theme-styles';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = cssVariables;
        
        // Update fonts
        const headlineFont = fontMap[settings.fontHeadline || 'Space Grotesk'];
        const bodyFont = fontMap[settings.fontBody || 'Inter'];
        
        root.style.setProperty('--font-headline', (headlineFont as any)?.style.fontFamily);
        root.style.setProperty('--font-body', (bodyFont as any)?.style.fontFamily);
        
    }, [settings]);

    return null;
};

export function ThemeProvider({ children, ...props }: Omit<ThemeProviderProps, 'themes'>) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
      themes={AVAILABLE_THEMES.map(t => t.value)}
    >
      <StyleInjector />
      {children}
    </NextThemesProvider>
  );
}
