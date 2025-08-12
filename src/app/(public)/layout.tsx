// src/app/(public)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { WavyBackground } from '@/components/layout/wavy-background';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Force dark theme for all public pages for a consistent look
    <div className="dark">
      <div className="flex flex-col min-h-screen bg-background relative">
        <WavyBackground />
        <PublicTopBar />
        <main className="flex-1 flex flex-col items-center justify-center p-4 z-10 pt-20 md:pt-0">
          {children}
        </main>
        <div className="hidden md:block z-10">
          <Footer />
        </div>
        <div className="z-10">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
