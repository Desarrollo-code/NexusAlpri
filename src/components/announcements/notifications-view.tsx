// src/components/announcements/notifications-view.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, Check, CheckCheck, Loader2, MailWarning, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import type { Notification as AppNotification } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isToday, isYesterday, isThisWeek, formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
};

const groupNotificationsByDate = (notifications: AppNotification[]) => {
    const groups: { [key: string]: AppNotification[] } = {
        Hoy: [],
        Ayer: [],
        'Esta Semana': [],
        Anteriores: [],
    };

    notifications.forEach(notification => {
        const date = new Date(notification.date);
        if (isToday(date)) {
            groups.Hoy.push(notification);
        } else if (isYesterday(date)) {
            groups.Ayer.push(notification);
        } else if (isThisWeek(date, { weekStartsOn: 1 })) {
            groups['Esta Semana'].push(notification);
        } else {
            groups.Anteriores.push(notification);
        }
    });

    return Object.entries(groups).filter(([, notifs]) => notifs.length > 0);
};

export function NotificationsView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showClearAllDialog, setShowClearAllDialog] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/notifications?all=true');
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const data: AppNotification[] = await response.json();
            setNotifications(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    const handleMarkAllRead = async () => {
        setIsProcessing(true);
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) {
            toast({ description: 'No hay notificaciones no leídas.'});
            setIsProcessing(false);
            return;
        }

        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => ({...n, read: true})));

        try {
             await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: 'all', read: true }),
            });
            toast({ title: 'Éxito', description: 'Todas las notificaciones han sido marcadas como leídas.'});
            router.refresh();
        } catch (error) {
             toast({ title: 'Error', description: 'No se pudieron marcar todas como leídas.', variant: 'destructive' });
             setNotifications(originalNotifications);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleDeleteRead = async () => {
        setIsProcessing(true);
        const readIds = notifications.filter(n => n.read).map(n => n.id);

        if (readIds.length === 0) {
            toast({ description: 'No hay notificaciones leídas para eliminar.'});
            setIsProcessing(false);
            setShowClearAllDialog(false);
            return;
        }

        const originalNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => !readIds.includes(n.id)));
        
        try {
            await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: readIds }),
            });
            toast({ title: 'Notificaciones Eliminadas' });
            router.refresh();
        } catch(error) {
            toast({ title: 'Error', description: 'No se pudieron eliminar las notificaciones.', variant: 'destructive'});
            setNotifications(originalNotifications);
        } finally {
            setIsProcessing(false);
            setShowClearAllDialog(false);
        }
    }

    const groupedNotifications = useMemo(() => groupNotificationsByDate(notifications), [notifications]);

    const NotificationItem = ({ notif }: { notif: AppNotification }) => (
        <div className={cn(
            "flex items-start gap-3 p-4 transition-colors rounded-lg",
            !notif.read && "bg-primary/5"
        )}>
             <div className="pt-1 flex flex-col items-center gap-1.5">
                {!notif.read && <div className="h-2 w-2 rounded-full bg-primary" />}
             </div>
             <div className="flex-grow">
                 <Link href={notif.link || '#'}>
                     <div className="flex justify-between items-start">
                         <div>
                             <p className={cn("font-semibold", !notif.read && "text-primary")}>{notif.title}</p>
                             <p className="text-sm text-muted-foreground mt-0.5">{notif.description}</p>
                         </div>
                     </div>
                 </Link>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs text-muted-foreground">{timeSince(notif.date)}</p>
                 </div>
             </div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>Bandeja de Entrada</CardTitle>
                    <CardDescription>Alertas y actualizaciones personales.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleMarkAllRead} variant="outline" size="sm" disabled={isProcessing || isLoading}>
                        <CheckCheck className="mr-2 h-4 w-4" /> Marcar Leídas
                    </Button>
                    <Button onClick={() => setShowClearAllDialog(true)} variant="destructive" size="sm" disabled={isProcessing || isLoading}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Leídas
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
                {isLoading ? (
                    <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                ) : error ? (
                    <div className="text-center py-8 text-destructive">{error}</div>
                ) : groupedNotifications.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <BellRing className="mx-auto h-12 w-12 mb-4 text-primary"/>
                        <p className="font-semibold text-lg">Todo está al día</p>
                        <p>No tienes notificaciones nuevas.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedNotifications.map(([groupTitle, notifs]) => (
                            <div key={groupTitle}>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-2 px-2">{groupTitle}</h3>
                                <div className="space-y-2">
                                    {notifs.map(notif => <NotificationItem key={notif.id} notif={notif} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            
             <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Notificaciones Leídas?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Se eliminarán permanentemente todas las notificaciones que ya han sido leídas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRead}
                            disabled={isProcessing}
                            className={cn(buttonVariants({ variant: "destructive" }))}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Sí, eliminar leídas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
