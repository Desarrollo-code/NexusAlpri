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
      "flex items-center h-20 border-b", 
      isCollapsed ? 'justify-center' : 'justify-between px-4',
      "bg-[#1E232C] border-slate-700"
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
            <span className="text-xl font-bold text-white whitespace-nowrap">
              {settings?.platformName || 'NexusAlpri'}
            </span>
        )}
      </Link>
    </div>
  );
};
