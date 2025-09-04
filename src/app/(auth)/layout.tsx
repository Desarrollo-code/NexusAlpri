// src/app/(auth)/layout.tsx
import { PublicTopBar } from '@/components/layout/public-top-bar';
import React from 'react';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen isolate">
        <DecorativeHeaderBackground />
        <PublicTopBar />
        <main className="flex-1 flex flex-col items-center justify-center p-4 pb-16 md:pb-4">
            {children}
        </main>
        <BottomNav />
    </div>
  );
}
