// src/components/layout/app-watermark.tsx
'use client';

import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export default function AppWatermark() {
    const { settings, isLoading } = useAuth();
    
    // Don't render anything until we know if there is a watermark or not
    if (isLoading) {
        return null;
    }
    
    if (settings?.watermarkUrl) {
      return (
        <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
          <Image 
            src={settings.watermarkUrl} 
            alt="Marca de agua" 
            width={80} 
            height={80} 
            className="opacity-50" 
            data-ai-hint="logo company" 
            priority 
            quality={100}
            style={{ width: 'auto', height: 'auto' }} 
          />
        </div>
      );
    }
    
    return null;
}
