
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
  
  // En móvil, la barra nunca está colapsada, solo abierta o cerrada.
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
    isCollapsed: finalIsCollapsed, // Usar el estado final calculado
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
          "fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out backdrop-blur-xl shadow-xl",
          "bg-[linear-gradient(to_bottom,hsl(var(--sidebar-gradient-from)),hsl(var(--sidebar-gradient-to)))]",
          "text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))]",
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
  return (
    <div className={cn(
      "flex items-center h-20 px-4 border-b border-[hsl(var(--sidebar-border))]",
      isCollapsed ? 'justify-center' : 'justify-between'
    )}>
      <Link href="/dashboard" className={cn("flex items-center gap-2 overflow-hidden")}>
        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shadow-inner flex-shrink-0">
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={50} height={50} data-ai-hint="logo" />
        </div>
        <span className={cn("text-xl font-bold font-headline-alt tracking-wide whitespace-nowrap text-[hsl(var(--sidebar-foreground))] transition-opacity duration-300", isCollapsed ? 'opacity-0 w-0' : 'opacity-100')}>
            NexusAlpri
        </span>
      </Link>
    </div>
  );
};

export const SidebarContent = () => {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
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
            "px-4 text-xs font-semibold uppercase text-[hsl(var(--sidebar-foreground))]/60 tracking-wider transition-all duration-300",
            isCollapsed && "text-center"
        )}>
            {label}
        </h2>
    );
};


const SidebarMenuItem = ({ item }: { item: NavItem }) => {
  const { activeItem, isCollapsed } = useSidebar();

  const isActive = useMemo(() => {
    if (!activeItem || !item.path) return false;
    return activeItem === item.path || (activeItem.startsWith(item.path) && item.path !== '/');
  }, [activeItem, item.path]);
  
  const content = (
      <div className={cn(
        "flex items-center gap-3 py-3 rounded-lg transition-all duration-200 font-medium group/menu-item",
        isCollapsed ? "justify-center px-0" : "px-4",
        isActive
          ? "bg-[hsl(var(--sidebar-active-background))] text-[hsl(var(--sidebar-accent-foreground))] shadow-md"
          : "text-[hsl(var(--sidebar-foreground))]/90 hover:bg-[hsl(var(--sidebar-active-background))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
      )}>
        <GradientIcon icon={item.icon || Shield} isActive={isActive} color={item.color} />
        <span className={cn("whitespace-nowrap transition-opacity duration-200", isCollapsed && "opacity-0 w-0 h-0")}>{item.label}</span>
      </div>
  );

  const linkWrapper = (
    <Link href={item.path || '#'}>
      {content}
    </Link>
  );

  if (isCollapsed) {
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
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 border-t border-[hsl(var(--sidebar-border))] mt-auto bg-black/20 text-[hsl(var(--sidebar-foreground))]">
      <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user?.avatar || ''} alt={user?.name || ''} data-ai-hint="user avatar" />
          <AvatarFallback className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className={cn("flex-1 overflow-hidden transition-all duration-200", isCollapsed && "w-0 opacity-0")}>
            <p className="text-sm truncate font-semibold">{user?.name}</p>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))]/80 capitalize truncate">{user?.role?.toLowerCase()}</p>
        </div>
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className={cn("text-[hsl(var(--sidebar-foreground))]/80 hover:bg-white/10", isCollapsed && "rotate-180")}
        >
          <ChevronsLeft />
        </Button>
      </div>
    </div>
  );
};
