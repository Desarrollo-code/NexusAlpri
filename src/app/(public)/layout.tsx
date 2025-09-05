// src/app/(public)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import React from 'react';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import { ThemeProvider } from '@/components/theme-provider';

// Función para obtener la URL de la marca de agua, con manejo de errores.
async function getWatermarkUrl() {
    try {
        const settings = await prisma.platformSettings.findFirst({
            select: { watermarkUrl: true }
        });
        return settings?.watermarkUrl;
    } catch (error) {
        console.error("Error fetching watermark, returning null:", error);
        return null; // Devuelve null si la base de datos no está disponible.
    }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const watermarkUrl = await getWatermarkUrl();

  return (
    <ThemeProvider defaultTheme="light" forcedTheme="light">
        <div className="relative flex flex-col min-h-screen isolate bg-background text-foreground">
            <DecorativeHeaderBackground />
            <PublicTopBar />
            <main className="flex-1 flex flex-col items-center pt-24 md:pt-0 pb-16 md:pb-0">
                {children}
            </main>
            <div className="hidden md:block">
                <Footer />
            </div>
            <div className="md:hidden">
                <BottomNav />
            </div>
            {watermarkUrl && (
            <div className="fixed right-4 z-50 pointer-events-none bottom-20 md:bottom-4">
                <Image
                    src={watermarkUrl}
                    alt="Alprigrama Watermark"
                    width={60}
                    height={60}
                    className="opacity-50"
                    data-ai-hint="logo company"
                    priority
                    style={{ width: 'auto', height: 'auto' }}
                    quality={100}
                />
            </div>
        )}
        </div>
    </ThemeProvider>
  );
}
