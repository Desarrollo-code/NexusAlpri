// src/components/announcement-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Announcement } from '@/types';
import { User, Clock, Edit, Trash2, Paperclip, File as FileIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Identicon } from './ui/identicon';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getIconForFileType } from '@/lib/resource-utils';

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcementId: string) => void;
}

export function AnnouncementCard({ announcement, onEdit, onDelete }: AnnouncementCardProps) {
  const { user } = useAuth();
  const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === announcement.author?.id));
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const imageAttachments = announcement.attachments?.filter(att => att.type.startsWith('image/')) || [];
  const fileAttachments = announcement.attachments?.filter(att => !att.type.startsWith('image/')) || [];

  return (
    <Card className="flex flex-col h-full group card-border-animated">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl font-headline">{announcement.title}</CardTitle>
            {announcement.priority === 'Urgente' && <Badge variant="destructive">{announcement.priority}</Badge>}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
            <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5"><AvatarFallback><Identicon userId={announcement.author?.id || 'system'} /></AvatarFallback></Avatar>
                <span>{announcement.author?.name || 'Sistema'}</span>
            </div>
             <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>{formatDate(announcement.date)}</span></div>
             <Badge variant="secondary" className="capitalize">{announcement.audience}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: announcement.content }} />
        
        {imageAttachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
                {imageAttachments.map(att => (
                    <div key={att.id} className="relative aspect-square rounded-md overflow-hidden">
                        <Image src={att.url} alt={att.name} fill className="object-cover" />
                    </div>
                ))}
            </div>
        )}

        {fileAttachments.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-3 w-3"/>Archivos Adjuntos</h4>
                <div className="space-y-2">
                    {fileAttachments.map(att => {
                         const FileTypeIcon = getIconForFileType(att.type);
                         return (
                            <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                                <FileTypeIcon className="h-5 w-5 text-primary shrink-0"/>
                                <span className="text-sm font-medium truncate flex-grow">{att.name}</span>
                            </a>
                        )
                    })}
                </div>
            </div>
        )}
      </CardContent>
      {canModify && onEdit && onDelete && (
        <CardFooter className="border-t pt-3 pb-3 justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(announcement)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(announcement.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
        </CardFooter>
      )}
    </Card>
  );
}
