// src/components/messages/chat-client.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Info, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { User, Attachment, Announcement as AnnouncementType } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ConversationList } from './conversation-list';
import { useRealtime } from '@/hooks/use-realtime';
import { ScrollArea } from '../ui/scroll-area';

type Conversation = {
  id: string;
  participants: any[];
  messages: any[];
  updatedAt: string;
};

interface ChatClientProps {
    onSelectConversation: (c: Conversation) => void;
    activeConversationId: string | null;
}

export function ChatClient({ onSelectConversation, activeConversationId }: ChatClientProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [usersForNewChat, setUsersForNewChat] = useState<User[]>([]);

    const fetchConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error("No se pudieron cargar las conversaciones");
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsLoadingConversations(false);
        }
    }, [toast]);
    
    // El hook de realtime ahora solo se preocupa de refrescar la lista
    useRealtime(user ? `user:${user.id}` : null, fetchConversations);
    
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchConversations();
        }
    }, [user, isAuthLoading, fetchConversations]);
    
    const handleStartNewChat = (recipient: User) => {
        setIsNewChatModalOpen(false);
        const existingConvo = conversations.find(c => c.participants.some(p => p.id === recipient.id));
        if (existingConvo) {
            onSelectConversation(existingConvo);
        } else {
            const tempConvo: Conversation = {
                id: `temp-${recipient.id}`, participants: [{...recipient}], messages: [], updatedAt: new Date().toISOString()
            };
            setConversations(prev => [tempConvo, ...prev]);
            onSelectConversation(tempConvo);
        }
    };

    useEffect(() => {
        if(isNewChatModalOpen) {
            fetch('/api/users/list')
                .then(res => res.json())
                .then(data => setUsersForNewChat(data.users || []));
        }
    }, [isNewChatModalOpen]);

    if (isAuthLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <>
            <Card className="flex flex-col h-full overflow-hidden">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Mensajes</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsNewChatModalOpen(true)}>
                        <UserPlus className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0">
                    <ScrollArea className="h-full">
                       {isLoadingConversations ? (
                            <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
                       ) : (
                            <ConversationList
                                conversations={conversations}
                                onSelect={onSelectConversation}
                                activeConversationId={activeConversationId}
                            />
                       )}
                    </ScrollArea>
                </CardContent>
            </Card>
            
            <Dialog open={isNewChatModalOpen} onOpenChange={setIsNewChatModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Iniciar Nueva Conversación</DialogTitle>
                        <DialogDescription>Selecciona un usuario para comenzar a chatear.</DialogDescription>
                    </DialogHeader>
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Buscar usuario..." />
                        <CommandList>
                            <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                            <CommandGroup>
                                {usersForNewChat.map(u => (
                                    <CommandItem key={u.id} onSelect={() => handleStartNewChat(u)}>
                                        {u.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    );
}