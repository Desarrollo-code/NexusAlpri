// src/app/(public)/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { AuthenticatedPublicHeader } from '@/components/layout/authenticated-public-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { useTheme } from 'next-themes';
import Image from 'next/image';

// Componente interno que renderiza el contenido del layout público
function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, settings, isLoading } = useAuth();
  const { setTheme, theme } = useTheme();

  // Forzar el tema claro en las páginas públicas si el usuario no está logueado
  useEffect(() => {
    if (theme !== 'light' && !user) {
      setTheme('light');
    }
  }, [theme, setTheme, user]);
  
  return (
    <div className="relative flex flex-col min-h-screen items-center antialiased bg-background text-slate-900">
      
      {settings?.publicPagesBgUrl && (
        <div className="fixed inset-0 z-0">
          <Image 
            src={settings.publicPagesBgUrl} 
            alt="Fondo decorativo de la plataforma" 
            fill 
            className="object-cover opacity-100"
            quality={80}
            data-ai-hint="abstract background"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {user ? <AuthenticatedPublicHeader /> : <PublicTopBar />}
        
        <main className="flex-1 flex flex-col items-center justify-center w-full pt-24 md:pt-28 pb-16 md:pb-8 px-4">
            {isLoading ? <div className="flex items-center justify-center h-full"><ColorfulLoader /></div> : children}
        </main>
        
        <Footer />
        <BottomNav />
      </div>
    </div>
  );
}

// El layout ahora solo renderiza el contenido, asumiendo que AuthProvider ya está en la raíz.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayoutContent>{children}</PublicLayoutContent>;
}
