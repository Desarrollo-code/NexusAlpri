// src/app/layout.tsx
import { Inter, Space_Grotesk, Dancing_Script, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import React from 'react';
import Image from 'next/image';
import { TitleProvider } from '@/contexts/title-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

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
      <head>
          <title>NexusAlpri</title>
          <meta name="description" content="Plataforma E-learning Corporativa" />
          <link rel="icon" href="/uploads/images/logo-nexusalpri.png" sizes="any" />
      </head>
      <body className={cn(
          `${inter.variable} ${spaceGrotesk.variable} ${dancingScript.variable} ${sourceCodePro.variable}`,
          "font-body flex flex-col min-h-screen bg-background"
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          themes={['light', 'dark', 'sunset', 'forest', 'oceanic', 'rose-gold']}
        >
            <AuthProvider>
                <TitleProvider>
                    <SidebarProvider>
                        {children}
                        <Toaster />
                    </SidebarProvider>
                </TitleProvider>
            </AuthProvider>
        </ThemeProvider>
         <div className="fixed bottom-8 right-2 z-50 pointer-events-none">
            <Image
                src="/uploads/images/watermark-alprigrama.png"
                alt="NexusAlpri Watermark"
                width={50}
                height={50}
                className="opacity-40"
                data-ai-hint="logo"
                priority
                style={{ width: 'auto', height: 'auto' }}
            />
        </div>
      </body>
    </html>
  );
}
