// src/components/messages/chat-client.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ArrowLeft, Search, UserPlus, Info, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { ScrollArea } from '../ui/scroll-area';
import { User } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';

// Tipos
type Participant = { id: string; name: string | null; avatar: string | null };
type Message = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: Participant;
};
type Conversation = {
  id: string;
  participants: Participant[];
  messages: Message[];
  updatedAt: string;
};

// Componente para la lista de conversaciones
const ConversationList = ({ conversations, onSelect, activeConversationId }: {
  conversations: Conversation[];
  onSelect: (c: Conversation) => void;
  activeConversationId: string | null;
}) => (
    <ScrollArea className="h-full">
        <div className="flex flex-col gap-1 p-2">
            {conversations.map(c => {
                const otherParticipant = c.participants[0];
                if (!otherParticipant) return null;
                
                const lastMessage = c.messages[0];
                return (
                    <button
                        key={c.id}
                        onClick={() => onSelect(c)}
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg text-left transition-colors w-full",
                            activeConversationId === c.id ? "bg-primary/10" : "hover:bg-muted"
                        )}
                    >
                        <Avatar className="h-11 w-11">
                            <AvatarImage src={otherParticipant.avatar || undefined} />
                            <AvatarFallback><Identicon userId={otherParticipant.id} /></AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold truncate">{otherParticipant.name}</p>
                                {lastMessage && <p className="text-xs text-muted-foreground">{format(parseISO(lastMessage.createdAt), 'p', { locale: es })}</p>}
                            </div>
                            {lastMessage && <p className="text-sm text-muted-foreground truncate">{lastMessage.content}</p>}
                        </div>
                    </button>
                )
            })}
        </div>
    </ScrollArea>
);

