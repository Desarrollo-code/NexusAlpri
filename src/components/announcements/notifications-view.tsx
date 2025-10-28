// src/components/announcements/notifications-view.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';

const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
};

const NotificationItem = ({ notif }: { notif: AppNotification }) => (
    <Link href={notif.link || '#'}>
        <div className={cn(
            "block p-3 transition-colors rounded-lg space-y-1",
            !notif.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
        )}>
            <div className="flex items-start gap-3">
                {!notif.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                <div className="flex-grow">
                    <p className={cn("font-semibold text-sm leading-tight", !notif.read && "text-foreground")}>{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">{timeSince(notif.date)}</p>
                </div>
            </div>
        </div>
    </Link>
);


export function NotificationsView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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


    return (
        <div className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg">Notificaciones</CardTitle>
            </CardHeader>
            <div className="flex-grow min-h-0">
                <ScrollArea className="h-full">
                    <div className="px-2 pb-2">
                        {isLoading ? (
                            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                        ) : error ? (
                            <div className="text-center py-8 text-destructive text-xs">{error}</div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BellRing className="mx-auto h-10 w-10 mb-2"/>
                                <p className="font-semibold text-sm">Todo al día</p>
                                <p className="text-xs">No tienes notificaciones.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map(notif => <NotificationItem key={notif.id} notif={notif} />)}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
             <div className="p-2 border-t mt-auto">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/notifications">Ver Todas</Link>
                </Button>
            </div>
        </div>
    );
}
