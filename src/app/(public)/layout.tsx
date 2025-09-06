// src/app/(public)/layout.tsx
import { PublicTopBar } from '@/components/layout/public-top-bar';
import React from 'react';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen isolate">
        <DecorativeHeaderBackground />
        <PublicTopBar />
        <main className="flex-1 flex flex-col items-center justify-center p-4 pt-20 md:pt-4 pb-20 md:pb-4">
            {children}
        </main>
        <Footer/>
        <BottomNav />
    </div>
  );
}
