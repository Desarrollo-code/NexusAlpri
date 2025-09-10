// src/app/(public)/layout.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { Footer } from '@/components/layout/footer';

// Este layout ahora es el único para todas las páginas públicas y de autenticación.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className={cn("relative flex flex-col min-h-screen items-center bg-background antialiased")}>
           <div className="absolute inset-0 -z-10 h-full w-full bg-background">
              <DecorativeHeaderBackground />
          </div>
          
          <PublicTopBar />
          
          <main className="flex-1 flex items-center justify-center w-full p-4 pt-20 md:pt-4 pb-20 md:pb-4">
             {children}
          </main>
          
          <Footer />
          <BottomNav />
      </div>
  );
}
