// src/components/messages/message-area.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getIconForFileType, getFileTypeDetails } from '@/lib/resource-utils';
import type { Attachment } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

type Participant = { id: string; name: string | null; avatar: string | null };
type Message = {
  id: string;
  content: string | null;
  createdAt: string;
  authorId: string;
  author: Participant;
  attachments: Attachment[];
};

const AttachmentPreview = ({ attachment }: { attachment: Attachment }) => {
    const { label, bgColor } = getFileTypeDetails(attachment.type);

    if (attachment.type.startsWith('image/')) {
        return <Image src={attachment.url} alt={attachment.name} width={300} height={200} className="rounded-lg object-cover max-w-full h-auto cursor-pointer" />;
    }
    if (attachment.type.startsWith('video/')) {
        return <video src={attachment.url} controls className="w-full max-w-xs rounded-lg" />;
    }

    return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80">
            <div
                className="w-8 h-8 flex items-center justify-center rounded-md flex-shrink-0"
                style={{ backgroundColor: bgColor }}
            >
                <span className="text-xs font-bold uppercase text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                    {label}
                </span>
            </div>
            <span className="truncate text-sm font-medium">{attachment.name}</span>
        </a>
    );
};

export const MessageArea = ({ messages, currentUser, otherParticipant }: {
    messages: Message[];
    currentUser: any;
    otherParticipant: Participant | null;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <ScrollArea className="flex-1" viewportRef={scrollRef}>
            <div className="p-4 space-y-6">
                {messages.map((msg, index) => {
                    const isCurrentUser = msg.authorId === currentUser.id;
                    const prevMsg = messages[index - 1];
                    const showAvatar = !isCurrentUser && (!prevMsg || prevMsg.authorId !== msg.authorId);

                    return (
                        <div key={msg.id} className={cn("flex gap-3", isCurrentUser ? "justify-end" : "justify-start")}>
                            {!isCurrentUser && (
                                <div className="w-9 h-9 flex-shrink-0 self-end">
                                    {showAvatar && (
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarImage src={otherParticipant?.avatar || undefined} />
                                            <AvatarFallback><Identicon userId={otherParticipant?.id || ''} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5 max-w-xs md:max-w-md">
                            {msg.attachments && msg.attachments.length > 0 && (
                                    <div className={cn("space-y-2", isCurrentUser ? "items-end" : "items-start")}>
                                        {msg.attachments.map(att => <AttachmentPreview key={att.id} attachment={att} />)}
                                    </div>
                                )}
                                {msg.content && (
                                    <div className={cn(
                                        "p-3 rounded-2xl",
                                        isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                    )}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                )}
                                <p className={cn("text-[10px] text-muted-foreground", isCurrentUser ? "text-right" : "text-left")}>
                                    {format(parseISO(msg.createdAt), 'p', { locale: es })}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
};
