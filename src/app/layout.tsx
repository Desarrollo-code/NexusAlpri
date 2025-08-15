// src/app/layout.tsx
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React from 'react';
import Image from 'next/image';
import { TitleProvider } from '@/contexts/title-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
});

const sourceCodePro = Source_Code_Pro({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-code',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
          `${inter.variable} ${spaceGrotesk.variable} ${sourceCodePro.variable}`,
          "font-body flex flex-col min-h-screen bg-background"
      )}>
        <AuthProvider>
            <TitleProvider>
                <SidebarProvider>
                    {children}
                    <Toaster />
                </SidebarProvider>
            </TitleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
