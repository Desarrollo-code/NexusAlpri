
'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { cn } from '@/lib/utils';
import { getNavItemsForRole } from '@/lib/nav-items';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronsRight, LogOut, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import type { NavItem } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';

const NavItemComponent = ({ item, activeItem, onItemClick }: { item: NavItem, activeItem: string, onItemClick: (item: NavItem) => void }) => {
    const hasChildren = item.children && item.children.length > 0;
    
    if (hasChildren) {
      return (
          <SidebarMenuButton
              onClick={() => onItemClick(item)}
              isActive={activeItem.startsWith(item.path || '---')}
              tooltip={{ children: item.label }}
          >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="sidebar-text flex-1 text-left font-medium">{item.label}</span>
          </SidebarMenuButton>
      )
    }
  
    return (
         <SidebarMenuButton
           asChild={!!item.path}
           onClick={() => onItemClick(item)}
           isActive={activeItem.startsWith(item.path || '---')}
           tooltip={{ children: item.label }}
         >
           {item.path ? (
             <Link href={item.path}>
               <item.icon className="h-5 w-5 flex-shrink-0" />
               <span className="sidebar-text flex-1 text-left font-medium">{item.label}</span>
               {item.badge && <Badge className="sidebar-text bg-blue-500 text-white">{item.badge}</Badge>}
             </Link>
           ) : (
             <>
               <item.icon className="h-5 w-5 flex-shrink-0" />
               <span className="sidebar-text flex-1 text-left font-medium">{item.label}</span>
               {item.badge && <Badge className="sidebar-text bg-blue-500 text-white">{item.badge}</Badge>}
             </>
           )}
         </SidebarMenuButton>
    );
};

function AppSidebar({ user, logout }: { user: any, logout: () => void }) {
    const { state, toggleSidebar, activeItem, setActiveItem, setOpenMobile } = useSidebar();
    const navItems = React.useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);
    const pathname = usePathname();
    const isMobile = useIsMobile();
    
    React.useEffect(() => {
        if (pathname) {
            setActiveItem(pathname);
        }
    }, [pathname, setActiveItem]);
    
    const handleItemClick = (item: NavItem) => {
        if (item.path) {
            setActiveItem(item.path);
            if (isMobile) {
                setOpenMobile(false); 
            }
        }
    };
    
    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                       <Image src="/uploads/images/logo-letter.png" alt="NexusAlpri Logo" width={24} height={24} data-ai-hint="logo letter" />
                    </div>
                    <span className="sidebar-text text-white text-xl font-bold">NexusAlpri</span>
                </div>
               <Button
                variant="ghost"
                size="icon"
                className="sidebar-text h-9 w-9 text-gray-400 hover:text-white"
                onClick={toggleSidebar}
               >
                 <ChevronsRight className={cn("h-5 w-5 transition-transform", state === "expanded" && "rotate-180")} />
               </Button>
            </SidebarHeader>
             <div className="p-4 sidebar-text">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                     type="text"
                     placeholder="Buscar..."
                     className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 h-9"
                   />
                 </div>
              </div>
            
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map((item) => (
                       <SidebarMenuItem key={item.id}>
                          <NavItemComponent item={item} activeItem={activeItem} onItemClick={handleItemClick}/>
                       </SidebarMenuItem>
                     ))}
                 </SidebarMenu>
            </SidebarContent>
            
            <SidebarFooter>
                <div className="sidebar-text flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg">
                     <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-semibold">
                            {user?.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                     </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-gray-400 text-xs capitalize truncate">{user?.role.toLowerCase()}</p>
                  </div>
                </div>
                <SidebarMenuButton
                    onClick={logout}
                    className="w-full text-red-300 hover:text-red-200 hover:bg-red-900/20"
                    tooltip={{ children: 'Cerrar Sesión' }}
                >
                    <LogOut className="h-5 w-5" />
                    <span className="sidebar-text font-medium">Cerrar Sesión</span>
                </SidebarMenuButton>
            </SidebarFooter>
        </Sidebar>
    );
}

function MainContent({ children }: { children: React.ReactNode }) {
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    return (
        <div className={cn("flex flex-col flex-1 overflow-hidden transition-[margin-left] duration-300", 
             isMobile ? "ml-0" : state === 'expanded' ? "lg:ml-72" : "lg:ml-20"
        )}>
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted/30 dark:bg-gray-900/80">
        <AppSidebar user={user} logout={logout} />
        <MainContent>
          {children}
        </MainContent>
      </div>
    </SidebarProvider>
  );
}
