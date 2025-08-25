// src/app/(public)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import React from 'react';
import prisma from '@/lib/prisma';
import Image from 'next/image';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.platformSettings.findFirst();

  return (
    <>
      <div className="relative flex flex-col min-h-screen isolate">
        <DecorativeHeaderBackground />
        <PublicTopBar />
        <main className="flex-1 flex flex-col items-center justify-center pb-16 md:pb-0">
            {children}
        </main>
        <div className="hidden md:block">
            <Footer />
        </div>
        <div className="md:hidden">
            <BottomNav />
        </div>
        {settings?.watermarkUrl && (
          <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <Image
                src={settings.watermarkUrl}
                alt="Alprigrama Watermark"
                width={60}
                height={60}
                className="opacity-50"
                data-ai-hint="logo company"
                priority
                style={{ width: 'auto', height: 'auto' }}
            />
          </div>
      )}
      </div>
    </>
  );
}
