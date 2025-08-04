
'use client';

import { Inter, Space_Grotesk, Dancing_Script, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import AppLayout from '@/app/(app)/layout';
import { Loader2 } from 'lucide-react';

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

function RootLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();

    const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/courses') || pathname.startsWith('/profile') || pathname.startsWith('/manage-courses') || pathname.startsWith('/users') || pathname.startsWith('/settings') || pathname.startsWith('/analytics') || pathname.startsWith('/security-audit') || pathname.startsWith('/enrollments') || pathname.startsWith('/my-courses') || pathname.startsWith('/announcements') || pathname.startsWith('/calendar') || pathname.startsWith('/resources') || pathname.startsWith('/notifications');

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
        <>
            <PublicTopBar />
            <main className="flex-1">
                {children}
            </main>
        </>
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
