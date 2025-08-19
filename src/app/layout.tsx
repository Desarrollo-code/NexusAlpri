// src/app/layout.tsx
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React from 'react';
import { TitleProvider } from '@/contexts/title-context';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

// No necesitamos getFontVariables aquí, ThemeProvider se encargará
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
          "font-body flex flex-col min-h-screen bg-background"
      )}>
        <AuthProvider>
          <ThemeProvider>
            <TitleProvider>
                {children}
                <Toaster />
            </TitleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
