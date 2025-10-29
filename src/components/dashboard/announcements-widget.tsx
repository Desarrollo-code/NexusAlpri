// src/components/dashboard/announcements-widget.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import type { Announcement } from '@/types';
import { Megaphone, Pin } from 'lucide-react';
import Link from "next/link";
import { Button } from "../ui/button";

export function AnnouncementsWidget({ announcements }: { announcements?: Announcement[] }) {
    if (!announcements || announcements.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    Anuncios Recientes
                    <Link href="/messages" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {announcements.map(ann => (
                    <div key={ann.id} className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm flex items-center gap-2">
                                {ann.title}
                                {ann.isPinned && <Pin className="h-3.5 w-3.5 text-blue-500 fill-current" />}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: ann.content.replace(/<[^>]+>/g, '') }} />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
