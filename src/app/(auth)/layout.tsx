// src/app/(auth)/layout.tsx
import { PublicTopBar } from '@/components/layout/public-top-bar';
import React from 'react';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ThemeProvider } from '@/components/theme-provider';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import { Footer } from '@/components/layout/footer';

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

export default async function AuthLayout({
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
            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-20 md:pt-4 pb-20 md:pb-4">
                {children}
            </main>
            <Footer />
            <BottomNav />
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
