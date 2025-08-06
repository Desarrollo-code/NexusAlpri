
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

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(prev => !prev);
    }
    // No action on desktop as it's always expanded
  };

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
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
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
          "fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out backdrop-blur-xl shadow-xl",
          "bg-[linear-gradient(to_bottom,hsl(var(--sidebar-gradient-from)),hsl(var(--sidebar-gradient-to)))]",
          "text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))]",
          isMobile ? `w-72 ${openMobile ? 'translate-x-0' : '-translate-x-full'}` :
            `w-72` // Always expanded on desktop
        )}
      >
        {children}
      </aside>
    </>
  );
};

export const SidebarHeader = () => {
  return (
    <div className={cn(
      "flex items-center h-20 px-4 border-b border-[hsl(var(--sidebar-border))]",
      'justify-between'
    )}>
      <Link href="/dashboard" className={cn("flex items-center gap-2 overflow-hidden")}>
        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shadow-inner flex-shrink-0">
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={50} height={50} data-ai-hint="logo" />
        </div>
        <span className="text-xl font-bold font-headline-alt tracking-wide whitespace-nowrap text-[hsl(var(--sidebar-foreground))]">
            NexusAlpri
        </span>
      </Link>
    </div>
  );
};

export const SidebarContent = () => {
  const { user } = useAuth();
  const navItems = getNavItemsForRole(user?.role || 'STUDENT');

  return (
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
  );
};

const SidebarSectionHeader = ({ label }: { label: string }) => {
  return <h2 className="px-4 text-xs font-semibold uppercase text-[hsl(var(--sidebar-foreground))]/60 tracking-wider">{label}</h2>;
};

const SidebarMenuItem = ({ item }: { item: NavItem }) => {
  const { activeItem } = useSidebar();

  const isActive = useMemo(() => {
    if (!activeItem || !item.path) return false;
    return activeItem === item.path || (activeItem.startsWith(item.path) && item.path !== '/');
  }, [activeItem, item.path]);

  const menuItemContent = (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium group/menu-item",
      isActive
        ? "bg-[hsl(var(--sidebar-active-background))] text-[hsl(var(--sidebar-accent-foreground))] shadow-md"
        : "text-[hsl(var(--sidebar-foreground))]/90 hover:bg-[hsl(var(--sidebar-active-background))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
    )}>
      <GradientIcon icon={item.icon || Shield} isActive={isActive} color={item.color} />
      <span className="whitespace-nowrap">{item.label}</span>
    </div>
  );

  if (!item.path) {
    return <div className="cursor-not-allowed">{menuItemContent}</div>;
  }

  return (
    <Link href={item.path}>
        {menuItemContent}
    </Link>
  );
};

export const SidebarFooter = () => {
  const { user, logout } = useAuth();

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
      <div className={cn("flex items-center gap-3")}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user?.avatar || ''} alt={user?.name || ''} data-ai-hint="user avatar" />
          <AvatarFallback className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
            <p className="text-sm truncate font-semibold">{user?.name}</p>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))]/80 capitalize truncate">{user?.role?.toLowerCase()}</p>
        </div>
      </div>
      <>
        <Separator className="my-3 bg-[hsl(var(--sidebar-border))]" />
        <Button
          onClick={logout}
          variant="ghost"
          className="text-[hsl(var(--sidebar-foreground))]/80 hover:text-[hsl(var(--destructive))] w-full justify-start p-2 h-auto text-sm"
        >
          Cerrar sesión
        </Button>
      </>
    </div>
  );
};
