// src/components/layout/sidebar-header.tsx
'use client';

import { useSidebar } from "../ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { ChevronsLeft, ChevronsRight, ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';

export const SidebarHeader = () => {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();
  const { settings } = useAuth();
  
  if (isMobile) {
      return (
         <div className="flex items-center h-20 border-b border-sidebar-border px-4 bg-sidebar-background">
             <Link href="/dashboard" className="inline-flex items-center gap-3">
                 <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-primary/20">
                    {settings?.logoUrl ? <Image src={settings.logoUrl} alt="Logo" fill className="object-contain p-1" /> : <div className="w-full h-full rounded-md bg-muted" />}
                 </div>
                 <span className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">{settings?.platformName || 'NexusAlpri'}</span>
             </Link>
         </div>
      );
  }

  return (
    <div className={cn(
      "flex items-center h-20 border-b border-sidebar-border", 
      isCollapsed ? 'justify-center' : 'justify-start px-4', // <-- CORRECCIÓN CLAVE
      "bg-sidebar-background"
    )}>
      <Link href="/dashboard" className="inline-flex items-center gap-3">
          <div className={cn(
              "bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg relative overflow-hidden",
              isCollapsed ? "h-12 w-12" : "h-12 w-12"
          )}>
            {settings?.logoUrl ? 
              <div className="relative w-full h-full">
                <Image src={settings.logoUrl} alt="Logo" fill className="object-contain p-1" />
              </div> 
              : <div className="w-full h-full rounded-md bg-muted" />
            }
          </div>
        
        {!isCollapsed && (
            <span className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">
              {settings?.platformName || 'NexusAlpri'}
            </span>
        )}
      </Link>
    </div>
  );
};
