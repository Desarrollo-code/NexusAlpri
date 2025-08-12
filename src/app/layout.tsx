// src/app/layout.tsx
import { Inter, Space_Grotesk, Dancing_Script, Source_Code_Pro } from 'next/font/google';
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

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline-alt',
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
          `${inter.variable} ${spaceGrotesk.variable} ${dancingScript.variable} ${sourceCodePro.variable}`,
          "font-body flex flex-col min-h-screen bg-background"
      )}>
        {/* ThemeProvider has been moved to AppLayout to scope it */}
        <AuthProvider>
            <TitleProvider>
                <SidebarProvider>
                    {children}
                    <Toaster />
                </SidebarProvider>
            </TitleProvider>
        </AuthProvider>
         <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <Image
                src="/uploads/images/alprigrama_watermark.png"
                alt="Alprigrama Watermark"
                width={80}
                height={80}
                className="opacity-40"
                data-ai-hint="logo company"
                priority
                style={{ width: 'auto', height: 'auto' }}
            />
        </div>
      </body>
    </html>
  );
}
