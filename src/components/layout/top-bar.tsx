
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserAvatarDropdown } from './user-avatar-dropdown';
import { usePathname } from 'next/navigation';
import { getNavItemsForRole } from '@/lib/nav-items';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole, NavItem } from '@/types'; 
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Notification as AppNotification } from '@/types'; 

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  
  const userAppRole = user?.role;
  const navItemsRaw = user ? getNavItemsForRole(userAppRole || 'STUDENT') : [];
  const allNavItems = navItemsRaw.flatMap(item => (item.subItems ? [item, ...item.subItems] : [item]));
  
  const getPageTitle = () => {
    const currentNavItem = allNavItems
      .slice()
      .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))
      .find(item => item.href && item.href !== '#' && pathname.startsWith(item.href));
      
    if (pathname === '/dashboard') return 'Panel Principal';
    if (pathname.startsWith('/courses/')) return 'Detalle del Curso';
    if (pathname.startsWith('/manage-courses/')) return 'Gestión de Curso';

    return currentNavItem?.label || 'NexusAlpri'; 
  };
  
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) { 
        setIsLoadingNotifications(false);
        setNotifications([]);
        return;
    }
    setIsLoadingNotifications(true);
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' }); 
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data: AppNotification[] = await response.json();
      setNotifications(data);
    } catch (err) {
      setNotifications([]); 
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.id]); 

  useEffect(() => {
    if (user) { 
        fetchNotifications();
    }
  }, [fetchNotifications, user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="hidden sm:block text-xl font-semibold font-headline truncate">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="relative h-9 w-9">
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && !isLoadingNotifications && (
                <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notificaciones</span>
            </Link>
          </Button>
          <UserAvatarDropdown />
        </div>
      </header>
    </>
  );
}
