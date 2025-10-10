// src/components/messages/chat-client.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ArrowLeft, Search, UserPlus, Info, MessageSquare, Paperclip, XCircle, File as FileIcon, Image as ImageIcon, Video as VideoIcon, FileQuestion } from 'lucide-react';
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
import { User, Attachment } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useRealtime } from '@/hooks/use-realtime';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import { getIconForFileType } from '@/lib/resource-utils';
import Image from 'next/image';

// Tipos
type Participant = { id: string; name: string | null; avatar: string | null };
type Message = {
  id: string;
  content: string | null;
  createdAt: string;
  authorId: string;
  author: Participant;
  conversationId: string;
  attachments: Attachment[];
};
type Conversation = {
  id: string;
  participants: Participant[];
  messages: Message[];
  updatedAt: string;
};
interface LocalAttachmentPreview {
    id: string;
    file: File;
    previewUrl: string; // URL.createObjectURL
    finalUrl?: string; // URL from Supabase
    uploadProgress: number;
    error?: string;
}

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
                const lastMessageText = lastMessage?.content || (lastMessage?.attachments?.length > 0 ? `Adjunto: ${lastMessage.attachments[0].name}` : 'Conversación iniciada');

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
                                {lastMessage && <p className="text-xs text-muted-foreground shrink-0 ml-2">{format(parseISO(lastMessage.createdAt), 'p', { locale: es })}</p>}
                            </div>
                            {lastMessage && <p className="text-sm text-muted-foreground truncate">{lastMessageText}</p>}
                        </div>
                    </button>
                )
            })}
        </div>
    </ScrollArea>
);

