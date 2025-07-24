
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, Check, CheckCheck, Loader2, MailWarning, Trash2, X, XCircle } from 'lucide-react';
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


export default function NotificationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<AppNotification | null>(null);
    const [showClearAllDialog, setShowClearAllDialog] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/notifications?all=true'); // Use query param to get all
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

    const handleToggleRead = async (notification: AppNotification, event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const newReadStatus = !notification.read;
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: newReadStatus } : n));
        
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [notification.id], read: newReadStatus }),
            });
            if (!response.ok) throw new Error('Failed to update notification status');
            router.refresh();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo actualizar la notificación.', variant: 'destructive' });
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: !newReadStatus } : n));
        }
    };
    
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
    
    const handleDelete = async (id: string | 'read') => {
        setIsProcessing(true);
        const idsToDelete = id === 'read' ? notifications.filter(n => n.read).map(n => n.id) : [id];

        if (idsToDelete.length === 0) {
            toast({ description: id === 'read' ? 'No hay notificaciones leídas para eliminar.' : 'Error al identificar la notificación.'});
            setIsProcessing(false);
            return;
        }

        const originalNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
        
        try {
            await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: idsToDelete }),
            });
            toast({ title: 'Notificaciones Eliminadas' });
            router.refresh();
        } catch(error) {
            toast({ title: 'Error', description: 'No se pudieron eliminar las notificaciones.', variant: 'destructive'});
            setNotifications(originalNotifications);
        } finally {
            setIsProcessing(false);
            setNotificationToDelete(null);
            setShowClearAllDialog(false);
        }
    }

    const NotificationItem = ({ notif }: { notif: AppNotification }) => {
        const ContentWrapper = notif.link ? Link : 'div';
        const contentWrapperProps = notif.link ? { href: notif.link, className: "flex-grow" } : { className: "flex-grow" };

        return (
            <li className={cn(
                "flex items-start gap-4 p-4 pl-6 transition-colors",
                notif.read ? 'hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'
            )}>
                <div className="flex-grow">
                    <ContentWrapper {...contentWrapperProps}>
                        <div className="flex items-center gap-3">
                            {!notif.read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                            <p className={cn("font-semibold", !notif.read && "text-primary")}>{notif.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notif.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">{timeSince(notif.date)}</p>
                    </ContentWrapper>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 items-end sm:items-center">
                    <Button variant="ghost" size="sm" onClick={(e) => handleToggleRead(notif, e)} className="h-8 justify-start sm:justify-center">
                        {notif.read ? <MailWarning className="mr-2 h-4 w-4"/> : <Check className="mr-2 h-4 w-4" />}
                        <span className="hidden sm:inline">{notif.read ? 'Marcar no leída' : 'Marcar leída'}</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={(e) => {
                        e.stopPropagation(); e.preventDefault();
                        setNotificationToDelete(notif);
                    }}>
                        <XCircle className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                    </Button>
                </div>
            </li>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-muted-foreground">Revisa todas tus alertas, anuncios y actualizaciones.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleMarkAllRead} variant="outline" disabled={isProcessing || isLoading}>
                        <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como leídas
                    </Button>
                    <Button onClick={() => setShowClearAllDialog(true)} variant="destructive" disabled={isProcessing || isLoading}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Leídas
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                    ) : error ? (
                        <div className="text-center py-8 text-destructive">{error}</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BellRing className="mx-auto h-12 w-12 mb-4 text-primary"/>
                            <p className="font-semibold text-lg">Todo está al día</p>
                            <p>No tienes notificaciones nuevas.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {notifications.map(notif => (
                                <NotificationItem key={notif.id} notif={notif} />
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Notificación?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Se eliminará la notificación "<strong>{notificationToDelete?.title}</strong>". Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDelete(notificationToDelete!.id)}
                            disabled={isProcessing}
                            className={cn(buttonVariants({ variant: "destructive" }))}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
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
                            onClick={() => handleDelete('read')}
                            disabled={isProcessing}
                            className={cn(buttonVariants({ variant: "destructive" }))}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Sí, eliminar leídas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
