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
  
  return (
    <div className={cn(
      "flex items-center justify-center h-20", 
      isCollapsed ? '' : 'px-4'
    )}>
      <Link href="/dashboard" className="inline-flex items-center gap-3">
         <div className={cn(
             "bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg relative overflow-hidden",
             isCollapsed ? "h-12 w-12" : "h-14 w-14",
             !settings?.logoUrl && "p-2"
         )}>
            {settings?.logoUrl ? 
              <div className="relative w-full h-full">
                <Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" className={cn("object-contain", isCollapsed ? 'p-1.5' : 'p-1')} />
              </div> 
              : <div className="w-full h-full rounded-md bg-muted" />
            }
          </div>
        
        {!isCollapsed && (
            <span className="text-xl font-bold font-headline tracking-wide whitespace-nowrap text-foreground">
              {settings?.platformName || 'NexusAlpri'}
            </span>
        )}
      </Link>
    </div>
  );
};
