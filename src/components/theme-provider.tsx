"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export const AVAILABLE_THEMES = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Nebula Oscuro" },
  { value: "sunset", label: "Atardecer" },
  { value: "forest", label: "Bosque" },
  { value: "oceanic", label: "Oceánico" },
  { value: "rose-gold", label: "Oro Rosado" },
];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
      <NextThemesProvider 
        {...props}
        attribute="class"
        defaultTheme="dark"
        enableSystem={false} // Disable system to have full control
        disableTransitionOnChange
        themes={AVAILABLE_THEMES.map(t => t.value)}
      >
        {children}
      </NextThemesProvider>
  );
}
