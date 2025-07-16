
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { useAuth } from "@/contexts/auth-context"
import { defaultThemes } from "@/lib/themes"

const THEME_NAMES = defaultThemes.map(t => t.name);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
      <NextThemesProvider 
        {...props} 
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <ThemeApplicator>{children}</ThemeApplicator>
      </NextThemesProvider>
  )
}


function ThemeApplicator({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const { theme: mode } = useNextTheme(); // 'light' or 'dark'

    React.useEffect(() => {
        if (isLoading) return;

        const themeName = user?.colorTheme || 'corporate-blue';
        const root = window.document.documentElement;

        // Remove old theme classes
        root.classList.remove(...THEME_NAMES);

        // Add the new theme class
        root.classList.add(themeName);
        
    }, [user, mode, isLoading]);

    return <>{children}</>;
}
