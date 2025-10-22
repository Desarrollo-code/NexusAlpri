// src/app/layout.tsx
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React, { useEffect } from 'react';
import { TitleProvider } from '@/contexts/title-context';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme-provider';
import AppWatermark from '@/components/layout/app-watermark';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `getFontVariables` ya no es asíncrona, por lo que podemos llamarla directamente.
  const fontVariables = getFontVariables();
  
  return (
    <html lang="es" suppressHydrationWarning className={fontVariables}>
      <head />
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <ThemeProvider>
          <AuthProvider>
              <TitleProvider>
                  {children}
                  <AppWatermark />
                  <Toaster />
              </TitleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
