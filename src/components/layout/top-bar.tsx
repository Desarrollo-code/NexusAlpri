
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserAvatarDropdown } from './user-avatar-dropdown';
import { usePathname } from 'next/navigation';
import { getNavItemsForRole } from '@/lib/nav-items';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole, NavItem } from '@/types'; 
import { BookOpenCheck, Bell, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Notification as AppNotification } from '@/types'; 
import { useToast } from '@/hooks/use-toast';

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


export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userAppRole = user?.role;
  const navItemsRaw = user ? getNavItemsForRole(userAppRole || 'STUDENT') : [];
  const allNavItems = navItemsRaw.flatMap(item => (item.subItems ? [item, ...item.subItems] : [item]));
  
  const getPageTitle = () => {
    // Find the most specific match by checking longer paths first
    const currentNavItem = allNavItems
      .slice() // Create a copy to avoid mutating the original
      .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))
      .find(item => item.href && item.href !== '#' && pathname.startsWith(item.href));
      
    if (pathname === '/dashboard') return 'Panel Principal';

    return currentNavItem?.label || 'NexusAlpri'; 
  };

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) { 
        setIsLoadingNotifications(false);
        setNotifications([]);
        return;
    }
    setIsLoadingNotifications(true);
    setNotificationError(null);
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' }); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch notifications: ${response.statusText}`);
      }
      const data: AppNotification[] = await response.json();
      setNotifications(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar notificaciones';
      setNotificationError(errorMessage);
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

  useEffect(() => {
    if (isDropdownOpen && user) {
        fetchNotifications();
    }
  }, [isDropdownOpen, fetchNotifications, user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleNotificationClick = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
        // Optimistic UI update
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        // Fire and forget API call
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [id], read: true }),
        }).catch(e => console.error("Failed to mark notification as read:", e));
    }
  };
  
  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      // Optimistic UI update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Fire and forget API call
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: 'all', read: true }),
      }).catch(e => console.error("Failed to mark all as read:", e));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold font-headline">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu onOpenChange={(open) => { 
            setIsDropdownOpen(open);
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && !isLoadingNotifications && !notificationError && (
                <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                 <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleMarkAllRead}>
                    Marcar todas como leídas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {isLoadingNotifications ? (
                <DropdownMenuItem disabled className="justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando...
                </DropdownMenuItem>
              ) : notificationError ? (
                <DropdownMenuItem disabled className="flex-col items-center justify-center py-4 text-destructive">
                  <AlertTriangle className="h-5 w-5 mb-1" />
                  <p className="text-sm font-medium">Error al cargar</p>
                  <p className="text-xs">{notificationError.substring(0,50)}</p>
                  <Button variant="link" size="sm" onClick={fetchNotifications} className="mt-1">Reintentar</Button>
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center justify-center py-4 text-muted-foreground">
                    No hay notificaciones
                </DropdownMenuItem>
              ) : (
                notifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(notification => {
                    const ItemWrapper = notification.link ? Link : 'div';
                    const itemProps = notification.link ? { href: notification.link } : {};

                    return (
                        <DropdownMenuItem
                            key={notification.id}
                            asChild={!!notification.link} 
                            onClick={() => handleNotificationClick(notification.id)}
                            className={`flex items-start gap-2.5 p-3 whitespace-normal cursor-pointer ${!notification.read ? 'font-medium bg-muted/50' : 'text-muted-foreground'}`}
                        >
                            <ItemWrapper {...itemProps} className="flex w-full items-start gap-2.5">
                                {!notification.read ? <Bell className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> : <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />}
                                <div className="flex-grow">
                                <p className="text-sm leading-tight font-semibold">{notification.title}</p>
                                {notification.description && <p className="text-xs leading-snug mt-0.5">{notification.description}</p>}
                                <p className={`text-xs mt-1 ${!notification.read ? 'text-primary/80' : 'text-muted-foreground/80'}`}>{timeSince(notification.date)}</p>
                                </div>
                            </ItemWrapper>
                        </DropdownMenuItem>
                    );
                })
              )}
            </ScrollArea>
             {!isLoadingNotifications && !notificationError && notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center">
                    <span className="text-sm text-primary hover:underline cursor-pointer" onClick={() => toast({title: "Info", description: "Página de 'Todas las notificaciones' pendiente de implementación."})}>
                        Ver todas las notificaciones
                    </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <UserAvatarDropdown />
      </div>
    </header>
  );
}
