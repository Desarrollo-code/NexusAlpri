// src/components/layout/sidebar-header.tsx
'use client';

import { useSidebar } from "../ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";

export const SidebarHeader = () => {
  const { isCollapsed, isMobile } = useSidebar();
  const { settings, isLoading } = useAuth();
  
  // Para móvil, el encabezado siempre está expandido y dentro de un `Sheet`.
  if (isMobile) {
      return (
         <div className="bg-[hsl(var(--sidebar-header-background))] flex items-center h-20 shadow-[0_4px_6px_-2px_hsl(var(--sidebar-border)/0.5)]">
             <Link href="/dashboard" className="inline-flex items-center gap-3 px-4">
                 <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-sidebar-accent/20">
                    {isLoading ? <Skeleton className="h-full w-full"/> : 
                     settings?.logoUrl ? <Image src={settings.logoUrl} alt="Logo" fill className="object-contain p-1" /> : <div className="w-full h-full rounded-md bg-muted" />
                    }
                 </div>
                 <span className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">{isLoading ? <Skeleton className="h-6 w-32"/> : settings?.platformName || 'NexusAlpri'}</span>
             </Link>
         </div>
      );
  }

  // Vista para escritorio
  return (
    <div className={cn(
      "flex items-center h-20 bg-[hsl(var(--sidebar-header-background))] shadow-[0_4px_6px_-2px_hsl(var(--sidebar-border)/0.5)] z-10",
      isCollapsed ? 'justify-center' : 'justify-start px-4'
    )}>
      <Link href="/dashboard" className="inline-flex items-center gap-3">
          <div className={cn(
              "bg-gradient-to-br from-sidebar-accent/20 to-sidebar-accent/10 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg relative overflow-hidden",
              "h-12 w-12"
          )}>
            {isLoading ? <Skeleton className="h-full w-full"/> : 
             settings?.logoUrl ? 
              <div className="relative w-full h-full">
                <Image src={settings.logoUrl} alt="Logo" data-ai-hint="logo" className={cn("object-contain p-1.5")} />
              </div> 
              : <div className="w-full h-full rounded-md bg-muted" />
            }
          </div>
        
        {!isCollapsed && (
            <span className="text-xl font-bold font-headline tracking-wide whitespace-nowrap text-sidebar-foreground">
              {isLoading ? <Skeleton className="h-6 w-32"/> : settings?.platformName || 'NexusAlpri'}
            </span>
        )}
      </Link>
    </div>
  );
};
