
// src/app/layout.tsx
'use client';
import { Inter, Space_Grotesk, Dancing_Script, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { Footer } from '@/components/layout/footer';
import { Loader2 } from 'lucide-react';
import AppLayout from './(app)/layout';


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

const IS_APP_ROUTE_REGEX = /^\/(dashboard|courses|my-courses|profile|manage-courses|users|settings|analytics|security-audit|enrollments|notifications|calendar|resources)/;

function RootLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();
    const isAppRoute = IS_APP_ROUTE_REGEX.test(pathname);

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (isAppRoute && user) {
        return <AppLayout>{children}</AppLayout>;
    }

    return (
      <div className="flex flex-col min-h-screen">
        <PublicTopBar />
        <main className="flex-1">
            {children}
        </main>
        <Footer />
      </div>
    );
}

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
          <link rel="icon" href="/uploads/images/logo-letter.png" sizes="any" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${dancingScript.variable} ${sourceCodePro.variable} font-body flex flex-col min-h-screen bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
