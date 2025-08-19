// src/app/(public)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { getFontVariables } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import React from 'react';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = await getFontVariables();

  return (
    <ThemeProvider>
      <div className={cn('flex flex-col min-h-screen bg-background relative isolate', fontVariables)}>
        <DecorativeHeaderBackground />
        <PublicTopBar />
        <main className="flex-1 flex flex-col items-center justify-center">
          {children}
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </ThemeProvider>
  );
}
