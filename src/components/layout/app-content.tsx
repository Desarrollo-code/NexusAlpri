// src/components/layout/app-content.tsx
'use client';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { PublicTopBar } from './public-top-bar';
import { BottomNav } from './bottom-nav';
import { DecorativeHeaderBackground } from './decorative-header-background';
import { Footer } from './footer';
import { cn } from '@/lib/utils';
import { ColorfulLoader } from '../ui/colorful-loader';

const PUBLIC_PAGES_PREFIXES = ['/', '/about', '/sign-in', '/sign-up'];

export function AppContent({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();

    const isPublicRoute = PUBLIC_PAGES_PREFIXES.some(prefix => {
        if (prefix === '/') return pathname === '/';
        return pathname.startsWith(prefix);
    });

    if (isLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <ColorfulLoader />
          </div>
        );
    }
    
    // Si no hay usuario y estamos en una ruta pública, mostrar layout público.
    if (!user && isPublicRoute) {
        return (
             <div className={cn("relative flex flex-col min-h-screen items-center bg-background antialiased")}>
                <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                    <DecorativeHeaderBackground />
                </div>
                
                <PublicTopBar />
                
                <main className="flex-1 flex items-center justify-center w-full p-4 pt-20 md:pt-4 pb-20 md:pb-4">
                    {children}
                </main>
                
                <Footer />
                <BottomNav />
            </div>
        );
    }
    
    // Si hay usuario (o estamos en una ruta de app), el AppLayout de (app) se encargará.
    return <>{children}</>;
}
