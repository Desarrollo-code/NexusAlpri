// src/components/layout/top-bar.tsx
'use client';

import { cn } from "@/lib/utils";
import { useSidebar } from "../ui/sidebar";
import { Button } from "../ui/button";
import { ChevronsLeft, Bell } from "lucide-react";
import { UserAvatarDropdown } from "./user-avatar-dropdown";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Notification } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useTitle } from "@/contexts/title-context";

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
};

export const TopBar = () => {
    const { isMobile, toggleSidebar } = useSidebar();
    const { pageTitle } = useTitle();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/notifications');
                if (response.ok) {
                    const data: Notification[] = await response.json();
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.read).length);
                }
            } catch (error) {
                // Silently fail, or toast an error if preferred
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (ids: string[] | 'all') => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids === 'all' ? 'all' : ids, read: true })
            });
            if (res.ok) {
                if (ids === 'all') {
                    setNotifications(prev => prev.map(n => ({...n, read: true})));
                    setUnreadCount(0);
                } else {
                    setNotifications(prev => prev.map(n => ids.includes(n.id) ? {...n, read: true} : n));
                    setUnreadCount(prev => prev - ids.length);
                }
            } else {
                 toast({ title: "Error", description: "No se pudieron marcar las notificaciones."})
            }
        } catch(error) {
            // silent
        }
    }


    return (
        <div className={cn(
            "flex items-center justify-between h-20 px-4 shrink-0",
            "bg-card/50 backdrop-blur-lg border-b border-border/50 sticky top-0 z-40"
        )}>
            {/* Left side */}
            <div className="flex items-center gap-2">
                {isMobile && (
                    <Button
                        onClick={toggleSidebar}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-foreground"
                    >
                        <ChevronsLeft className="h-5 w-5" />
                    </Button>
                )}
                 <h1 className="text-xl font-semibold truncate">{pageTitle}</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-foreground">
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
                         {notifications.length > 0 ? (
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
                <Separator orientation="vertical" className="h-8" />
                <UserAvatarDropdown />
            </div>
        </div>
    );
};
