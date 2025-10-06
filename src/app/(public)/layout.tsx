// src/app/(public)/layout.tsx
'use client';

import React from 'react';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { AuthenticatedPublicHeader } from '@/components/layout/authenticated-public-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  
  // El layout ahora siempre renderiza la estructura, y los componentes internos deciden si mostrarse.
  return (
    <div className={cn("relative flex flex-col min-h-screen items-center bg-sky-100 antialiased")}>
        
        {/* Los componentes de la barra superior ahora manejan su propia lógica de visibilidad */}
        <PublicTopBar />
        <AuthenticatedPublicHeader />
        
        <main className="flex-1 flex flex-col items-center justify-center w-full p-4 pt-24 md:pt-28 pb-16 md:pb-8">
            {isLoading ? <ColorfulLoader /> : children}
        </main>
        
        <Footer />
        <BottomNav />
    </div>
  );
}
