
'use client';

import { Inter, Space_Grotesk, Dancing_Script, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from 'next-themes';
import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicTopBar } from '@/components/layout/public-top-bar';
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

const publicPages = ['/', '/about', '/sign-in', '/sign-up'];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Check if the current path starts with any of the public paths.
  // This handles nested routes like /sign-in/[[...sign-in]]
  const isPublicPage = publicPages.some(p => pathname.startsWith(p));
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${dancingScript.variable} ${sourceCodePro.variable}`} suppressHydrationWarning>
      <head>
          <title>NexusAlpri</title>
          <meta name="description" content="Plataforma E-learning Corporativa" />
      </head>
      <body className="font-body flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <AuthProvider>
                {isPublicPage && <PublicTopBar />}
                <main className={cn("flex-1 flex flex-col", isAuthPage ? "items-center justify-center" : "")}>
                  {children}
                </main>
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
