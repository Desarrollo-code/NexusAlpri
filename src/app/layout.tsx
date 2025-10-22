// src/app/layout.tsx
import './globals.css';
import React from 'react';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme-provider';

// Este es ahora un Server Component.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = getFontVariables();
  
  return (
    <html lang="es" suppressHydrationWarning className={fontVariables}>
      <head />
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
