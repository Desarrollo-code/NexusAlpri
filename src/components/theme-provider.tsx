// src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useAuth } from '@/contexts/auth-context';

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
    
    React.useEffect(() => {
        if (!settings || typeof window === 'undefined') return;

        const root = document.documentElement;

        const setVar = (varName: string, hex: string | null | undefined) => {
            const hsl = hexToHsl(hex || '');
            if (hsl) {
                root.style.setProperty(varName, hsl);
            }
        };

        // Set light theme variables
        setVar('--primary', settings.primaryColor);
        setVar('--secondary', settings.secondaryColor);
        setVar('--accent', settings.accentColor);
        setVar('--background', settings.backgroundColorLight);

        // Set dark theme variables
        // These are applied when the .dark class is present
        setVar('--primary-dark', settings.primaryColorDark);
        setVar('--background-dark', settings.backgroundColorDark);

        // Update font variables
        const fontVariables = settings.fontHeadline && settings.fontBody
          ? `${settings.fontHeadline.variable} ${settings.fontBody.variable}`
          : ''; // getFontVariables can now be simplified or this logic can be moved here
        // This part requires a bigger refactor of how fonts are loaded, for now we focus on colors
        
    }, [settings, theme]);

    if (!settings) return null;

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
    `.trim();

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
