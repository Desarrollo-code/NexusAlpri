
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
      <main className="flex-1">
          {children}
      </main>
    </div>
  );
}
