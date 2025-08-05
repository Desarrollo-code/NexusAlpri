// Sidebar-layout-enhanced 🌈 Creativo & juvenil
// Estilo visual mejorado: colores vivos, tipografía amigable, gradientes y transiciones suaves

'use client';

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Shield, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth-context";
import { getNavItemsForRole } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { GradientIcon } from "./gradient-icon";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


const SidebarContext = React.createContext<any>(null);

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = React.useState(pathname);
  const [isOpen, setIsOpen] = React.useState(true);
  const [openMobile, setOpenMobile] = React.useState(false);

  React.useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
      ?.split('=')[1];
    setIsOpen(cookieValue !== undefined ? cookieValue === 'true' : true);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(prev => !prev);
    } else {
      const newState = !isOpen;
      setIsOpen(newState);
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${newState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }
  };

  React.useEffect(() => {
    if (pathname) setActiveItem(pathname);
  }, [pathname]);

  const value = {
    state: isOpen ? 'expanded' : 'collapsed',
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
    activeItem,
  };

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();
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
          "fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out border-r backdrop-blur-xl shadow-xl",
          "bg-gradient-to-b from-sidebar-gradient-from to-sidebar-gradient-to text-sidebar-foreground",
          isMobile ?
            `w-72 ${openMobile ? 'translate-x-0' : '-translate-x-full'}` :
            `${state === 'expanded' ? 'w-72' : 'w-20'}`
        )}
      >
        {children}
      </aside>
    </>
  );
};

export const SidebarHeader = () => {
  const { state } = useSidebar();
  return (
    <div className={cn(
        "flex items-center h-16 px-4 border-b border-sidebar-border",
        state === 'expanded' ? 'justify-between' : 'justify-center'
    )}>
      <Link href="/dashboard" className={cn("flex items-center gap-2 overflow-hidden", state === 'collapsed' && 'w-10')}>
        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shadow-inner flex-shrink-0">
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={50} height={50} />
        </div>
        {state === 'expanded' && (
          <span className="text-xl font-bold font-headline-alt tracking-wide whitespace-nowrap">NexusAlpri</span>
        )}
      </Link>
    </div>
  );
};

export const SidebarContent = () => {
  const { user } = useAuth();
  const navItems = getNavItemsForRole(user?.role || 'STUDENT');

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.id} item={item} />
      ))}
    </div>
  );
};

const SidebarMenuItem = ({ item }: { item: NavItem }) => {
  const { state, activeItem } = useSidebar();
  const hasChildren = item.children && item.children.length > 0;
  
  const isActive = useMemo(() => {
    if (!activeItem || !item.path) return false;
    if (hasChildren) {
        // Parent is active if any child is active
        return item.children.some(child => child.path && activeItem.startsWith(child.path));
    }
    return activeItem.startsWith(item.path);
  }, [activeItem, item, hasChildren]);

  if (hasChildren) {
    return (
      <Collapsible defaultOpen={isActive}>
        <CollapsibleTrigger className={cn(
            "flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium",
            "hover:bg-sidebar-active-background text-sidebar-foreground/90",
            state === 'collapsed' && 'justify-center',
             isActive && "bg-sidebar-active-background text-sidebar-accent-foreground"
        )}>
           <GradientIcon icon={item.icon || Shield} isActive={isActive} color={item.color}/>
           {state === 'expanded' && <span className="flex-1 text-left">{item.label}</span>}
           {state === 'expanded' && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [&[data-state=open]]:-rotate-180" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="py-1 pl-8 pr-2 space-y-1">
          {item.children.map(child => {
            const isChildActive = child.path && activeItem.startsWith(child.path);
            return (
              <Link
                key={child.id}
                href={child.path || '#'}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 text-sm",
                  isChildActive ? "text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground"
                )}
              >
                <GradientIcon icon={child.icon || Shield} isActive={isChildActive} size="sm" />
                <span>{child.label}</span>
              </Link>
            )
          })}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  const menuItemContent = (
    <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium group/menu-item",
        isActive ? "bg-sidebar-active-background text-sidebar-accent-foreground shadow-md" : "hover:bg-sidebar-active-background text-sidebar-foreground/90",
        state === 'collapsed' && 'justify-center'
    )}>
        <GradientIcon icon={item.icon || Shield} isActive={isActive} />
        {state === 'expanded' && <span className="whitespace-nowrap">{item.label}</span>}
    </div>
  );

  return (
    <Link href={item.path || '#'}>
      {state === 'collapsed' ? (
          <Tooltip>
              <TooltipTrigger asChild>{menuItemContent}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
          </Tooltip>
      ) : menuItemContent}
    </Link>
  );
};


export const SidebarFooter = () => {
  const { user, logout } = useAuth();
  const { state } = useSidebar();

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 border-t border-sidebar-border mt-auto bg-black/20">
      <div className={cn("flex items-center", state === 'expanded' ? 'gap-3' : 'justify-center')}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user?.avatar || ''} alt={user?.name || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        {state === 'expanded' && (
          <div className="flex-1 overflow-hidden">
            <p className="text-sm truncate font-semibold">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/80 capitalize truncate">{user?.role?.toLowerCase()}</p>
          </div>
        )}
      </div>
      <Separator className="my-3 bg-sidebar-border" />
      <div className="flex justify-between items-center">
        {state === 'expanded' && (
          <Button onClick={logout} variant="ghost" className="text-sidebar-foreground/80 hover:text-destructive w-full justify-start p-2 h-auto text-sm">
            Cerrar sesión
          </Button>
        )}
        <SidebarToggle />
      </div>
    </div>
  );
};

export const SidebarToggle = () => {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button 
      onClick={toggleSidebar} 
      variant="ghost" 
      size="icon" 
      className={cn(
          "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
          state === 'collapsed' && 'w-full'
      )}>
      {state === 'expanded' ? <ChevronsLeft /> : <ChevronsRight />}
    </Button>
  );
};
