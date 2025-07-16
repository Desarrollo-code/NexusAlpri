
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { useAuth } from "@/contexts/auth-context"
import { defaultThemes } from "@/lib/themes"

const THEMES = defaultThemes.map(t => t.name);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { user, isLoading } = useAuth();
  
  // This prevents a flash of the default theme before the user's theme is applied.
  const effectiveTheme = !isLoading && user?.colorTheme ? user.colorTheme : 'corporate-blue';
  
  return (
      <NextThemesProvider 
        {...props} 
        themes={THEMES}
        attribute="class"
        defaultTheme="system"
        value={{
            [effectiveTheme]: effectiveTheme,
        }}
      >
        {children}
      </NextThemesProvider>
  )
}
