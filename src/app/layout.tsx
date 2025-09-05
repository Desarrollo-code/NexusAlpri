
// src/app/layout.tsx
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React from 'react';
import { TitleProvider } from '@/contexts/title-context';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';

// Esta función ahora solo obtiene las fuentes, sin consultar la base de datos.
async function getLayoutSettings() {
    return {
        fontVariables: await getFontVariables()
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
