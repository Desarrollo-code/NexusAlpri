// src/components/layout/app-watermark.tsx
'use client';

import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function AppWatermark() {
    const { settings, isLoading } = useAuth();
    const pathname = usePathname();
    
    // El "mundo público" se considera cualquier ruta que no empiece con /dashboard, /profile, etc.
    const isPublicWorld = !/^\/(dashboard|profile|manage-courses|my-courses|my-notes|resources|announcements|calendar|forms|enrollments|analytics|security-audit|settings|notifications|leaderboard|messages|quizz-it|processes)/.test(pathname);

    // No renderizar nada hasta saber si hay una marca de agua.
    if (isLoading) {
        return null;
    }
    
    if (settings?.watermarkUrl) {
      return (
        <div className={cn(
            "fixed z-[9999] pointer-events-none",
            "right-4 opacity-30 md:opacity-50",
            // En el mundo público (con bottom nav), se le da más espacio en la parte inferior en móviles.
            // En el mundo de la app (sin bottom nav), siempre está en la misma posición inferior.
            isPublicWorld ? "bottom-20 md:bottom-4" : "bottom-4"
        )}>
          <Image 
            src={settings.watermarkUrl} 
            alt="Marca de agua" 
            width={75} 
            height={75} 
            data-ai-hint="logo company" 
            priority 
            quality={100}
          />
        </div>
      );
    }
    
    return null;
}
