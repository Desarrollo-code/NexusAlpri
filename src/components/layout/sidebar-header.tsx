// src/components/layout/sidebar-header.tsx
'use client';

import { useSidebar } from "../ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import { motion } from "framer-motion";

export const SidebarHeader = () => {
  const { isCollapsed, isMobile } = useSidebar();
  const { settings, isLoading } = useAuth();

  // Para móvil, el encabezado siempre está expandido y dentro de un `Sheet`.
  if (isMobile) {
    return (
      <div className="bg-[hsl(var(--sidebar-header-background))] flex items-center h-20 shadow-[0_4px_6px_-2px_hsl(var(--sidebar-border)/0.5)]">
        <Link href="/dashboard" className="inline-flex items-center gap-3 px-4">
          <div className="relative h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent shadow-[0_0_20px_rgba(var(--primary),0.3)] border border-white/20">
            {isLoading ? <Skeleton className="h-full w-full" /> :
              settings?.logoUrl ? <div className="relative w-full h-full"><Image src={settings.logoUrl} alt="Logo" fill className="object-contain p-2 hover:scale-110 transition-transform duration-300" /></div> : <div className="w-full h-full rounded-md bg-muted" />
            }
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-primary tracking-tighter">{isLoading ? <Skeleton className="h-6 w-32" /> : settings?.platformName || 'NexusAlpri'}</span>
          </div>
        </Link>
      </div>
    );
  }

  // Vista para escritorio
  return (
    <div className={cn(
      "flex items-center h-24 bg-transparent border-b border-sidebar-border/10 z-10 transition-all duration-300",
      isCollapsed ? 'justify-center' : 'justify-start px-6'
    )}>
      <Link href="/dashboard" className="inline-flex items-center gap-4 group">
        <motion.div
          animate={{
            width: 52,
            height: 52,
            borderRadius: isCollapsed ? "16px" : "14px"
          }}
          className={cn(
            "bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.2)] flex-shrink-0 relative overflow-hidden border border-white/20 group-hover:shadow-[0_0_40px_rgba(var(--primary),0.4)] transition-shadow duration-500",
          )}
        >
          {isLoading ? <Skeleton className="h-full w-full" /> :
            settings?.logoUrl ?
              <div className="relative w-full h-full">
                <Image src={settings.logoUrl} alt="Logo" data-ai-hint="logo" quality={100} fill className={cn("object-contain p-2 group-hover:scale-110 transition-transform duration-500")} />
              </div>
              : <div className="w-full h-full rounded-md bg-muted" />
          }
        </motion.div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-2xl font-black font-headline tracking-tighter whitespace-nowrap text-primary transition-colors duration-300">
              {isLoading ? <Skeleton className="h-6 w-32" /> : settings?.platformName || 'NexusAlpri'}
            </span>
            {/* Etiqueta eliminada: antes mostraba 'Ecosystem' */}
          </motion.div>
        )}
      </Link>
    </div>
  );
};
