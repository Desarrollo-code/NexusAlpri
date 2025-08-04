// src/app/(public)/layout.tsx
import { PublicTopBar } from '@/components/layout/public-top-bar';
import React from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full flex-1">
      <PublicTopBar />
      <main className="flex-1 flex flex-col items-center justify-center py-12 md:py-24">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
