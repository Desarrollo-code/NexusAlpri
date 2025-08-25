// src/app/layout.tsx
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React from 'react';
import { TitleProvider } from '@/contexts/title-context';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = await getFontVariables();
  
  // El ThemeProvider se ha movido a los layouts específicos (app y public)
  // para un control más granular. El layout raíz ya no gestiona el tema.
  return (
    <html lang="es" suppressHydrationWarning className={fontVariables}>
      <body className={cn("font-body flex flex-col min-h-screen bg-background")}>
        <AuthProvider>
            <TitleProvider>
                {children}
                <Toaster />
            </TitleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
