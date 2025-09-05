// src/app/(auth)/layout.tsx
import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';

// Función para obtener la URL de la marca de agua, con manejo de errores.
async function getWatermarkUrl() {
    // Simulamos la no disponibilidad de la DB en este layout para el diseño
    return null;
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = await getFontVariables();

  return (
    <ThemeProvider defaultTheme="light" forcedTheme="light">
        <div className={cn("relative flex flex-col min-h-screen isolate bg-background text-foreground antialiased", fontVariables)}>
             {/* Fondo Decorativo Mejorado */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--primary-rgb),0.15),rgba(255,255,255,0))]"></div>
                <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--accent-rgb),0.15),rgba(255,255,255,0))]"></div>
            </div>
            
            <PublicTopBar />
            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-20 md:pt-4 pb-20 md:pb-4">
                {children}
            </main>
            <BottomNav />
        </div>
    </ThemeProvider>
  );
}
