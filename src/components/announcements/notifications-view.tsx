// src/components/announcements/notifications-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardContent } from '../ui/card';
import { BellRing, Loader2, UserPlus, Award, MessageSquare, X, Check, Clock } from 'lucide-react';
import type { Notification as AppNotification } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

const getNotificationDetails = (notification: AppNotification) => {
    // This can be expanded with more notification types
    if (notification.title.includes('Logro')) {
        return { icon: Award, color: 'text-amber-500' };
    }
    if (notification.title.includes('Anuncio')) {
        return { icon: MessageSquare, color: 'text-blue-500' };
    }
    if (notification.title.includes('Asignado')) {
        return { icon: UserPlus, color: 'text-green-500' };
    }
     if (notification.title.includes('Pausa Activa')) {
        return { icon: Clock, color: 'text-green-500' };
    }
    return { icon: BellRing, color: 'text-muted-foreground' };
};

const NotificationItem = ({ notif, onDismiss }: { notif: AppNotification, onDismiss: (id: string) => void }) => {
    const { icon: Icon, color } = getNotificationDetails(notif);
    const formattedDate = format(new Date(notif.date), "d MMM yyyy 'a las' hh:mm a", { locale: es });
    
    const achievementNameMatch = notif.title.match(/Logro Desbloqueado: (.*)!/);
    const mainTitle = achievementNameMatch ? "¡Logro Desbloqueado!" : notif.title;
    const achievementName = achievementNameMatch ? `${achievementNameMatch[1]}!` : '';

    return (
        <div className={cn("flex items-start gap-4 p-4 border-b", !notif.read && "bg-primary/5")}>
            <Icon className={cn("h-6 w-6 mt-1 flex-shrink-0", color)} />
            <div className="flex-grow space-y-2">
                <div className="flex justify-between items-start gap-4">
                    <p className={cn("font-bold text-base leading-tight", !notif.read && "text-foreground")}>
                       {mainTitle}
                       {achievementName && <span className="font-semibold text-lg ml-1">{achievementName}</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        <span>{formattedDate}</span>
                         <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => onDismiss(notif.id)}>
                            <X className="h-4 w-4" />
                         </Button>
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground line-clamp-2">
                    {notif.description}
                </p>
                 {notif.link && (
                    <div className="pt-1">
                        <Button asChild variant="default" size="sm">
                            <Link href={notif.link}>Ver detalles</Link>
                        </Button>
                    </div>
                 )}
            </div>
        </div>
    );
};


export function NotificationsView() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

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
    
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleDismiss = async (notificationId: string) => {
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        try {
            const response = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [notificationId] }),
            });
            if (response.status !== 204) {
                throw new Error("No se pudo eliminar la notificación.");
            }
            toast({ description: "Notificación eliminada." });
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
            setNotifications(originalNotifications);
        }
    }
    
    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => ({...n, read: true})));

        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: 'all', read: true }),
            });
             if (!response.ok) {
                throw new Error("No se pudieron marcar como leídas.");
            }
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
            setNotifications(originalNotifications);
        }
    }

    return (
      <>
        <div className="p-2 border-b flex items-center justify-end h-16">
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                <Check className="mr-2 h-4 w-4"/>
                Marcar todas como leídas
             </Button>
        </div>
        <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div>
                {isLoading ? (
                    <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <BellRing className="mx-auto h-8 w-8 mb-2"/>
                        <p>No tienes notificaciones.</p>
                    </div>
                ) : (
                    <div>
                        {notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onDismiss={handleDismiss} />)}
                    </div>
                )}
              </div>
            </ScrollArea>
        </CardContent>
         <div className="p-2 border-t mt-auto">
            <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/notifications">Ver Todas las Notificaciones</Link>
            </Button>
        </div>
      </>
    );
}
