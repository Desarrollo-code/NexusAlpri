// src/app/(auth)/layout.tsx
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative flex flex-col min-h-screen isolate">
          <DecorativeHeaderBackground />
          <PublicTopBar />
          <main className="flex-1 flex flex-col items-center justify-center">
              {children}
          </main>
      </div>
    </>
  );
}
