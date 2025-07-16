
"use client"

import React, { createContext, useContext, useEffect, useState, useMemo } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import type { ColorTheme } from "@/lib/themes"
import { defaultThemes, getTheme, isLight } from "@/lib/themes";

interface CustomThemeContextType {
    theme: string;
    setTheme: (theme: string) => void;
    customTheme: ColorTheme;
    setCustomTheme: (theme: ColorTheme) => void;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

function CustomThemeContentProvider({ children }: { children: React.ReactNode }) {
    const { setTheme: setNextTheme, resolvedTheme } = useNextTheme();
    const [theme, _setTheme] = useState('corporate-blue');
    const [customTheme, _setCustomTheme] = useState<ColorTheme>(getTheme('custom'));

    useEffect(() => {
        const storedTheme = localStorage.getItem('app-color-theme') || 'corporate-blue';
        const storedCustomTheme = localStorage.getItem('app-custom-theme');
        _setTheme(storedTheme);
        if (storedCustomTheme) {
            try {
                _setCustomTheme(JSON.parse(storedCustomTheme));
            } catch (e) {
                _setCustomTheme(getTheme('custom'));
            }
        }
    }, []);

    const setTheme = (newThemeName: string) => {
        const themeToApply = getTheme(newThemeName);
        
        const root = document.documentElement;
        root.style.setProperty('--background', themeToApply.colors.background);
        root.style.setProperty('--foreground', themeToApply.colors.foreground);
        root.style.setProperty('--primary', themeToApply.colors.primary);
        root.style.setProperty('--accent', themeToApply.colors.accent);
        
        const newResolvedTheme = isLight(themeToApply.colors.background) ? 'light' : 'dark';
        if (resolvedTheme !== newResolvedTheme) {
            setNextTheme(newResolvedTheme);
        }

        _setTheme(newThemeName);
        localStorage.setItem('app-color-theme', newThemeName);
    };

    const setCustomTheme = (newCustomTheme: ColorTheme) => {
        _setCustomTheme(newCustomTheme);
        localStorage.setItem('app-custom-theme', JSON.stringify(newCustomTheme));
        // If the current theme is custom, re-apply it to update live
        if (theme === 'custom') {
            setTheme('custom');
        }
    };
    
    // Apply initial theme on load
    useEffect(() => {
        if (theme) {
            setTheme(theme);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme]);
    
    const contextValue = useMemo(() => ({
        theme,
        setTheme,
        customTheme,
        setCustomTheme,
    }), [theme, customTheme]);

    return (
        <CustomThemeContext.Provider value={contextValue}>
            {children}
        </CustomThemeContext.Provider>
    );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
        <CustomThemeContentProvider>
            {children}
        </CustomThemeContentProvider>
    </NextThemesProvider>
  )
}

export const useCustomTheme = () => {
    const context = useContext(CustomThemeContext);
    if (context === undefined) {
        throw new Error("useCustomTheme must be used within a ThemeProvider");
    }
    return context;
};
