// src/app/layout.tsx
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React from 'react';
import { TitleProvider } from '@/contexts/title-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import { DynamicThemeProvider } from '@/components/dynamic-theme-provider';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const fontVariables = await getFontVariables();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
          fontVariables,
          "font-body flex flex-col min-h-screen bg-background"
      )}>
        <AuthProvider>
          <DynamicThemeProvider>
            <TitleProvider>
                <SidebarProvider>
                    {children}
                    <Toaster />
                </SidebarProvider>
            </TitleProvider>
          </DynamicThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
