// src/app/(public)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This div now defaults to the light theme for all public pages.
    <div className="light">
      <div className="flex flex-col min-h-screen bg-background relative isolate">
        <div className="bg-grainy-gradient" />
        <PublicTopBar />
        <main className="flex-1 flex flex-col items-center justify-center z-10">
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
