// src/app/layout.tsx
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React from 'react';
import { TitleProvider } from '@/contexts/title-context';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';

// This function now fetches settings and determines font variables on the server.
async function getLayoutSettings() {
    return {
        fontVariables: getFontVariables() // Get default fonts
    };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { fontVariables } = await getLayoutSettings();
  
  return (
    <html lang="es" suppressHydrationWarning className={fontVariables}>
      <body className={cn("flex flex-col min-h-screen bg-background font-body")}>
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
