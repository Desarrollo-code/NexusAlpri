// src/components/layout/top-bar.tsx
'use client';

import { cn } from "@/lib/utils";
import { useSidebar } from "../ui/sidebar";
import { Button } from "../ui/button";
import { Bell, PanelLeft, ArrowLeft } from "lucide-react";
import { UserAvatarDropdown } from "./user-avatar-dropdown";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Notification as AppNotification, NavItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useTitle } from "@/contexts/title-context";
import { useRouter, usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { getNavItemsForRole } from "@/lib/nav-items";
import { GradientIcon } from "../ui/gradient-icon";
import { timeSince } from "@/lib/utils";
import { ColorfulLoader } from "../ui/colorful-loader";

export const TopBar = () => {
    const { toggleSidebar } = useSidebar();
    const { pageTitle, headerActions, showBackButton } = useTitle();
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // --- LÓGICA PARA OBTENER EL ÍCONO DE LA PÁGINA ACTUAL ---
    const { icon: currentPageIcon, title: currentPageTitle } = useMemo(() => {
        if (!user?.role) return { icon: null, title: pageTitle };
        const navItems = getNavItemsForRole(user.role);
        
        const findItem = (items: NavItem[], path: string): NavItem | undefined => {
            for (const item of items) {
                 if (item.path && path.startsWith(item.path) && (item.path !== '/dashboard' || path === '/dashboard')) {
                    return item;
                }
                if (item.children) {
                    const found = findItem(item.children, path);
                    if (found) return found;
                }
            }
        };
        
        const currentItem = findItem(navItems, pathname);

        // Para rutas dinámicas, el `pageTitle` del contexto tiene prioridad.
        const title = pageTitle || currentItem?.label || "NexusAlpri";

        return { icon: currentItem?.icon || null, title };
    }, [pathname, user?.role, pageTitle]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data: AppNotification[] = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            // Silently fail for polling
        } finally {
          setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (ids: string[] | 'all') => {
        if (unreadCount === 0 && ids === 'all') return;
        
        const originalNotifications = [...notifications];
        const unreadIdsToMark = ids === 'all'
            ? originalNotifications.filter(n => !n.read).map(n => n.id)
            : ids;
            
        // Optimistic update
        setNotifications(prev => prev.map(n => unreadIdsToMark.includes(n.id) ? {...n, read: true} : n));
        setUnreadCount(prev => prev - unreadIdsToMark.length);
        
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids === 'all' ? 'all' : ids, read: true })
            });
            if (!res.ok) {
                 throw new Error("No se pudieron marcar las notificaciones.");
            }
        } catch(error) {
            // Revert on error
            setNotifications(originalNotifications);
            setUnreadCount(originalNotifications.filter(n => !n.read).length);
            toast({ title: "Error", description: "No se pudieron marcar las notificaciones."})
        }
    }


    return (
        <div className={cn(
            "flex items-center justify-between h-20 px-4 shrink-0 border-b sticky top-0 z-30",
            "bg-primary-gradient text-primary-foreground border-border/80"
        )}>
            {/* Left side */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                 {isMobile ? (
                    <Button onClick={toggleSidebar} variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-black/20">
                        <PanelLeft className="h-5 w-5"/>
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                 ) : showBackButton ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-black/20" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4"/>
                        <span className="sr-only">Volver</span>
                    </Button>
                 ) : (
                    <div className="w-8"/> // Placeholder to keep alignment
                 )}
                 <h1 className="text-xl font-bold truncate">
                    {currentPageTitle}
                 </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                 {headerActions && <div className="hidden md:flex items-center gap-2">{headerActions}</div>}
                 <Popover onOpenChange={(open) => { if (open) fetchNotifications() }}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-primary-foreground/80 hover:text-primary-foreground hover:bg-black/20 transition-colors">
                            <Bell className="h-5 w-5"/>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive items-center justify-center text-xs text-destructive-foreground">{unreadCount}</span>
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                         <div className="p-4">
                            <h4 className="font-medium text-sm">Notificaciones</h4>
                         </div>
                         <Separator />
                          {isLoading ? <div className="flex justify-center p-4"><div className="w-6 h-6"><ColorfulLoader/></div></div> :
                            notifications.length > 0 ? (
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.map(n => (
                                        <Link key={n.id} href={n.link || '#'} onClick={() => !n.read && markAsRead([n.id])}>
                                          <div className={cn(
                                            "p-4 border-b hover:bg-muted/50",
                                            !n.read && "bg-primary/5"
                                          )}>
                                            <p className="text-sm font-semibold">{n.title}</p>
                                            <p className="text-sm text-muted-foreground">{n.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{timeSince(new Date(n.date))}</p>
                                          </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones.</p>
                            )}
                         <Separator />
                         <div className="p-2 flex justify-between items-center">
                            <Button variant="ghost" size="sm" onClick={() => markAsRead('all')} disabled={unreadCount === 0}>Marcar todas leídas</Button>
                            <Button variant="link" size="sm" asChild>
                                <Link href="/notifications">Ver todas</Link>
                            </Button>
                         </div>
                    </PopoverContent>
                 </Popover>
                <Separator orientation="vertical" className="h-8 bg-white/20" />
                <UserAvatarDropdown />
            </div>
            {headerActions && isMobile && (
              <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t p-2 flex justify-around gap-2 z-50">
                {headerActions}
              </div>
            )}
        </div>
    );
};
