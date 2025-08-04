import { Inter, Space_Grotesk, Dancing_Script, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from 'next-themes';
import React from 'react';
import { PublicLayoutWrapper } from '@/components/layout/public-layout-wrapper';
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
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${dancingScript.variable} ${sourceCodePro.variable}`} suppressHydrationWarning>
      <head>
          <title>NexusAlpri</title>
          <meta name="description" content="Plataforma E-learning Corporativa" />
      </head>
      <body className="font-body flex flex-col min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <AuthProvider>
                <PublicLayoutWrapper>
                    {children}
                </PublicLayoutWrapper>
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}