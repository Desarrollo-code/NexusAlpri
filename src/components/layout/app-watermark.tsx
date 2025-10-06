// src/components/layout/app-watermark.tsx
'use client';

import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function AppWatermark() {
    const { settings, isLoading } = useAuth();
    
    // Don't render anything until we know if there is a watermark or not
    if (isLoading) {
        return null;
    }
    
    if (settings?.watermarkUrl) {
      return (
        <div className={cn(
            "fixed z-[9999] pointer-events-none",
             // En móvil, se posiciona más arriba para no chocar con la barra de navegación.
            "bottom-20 md:bottom-4 right-4 opacity-30 md:opacity-50"
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
