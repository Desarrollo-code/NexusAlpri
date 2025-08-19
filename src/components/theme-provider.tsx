// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';
import { fontMap } from '@/lib/fonts';

export const AVAILABLE_THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
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
    const { theme } = useNextTheme();
    
    const cssVariables = React.useMemo(() => {
        if (!settings) return '';

        const isDark = theme === 'dark';
        
        const primary = isDark ? settings.primaryColorDark : settings.primaryColor;
        const background = isDark ? settings.backgroundColorDark : settings.backgroundColorLight;
        
        const fontHeadline = fontMap[settings.fontHeadline || 'Space Grotesk'] as any;
        const fontBody = fontMap[settings.fontBody || 'Inter'] as any;

        return `
          :root {
            ${primary ? `--primary: ${hexToHsl(primary)};` : ''}
            ${background ? `--background: ${hexToHsl(background)};` : ''}
            ${settings.secondaryColor ? `--secondary: ${hexToHsl(settings.secondaryColor)};` : ''}
            ${settings.accentColor ? `--accent: ${hexToHsl(settings.accentColor)};` : ''}
            ${fontHeadline ? `--font-headline: ${fontHeadline.style.fontFamily};` : ''}
            ${fontBody ? `--font-body: ${fontBody.style.fontFamily};` : ''}
          }
        `.trim();
    }, [settings, theme]);

    if (!cssVariables) return null;

    return <style>{cssVariables}</style>;
};

export function ThemeProvider({ children, ...props }: Omit<ThemeProviderProps, 'themes'>) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false} // Allow transitions
      themes={AVAILABLE_THEMES.map(t => t.value)}
    >
      <StyleInjector />
      {children}
    </NextThemesProvider>
  );
}
