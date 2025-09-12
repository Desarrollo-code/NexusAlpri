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
            "bottom-16 ml-32", // Posición en móvil
            "md:bottom-4 md:left-auto md:right-4 md:transform-none md:ml-0" // Posición en escritorio
        )}>
          <Image 
            src={settings.watermarkUrl} 
            alt="Marca de agua" 
            width={80} 
            height={80} 
            className="opacity-50" 
            data-ai-hint="logo company" 
            priority 
            quality={100}
          />
        </div>
      );
    }
    
    return null;
}
