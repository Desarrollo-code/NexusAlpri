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
    <div className="flex flex-col min-h-screen bg-background relative isolate">
       <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover -z-20"
          src="/videos/background.mp4"
          poster="/uploads/images/video-poster.jpg"
        >
          Tu navegador no soporta el tag de video.
        </video>
        <div className="absolute inset-0 bg-black/50 -z-10" />
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
  );
}
