// src/components/announcement-card.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Announcement, Reaction, UserRole } from '@/types';
import { User, Clock, Edit, Trash2, Paperclip, Check, CheckCheck, SmilePlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Identicon } from './ui/identicon';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getIconForFileType } from '@/lib/resource-utils';
import { useInView } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '💡', '🤔'];

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcementId: string) => void;
  onReactionChange?: (announcementId: string, updatedReactions: Reaction[]) => void;
  onRead?: (announcementId: string, userId: string) => void;
}

type UserDisplayInfo = {
  id: string;
  name: string | null;
  avatar?: string | null;
};

const UserListPopover = ({ trigger, title, users }: { trigger: React.ReactNode, title: string, users: UserDisplayInfo[] }) => (
    <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-64 p-0">
            <div className="p-3 font-semibold text-sm border-b">{title} ({users.length})</div>
            <ScrollArea className="max-h-60">
                <div className="p-2 space-y-1">
                    {users && users.length > 0 ? users.map(user => (
                        <div key={user.id} className="flex items-center gap-2 p-1.5 rounded-md">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{user.name || 'Usuario Desconocido'}</span>
                        </div>
                    )) : <p className="text-xs text-center text-muted-foreground p-4">Nadie por aquí.</p>}
                </div>
            </ScrollArea>
        </PopoverContent>
    </Popover>
);

const getAudienceInSpanish = (audience: UserRole[] | 'ALL' | string) => {
    const audienceValue = Array.isArray(audience) ? audience[0] : audience;
    switch(audienceValue) {
        case 'ALL': return 'Todos';
        case 'STUDENT': return 'Estudiantes';
        case 'INSTRUCTOR': return 'Instructores';
        case 'ADMINISTRATOR': return 'Admins';
        default: return 'Todos';
    }
}


export function AnnouncementCard({ announcement, onEdit, onDelete, onReactionChange, onRead }: AnnouncementCardProps) {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });

  const canModify = useMemo(() => user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === announcement.author?.id)), [user, announcement.author]);
  
  const userHasRead = useMemo(() => {
      if (!user) return false;
      return announcement.reads?.some(readUser => readUser.id === user.id);
  }, [announcement.reads, user]);
  
  const userReaction = useMemo(() => {
    if (!user) return null;
    return announcement.reactions?.find(r => r.userId === user.id)?.reaction || null;
  }, [announcement.reactions, user]);

  useEffect(() => {
    if (isInView && user && !userHasRead && onRead) {
      onRead(announcement.id, user.id);
    }
  }, [isInView, user, userHasRead, onRead, announcement.id]);

  const handleReaction = async (reaction: string) => {
    if (!user || !onReactionChange) return;

    // Optimistic update
    const currentReactions = announcement.reactions || [];
    let newReactions: Reaction[] = JSON.parse(JSON.stringify(currentReactions));
    const existingReactionIndex = newReactions.findIndex(r => r.userId === user.id);

    if (existingReactionIndex > -1) {
        if (newReactions[existingReactionIndex].reaction === reaction) { // Toggle off
            newReactions.splice(existingReactionIndex, 1);
        } else { // Change reaction
            newReactions[existingReactionIndex].reaction = reaction;
        }
    } else { // Add new reaction
        newReactions.push({
          userId: user.id,
          reaction: reaction,
          user: { id: user.id, name: user.name, avatar: user.avatar }
        });
    }
    onReactionChange(announcement.id, newReactions);
    
    try {
        await fetch(`/api/announcements/${announcement.id}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reaction }),
        });
    } catch(e) {
        console.error("Failed to update reaction", e);
        onReactionChange(announcement.id, currentReactions);
    }
  };
  
  const groupedReactions = useMemo(() => {
    if (!announcement.reactions) return {};
    return announcement.reactions.reduce((acc, r) => {
        if (!r.user) return acc; // Skip if user data is missing
        if (!acc[r.reaction]) {
            acc[r.reaction] = [];
        }
        acc[r.reaction].push(r.user);
        return acc;
    }, {} as Record<string, UserDisplayInfo[]>);
  }, [announcement.reactions]);
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const imageAttachments = announcement.attachments?.filter(att => att.type.startsWith('image/')) || [];
  const fileAttachments = announcement.attachments?.filter(att => !att.type.startsWith('image/')) || [];
  
  const readStatusIcon = userHasRead ? <CheckCheck className="h-4 w-4 text-blue-500" /> : <Check className="h-4 w-4 text-muted-foreground" />;

  return (
    <Card ref={cardRef} className="flex flex-col h-full group card-border-animated">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl font-headline">{announcement.title}</CardTitle>
            {announcement.priority === 'Urgente' && <Badge variant="destructive">{announcement.priority}</Badge>}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
            <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5"><AvatarImage src={announcement.author?.avatar || undefined} /><AvatarFallback><Identicon userId={announcement.author?.id || 'system'} /></AvatarFallback></Avatar>
                <span>{announcement.author?.name || 'Sistema'}</span>
            </div>
             <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>{formatDate(announcement.date)}</span></div>
             <Badge variant="secondary">{getAudienceInSpanish(announcement.audience)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: announcement.content }} />
        
        {imageAttachments.length > 0 && (
            <div className={cn( "grid gap-2", imageAttachments.length === 1 ? "grid-cols-1" : "grid-cols-2" )}>
                {imageAttachments.slice(0, 4).map((att, index) => (
                    <div key={att.id || index} className={cn("relative aspect-video rounded-md overflow-hidden", imageAttachments.length > 2 && index === 0 && "col-span-2" )}>
                        <Image src={att.url} alt={att.name} fill className="object-cover" />
                         {imageAttachments.length > 4 && index === 3 && ( <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">+{imageAttachments.length - 4}</div> )}
                    </div>
                ))}
            </div>
        )}

        {fileAttachments.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-3 w-3"/>Archivos Adjuntos</h4>
                <div className="space-y-2">
                    {fileAttachments.map(att => { const FileTypeIcon = getIconForFileType(att.type); return ( <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"><FileTypeIcon className="h-5 w-5 text-primary shrink-0"/> <span className="text-sm font-medium truncate flex-grow">{att.name}</span></a> )})}
                </div>
            </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><SmilePlus className="h-4 w-4"/></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1">
                        <div className="flex gap-1">
                            {EMOJI_REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleReaction(emoji)} className={cn("text-xl p-1 rounded-md transition-transform hover:scale-125", userReaction === emoji && "bg-primary/20")}>{emoji}</button>
                            ))}
                        </div>
                    </PopoverContent>
                 </Popover>
                  <div className="flex items-center gap-1">
                    {Object.entries(groupedReactions).map(([reaction, users]) => (
                        <UserListPopover
                            key={reaction}
                            title={`Reaccionaron con ${reaction}`}
                            users={users}
                            trigger={<Badge variant="secondary" className="cursor-pointer">{reaction} {users.length}</Badge>}
                        />
                    ))}
                  </div>
            </div>
            
             <UserListPopover
                title="Visto por"
                users={announcement.reads || []}
                trigger={
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                                    <span className="text-xs">{announcement._count?.reads ?? (announcement.reads || []).length}</span>
                                    {readStatusIcon}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{userHasRead ? 'Visto por ti' : 'Pendiente de ver'}. Haz clic para ver todos.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                }
             />
            
            {canModify && onEdit && onDelete && (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(announcement)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(announcement.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                </div>
            )}
        </CardFooter>
    </Card>
  );
}
