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
            "flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg transition-all duration-300",
            "w-14 h-14 bg-card dark:bg-white/20"
        )}>
          <Image 
            src={logoSrc} 
            alt="Logo" 
            width={56} 
            height={56} 
            data-ai-hint="logo" 
            className={cn(!settings?.logoUrl && "p-1")}
            style={{objectFit: 'contain'}}
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
