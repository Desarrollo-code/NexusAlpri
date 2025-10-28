// src/components/announcements/announcement-card.tsx
'use client';

import React from 'react';
import type { Announcement as AnnouncementType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { VerifiedBadge } from '../ui/verified-badge';

const timeSince = (dateString: string): string => {
  const date = parseISO(dateString);
  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'hace un momento';
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  
  return format(date, "d MMM, yyyy", { locale: es });
};


export function AnnouncementCard({ announcement }: { announcement: AnnouncementType }) {
  
  return (
    <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="p-3">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={announcement.author?.avatar || undefined} />
                    <AvatarFallback><Identicon userId={announcement.author?.id || ''} /></AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{announcement.author?.name || 'Sistema'}</p>
                        <VerifiedBadge role={announcement.author?.role as any} />
                    </div>
                    <p className="text-xs text-muted-foreground">{timeSince(announcement.date)}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
            <h4 className="font-semibold mb-1">{announcement.title}</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: announcement.content }} />
        </CardContent>
    </Card>
  );
}