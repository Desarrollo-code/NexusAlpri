// src/app/layout.tsx
import './globals.css';
import React from 'react';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { TitleProvider } from '@/contexts/title-context';
import { Toaster } from '@/components/ui/toaster';
import { TourProvider } from '@/contexts/tour-context';

export const metadata = {
  title: 'NexusAlpri',
  description: 'Plataforma E-learning Corporativa',
}

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
        <AuthProvider>
          <ThemeProvider>
            <TitleProvider>
              <TourProvider>
                {children}
                <Toaster />
              </TourProvider>
            </TitleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
