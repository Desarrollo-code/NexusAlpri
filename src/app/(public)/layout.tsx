// src/app/(public)/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { AuthenticatedPublicHeader } from '@/components/layout/authenticated-public-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, settings, isLoading } = useAuth();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  // Forzar el tema claro en las páginas públicas
  useEffect(() => {
    if (theme !== 'light') {
      setTheme('light');
    }
  }, [theme, setTheme]);
  
  return (
    <div className="relative flex flex-col min-h-screen items-center antialiased bg-background text-slate-900">
      
      {/* CAPA 0: Imagen de fondo */}
      {settings?.publicPagesBgUrl && (
        <div className="fixed inset-0 z-0">
          <Image 
            src={settings.publicPagesBgUrl} 
            alt="Fondo decorativo de la plataforma" 
            fill 
            className="object-cover opacity-60"
            quality={80}
            data-ai-hint="abstract background"
          />
          {/* Superposición opcional para oscurecer/aclarar */}
          <div className="absolute inset-0 bg-background/50" />
        </div>
      )}

      {/* CAPA 10: Contenido principal */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {user ? <AuthenticatedPublicHeader /> : <PublicTopBar />}
        
        <main className="flex-1 flex flex-col items-center justify-center w-full pt-24 md:pt-28 pb-16 md:pb-8 px-4">
            {isLoading ? <ColorfulLoader /> : children}
        </main>
        
        <Footer />
        <BottomNav />
      </div>
    </div>
  );
}
