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
    <div>
      <div className="flex flex-col min-h-screen bg-background relative isolate">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div></div>
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