// Componente para mostrar los mensajes de una conversación
const MessageArea = ({ messages, currentUser, otherParticipant }: {
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
                const isCurrentUser = msg.authorId === currentUser.id;
                return (
                    <div key={msg.id} className={cn("flex gap-3", isCurrentUser ? "justify-end" : "justify-start")}>
                        {!isCurrentUser && (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={otherParticipant?.avatar || undefined} />
                                <AvatarFallback><Identicon userId={otherParticipant?.id || ''} /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl",
                            isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                        )}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={cn("text-xs mt-1", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                {format(parseISO(msg.createdAt), 'p', { locale: es })}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
};

// Componente principal del cliente de chat
export function ChatClient() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [usersForNewChat, setUsersForNewChat] = useState<User[]>([]);

    const newChatUserId = searchParams.get('new');
    
    // El callback que se pasa al hook
    const handleNewMessage = useCallback((newMessage: Message) => {
        // Solo actualiza si el mensaje pertenece a la conversación activa
        if (activeConversation && newMessage.conversationId === activeConversation.id) {
            setMessages(prevMessages => [...prevMessages, newMessage]);
        }
        // Actualiza el último mensaje en la lista de conversaciones
        setConversations(prev => {
            const convoIndex = prev.findIndex(c => c.id === newMessage.conversationId);
            if (convoIndex > -1) {
                const updatedConvo = { ...prev[convoIndex], messages: [newMessage], updatedAt: newMessage.createdAt };
                const restConvos = prev.filter(c => c.id !== newMessage.conversationId);
                // Mover la conversación actualizada al principio de la lista
                return [updatedConvo, ...restConvos];
            }
            // Si la conversación es nueva para este usuario, la recargamos
            fetchConversations();
            return prev;
        });
    }, [activeConversation]);

    // Usamos el hook para la conversación activa
    useRealtimeChat(activeConversation?.id ?? null, handleNewMessage);
    
    // Fetch all conversations
    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error("No se pudieron cargar las conversaciones");
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchConversations();
        }
    }, [user, isAuthLoading, fetchConversations]);

    // Fetch messages for active conversation
    useEffect(() => {
        if (activeConversation && !activeConversation.id.startsWith('temp-')) {
            fetch(`/api/conversations/${activeConversation.id}`)
                .then(res => res.json())
                .then(data => setMessages(Array.isArray(data) ? data : []))
                .catch(() => toast({ title: 'Error', description: 'No se pudieron cargar los mensajes.', variant: 'destructive'}));
        } else if (activeConversation && activeConversation.id.startsWith('temp-')) {
            setMessages([]);
        }
    }, [activeConversation, toast]);
    
    // Handle opening a new chat from URL param
    useEffect(() => {
        if (newChatUserId && conversations.length > 0) {
            const existingConvo = conversations.find(c => c.participants.some(p => p.id === newChatUserId));
            if (existingConvo) {
                setActiveConversation(existingConvo);
                router.replace('/messages', { scroll: false }); 
            } else {
                setIsNewChatModalOpen(true);
            }
        }
    }, [newChatUserId, conversations, router]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const recipientId = activeConversation?.participants[0]?.id;
        if (!newMessage.trim() || !recipientId) return;

        setIsSending(true);
        const tempMessageId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempMessageId,
            content: newMessage,
            createdAt: new Date().toISOString(),
            authorId: user!.id,
            author: user!,
        };
        
        // Optimistic update
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        
        try {
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId, content: newMessage }),
            });
            const sentMessage = await response.json();
            if (!response.ok) throw new Error(sentMessage.message || 'Error al enviar el mensaje');
            
            // Replace temporary message with the real one from the server
            setMessages(prev => prev.map(m => m.id === tempMessageId ? sentMessage : m));
            
            // If it was a temporary conversation, fetch all conversations to get the new one with its real ID.
            if (activeConversation?.id.startsWith('temp-')) {
                await fetchConversations();
                const realConvo = conversations.find(c => c.participants.some(p => p.id === recipientId));
                if (realConvo) setActiveConversation(realConvo);
            }
            
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
            // Revert optimistic update
            setMessages(prev => prev.filter(m => m.id !== tempMessageId));
        } finally {
            setIsSending(false);
        }
    };
    
    const handleStartNewChat = async (recipient: User) => {
        setIsNewChatModalOpen(false);
        const existingConvo = conversations.find(c => c.participants.some(p => p.id === recipient.id));
        if (existingConvo) {
            setActiveConversation(existingConvo);
        } else {
            const tempConvo: Conversation = {
                id: `temp-${recipient.id}`,
                participants: [{...recipient}],
                messages: [],
                updatedAt: new Date().toISOString()
            };
            setConversations(prev => [tempConvo, ...prev]);
            setActiveConversation(tempConvo);
        }
    };
    
    useEffect(() => {
        if(isNewChatModalOpen) {
            fetch('/api/users/list')
                .then(res => res.json())
                .then(data => setUsersForNewChat(data.users || []));
        }
    }, [isNewChatModalOpen]);


    const otherParticipant = activeConversation?.participants[0] || null;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card border rounded-lg overflow-hidden">
            <aside className={cn(
                "w-full md:w-80 lg:w-96 flex-shrink-0 border-r flex flex-col transition-transform duration-300 md:translate-x-0",
                activeConversation ? "-translate-x-full" : "translate-x-0"
            )}>
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Conversaciones</h2>
                    <Button size="icon" variant="ghost" onClick={() => setIsNewChatModalOpen(true)}>
                        <UserPlus className="h-5 w-5" />
                    </Button>
                </div>
                {conversations.length > 0 ? (
                    <ConversationList conversations={conversations} onSelect={setActiveConversation} activeConversationId={activeConversation?.id || null} />
                ) : (
                     <div className="p-4 text-center text-sm text-muted-foreground h-full flex flex-col items-center justify-center">
                        <Info className="h-8 w-8 mb-2"/>
                        <p>No tienes conversaciones.</p>
                        <Button variant="link" onClick={() => setIsNewChatModalOpen(true)}>Inicia una nueva.</Button>
                    </div>
                )}
            </aside>
            <main className={cn(
                "flex-1 flex flex-col transition-transform duration-300 w-full md:w-auto absolute md:static inset-0",
                activeConversation ? "translate-x-0" : "translate-x-full md:translate-x-0"
            )}>
                {activeConversation && otherParticipant ? (
                    <>
                        <div className="p-3 border-b flex items-center gap-3 h-16">
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConversation(null)}><ArrowLeft/></Button>
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={otherParticipant.avatar || undefined} />
                                <AvatarFallback><Identicon userId={otherParticipant.id} /></AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold">{otherParticipant.name}</h3>
                        </div>
                        <MessageArea messages={messages} currentUser={user} otherParticipant={otherParticipant}/>
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex items-start gap-2">
                                <Textarea 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 resize-none"
                                    rows={1}
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <Button type="submit" disabled={isSending || !newMessage.trim()} size="icon">
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground p-8 text-center">
                        <MessageSquare className="h-16 w-16 mb-4"/>
                        <h3 className="text-lg font-semibold">Selecciona una conversación</h3>
                        <p className="text-sm">O inicia una nueva para empezar a chatear.</p>
                    </div>
                )}
            </main>
            
            <Dialog open={isNewChatModalOpen} onOpenChange={setIsNewChatModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Iniciar Nueva Conversación</DialogTitle>
                        <DialogDescription>Busca y selecciona un usuario para enviarle un mensaje.</DialogDescription>
                    </DialogHeader>
                    <Command>
                      <CommandInput placeholder="Buscar usuario..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                        <CommandGroup>
                           {usersForNewChat.map((u) => (
                            <CommandItem key={u.id} onSelect={() => handleStartNewChat(u)} className="flex items-center gap-3">
                                 <Avatar className="h-8 w-8">
                                    <AvatarImage src={u.avatar || undefined} />
                                    <AvatarFallback><Identicon userId={u.id}/></AvatarFallback>
                                </Avatar>
                                <span>{u.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </div>
    );
}
