
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { useAuth } from "@/contexts/auth-context"

// This is a client-side only component that handles applying the user's saved theme class.
function ThemeClassApplier() {
    const { user, isLoading } = useAuth();
    
    React.useEffect(() => {
        if (isLoading || typeof window === 'undefined') return;

        // Get the user's preferred color theme, defaulting to 'corporate-blue'
        const themeName = user?.colorTheme || 'corporate-blue';
        const root = window.document.documentElement;
        
        // Remove any other theme classes to avoid conflicts
        root.className.split(' ').forEach(className => {
            if (className.startsWith('theme-')) {
                root.classList.remove(className);
            }
        });

        // Add the current user's theme class
        root.classList.add(themeName);

    }, [user?.colorTheme, isLoading]);

    return null; // This component does not render anything
}


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
      <NextThemesProvider {...props}>
        <ThemeClassApplier />
        {children}
      </NextThemesProvider>
  )
}
