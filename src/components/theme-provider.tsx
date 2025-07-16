
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { useAuth } from "@/contexts/auth-context"

function ThemeApplier() {
    const { theme } = useTheme(); // from next-themes (light, dark, system)
    const { user, isLoading } = useAuth(); // from our context

    React.useEffect(() => {
        if (isLoading || typeof window === 'undefined') return;

        const root = window.document.documentElement;
        
        // 1. Remove all potential theme classes first to avoid conflicts
        root.className.split(' ').forEach(className => {
            if (className.startsWith('theme-')) {
                root.classList.remove(className);
            }
        });

        // 2. Add the user's specific color palette class
        const colorTheme = user?.colorTheme || 'corporate-blue';
        root.classList.add(colorTheme);
        
        // 3. The `class` from next-themes (e.g., 'dark') is handled by the provider automatically.
        // No need to manually add `.dark` here.

    }, [user?.colorTheme, isLoading, theme]);

    return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
      <NextThemesProvider {...props}>
        <ThemeApplier />
        {children}
      </NextThemesProvider>
  )
}
