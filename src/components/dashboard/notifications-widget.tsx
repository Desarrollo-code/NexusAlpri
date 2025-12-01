// src/components/dashboard/notifications-widget.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import type { Notification } from '@/types';
import { BellRing, Check, Info, FileWarning } from 'lucide-react';
import Link from "next/link";
import { Button } from "../ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const getIconForNotification = (title: string) => {
    if (title.toLowerCase().includes('expirar')) {
        return <FileWarning className="h-5 w-5 text-amber-500" />;
    }
    return <Info className="h-5 w-5 text-blue-500" />;
}

export function NotificationsWidget({ notifications }: { notifications?: Notification[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BellRing className="h-5 w-5 text-primary"/>
                        Alertas y Notificaciones
                    </div>
                    <Link href="/notifications" className="text-sm font-medium text-primary hover:underline">Ver todas</Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {notifications && notifications.length > 0 ? notifications.map(notif => (
                    <Link key={notif.id} href={notif.link || '#'} className="block p-3 rounded-lg border bg-background hover:bg-muted transition-colors">
                        <div className="flex items-start gap-3">
                             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {getIconForNotification(notif.title)}
                            </div>
                            <div className="min-w-0 flex-grow">
                                <p className="font-semibold text-sm line-clamp-1">{notif.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{notif.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notif.date), { addSuffix: true, locale: es })}</p>
                            </div>
                        </div>
                    </Link>
                )) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-2 text-green-500">
                           <Check className="h-7 w-7"/>
                        </div>
                       <p>Todo en orden. No hay alertas.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
