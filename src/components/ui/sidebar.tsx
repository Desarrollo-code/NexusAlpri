// src/components/ui/sidebar.tsx
'use client';

import * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeftCircle, ChevronRightCircle } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

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
          className="lg:hidden fixed inset-0 bg-primary/10 z-40"
          onClick={() => setOpenMobile(false)}
        />
      )}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? (openMobile ? 288 : 0) : (isCollapsed ? 80 : 288),
          x: isMobile ? (openMobile ? 0 : -288) : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-0 left-0 z-50 h-screen flex flex-col border-r border-sidebar-border/30 shadow-2xl",
          isMobile ? (openMobile ? "bg-white text-foreground" : "invisible lg:visible") : "bg-sidebar-background/60 backdrop-blur-xl",
        )}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
          {children}
        </div>
      </motion.aside>
    </>
  );
};


const SidebarMenuItem = ({ item }: { item: NavItem }) => {
  const { activeItem, isCollapsed, isMobile } = useSidebar();

  const forceCenteredIds = new Set(['dashboard', 'competition']);

  const isActive = useMemo(() => {
    if (!activeItem || !item.path) return false;
    if (item.path === '/dashboard') return activeItem === '/dashboard';
    return activeItem.startsWith(item.path);
  }, [activeItem, item.path]);

  const linkContent = (
    <div className={cn(
      "flex items-center rounded-xl transition-all duration-300 font-semibold group/menu-item relative overflow-hidden",
      isCollapsed ? (forceCenteredIds.has(item.id) ? "justify-center h-12 w-12 gap-0" : "justify-center h-12 w-12 gap-0") : "pl-6 pr-3 py-3 mx-0 gap-3",
      isActive
        ? (isMobile ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary")
        : (isMobile ? "text-foreground/80" : "text-sidebar-muted-foreground hover:bg-primary/5 hover:text-primary")
    )}>
      {isActive && !isCollapsed && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <div className={cn(
        "flex items-center justify-center transition-transform duration-300 group-hover/menu-item:scale-110",
        isCollapsed ? "w-12 h-12 flex-shrink-0 items-center justify-center" : "w-10 flex-shrink-0 items-center justify-center",
        // Reset any horizontal margin/padding for specific ids to ensure perfect centering
        isCollapsed && forceCenteredIds.has(item.id) ? "mx-0 p-0" : "",
        isActive && "scale-110"
      )}>
        <GradientIcon icon={item.icon} isActive={isActive} />
      </div>
      {!isCollapsed && (
        <span className={cn(
          "whitespace-nowrap transition-colors duration-300",
          isActive ? "text-primary" : "group-hover/menu-item:text-primary"
        )}>
          {item.label}
        </span>
      )}
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
        <TooltipTrigger asChild>
          <div className="w-full flex items-center justify-center">{linkWrapper}</div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={10}>
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkWrapper;
};

const SidebarSectionHeader = ({ item, isActive }: { item: NavItem, isActive: boolean }) => {
  const { isCollapsed, isMobile } = useSidebar();

  const shiftedParentIds = new Set(["dashboard", "competition", "communications", "learning", "organization", "admin"]);

  const headerContent = (
    <div className={cn(
      "flex items-center w-full rounded-xl transition-all duration-300 group",
      isCollapsed ? 'h-12 w-12 justify-center mx-0 gap-0' : 'pl-6 pr-3 py-3 mx-0 justify-between',
      isActive ? (isMobile ? "bg-primary/10 text-primary" : "bg-primary/5 text-primary") : (isMobile ? "text-foreground/80" : "hover:bg-primary/5 text-sidebar-muted-foreground hover:text-primary")
    )}>
      <div className={cn(
        "flex items-center",
        isCollapsed ? "gap-0 justify-center" : "gap-3"
      )}>
        <div className={cn(
          "transition-transform duration-300 group-hover:scale-110",
          isCollapsed
            ? "w-12 h-12 flex-shrink-0 flex items-center justify-center"
            : "w-10 flex-shrink-0 flex items-center justify-center",
          isActive && "scale-110"
        )}>
          <GradientIcon icon={item.icon} isActive={isActive} />
        </div>
        {!isCollapsed && <span className="text-base font-semibold whitespace-nowrap">{item.label}</span>}
      </div>
      {!isCollapsed && <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-300 text-inherit", "group-data-[state=open]:rotate-180")} />}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full flex items-center justify-center">{headerContent}</div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={10}>
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AccordionTrigger className="hover:no-underline p-0 w-full">
      {headerContent}
    </AccordionTrigger>
  );
};

const SectionItem = ({ item }: { item: NavItem }) => {
  const { isCollapsed, activeItem } = useSidebar();
  const [openAccordion, setOpenAccordion] = React.useState<string[]>([]);

  const isActive = useMemo(() => item.children?.some(child => child.path && activeItem.startsWith(child.path)) || false, [activeItem, item.children]);

  React.useEffect(() => {
    if (isActive) {
      setOpenAccordion(prev => [...new Set([...prev, item.id])]);
    }
  }, [isActive, item.id]);

  if (isCollapsed) {
    return (
      <div>
        <SidebarSectionHeader item={item} isActive={isActive} />
        {isActive && (
          <div className="mt-1 flex flex-col items-center">
            {item.children?.map(child => (
              <SidebarMenuItem key={child.id} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion} className="w-full">
      <AccordionItem value={item.id} className="border-b-0">
        <SidebarSectionHeader item={item} isActive={isActive} />
        <AccordionContent className="pl-6 pt-0 pb-0">
          <div className="space-y-1 mt-1 border-l-2 border-[hsl(var(--sidebar-muted-foreground))]/30">
            {item.children?.map(child => <SidebarMenuItem key={child.id} item={child} />)}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};


export const SidebarContent = () => {
  const { user } = useAuth();
  const navItems = getNavItemsForRole(user?.role || 'STUDENT');

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-1 space-y-2 thin-scrollbar">
        {navItems.map((item) => {
          if (item.children && item.children.length > 0) {
            return <SectionItem key={item.id} item={item} />;
          }
          return <SidebarMenuItem key={item.id} item={item} />;
        })}
      </div>
    </TooltipProvider>
  );
};


export const SidebarFooter = () => {
  const { settings } = useAuth();
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();

  if (isMobile) return null;

  return (
    <div className="p-4 flex flex-col gap-3 bg-white/5 backdrop-blur-sm border-t border-sidebar-border/20 z-10 transition-all duration-300">
      {!isCollapsed && settings?.projectVersion && (
        <div className="px-3 py-1 text-center text-[12px] lowercase tracking-widest text-sidebar-muted-foreground/60 font-medium">
          versión {settings.projectVersion}
        </div>
      )}
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className={cn(
          "w-full h-10 text-sidebar-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors duration-300 rounded-lg",
          isCollapsed ? "h-12 w-12 mx-auto" : ""
        )}
      >
        {isCollapsed ? <ChevronRightCircle className="h-6 w-6" /> : <ChevronLeftCircle className="h-6 w-6" />}
      </Button>
    </div>
  )
}
