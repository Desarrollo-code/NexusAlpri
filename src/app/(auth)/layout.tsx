// src/app/(auth)/layout.tsx
import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import prisma from '@/lib/prisma';
import type { PlatformSettings } from '@/types';

async function getPageSettings(): Promise<Partial<PlatformSettings>> {
    try {
        const settings = await prisma.platformSettings.findFirst({
            select: {
                platformName: true,
                authImageUrl: true
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
  const authImageUrl = settings?.authImageUrl;


  return (
    <ThemeProvider defaultTheme="light" forcedTheme="light">
        <div className={cn("relative flex min-h-screen items-center justify-center bg-background p-4 antialiased", fontVariables)}>
             <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--primary-rgb),0.1),rgba(255,255,255,0))]"></div>
                <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--accent-rgb),0.1),rgba(255,255,255,0))]"></div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto md:grid md:grid-cols-2">
                <div className="hidden md:flex p-8 lg:p-12 relative text-white btn-primary-gradient flex-col justify-between">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold font-headline">{settings?.platformName || 'NexusAlpri'}</h2>
                        <p className="mt-2 text-white/80 max-w-sm">La plataforma de e-learning que se adapta a tu equipo.</p>
                    </div>
                     {authImageUrl ? 
                        <Image src={authImageUrl} alt="Decorative background" fill className="object-cover opacity-20" data-ai-hint="abstract collaboration" quality={100} />
                        : <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-white/10 rounded-full" />
                     }
                </div>

                <div className="w-full p-6 sm:p-10 flex flex-col justify-center">
                    {children}
                </div>
            </div>
        </div>
    </ThemeProvider>
  );
}
