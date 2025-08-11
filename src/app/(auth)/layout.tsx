// src/app/(auth)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
       <PublicTopBar />
       <main className="flex-1 flex flex-col items-center justify-center p-4">
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
