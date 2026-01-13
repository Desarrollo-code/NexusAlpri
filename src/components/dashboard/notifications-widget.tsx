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
    if (!notifications || notifications.length === 0) {
        return (
            <div className="text-center py-8 text-xs text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2 text-emerald-500">
                    <Check className="h-5 w-5" />
                </div>
                <p>Todo en orden</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100">
            {notifications.map(notif => (
                <Link key={notif.id} href={notif.link || '#'} className="block p-2.5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                            {notif.title.toLowerCase().includes('expirar') ? <FileWarning className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0 flex-grow">
                            <p className="font-bold text-[11px] line-clamp-1 truncate">{notif.title}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{notif.description}</p>
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5">{formatDistanceToNow(new Date(notif.date), { addSuffix: true, locale: es })}</p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
