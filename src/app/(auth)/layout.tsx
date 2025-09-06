// src/app/(auth)/layout.tsx
import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import type { PlatformSettings } from '@/types';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';

async function getPageSettings(): Promise<Partial<PlatformSettings>> {
    try {
        const settings = await prisma.platformSettings.findFirst({
            select: {
                platformName: true,
                authImageUrl: true,
                logoUrl: true,
            }
        });
        return settings || {};
    } catch (error) {
        console.error("Failed to fetch settings for Auth layout, using defaults:", error);
        return {};
    }
}


export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = await getFontVariables();
  const settings = await getPageSettings();
  
  return (
    <ThemeProvider defaultTheme="light" forcedTheme="light">
        <div className={cn("relative flex flex-col min-h-screen items-center justify-center bg-background antialiased", fontVariables)}>
             <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--primary-rgb),0.08),rgba(255,255,255,0))]"></div>
                <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--accent-rgb),0.08),rgba(255,255,255,0))]"></div>
            </div>
            
            <PublicTopBar />
            
            <main className="flex-1 flex items-center justify-center w-full p-4">
               {children}
            </main>
            
            <BottomNav />
        </div>
    </ThemeProvider>
  );
}
