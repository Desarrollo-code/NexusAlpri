// src/components/announcement-card.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Announcement, Reaction, UserRole } from '@/types';
import { Clock, Edit, Trash2, Paperclip, CheckCheck, SmilePlus, Eye, MoreVertical, Pin, PinOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Identicon } from './ui/identicon';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getIconForFileType } from '@/lib/resource-utils';
import { useInView } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '💡', '🤔'];

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete?: (announcementId: string) => void;
  onReactionChange?: (announcementId: string, updatedReactions: Reaction[]) => void;
  onRead?: (announcementId: string) => void;
  onTogglePin?: (announcement: Announcement) => void;
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
                    {users && users.length > 0 ? users.map(user => {
                        if (!user) return null; // Defensive check
                        return (
                            <div key={user.id} className="flex items-center gap-2 p-1.5 rounded-md">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={user.avatar || undefined} />
                                    <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{user.name || 'Usuario Desconocido'}</span>
                            </div>
                        )
                    }) : <p className="text-xs text-center text-muted-foreground p-4">Nadie por aquí.</p>}
                </div>
            </ScrollArea>
        </PopoverContent>
    </Popover>
);

const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
      const diffMinutes = Math.round(diffSeconds / 60);
      const diffHours = Math.round(diffMinutes / 60);

      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (error) {
      return 'Fecha inválida';
    }
};

export function AnnouncementCard({ announcement, onDelete, onReactionChange, onRead, onTogglePin }: AnnouncementCardProps) {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const [hasBeenRead, setHasBeenRead] = useState(false);

  const canModify = useMemo(() => user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === announcement.author?.id)), [user, announcement.author]);
  
  const userReaction = useMemo(() => user && announcement.reactions?.find(r => r.userId === user.id)?.reaction || null, [announcement.reactions, user]);

  useEffect(() => {
    if (isInView && user && onRead && !hasBeenRead) {
      onRead(announcement.id);
      fetch(`/api/announcements/${announcement.id}/read`, { method: 'POST' });
      setHasBeenRead(true);
    }
  }, [isInView, user, onRead, announcement.id, hasBeenRead]);

  const handleReaction = async (reaction: string) => {
    if (!user || !onReactionChange) return;

    const currentReactions = announcement.reactions || [];
    let newReactions: Reaction[] = JSON.parse(JSON.stringify(currentReactions));
    const existingReactionIndex = newReactions.findIndex(r => r.userId === user.id);

    if (existingReactionIndex > -1) {
        if (newReactions[existingReactionIndex].reaction === reaction) newReactions.splice(existingReactionIndex, 1);
        else newReactions[existingReactionIndex].reaction = reaction;
    } else {
        newReactions.push({ userId: user.id, reaction, user: { id: user.id, name: user.name, avatar: user.avatar } });
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
        if (!r.user) return acc;
        if (!acc[r.reaction]) acc[r.reaction] = [];
        acc[r.reaction].push(r.user);
        return acc;
    }, {} as Record<string, UserDisplayInfo[]>);
  }, [announcement.reactions]);
  
  const imageAttachments = announcement.attachments?.filter(att => att.type.startsWith('image/')) || [];
  const fileAttachments = announcement.attachments?.filter(att => !att.type.startsWith('image/')) || [];
  
  return (
    <Card ref={cardRef} className="card-border-animated w-full">
      <CardContent className="p-4 flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={announcement.author?.avatar || undefined} />
          <AvatarFallback><Identicon userId={announcement.author?.id || ''} /></AvatarFallback>
        </Avatar>
        <div className="w-full">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm">
                <span className="font-bold">{announcement.author?.name || 'Sistema'}</span>
                <span className="text-muted-foreground">{formatDate(announcement.date)}</span>
                {announcement.isPinned && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Pin className="h-4 w-4 text-primary" />
                            </TooltipTrigger>
                            <TooltipContent><p>Anuncio Fijado</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
             </div>
             {canModify && onDelete && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => onTogglePin?.(announcement)}>
                            {announcement.isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                            {announcement.isPinned ? 'Desfijar' : 'Fijar Anuncio'}
                         </DropdownMenuItem>
                         <DropdownMenuItem disabled>
                            <Edit className="mr-2 h-4 w-4"/>Editar (próximamente)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(announcement.id)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4"/>Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none mt-1" dangerouslySetInnerHTML={{ __html: announcement.content }} />
          {imageAttachments.length > 0 && (
             <div className={cn("grid gap-1 mt-3 rounded-lg overflow-hidden border", imageAttachments.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                 {imageAttachments.slice(0,4).map((att, index) => (
                    <div key={index} className={cn("relative aspect-video", imageAttachments.length === 3 && index === 0 && "row-span-2")}>
                       <Image src={att.url} alt={att.name} fill className="object-cover" />
                       {imageAttachments.length > 4 && index === 3 && ( <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">+{imageAttachments.length - 4}</div> )}
                    </div>
                 ))}
             </div>
          )}
          {fileAttachments.length > 0 && (
            <div className="mt-3 space-y-2">
                {fileAttachments.map(att => { const FileTypeIcon = getIconForFileType(att.type); return ( <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors border"><FileTypeIcon className="h-5 w-5 text-primary shrink-0"/> <span className="text-sm font-medium truncate flex-grow">{att.name}</span></a> )})}
            </div>
          )}
          <div className="flex items-center text-muted-foreground mt-3 -ml-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon"><SmilePlus className="h-4 w-4"/></Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1">
                    <div className="flex gap-1">{EMOJI_REACTIONS.map(emoji => <button key={emoji} onClick={() => handleReaction(emoji)} className={cn("text-xl p-1 rounded-md transition-transform hover:scale-125", userReaction === emoji && "bg-primary/20")}>{emoji}</button>)}</div>
                </PopoverContent>
            </Popover>
            <div className="flex items-center gap-1 overflow-x-auto flex-grow">
                {Object.entries(groupedReactions).map(([reaction, users]) => (
                    <UserListPopover
                        key={reaction}
                        title={`Reaccionaron con ${reaction}`}
                        users={users.filter(Boolean)} // Ensure no null users
                        trigger={
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                                {reaction} <span className="font-bold">{users.length}</span>
                            </Button>
                        }
                    />
                ))}
            </div>
             <div className="flex items-center gap-1 text-xs font-bold pl-2">
                 <Eye className="h-4 w-4"/>
                 <span>{announcement._count?.reads ?? 0}</span>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
