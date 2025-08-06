
'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types'; 
import { Bell, ChevronDown, Menu, User as UserIcon, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getNavItemsForRole } from '@/lib/nav-items';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Monitor, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';


function ThemeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-1">Tema</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Oscuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>Sistema</span>
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
}


export function TopBar() {
  const { user, logout } = useAuth();
  const { toggleSidebar, activeItem } = useSidebar();
  
  const navItems = useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);

  const getPageTitle = () => {
    const allNavItems = navItems.flatMap(item => (item.children ? [item, ...item.children] : [item]));
    const currentItem = allNavItems.find(item => item.path && activeItem.startsWith(item.path));
    return currentItem?.label || 'Panel Principal';
  };
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
   <div className={cn(
       "h-20 bg-card/80 backdrop-blur-lg border-b",
       "flex items-center justify-between px-4 lg:px-6 flex-shrink-0"
    )}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-foreground hover:bg-muted"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div>
          <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 text-foreground hover:bg-muted" aria-label="Ver notificaciones">
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-destructive border-2 border-background"></span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                 <div className="p-4 text-sm text-center text-muted-foreground">
                    No hay notificaciones nuevas.
                 </div>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="flex items-center gap-3 h-auto p-1.5 rounded-full text-foreground hover:bg-muted" aria-label="Abrir menú de usuario">
                     <Avatar className="h-9 w-9 border-2 border-border">
                        <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Avatar de usuario'} />
                        <AvatarFallback>
                            {getInitials(user?.name || '')}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline font-medium">{user?.name}</span>
                    <ChevronDown className="h-4 w-4 hidden md:inline" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                    </Link>
                </DropdownMenuItem>
                 <ThemeToggle />
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
