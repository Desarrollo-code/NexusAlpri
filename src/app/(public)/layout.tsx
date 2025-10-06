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
  
  return (
    <div className={cn(
        "relative flex flex-col min-h-screen items-center antialiased",
        "bg-gradient-to-br from-accent/70 via-primary to-blue-600"
    )}>
        
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
