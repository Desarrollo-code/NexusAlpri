// src/app/(public)/layout.tsx
'use client';

import React, { useEffect, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { AuthenticatedPublicHeader } from '@/components/layout/authenticated-public-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { AppWatermark } from '@/components/layout/app-watermark';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';


function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
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
    <div className="relative flex flex-col min-h-screen items-center antialiased bg-background text-foreground">
      
      <main className="flex-1 flex flex-col items-center w-full relative">
        <DecorativeHeaderBackground />
        {user ? <AuthenticatedPublicHeader /> : <PublicTopBar />}
        
        <div className="flex-1 flex flex-col items-center justify-center w-full pt-24 md:pt-28 pb-16 md:pb-8 px-4">
          {children}
        </div>
        
        <Footer />
        <BottomNav />
        <AppWatermark />
      </main>
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
