// src/components/announcements/notifications-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BellRing, Loader2 } from 'lucide-react';
import type { Notification as AppNotification } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';

const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
};

const NotificationItem = ({ notif }: { notif: AppNotification }) => (
    <Link href={notif.link || '#'} className="block w-full">
        <div className={cn(
            "p-3 transition-colors rounded-lg space-y-1 w-full",
            !notif.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
        )}>
            <div className="flex items-start gap-3">
                {!notif.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                <div className="flex-grow min-w-0">
                    <p className={cn("font-semibold text-sm leading-tight", !notif.read && "text-foreground")}>{notif.title}</p>
                    {notif.description && <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>}
                    <p className="text-xs text-muted-foreground/80 mt-1">{timeSince(notif.date)}</p>
                </div>
            </div>
        </div>
    </Link>
);


export function NotificationsView() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/notifications?all=true');
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data: AppNotification[] = await response.json();
            setNotifications(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);


    return (
      <>
        <CardHeader>
            <CardTitle className="text-base">Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-2 pb-2">
                {isLoading ? (
                    <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                        <BellRing className="mx-auto h-8 w-8 mb-2"/>
                        <p>No tienes notificaciones.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {notifications.map(notif => <NotificationItem key={notif.id} notif={notif} />)}
                    </div>
                )}
              </div>
            </ScrollArea>
        </CardContent>
         <div className="p-2 border-t mt-auto">
            <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/notifications">Ver Todas</Link>
            </Button>
        </div>
      </>
    );
}
