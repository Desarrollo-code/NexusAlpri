// src/components/messages/chat-client.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Bell, Megaphone, UserPlus, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { User, Attachment, Announcement as AnnouncementType, Conversation as AppConversation, Notification as AppNotification } from '@/types';
import { ConversationList } from './conversation-list';
import { useRealtime } from '@/hooks/use-realtime';
import { MessageArea } from './message-area';
import { MessageInput } from './message-input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { AnnouncementViewer } from './announcement-viewer';
import { AnnouncementsView } from '../announcements/announcements-view';
import { NotificationsView } from '../announcements/notifications-view';
import { NewConversationModal } from './new-conversation-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type ActiveListView = 'chats' | 'announcements' | 'notifications';

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
    
    const [activeListView, setActiveListView] = useState<ActiveListView>('chats');
    const [activeAnnouncement, setActiveAnnouncement] = useState<AnnouncementType | null>(null);

    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);

    const handleRealtimeEvent = useCallback((payload: any) => {
        const { event, payload: data } = payload;
        
        switch(event) {
            case 'chat_message':
                const isForActiveConvo = data.conversationId === activeConversation?.id;
                if (isForActiveConvo) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                }
                fetchConversations(); // Re-fetch all conversations to update the list and last message
                break;
            
            case 'announcement_deleted':
                 if (activeAnnouncement?.id === data.id) {
                    setActiveAnnouncement(null); // Close the viewer if the active announcement is deleted
                }
                break;
            case 'announcement_updated':
                 if (activeAnnouncement?.id === data.id) {
                    setActiveAnnouncement(data); // Update the viewer with new data
                }
                break;
        }

    }, [activeConversation?.id, activeAnnouncement?.id]);
    
    useRealtime(user ? `user:${user.id}` : null, handleRealtimeEvent);
    useRealtime('announcements', handleRealtimeEvent);

    const fetchConversations = useCallback(async () => {
        // Don't set loading to true for background polling
        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error("No se pudieron cargar las conversaciones");
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            // Silently fail for polling
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);
    
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchConversations();
            // Polling interval
            const intervalId = setInterval(fetchConversations, 15000); // Poll every 15 seconds
            return () => clearInterval(intervalId);
        }
    }, [user, isAuthLoading, fetchConversations]);
    
    const handleSelectConversation = useCallback(async (convo: AppConversation) => {
      setActiveConversation(convo);
      setActiveAnnouncement(null);
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
    
    const handleStartNewConversation = (participant: User) => {
        const existingConvo = conversations.find(c => c.participants.some(p => p.id === participant.id) && c.participants.length === 1);
        if (existingConvo) {
            handleSelectConversation(existingConvo);
        } else {
             const tempConvo: AppConversation = {
                id: `temp-${participant.id}`,
                participants: [participant],
                messages: [],
                updatedAt: new Date().toISOString(),
                isGroup: false,
             };
             setActiveConversation(tempConvo);
             setMessages([]);
        }
    }
    
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
          id: tempMessageId, content, authorId: user.id, author: { id: user.id, name: user.name, avatar: user.avatar },
          createdAt: new Date().toISOString(), attachments
      };
      setMessages(prev => [...prev, newMessage]);

      try {
        const response = await fetch('/api/conversations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId, content, attachments }),
        });
        const savedMessage = await response.json();
        if (!response.ok) throw new Error(savedMessage.message);
        
        setMessages(prev => prev.map(m => m.id === tempMessageId ? savedMessage : m));
        
        if(activeConversation.id.startsWith('temp-')) {
            await fetchConversations();
            setActiveConversation(prev => prev ? {...prev, id: savedMessage.conversationId} : null);
        } else {
             fetchConversations();
        }

      } catch (error) {
        toast({ title: "Error al enviar", description: (error as Error).message, variant: 'destructive' });
        setMessages(prev => prev.filter(m => m.id !== tempMessageId));
      }
    };
    
    const renderListView = () => (
        <Tabs defaultValue="chats" className="flex flex-col h-full">
            <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chats"><MessageSquare className="h-4 w-4 mr-2"/>Chats</TabsTrigger>
                    <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 mr-2"/>Anuncios</TabsTrigger>
                </TabsList>
            </CardHeader>
            <TabsContent value="chats" className="p-0 m-0 flex-1 min-h-0">
                <ConversationList conversations={conversations} onSelect={handleSelectConversation} activeConversationId={activeConversation?.id || null} isLoading={isLoadingConversations} onNewChat={() => setIsNewConvoModalOpen(true)}/>
            </TabsContent>
            <TabsContent value="announcements" className="p-0 m-0 flex-1 min-h-0">
                <AnnouncementsView onSelectAnnouncement={setActiveAnnouncement} />
            </TabsContent>
        </Tabs>
    );

    
    const renderMainView = () => {
        if (activeConversation) {
             return (
                  <div className="flex flex-col h-full bg-background">
                      <header className="p-3 border-b flex items-center gap-3 h-16 shrink-0">
                          {isMobile && <Button variant="ghost" size="icon" onClick={() => setActiveConversation(null)}><Info/></Button>}
                          <Avatar className="h-9 w-9 border">
                              <AvatarImage src={activeConversation.participants[0]?.avatar || undefined} />
                              <AvatarFallback><Identicon userId={activeConversation.participants[0]?.id || ''} /></AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold">{activeConversation.participants[0]?.name}</h3>
                      </header>
                      <div className="flex-1 min-h-0">
                          {isLoadingMessages ? (
                            <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
                          ) : (
                            <MessageArea messages={messages} currentUser={user} otherParticipant={activeConversation.participants[0]} />
                          )}
                      </div>
                      <div className="p-4 border-t bg-muted/30">
                          <MessageInput onSendMessage={handleSendMessage} />
                      </div>
                  </div>
              )
        }
        if (activeAnnouncement) {
            return <AnnouncementViewer announcement={activeAnnouncement} onBack={() => setActiveAnnouncement(null)} />;
        }
        return (
            <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground bg-card p-8 text-center">
                <MessageSquare className="h-16 w-16 mb-4"/>
                <h3 className="text-lg font-semibold">Selecciona una conversación</h3>
                <p className="text-sm">O inicia una nueva para empezar a chatear.</p>
            </div>
        )
    }

    if (isAuthLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
      <Card className="h-full w-full rounded-none md:rounded-lg flex overflow-hidden border-0 md:border">
        {/* List Panel */}
        <aside className={cn(
          "w-full md:w-80 lg:w-96 flex-shrink-0 border-r flex-col transition-transform duration-300 ease-in-out bg-card",
          isMobile && (activeConversation || activeAnnouncement) ? "hidden" : "flex",
        )}>
            {renderListView()}
        </aside>

        {/* Main Content Panel */}
        <main className={cn(
          "flex-1 flex flex-col transition-transform duration-300 ease-in-out",
          isMobile && "absolute inset-0 bg-card z-10",
          isMobile && (!activeConversation && !activeAnnouncement) ? "hidden" : "flex"
        )}>
           {renderMainView()}
        </main>
        
        <NewConversationModal
            isOpen={isNewConvoModalOpen}
            onClose={() => setIsNewConvoModalOpen(false)}
            onSelectParticipant={(participant) => {
                setIsNewConvoModalOpen(false);
                handleStartNewConversation(participant);
            }}
        />
      </Card>
    );
}
