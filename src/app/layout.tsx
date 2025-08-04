
'use client';

import { Inter, Space_Grotesk, Dancing_Script, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { useTheme } from "next-themes";
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import AppLayout from '@/app/(app)/layout';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
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

// Regex to identify routes that belong to the private part of the application
const IS_APP_ROUTE_REGEX = /^\/(dashboard|courses|my-courses|profile|manage-courses|users|settings|analytics|security-audit|enrollments|notifications|calendar|resources)/;

function RootLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();
    const { setTheme } = useTheme();

    const isAppRoute = IS_APP_ROUTE_REGEX.test(pathname);

    useEffect(() => {
        if (!isAppRoute) {
            setTheme('light');
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        } else {
             document.documentElement.classList.remove('light');
        }
    }, [isAppRoute, setTheme]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // If the user is on a protected route and is logged in, show the app layout
    if (isAppRoute && user) {
        return (
            <AppLayout>
                <TopBar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </AppLayout>
        );
    }

    // Otherwise, show the public layout (top bar + page content)
    return (
        <>
            <PublicTopBar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
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
            <SidebarProvider>
              <RootLayoutContent>{children}</RootLayoutContent>
            </SidebarProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
