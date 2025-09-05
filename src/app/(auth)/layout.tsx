// src/app/(auth)/layout.tsx
import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';

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
    <ThemeProvider defaultTheme="dark" forcedTheme="dark">
        <div className={cn("relative flex flex-col min-h-screen isolate bg-background text-foreground antialiased", fontVariables)}>
             {/* Fondo Decorativo Mejorado */}
             <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
            </div>
            
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                {children}
            </main>
        </div>
    </ThemeProvider>
  );
}
