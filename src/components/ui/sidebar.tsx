// Sidebar-layout-enhanced 🌈 Creativo & juvenil
// Estilo visual mejorado: colores vivos, tipografía amigable, gradientes y transiciones suaves

'use client';

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth-context";
import { getNavItemsForRole } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { GradientIcon } from "./gradient-icon";

const SidebarContext = React.createContext(null);
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

const SidebarProvider = ({ children }) => {
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

const Sidebar = ({ children }) => {
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
          isMobile ?
            `w-72 bg-bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600
 text-white ${openMobile ? 'translate-x-0' : '-translate-x-full'}` :
            `text-white bg-gradient-to-br  from-emerald-400 via-teal-500 to-indigo-600
 ${state === 'expanded' ? 'w-72' : 'w-20'}`
        )}
      >
        {children}
      </aside>
    </>
  );
};

const SidebarHeader = () => {
  const { state } = useSidebar();
  return (
    <div className="flex items-center justify-between h-16 px-4 border-b border-white/20 bg-white/10 backdrop-blur-sm">
      <Link href="/dashboard" className="flex items-center gap-1">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={50} height={50} />
        </div>
        {state === 'expanded' && (
          <span className="text-xl font-bold font-sans tracking-wide">NexusAlpri</span>
        )}
      </Link>
    </div>
  );
};

const SidebarContent = () => {
  const { user } = useAuth();
  const navItems = getNavItemsForRole(user?.role || 'STUDENT');
  const { state, activeItem } = useSidebar();

  return (
    <div className="flex-1 overflow-auto py-4 px-3 space-y-2">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.id} item={item} isActive={activeItem.startsWith(item.path || '')} />
      ))}
    </div>
  );
};

const SidebarMenuItem = ({ item, isActive }) => {
  const { state } = useSidebar();
  return (
    <Link
      href={item.path || '#'}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium",
        isActive ? "bg-white/20 text-white shadow-md" : "hover:bg-white/10 text-white/90",
        state === 'collapsed' && 'justify-center'
      )}
    >
      <GradientIcon icon={item.icon || Shield} isActive={isActive} />
      {state === 'expanded' && <span>{item.label}</span>}
    </Link>
  );
};

const SidebarFooter = () => {
  const { user, logout } = useAuth();
  const { state } = useSidebar();

  const getInitials = (name) => {
    if (!name) return '??';
    const [first, last] = name.split(' ');
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="p-4 border-t border-white/20 mt-auto bg-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar || ''} alt={user.name} />
          <AvatarFallback className="bg-orange-600 text-white font-bold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        {state === 'expanded' && (
          <div className="flex-1 overflow-hidden">
            <p className="text-sm truncate font-semibold">{user.name}</p>
            <p className="text-xs text-white/80 capitalize truncate">{user.role.toLowerCase()}</p>
          </div>
        )}
      </div>
      <Separator className="my-3 bg-white/30" />
      <div className="flex justify-between items-center">
        {state === 'expanded' && (
          <Button onClick={logout} variant="ghost" className="text-white hover:text-red-300">
            Cerrar sesión
          </Button>
        )}
        <SidebarToggle />
      </div>
    </div>
  );
};

const SidebarToggle = () => {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button onClick={toggleSidebar} variant="ghost" size="icon" className="text-white hover:text-yellow-200">
      {state === 'expanded' ? <ChevronsLeft /> : <ChevronsRight />}
    </Button>
  );
};

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarToggle,
  useSidebar,
};
