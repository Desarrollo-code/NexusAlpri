
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPublicPage = !pathname.startsWith('/dashboard') && 
                       !pathname.startsWith('/courses/') && // Excluir páginas de detalle de cursos
                       !pathname.startsWith('/manage-courses') &&
                       !pathname.startsWith('/my-courses') &&
                       !pathname.startsWith('/resources') &&
                       !pathname.startsWith('/announcements') &&
                       !pathname.startsWith('/calendar') &&
                       !pathname.startsWith('/profile') &&
                       !pathname.startsWith('/settings') &&
                       !pathname.startsWith('/users') &&
                       !pathname.startsWith('/analytics') &&
                       !pathname.startsWith('/security-audit') &&
                       !pathname.startsWith('/enrollments') &&
                       !pathname.startsWith('/notifications');

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
                {isPublicPage && <PublicTopBar />}
                <div className={cn("flex-1 flex flex-col w-full", !isPublicPage && "h-screen")}>
                  {children}
                </div>
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
