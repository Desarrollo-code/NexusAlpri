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
import { MessageArea } from './message-area';
import { AnnouncementViewer } from './announcement-viewer';
import { useRealtime } from '@/hooks/use-realtime';
import { ScrollArea } from '../ui/scroll-area';

type Conversation = {
  id: string;
  participants: any[];
  messages: any[];
  updatedAt: string;
};

export interface LocalAttachmentPreview {
    id: string;
    file: File;
    previewUrl: string;
    finalUrl?: string;
    uploadProgress: number;
    error?: string;
}

interface ChatClientProps {
    activeItem: { type: 'conversation' | 'announcement', data: any } | null;
    onBack: () => void;
    onSelectConversation: (c: Conversation) => void;
}

export function ChatClient({ activeItem, onBack, onSelectConversation }: ChatClientProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
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
    
    const handleNewMessage = useCallback((payload: any) => {
        if (activeItem?.type === 'conversation' && payload.conversationId === activeItem.data.id) {
            setMessages(prevMessages => [...prevMessages, payload]);
        }
        fetchConversations();
    }, [activeItem, fetchConversations]);

    useRealtime(user ? `user:${user.id}` : null, handleNewMessage);
    
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchConversations();
        }
    }, [user, isAuthLoading, fetchConversations]);
    
    useEffect(() => {
        if (activeItem?.type === 'conversation' && !activeItem.data.id.startsWith('temp-')) {
            fetch(`/api/conversations/${activeItem.data.id}`)
                .then(res => res.json())
                .then(data => setMessages(Array.isArray(data) ? data : []))
                .catch(() => toast({ title: 'Error', description: 'No se pudieron cargar los mensajes.', variant: 'destructive'}));
        } else if (activeItem?.type === 'conversation' && activeItem.data.id.startsWith('temp-')) {
            setMessages([]);
        }
    }, [activeItem, toast]);
    
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
            {activeItem?.type === 'conversation' && activeItem.data.participants[0] ? (
                <MessageArea 
                    conversation={activeItem.data} 
                    messages={messages}
                    setMessages={setMessages}
                    onNewMessage={fetchConversations}
                />
            ) : activeItem?.type === 'announcement' ? (
                 <AnnouncementViewer announcement={activeItem.data} onBack={onBack} />
            ) : (
                <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground p-8 text-center bg-muted/30">
                    <MessageSquare className="h-16 w-16 mb-4"/><h3 className="text-lg font-semibold">Selecciona una conversación</h3><p className="text-sm">O inicia una nueva para empezar a chatear.</p>
                </div>
            )}
            
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
