// src/app/(public)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { IsometricBackground } from '@/components/layout/isometric-background';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <IsometricBackground />
      <PublicTopBar />
      <main className="flex-1 flex flex-col items-center justify-center z-10 pt-20 md:pt-0">
        {children}
      </main>
      <div className="hidden md:block z-10">
        <Footer />
      </div>
       <div className="z-10">
        <BottomNav />
      </div>
    </div>
  );
}
