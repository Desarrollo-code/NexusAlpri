// src/components/messages/chat-client.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Info, MessageSquare, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import type { User, Attachment, Announcement as AnnouncementType, Conversation as AppConversation } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ConversationList } from './conversation-list';
import { useRealtime } from '@/hooks/use-realtime';
import { MessageArea } from './message-area';
import { MessageInput } from './message-input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { AnnouncementViewer } from './announcement-viewer';
import { Separator } from '../ui/separator';
import { AnnouncementsView } from '../announcements/announcements-view';

interface ChatClientProps {
  newChatUserId?: string | null;
}

export function ChatClient({ newChatUserId }: ChatClientProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const [conversations, setConversations] = useState<AppConversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [activeConversation, setActiveConversation] = useState<AppConversation | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    
    const handleRealtimeMessage = useCallback((payload: any) => {
        if (payload.conversationId === activeConversation?.id) {
            setMessages(prev => [...prev, payload]);
        }
        
        setConversations(prev => {
            const convoIndex = prev.findIndex(c => c.id === payload.conversationId);
            if (convoIndex > -1) {
                const updatedConvo = { ...prev[convoIndex], messages: [payload], updatedAt: payload.createdAt };
                const restConvos = prev.filter(c => c.id !== payload.conversationId);
                return [updatedConvo, ...restConvos];
            }
            fetchConversations();
            return prev;
        });

    }, [activeConversation?.id]);
    
    useRealtime(user ? `user:${user.id}` : null, handleRealtimeMessage);

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
    
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchConversations();
        }
    }, [user, isAuthLoading, fetchConversations]);

    const handleSelectConversation = useCallback(async (convo: AppConversation) => {
      setActiveConversation(convo);
      setIsLoadingMessages(true);
      try {
        if(convo.id.startsWith('temp-')) {
          setMessages([]);
          return;
        }
        const res = await fetch(`/api/conversations/${convo.id}`);
        if (!res.ok) throw new Error('No se pudieron cargar los mensajes.');
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      } finally {
        setIsLoadingMessages(false);
      }
    }, [toast]);
    
     useEffect(() => {
        if (newChatUserId && conversations.length > 0) {
            const existingConvo = conversations.find(c => c.participants.some(p => p.id === newChatUserId));
            if (existingConvo) {
                handleSelectConversation(existingConvo);
            }
        }
    }, [newChatUserId, conversations, handleSelectConversation]);

    const handleSendMessage = async (content: string, attachments: any[]) => {
      if (!activeConversation || !user) return;

      const recipientId = activeConversation.participants[0]?.id;
      if (!recipientId) return;

      const tempMessageId = `temp-${Date.now()}`;
      const newMessage = {
          id: tempMessageId,
          content,
          authorId: user.id,
          author: { id: user.id, name: user.name, avatar: user.avatar },
          createdAt: new Date().toISOString(),
          attachments
      };
      setMessages(prev => [...prev, newMessage]);

      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId, content, attachments }),
        });
        const savedMessage = await response.json();
        if (!response.ok) throw new Error(savedMessage.message);
        
        setMessages(prev => prev.map(m => m.id === tempMessageId ? savedMessage : m));
        
        if(activeConversation.id.startsWith('temp-')) {
            await fetchConversations();
            setActiveConversation(prev => prev ? {...prev, id: savedMessage.conversationId} : null);
        }

      } catch (error) {
        toast({ title: "Error al enviar", description: (error as Error).message, variant: 'destructive' });
        setMessages(prev => prev.filter(m => m.id !== tempMessageId));
      }
    };


    if (isAuthLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
      <Card className="flex h-full overflow-hidden">
          <aside className={cn(
              "w-full md:w-80 lg:w-96 flex-shrink-0 border-r flex flex-col transition-transform duration-300 ease-in-out",
              isMobile && activeConversation ? "-translate-x-full" : "translate-x-0",
              !isMobile && "md:translate-x-0"
          )}>
               <div className="flex-grow flex flex-col min-h-0">
                  <div className="p-4 border-b">
                     <h2 className="text-lg font-semibold">Mensajes</h2>
                  </div>
                  <ConversationList
                      conversations={conversations}
                      onSelect={handleSelectConversation}
                      activeConversationId={activeConversation?.id || null}
                      isLoading={isLoadingConversations}
                  />
               </div>
               <div className="flex-shrink-0 h-1/3 min-h-[200px] border-t flex flex-col">
                  <AnnouncementsView />
               </div>
          </aside>

          <main className={cn(
              "flex-1 flex flex-col transition-transform duration-300 ease-in-out",
              isMobile && "absolute inset-0 bg-card",
              isMobile && !activeConversation ? "translate-x-full" : "translate-x-0"
          )}>
              {activeConversation ? (
                  <>
                      <header className="p-3 border-b flex items-center gap-3 h-16 shrink-0">
                          {isMobile && <Button variant="ghost" size="icon" onClick={() => setActiveConversation(null)}><ArrowLeft/></Button>}
                          <Avatar className="h-9 w-9 border">
                              <AvatarImage src={activeConversation.participants[0]?.avatar || undefined} />
                              <AvatarFallback><Identicon userId={activeConversation.participants[0]?.id || ''} /></AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold">{activeConversation.participants[0]?.name}</h3>
                      </header>
                      
                      {isLoadingMessages ? (
                        <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
                      ) : (
                        <MessageArea messages={messages} currentUser={user} otherParticipant={activeConversation.participants[0]} />
                      )}
                      
                      <div className="p-4 border-t bg-muted/30">
                          <MessageInput onSendMessage={handleSendMessage} />
                      </div>
                  </>
              ) : (
                  <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground bg-card p-8 text-center">
                      <MessageSquare className="h-16 w-16 mb-4"/>
                      <h3 className="text-lg font-semibold">Selecciona una conversación</h3>
                      <p className="text-sm">O inicia una nueva para empezar a chatear.</p>
                  </div>
              )}
          </main>
      </Card>
    );
}
