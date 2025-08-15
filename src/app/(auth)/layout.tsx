// src/app/(auth)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light">
      <div className="flex flex-col min-h-screen bg-background relative isolate">
          <DecorativeHeaderBackground />
          <PublicTopBar />
          <main className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto">
              {children}
            </div>
          </main>
        <div className="hidden md:block">
          <Footer />
        </div>
          <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
