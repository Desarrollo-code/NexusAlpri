// src/app/(public)/layout.tsx
'use client';

import React, { useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { AuthenticatedPublicHeader } from '@/components/layout/authenticated-public-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { AppWatermark } from '@/components/layout/app-watermark';


function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, settings } = useAuth();
  const { setTheme } = useTheme();

  // Forzar el tema claro en las páginas públicas
  useEffect(() => {
      setTheme('light');
  }, [setTheme]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <ColorfulLoader />
        </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-screen items-center antialiased bg-background text-slate-900">
      
      {settings?.publicPagesBgUrl && (
        <div className="fixed inset-0 z-0">
          <Image 
            src={settings.publicPagesBgUrl} 
            alt="Fondo decorativo de la plataforma" 
            fill 
            className="object-cover opacity-100"
            quality={80}
            data-ai-hint="abstract background"
            priority
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {user ? <AuthenticatedPublicHeader /> : <PublicTopBar />}
        
        <main className="flex-1 flex flex-col items-center justify-center w-full pt-24 md:pt-28 pb-16 md:pb-8 px-4">
          {children}
        </main>
        
        <Footer />
        <BottomNav />
        <AppWatermark />
      </div>
    </div>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><ColorfulLoader /></div>}>
        <PublicLayoutContent>{children}</PublicLayoutContent>
    </Suspense>
  );
}
