// src/components/messages/conversation-list.tsx
'use client';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { UserPlus } from 'lucide-react';
import { CardHeader, CardTitle, CardContent } from '../ui/card';


type Participant = { id: string; name: string | null; avatar: string | null };
type Message = { content: string | null; createdAt: string, attachments?: any[] };
type Conversation = {
  id: string;
  participants: Participant[];
  messages: Message[];
  updatedAt: string;
};

const formatTimestamp = (isoString: string): string => {
    try {
        const date = parseISO(isoString);
        if (isToday(date)) return format(date, 'p', { locale: es });
        if (isYesterday(date)) return 'Ayer';
        return format(date, 'dd/MM/yy');
    } catch(e) {
        return '';
    }
}

export const ConversationList = ({ conversations, onSelect, activeConversationId, isLoading, onNewChat }: {
  conversations: Conversation[];
  onSelect: (c: Conversation) => void;
  activeConversationId: string | null;
  isLoading: boolean;
  onNewChat: () => void;
}) => {
    return (
        <>
            <div className="p-2 border-b flex items-center justify-end h-16">
                 <Button variant="ghost" size="sm" onClick={onNewChat} className="h-8">
                    <UserPlus className="h-4 w-4 mr-2"/>
                    Nuevo Chat
                </Button>
            </div>
             <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="p-2">
                        {isLoading ? (
                            <div className="space-y-2">
                                {[...Array(8)].map((_, i) => (
                                     <div key={i} className="flex items-center gap-3 p-2.5">
                                         <Skeleton className="h-11 w-11 rounded-full"/>
                                         <div className="flex-grow space-y-1">
                                             <Skeleton className="h-4 w-3/4"/>
                                             <Skeleton className="h-3 w-full"/>
                                         </div>
                                     </div>
                                ))}
                            </div>
                        ) : (
                            conversations.map(c => {
                                const otherParticipant = c.participants[0];
                                if (!otherParticipant) return null;
                                
                                const lastMessage = c.messages[0];
                                const lastMessageText = lastMessage?.content || "Conversación iniciada";

                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => onSelect(c)}
                                        className={cn(
                                            "flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors w-full",
                                            activeConversationId === c.id ? "bg-muted" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <Avatar className="h-11 w-11 border">
                                            <AvatarImage src={otherParticipant.avatar || undefined} />
                                            <AvatarFallback><Identicon userId={otherParticipant.id} /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold truncate text-sm">{otherParticipant.name}</p>
                                                {lastMessage && <p className="text-xs text-muted-foreground shrink-0 ml-2">{formatTimestamp(c.updatedAt)}</p>}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{lastMessageText}</p>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
             </CardContent>
        </>
    );
};
