"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { useAuth } from "@/contexts/auth-context"

function ThemeApplier() {
    const { theme: mode } = useTheme(); // 'light', 'dark', 'system'
    const { user } = useAuth();
    
    React.useEffect(() => {
        const colorTheme = user?.colorTheme || 'corporate-blue';
        const root = document.documentElement;

        // Remove any existing theme classes
        root.classList.forEach(className => {
            if (className.startsWith('theme-')) {
                root.classList.remove(className);
            }
        });
        
        // Add the new theme class
        root.classList.add(`theme-${colorTheme}`);

    }, [user?.colorTheme, mode]);

    return null;
}


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
        {children}
        <ThemeApplier />
    </NextThemesProvider>
  )
}
