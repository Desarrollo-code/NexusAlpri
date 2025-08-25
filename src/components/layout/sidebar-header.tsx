// src/components/layout/sidebar-header.tsx

'use client';

import { useSidebar } from "../ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const SidebarHeader = () => {
  const { isCollapsed } = useSidebar();
  const { settings } = useAuth();
  
  const logoSrc = settings?.logoUrl || "/uploads/images/logo-nexusalpri.png";

  return (
    <div className={cn(
      "flex items-center h-20 px-4", 
      isCollapsed ? 'justify-center' : 'justify-between'
    )}>
      <Link href="/dashboard" className={cn("flex items-center gap-2 overflow-hidden")}>
         <div className={cn(
            "flex items-center justify-center flex-shrink-0 rounded-lg transition-all duration-300 relative",
            "w-12 h-12 bg-gray-900" 
        )}>
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-70"></div>
          <Image 
            src={logoSrc} 
            alt="Logo" 
            width={48} 
            height={48} 
            data-ai-hint="logo" 
            className="rounded-md z-10"
            style={{objectFit: 'cover'}}
          />
        </div>
        {!isCollapsed && (
            <span className={cn("text-2xl font-bold font-headline tracking-wide whitespace-nowrap text-foreground transition-opacity duration-300")}>
              {settings?.platformName || 'NexusAlpri'}
            </span>
        )}
      </Link>
    </div>
  );
};
