

'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserAvatarDropdown } from './user-avatar-dropdown';
import { usePathname } from 'next/navigation';
import { getNavItemsForRole } from '@/lib/nav-items';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole, NavItem } from '@/types'; 
import { Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import type { Notification as AppNotification } from '@/types'; 
import { cn } from '@/lib/utils';


const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 0) return "En el futuro";
    if (seconds < 5) return "Ahora mismo";
    if (seconds < 60) return `Hace ${seconds} seg.`;

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min.`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Hace ${hours} hr${hours > 1 ? 's' : ''}.`;
    
    const days = Math.round(hours / 24);
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;

    const weeks = Math.round(days / 7);
    if (weeks < 5) return `Hace ${weeks} sem.`;

    const months = Math.round(days / 30.44); // Average days in month
    if (months < 12) return `Hace ${months} mes${months > 1 ? 'es' : ''}`;

    const years = Math.round(days / 365.25);
    return `Hace ${years} año${years > 1 ? 's' : ''}`;
};


const NotificationPopover = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) { 
        setIsLoading(false);
        setNotifications([]);
        return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' }); 
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data: AppNotification[] = await response.json();
      setNotifications(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      setNotifications([]); 
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); 

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  
  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  return (
    <Popover onOpenChange={(open) => { if(open) fetchNotifications()}}>
      <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-primary-foreground hover:bg-white/10">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && !isLoading && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive"></span>
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-none shadow-none">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : recentNotifications.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentNotifications.map(notif => (
                  <li key={notif.id}>
                    <Link href={notif.link || '#'} className={cn(
                      "block p-3 hover:bg-muted/50 transition-colors",
                      !notif.read && "bg-primary/5"
                    )}>
                      <div className="flex items-start gap-3">
                        {!notif.read && <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                        <div className="flex-grow">
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{timeSince(notif.date)}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones.</div>
            )}
          </CardContent>
          <CardFooter className="p-2 border-t">
              <Button asChild variant="link" size="sm" className="w-full text-primary">
                <Link href="/notifications">
                    Ver todas las notificaciones <ArrowRight className="ml-2 h-4 w-4"/>
                </Link>
              </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
};


export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const userAppRole = user?.role;
  const navItemsRaw = user ? getNavItemsForRole(userAppRole || 'STUDENT') : [];
  
  const getPageDetails = () => {
    const allNavItems = navItemsRaw.flatMap(item => (item.subItems ? [item, ...item.subItems] : [item]));
    
    const currentNavItem = allNavItems
      .slice()
      .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))
      .find(item => item.href && item.href !== '#' && pathname.startsWith(item.href));

    let title = currentNavItem?.label || 'NexusAlpri';
    
    if (pathname.startsWith('/dashboard')) {
        title = 'Panel Principal';
    } else if (pathname.startsWith('/courses/') && !pathname.endsWith('/courses')) {
        title = 'Detalle del Curso';
    } else if (pathname.startsWith('/manage-courses/') && !pathname.endsWith('/manage-courses')) {
        title = 'Gestión de Curso';
    } else if (pathname.startsWith('/profile')) {
        title = 'Mi Perfil';
    }
    
    return title;
  };
  
  const pageTitle = getPageDetails();
  
  return (
      <header className={cn(
          "topbar-gradient sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 text-primary-foreground md:px-6",
      )}>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden text-primary-foreground hover:bg-white/10" />
          <h1 className="hidden sm:block text-xl font-semibold font-headline truncate">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <NotificationPopover />
          <UserAvatarDropdown />
        </div>
      </header>
  );
}
