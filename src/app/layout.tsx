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
  
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
          "font-body flex flex-col min-h-screen bg-background",
          fontVariables
      )}>
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
