// src/app/(public)/(auth)/layout.tsx
import { Footer } from '@/components/layout/footer';
import { PublicTopBar } from '@/components/layout/public-top-bar';

export default function PublicAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicTopBar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
