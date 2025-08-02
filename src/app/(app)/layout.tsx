// src/app/(app)/layout.tsx
'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { getNavItemsForRole } from '@/lib/nav-items';
import type { UserRole, NavItem } from '@/types';
import Link from 'next/link';
import { LogOut, Loader2, ChevronsRight, Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';


function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, settings, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const { state, toggleSidebar, activeItem, setActiveItem, isMobileOpen, setIsMobileOpen } = useSidebar();

    // --- Idle Timeout Logic ---
    const handleIdleLogout = useCallback(() => {
        if (user) {
            logout();
            toast({
                title: "Sesión Expirada",
                description: "Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión de nuevo.",
                variant: "destructive"
            });
        }
    }, [logout, toast, user]);

    const idleTimeoutMinutes = settings?.idleTimeoutMinutes || 20;
    const isIdleTimeoutEnabled = settings?.enableIdleTimeout ?? true;

    useIdleTimeout(handleIdleLogout, idleTimeoutMinutes, isIdleTimeoutEnabled);

    // --- Navigation Logic ---
    const navItems = useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);

    useEffect(() => {
        if (pathname) {
            setActiveItem(pathname);
        }
    }, [pathname, setActiveItem]);


    // --- Loading and Auth Check ---
     useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/sign-in');
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleItemClick = (item: NavItem) => {
        if (item.path) {
          setActiveItem(item.path);
          setIsMobileOpen(false); 
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900/80">
            <Sidebar>
                <SidebarHeader>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">N</span>
                        </div>
                        {state === 'expanded' && (
                          <span className="text-white text-xl font-bold">NexusAlpri</span>
                        )}
                      </div>
                     <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-400 hover:text-white"
                      onClick={toggleSidebar}
                    >
                      <ChevronsRight className={cn("h-5 w-5 transition-transform", state === "expanded" && "rotate-180")} />
                    </Button>
                </SidebarHeader>

                {state === 'expanded' && (
                  <div className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 h-9"
                      />
                    </div>
                  </div>
                )}
                
                <SidebarContent>
                     <SidebarMenu>
                        {navItems.map((item) => (
                           <SidebarMenuItem key={item.id}>
                             {item.children ? (
                               <NavGroup
                                 item={item}
                                 isCollapsed={state === 'collapsed'}
                                 activeItem={activeItem}
                                 onItemClick={handleItemClick}
                               />
                             ) : (
                               <NavItem
                                 item={item}
                                 isActive={item.path === activeItem}
                                 onClick={handleItemClick}
                                 isCollapsed={state === 'collapsed'}
                               />
                             )}
                           </SidebarMenuItem>
                         ))}
                    </SidebarMenu>
                </SidebarContent>
                
                <SidebarFooter>
                    {state === 'expanded' && user && (
                        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg">
                             <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-semibold">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-white text-sm font-medium truncate">{user.name}</p>
                            <p className="text-gray-400 text-xs truncate">{user.role}</p>
                          </div>
                        </div>
                     )}
                    <button
                        onClick={logout}
                        className={cn(`w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded-lg transition-colors`,
                        state === 'collapsed' && 'justify-center')}
                    >
                        <LogOut className="h-5 w-5" />
                        {state === 'expanded' && <span className="font-medium">Cerrar Sesión</span>}
                    </button>
                </SidebarFooter>
            </Sidebar>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                  {children}
                </main>
            </div>
        </div>
    )
}

const NavItem = ({ item, isActive, onClick, isCollapsed }: { item: NavItem, isActive: boolean, onClick: (item: NavItem) => void, isCollapsed: boolean }) => {
  const Icon = item.icon;
  return (
    <Button
      onClick={() => onClick(item)}
      variant={isActive ? 'default' : 'ghost'}
      className={cn(
        "w-full flex items-center gap-3 py-3 h-auto transition-all duration-200",
        isActive 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white',
        isCollapsed ? 'justify-center px-2' : 'justify-start px-4'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left font-medium">{item.label}</span>
          {item.badge && <Badge className="bg-blue-500 text-white">{item.badge}</Badge>}
        </>
      )}
    </Button>
  );
};


const NavGroup = ({ item, isCollapsed, activeItem, onItemClick }: { item: NavItem, isCollapsed: boolean, activeItem: string, onItemClick: (item: NavItem) => void }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = item.icon;
  const { user } = useAuth();
  
  const hasActiveChild = useMemo(() => item.children?.some(child => child.path === activeItem), [item.children, activeItem]);

  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {item.children?.filter(child => child.roles.includes(user?.role || 'STUDENT')).map(child => (
          <NavItem
            key={child.id}
            item={child}
            isActive={child.path === activeItem}
            onClick={onItemClick}
            isCollapsed={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
          hasActiveChild ? 'bg-gray-700 text-blue-300' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1 text-left font-medium">{item.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="ml-4 pl-2 border-l border-gray-600 space-y-1">
          {item.children?.filter(child => child.roles.includes(user?.role || 'STUDENT')).map(child => (
            <NavItem
              key={child.id}
              item={child}
              isActive={child.path === activeItem}
              onClick={onItemClick}
              isCollapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </SidebarProvider>
    );
}