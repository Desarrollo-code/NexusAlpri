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
    <div className="dark flex flex-col min-h-screen">
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="/uploads/images/video_poster.jpg"
        >
          <source src="/uploads/videos/public-background.mp4" type="video/mp4" />
          Tu navegador no soporta la etiqueta de video.
        </video>
        <div className="absolute inset-0 bg-background/80"></div>
      </div>
      <PublicTopBar />
      <main className="flex-1 flex flex-col items-center justify-center pb-20 md:pb-0 z-10">
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
