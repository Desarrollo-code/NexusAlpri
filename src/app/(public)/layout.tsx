// src/app/(public)/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { AuthenticatedPublicHeader } from '@/components/layout/authenticated-public-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  // Forzar el tema claro en las páginas públicas
  useEffect(() => {
    if (theme !== 'light') {
      setTheme('light');
    }
  }, [theme, setTheme]);

  // Ocultar la cuadrícula en las páginas de autenticación
  const showGrid = !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up');
  
  return (
    <div className="relative flex flex-col min-h-screen items-center antialiased bg-background text-slate-900">
        
        {/* La cuadrícula solo se renderiza si no estamos en las páginas de acceso */}
        {showGrid && <div className="grid-bg"></div>}

        <DecorativeHeaderBackground />
        
        {user ? <AuthenticatedPublicHeader /> : <PublicTopBar />}
        
        <main className="flex-1 flex flex-col items-center justify-center w-full pt-24 md:pt-28 pb-16 md:pb-8 px-4">
            {isLoading ? <ColorfulLoader /> : children}
        </main>
        
        <Footer />
        <BottomNav />
    </div>
  );
}
