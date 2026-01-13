// src/components/dashboard/announcements-widget.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import type { Announcement } from '@/types';
import { Megaphone, Pin } from 'lucide-react';
import Link from "next/link";
import { Button } from "../ui/button";

export function AnnouncementsWidget({ announcements }: { announcements?: Announcement[] }) {
    if (!announcements || announcements.length === 0) return (
        <div className="p-6 text-center text-xs text-muted-foreground">No hay anuncios recientes</div>
    );

    return (
        <div className="divide-y divide-slate-100">
            {announcements.map(ann => (
                <div key={ann.id} className="p-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Megaphone className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-[12px] truncate">
                                    {ann.title}
                                </p>
                                {ann.isPinned && <Pin className="h-3 w-3 text-emerald-500 fill-current shrink-0" />}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5" dangerouslySetInnerHTML={{ __html: ann.content.replace(/<[^>]+>/g, '') }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