const AttachmentPreview = ({ attachment }: { attachment: Attachment }) => {
    const FileIconComponent = getIconForFileType(attachment.type);

    if (attachment.type.startsWith('image/')) {
        return <Image src={attachment.url} alt={attachment.name} width={300} height={200} className="rounded-lg object-cover" />;
    }
    if (attachment.type.startsWith('video/')) {
        return <video src={attachment.url} controls className="w-full max-w-xs rounded-lg" />;
    }

    return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80">
            <FileIconComponent className="h-6 w-6 text-primary" />
            <span className="truncate text-sm font-medium">{attachment.name}</span>
        </a>
    );
}

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
                             <Avatar className="h-8 w-8 self-end">
                                <AvatarImage src={otherParticipant?.avatar || undefined} />
                                <AvatarFallback><Identicon userId={otherParticipant?.id || ''} /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl flex flex-col gap-2",
                            isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                        )}>
                            {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="space-y-2">
                                    {msg.attachments.map(att => <AttachmentPreview key={att.id} attachment={att} />)}
                                </div>
                            )}
                            <p className={cn("text-xs mt-1 self-end", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
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
    
    const [localPreviews, setLocalPreviews] = useState<LocalAttachmentPreview[]>([]);

    const newChatUserId = searchParams.get('new');
    
    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
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
    
    const handleNewMessage = useCallback((payload: { event: string, payload: Message }) => {
        const { event, payload: receivedMessage } = payload;
        
        if (event !== 'chat_message') return;

        if (activeConversation && receivedMessage.conversationId === activeConversation.id) {
            setMessages(prevMessages => [...prevMessages, receivedMessage]);
        }
        
        setConversations(prev => {
            const convoIndex = prev.findIndex(c => c.id === receivedMessage.conversationId);
            if (convoIndex > -1) {
                const updatedConvo = { ...prev[convoIndex], messages: [receivedMessage], updatedAt: receivedMessage.createdAt };
                const restConvos = prev.filter(c => c.id !== receivedMessage.conversationId);
                return [updatedConvo, ...restConvos];
            }
            fetchConversations();
            return prev;
        });
    }, [activeConversation, fetchConversations]);

    useRealtime(user ? `user:${user.id}` : null, handleNewMessage);
    
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchConversations();
        }
    }, [user, isAuthLoading, fetchConversations]);

    useEffect(() => {
        if (activeConversation && !activeConversation.id.startsWith('temp-')) {
            fetch(`/api/conversations/${activeConversation.id}`)
                .then(res => res.json())
                .then(data => setMessages(Array.isArray(data) ? data : []))
                .catch(() => toast({ title: 'Error', description: 'No se pudieron cargar los mensajes.', variant: 'destructive'}));
        } else if (activeConversation?.id.startsWith('temp-')) {
            setMessages([]);
        }
    }, [activeConversation, toast]);
    
    const handleStartNewChat = useCallback(async (recipient: User) => {
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
    }, [conversations]);

    useEffect(() => {
        const handleNewChatParam = async () => {
            if (newChatUserId && user) {
                if(newChatUserId === user.id) {
                    router.replace('/messages', { scroll: false });
                    return;
                }
                const existingConvo = conversations.find(c => c.participants.some(p => p.id === newChatUserId));
                if (existingConvo) {
                    setActiveConversation(existingConvo);
                } else {
                    if (usersForNewChat.length === 0) {
                        try {
                           const res = await fetch('/api/users/list');
                           const data = await res.json();
                           const allUsers = data.users || [];
                           setUsersForNewChat(allUsers);
                           const recipient = allUsers.find((u: User) => u.id === newChatUserId);
                           if (recipient) handleStartNewChat(recipient);
                        } catch (e) {
                            console.error("Failed to pre-fetch users for new chat", e);
                        }
                    } else {
                        const recipient = usersForNewChat.find(u => u.id === newChatUserId);
                        if (recipient) handleStartNewChat(recipient);
                    }
                }
                router.replace('/messages', { scroll: false });
            }
        };
        if(!isLoading) {
            handleNewChatParam();
        }
    }, [newChatUserId, user, conversations, usersForNewChat, router, isLoading, handleStartNewChat]);
    
    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        const newPreview: LocalAttachmentPreview = {
            id: `${file.name}-${Date.now()}`, file,
            previewUrl: URL.createObjectURL(file), uploadProgress: 0
        };
        setLocalPreviews(prev => [...prev, newPreview]);
        uploadFile(newPreview);
    };

    const uploadFile = async (preview: LocalAttachmentPreview) => {
        try {
            const result = await uploadWithProgress('/api/upload/chat-attachment', preview.file, (progress) => {
                setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, uploadProgress: progress } : p));
            });
            setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, finalUrl: result.url, uploadProgress: 100 } : p));
        } catch (err) {
            setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, error: (err as Error).message } : p));
        }
    };
    
     const removePreview = (id: string) => {
        const previewToRemove = localPreviews.find(p => p.id === id);
        if (previewToRemove) URL.revokeObjectURL(previewToRemove.previewUrl);
        setLocalPreviews(prev => prev.filter(p => p.id !== id));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const recipientId = activeConversation?.participants[0]?.id;
        if (!recipientId || (!newMessage.trim() && localPreviews.length === 0)) return;
        
        const isStillUploading = localPreviews.some(p => p.uploadProgress > 0 && p.uploadProgress < 100);
        if (isStillUploading) {
            toast({ title: "Subida en progreso", description: "Espera a que todos los archivos terminen de subirse." });
            return;
        }
        
        setIsSending(true);
        const attachmentsToSend = localPreviews.filter(p => p.finalUrl).map(p => ({
            name: p.file.name, url: p.finalUrl!, type: p.file.type, size: p.file.size
        }));
        
        const messageToSend = newMessage;
        setNewMessage('');
        setLocalPreviews([]);
        
        try {
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId, content: messageToSend, attachments: attachmentsToSend }),
            });
            const sentMessage = await response.json();
            if (!response.ok) throw new Error(sentMessage.message || 'Error al enviar el mensaje');
            
            setMessages(prev => [...prev, sentMessage]);
            if (activeConversation?.id.startsWith('temp-')) {
                fetchConversations(); // Recarga las conversaciones para obtener el ID real
            }
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
            setNewMessage(messageToSend); // Restore failed message
            // Restore previews too? For now, we clear them.
        } finally {
            setIsSending(false);
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
            <aside className={cn("w-full md:w-80 lg:w-96 flex-shrink-0 border-r flex flex-col transition-transform duration-300 md:translate-x-0", activeConversation ? "-translate-x-full" : "translate-x-0")}>
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Conversaciones</h2>
                    <Button size="icon" variant="ghost" onClick={() => setIsNewChatModalOpen(true)}><UserPlus className="h-5 w-5" /></Button>
                </div>
                {conversations.length > 0 ? (
                    <ConversationList conversations={conversations} onSelect={setActiveConversation} activeConversationId={activeConversation?.id || null} />
                ) : (
                     <div className="p-4 text-center text-sm text-muted-foreground h-full flex flex-col items-center justify-center">
                        <Info className="h-8 w-8 mb-2"/><p>No tienes conversaciones.</p>
                        <Button variant="link" onClick={() => setIsNewChatModalOpen(true)}>Inicia una nueva.</Button>
                    </div>
                )}
            </aside>
            <main className={cn("flex-1 flex flex-col transition-transform duration-300 w-full md:w-auto absolute md:static inset-0", activeConversation ? "translate-x-0" : "translate-x-full md:translate-x-0")}>
                {activeConversation && otherParticipant ? (
                    <>
                        <div className="p-3 border-b flex items-center gap-3 h-16">
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConversation(null)}><ArrowLeft/></Button>
                            <Avatar className="h-9 w-9"><AvatarImage src={otherParticipant.avatar || undefined} /><AvatarFallback><Identicon userId={otherParticipant.id} /></AvatarFallback></Avatar>
                            <h3 className="font-semibold">{otherParticipant.name}</h3>
                        </div>
                        <MessageArea messages={messages} currentUser={user} otherParticipant={otherParticipant}/>
                        <div className="p-4 border-t bg-background">
                            {localPreviews.length > 0 && (
                                <div className="mb-2 p-2 border rounded-lg">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {localPreviews.map(p => (
                                            <div key={p.id} className="relative aspect-square border rounded-md overflow-hidden bg-muted/50">
                                                {p.file.type.startsWith('image/') && <Image src={p.previewUrl} alt={p.file.name} fill className="object-contain p-1" />}
                                                {!p.file.type.startsWith('image/') && <div className="flex flex-col items-center justify-center h-full text-center p-1"><FileIcon className="h-6 w-6 text-muted-foreground"/><p className="text-xs text-muted-foreground truncate w-full">{p.file.name}</p></div>}
                                                <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center p-1 transition-opacity", p.uploadProgress === 100 ? "opacity-0 hover:opacity-100" : "")}>
                                                    {p.uploadProgress > 0 && p.uploadProgress < 100 && !p.error && <Progress value={p.uploadProgress} className="h-1 w-10/12"/>}
                                                    {p.error && <AlertTriangle className="h-6 w-6 text-destructive"/>}
                                                </div>
                                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={() => removePreview(p.id)}><XCircle className="h-3 w-3"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-start gap-2">
                                <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 resize-none" rows={1} disabled={isSending} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => document.getElementById('chat-file-upload')?.click()} disabled={isSending}><Paperclip className="h-4 w-4" /></Button>
                                <input id="chat-file-upload" type="file" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} className="hidden" />
                                <Button type="submit" disabled={isSending || (!newMessage.trim() && localPreviews.length === 0)} size="icon"><Send className="h-4 w-4"/></Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground p-8 text-center">
                        <MessageSquare className="h-16 w-16 mb-4"/><h3 className="text-lg font-semibold">Selecciona una conversación</h3><p className="text-sm">O inicia una nueva para empezar a chatear.</p>
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
                                 <Avatar className="h-8 w-8"><AvatarImage src={u.avatar || undefined} /><AvatarFallback><Identicon userId={u.id}/></AvatarFallback></Avatar>
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
