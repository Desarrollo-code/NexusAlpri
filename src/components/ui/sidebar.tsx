
'use client';

// Sidebar-layout-enhanced 🌈 Creativo & juvenil
// Estilo visual mejorado: colores vivos, tipografía amigable, gradientes y transiciones suaves

import * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronsLeft, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth-context";
import { getNavItemsForRole } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { GradientIcon } from "./gradient-icon";
import type { NavItem } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const SidebarContext = React.createContext<any>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = React.useState(pathname);
  const [openMobile, setOpenMobile] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };
  
  const finalIsCollapsed = !isMobile && isCollapsed;

  React.useEffect(() => {
    if (pathname) setActiveItem(pathname);
  }, [pathname]);

  React.useEffect(() => {
      if (isMobile) {
        setOpenMobile(false);
      }
  }, [pathname, isMobile]);
  
  const value = {
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
    activeItem,
    isCollapsed: finalIsCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { isMobile, openMobile, setOpenMobile, isCollapsed } = useSidebar();
  
  const desktopClasses = isCollapsed ? "w-20" : "w-72";
  const mobileClasses = openMobile ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      {isMobile && openMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setOpenMobile(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out shadow-xl",
          "bg-sidebar-background border-r border-sidebar-border",
          isMobile ? `w-72 ${mobileClasses}` : desktopClasses
        )}
      >
        {children}
      </aside>
    </>
  );
};

export const SidebarHeader = () => {
  const { isCollapsed } = useSidebar();
  const { settings } = useAuth();
  
  return (
    <div className={cn(
      "flex items-center h-20 px-4", 
      isCollapsed ? 'justify-center' : 'justify-between'
    )}>
      <Link href="/dashboard" className={cn("flex items-center gap-2 overflow-hidden")}>
         <div className={cn(
            "flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg transition-all duration-300",
            "w-12 h-12 bg-card dark:bg-white/20"
        )}>
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={48} height={48} data-ai-hint="logo"/>
        </div>
        {!isCollapsed && (
            <span className={cn("text-2xl font-bold font-headline-alt tracking-wide whitespace-nowrap text-sidebar-foreground transition-opacity duration-300")}>
              {settings?.platformName || 'NexusAlpri'}
            </span>
        )}
      </Link>
    </div>
  );
};

export const SidebarContent = () => {
  const { user } = useAuth();
  const { isCollapsed, isMobile } = useSidebar();
  const navItems = getNavItemsForRole(user?.role || 'STUDENT');

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.children && item.children.length > 0) {
            return (
              <div key={item.id} className="pt-4">
                <SidebarSectionHeader label={item.label} />
                <div className="space-y-1 mt-2">
                  {item.children.map(child => <SidebarMenuItem key={child.id} item={child} />)}
                </div>
              </div>
            );
          }
          return <SidebarMenuItem key={item.id} item={item} />;
        })}
      </div>
    </TooltipProvider>
  );
};

const SidebarSectionHeader = ({ label }: { label: string }) => {
    const { isCollapsed } = useSidebar();
    if (isCollapsed) return null;
    return (
      <h2 className={cn(
          "px-4 text-xs font-semibold uppercase text-sidebar-muted-foreground tracking-wider transition-all duration-300"
      )}>
          {label}
      </h2>
    );
};


const SidebarMenuItem = ({ item }: { item: NavItem }) => {
  const { activeItem, isCollapsed, isMobile } = useSidebar();

  const isActive = useMemo(() => {
    if (!activeItem || !item.path) return false;
    // Exact match for dashboard, startsWith for others
    if (item.path === '/dashboard') return activeItem === item.path;
    return activeItem.startsWith(item.path) && item.path !== '/';
  }, [activeItem, item.path]);

  const showText = !isCollapsed || isMobile;
  
  const content = (
      <div className={cn(
        "flex items-center gap-3 py-3 rounded-lg transition-all duration-300 font-medium group/menu-item relative",
        isCollapsed && !isMobile ? "justify-center px-0" : "px-4",
        isActive
          ? "bg-gradient-to-r from-accent/50 to-primary/50 text-sidebar-accent-foreground"
          : "text-sidebar-muted-foreground hover:bg-accent/20 hover:text-primary"
      )}>
        <GradientIcon icon={item.icon || Shield} isActive={isActive} />
        {showText && <span className="whitespace-nowrap">{item.label}</span>}
      </div>
  );

  const linkWrapper = (
    <Link href={item.path || '#'}>
      {content}
    </Link>
  );

  if (isCollapsed && !isMobile) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{linkWrapper}</TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={10}>
                <p>{item.label}</p>
            </TooltipContent>
        </Tooltip>
    );
  }
  
  return linkWrapper;
};


export const SidebarFooter = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="p-4 border-t border-sidebar-border mt-auto">
      <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-end")}>
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className={cn(
              "h-9 w-9 text-sidebar-muted-foreground hover:bg-sidebar-muted-foreground/10 hover:text-sidebar-foreground transition-transform duration-300",
              isCollapsed && "rotate-180"
          )}
        >
          <ChevronsLeft className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
