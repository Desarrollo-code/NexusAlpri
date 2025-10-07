// src/app/(public)/layout.tsx
'use client';

import React from 'react';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { AuthenticatedPublicHeader } from '@/components/layout/authenticated-public-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  
  return (
    <div className="relative flex flex-col min-h-screen items-center antialiased bg-blue-400 text-slate-100">
        
        <DecorativeHeaderBackground />
        
        {user ? <AuthenticatedPublicHeader /> : <PublicTopBar />}
        
        <main className="flex-1 flex flex-col items-center justify-center w-full pt-24 md:pt-28 pb-16 md:pb-8">
            {isLoading ? <ColorfulLoader /> : children}
        </main>
        
        <Footer />
        <BottomNav />
    </div>
  );
}
