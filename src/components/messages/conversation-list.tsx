// src/components/messages/conversation-list.tsx
'use client';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Participant = { id: string; name: string | null; avatar: string | null };
type Message = { content: string | null; createdAt: string, attachments?: any[] };
type Conversation = {
  id: string;
  participants: Participant[];
  messages: Message[];
  updatedAt: string;
};

export const ConversationList = ({ conversations, onSelect, activeConversationId }: {
  conversations: Conversation[];
  onSelect: (c: Conversation) => void;
  activeConversationId: string | null;
}) => {
    return (
        <div className="flex flex-col gap-1">
            {conversations.map(c => {
                const otherParticipant = c.participants[0];
                if (!otherParticipant) return null;
                
                const lastMessage = c.messages[0];
                let lastMessageText = 'Conversación iniciada';
                if (lastMessage) {
                    if (lastMessage.content) {
                        lastMessageText = lastMessage.content;
                    } else if (lastMessage.attachments && lastMessage.attachments.length > 0) {
                        lastMessageText = "Envió un adjunto";
                    }
                }

                return (
                    <button
                        key={c.id}
                        onClick={() => onSelect(c)}
                        className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors w-full",
                            activeConversationId === c.id ? "bg-primary/10" : "hover:bg-muted"
                        )}
                    >
                        <Avatar className="h-11 w-11 border">
                            <AvatarImage src={otherParticipant.avatar || undefined} />
                            <AvatarFallback><Identicon userId={otherParticipant.id} /></AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold truncate text-sm">{otherParticipant.name}</p>
                                {lastMessage && <p className="text-xs text-muted-foreground shrink-0 ml-2">{format(parseISO(c.updatedAt), 'p', { locale: es })}</p>}
                            </div>
                            {lastMessage && <p className="text-xs text-muted-foreground truncate">{lastMessageText}</p>}
                        </div>
                    </button>
                )
            })}
        </div>
    );
};
