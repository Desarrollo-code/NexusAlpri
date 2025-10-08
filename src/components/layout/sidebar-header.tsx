// src/components/layout/sidebar-header.tsx
'use client';

import { useSidebar } from "../ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { ChevronsLeft } from "lucide-react";

export const SidebarHeader = () => {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();
  const { settings } = useAuth();
  
  return (
    <div className={cn(
      "flex items-center h-20 border-b border-sidebar-border/50", 
      isCollapsed ? 'justify-center' : 'justify-between px-4'
    )}>
      <Link href="/dashboard" className={cn(
          "inline-flex items-center gap-3",
          isCollapsed && "justify-center"
      )}>
         <div className={cn(
             "bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg relative overflow-hidden",
             isCollapsed ? "h-10 w-10" : "h-12 w-12",
             !settings?.logoUrl && "p-2"
         )}>
            {settings?.logoUrl ? 
              <div className="relative w-full h-full">
                <Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" className={cn("object-contain p-1")} />
              </div> 
              : <div className="w-full h-full rounded-md bg-muted" />
            }
          </div>
        
        {!isCollapsed && (
            <span className="text-xl font-bold font-headline tracking-wide whitespace-nowrap text-sidebar-foreground">
              {settings?.platformName || 'NexusAlpri'}
            </span>
        )}
      </Link>

      {!isMobile && !isCollapsed && (
         <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-muted-foreground hover:bg-white/10 hover:text-sidebar-foreground"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}
    </div>
  );
};
