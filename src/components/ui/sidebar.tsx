// src/components/ui/sidebar.tsx
'use client';

import * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown, ChevronLeftCircle, ChevronRightCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth-context";
import { getNavItemsForRole } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NavItem } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import { SidebarHeader } from "../layout/sidebar-header";
import { useTheme } from "next-themes";
import { Switch } from "./switch";
import { Label } from "./label";
import { GradientIcon } from "./gradient-icon";

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
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile);

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
    setIsCollapsed(isMobile);
  }, [isMobile]);


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
          "fixed top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ease-in-out shadow-xl",
          "bg-sidebar-background border-r border-sidebar-border",
          isMobile ? `w-72 ${mobileClasses}` : desktopClasses
        )}
      >
        {children}
      </aside>
    </>
  );
};

export const SidebarContent = () => {
  const { user } = useAuth();
  const { isCollapsed, activeItem } = useSidebar();
  const navItems = getNavItemsForRole(user?.role || 'STUDENT');
  
  const [openAccordion, setOpenAccordion] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    const activeSection = navItems.find(item => 
      item.children?.some(child => child.path && activeItem.startsWith(child.path))
    );
    if (activeSection) {
      setOpenAccordion(prev => [...new Set([...prev, activeSection.id])]);
    }
  }, [activeItem, navItems]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 thin-scrollbar">
        {navItems.map((item) => {
          if (item.children && item.children.length > 0) {
            return (
              <Accordion 
                key={item.id} 
                type="multiple" 
                value={openAccordion} 
                onValueChange={setOpenAccordion}
                className="w-full"
              >
                <AccordionItem value={item.id} className="border-b-0">
                  <AccordionTrigger asChild>
                     <SidebarSectionHeader item={item} />
                  </AccordionTrigger>
                  <AccordionContent className={cn("pl-6", isCollapsed && "hidden")}>
                    <div className="space-y-1 mt-1 border-l-2 border-sidebar-border/50">
                        {item.children.map(child => <SidebarMenuItem key={child.id} item={child} />)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          }
          return <SidebarMenuItem key={item.id} item={item} />;
        })}
      </div>
    </TooltipProvider>
  );
};

const SidebarSectionHeader = ({ item }: { item: NavItem }) => {
    const { isCollapsed, activeItem } = useSidebar();
    
    const isActive = useMemo(() => {
      return item.children?.some(child => child.path && activeItem.startsWith(child.path)) || false;
    }, [activeItem, item.children]);

    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex justify-center items-center h-12 w-12 rounded-lg">
                        <GradientIcon icon={item.icon} isActive={isActive} />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" sideOffset={10}>
                    <p>{item.label}</p>
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
      <div className={cn(
          "flex items-center justify-between w-full p-3 rounded-lg transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-hover text-sidebar-muted-foreground"
      )}>
        <div className="flex items-center gap-3">
          <GradientIcon icon={item.icon} isActive={isActive}/>
          <span className={cn(
              "text-base font-semibold whitespace-nowrap",
              isActive ? "text-sidebar-accent-foreground" : "group-hover:text-sidebar-foreground"
          )}>{item.label}</span>
        </div>
      </div>
    );
};


const SidebarMenuItem = ({ item }: { item: NavItem }) => {
  const { activeItem, isCollapsed } = useSidebar();
  
  const isActive = useMemo(() => {
    if (!activeItem || !item.path) return false;
    // La condición para el dashboard debe ser exacta para no activarse en otras rutas.
    if (item.path === '/dashboard') return activeItem === '/dashboard';
    return activeItem.startsWith(item.path);
  }, [activeItem, item.path]);

  const linkContent = (
      <div className={cn(
        "flex items-center gap-3 rounded-lg transition-all duration-300 font-medium group/menu-item relative",
        isCollapsed ? "justify-center h-12 w-12" : "p-3",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow"
          : "text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground"
      )}>
        <GradientIcon icon={item.icon} isActive={isActive} />
        {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
      </div>
  );

  const linkWrapper = (
    <Link href={item.path || '#'}>
      {linkContent}
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
    const { logout } = useAuth();
    const { isCollapsed, toggleSidebar, isMobile } = useSidebar();
    const { theme, setTheme } = useTheme();

    if (isMobile) return null;

    return (
        <div className="p-3 border-t border-sidebar-border flex flex-col gap-2">
             {!isCollapsed && (
                <div className="flex items-center justify-between px-3 py-2">
                     <Label htmlFor="theme-toggle" className="text-sidebar-muted-foreground text-sm">Modo Oscuro</Label>
                     <Switch 
                        id="theme-toggle"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                     />
                </div>
             )}
            <Button
                onClick={logout}
                variant="ghost"
                className={cn(
                    "w-full text-sidebar-muted-foreground hover:bg-red-500/20 hover:text-red-400",
                    isCollapsed ? 'justify-center p-0 h-10' : 'justify-start gap-3 p-3'
                )}
            >
                <LogOut className="h-5 w-5" />
                {!isCollapsed && <span className="font-semibold">Cerrar Sesión</span>}
            </Button>
            <Button
                onClick={toggleSidebar}
                variant="ghost"
                size="icon"
                className="w-full h-10 text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-white"
            >
                {isCollapsed ? <ChevronRightCircle className="h-6 w-6"/> : <ChevronLeftCircle className="h-6 w-6"/>}
            </Button>
        </div>
    )
}
