// src/app/(public)/layout.tsx
import React from 'react';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative flex flex-col min-h-screen items-center bg-slate-50 antialiased")}>
        <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,0.15),transparent)] animate-aurora-1" />
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-[radial-gradient(circle_farthest-side,rgba(249,115,22,0.15),transparent)] animate-aurora-2" />
        </div>
        
        <PublicTopBar />
        
        <main className="flex-1 flex flex-col items-center justify-center w-full p-4">
            {children}
        </main>
        
        <Footer />
        <BottomNav />
    </div>
  );
}
