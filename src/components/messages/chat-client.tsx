// src/components/messages/chat-client.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ArrowLeft, Search, UserPlus, Info, MessageSquare, Paperclip, XCircle, FileText, Megaphone } from 'lucide-react';
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
import { User, Attachment, Announcement as AnnouncementType } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useRealtime } from '@/hooks/use-realtime';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import { getIconForFileType } from '@/lib/resource-utils';
import Image from 'next/image';
import { Card } from '../ui/card';
import { ConversationList } from './conversation-list';
import { AnnouncementsView } from '../announcements/announcements-view';
import { MessageArea } from './message-area';
import { AnnouncementViewer } from './announcement-viewer';

// Tipos
type Conversation = {
  id: string;
  participants: any[];
  messages: any[];
  updatedAt: string;
};
export interface LocalAttachmentPreview {
    id: string;
    file: File;
    previewUrl: string; // URL.createObjectURL
    finalUrl?: string; // URL from Supabase
    uploadProgress: number;
    error?: string;
}

// Componente principal del cliente de chat
export function ChatClient() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    
    const [activeItem, setActiveItem] = useState<{ type: 'conversation' | 'announcement', data: any } | null>(null);

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [usersForNewChat, setUsersForNewChat] = useState<User[]>([]);
    
    const [localPreviews, setLocalPreviews] = useState<LocalAttachmentPreview[]>([]);

    const newChatUserId = searchParams.get('new');
    
    // --- LÓGICA DE DATOS Y TIEMPO REAL ---

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
        fetchConversations(); // Re-fetch para reordenar la lista
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
    
    const handleStartNewChat = useCallback((recipient: User) => {
        setIsNewChatModalOpen(false);
        const existingConvo = conversations.find(c => c.participants.some(p => p.id === recipient.id));
        if (existingConvo) {
            setActiveItem({ type: 'conversation', data: existingConvo });
        } else {
            const tempConvo: Conversation = {
                id: `temp-${recipient.id}`, participants: [{...recipient}], messages: [], updatedAt: new Date().toISOString()
            };
            setConversations(prev => [tempConvo, ...prev]);
            setActiveItem({ type: 'conversation', data: tempConvo });
        }
    }, [conversations]);

    useEffect(() => {
        const handleNewChatParam = async () => {
            if (newChatUserId && user) {
                if(newChatUserId === user.id) { router.replace('/announcements', { scroll: false }); return; }
                const existingConvo = conversations.find(c => c.participants.some(p => p.id === newChatUserId));
                if (existingConvo) { setActiveItem({ type: 'conversation', data: existingConvo }); } 
                else {
                    if (usersForNewChat.length === 0) {
                        try {
                           const res = await fetch('/api/users/list');
                           const data = await res.json();
                           const allUsers = data.users || [];
                           setUsersForNewChat(allUsers);
                           const recipient = allUsers.find((u: User) => u.id === newChatUserId);
                           if (recipient) handleStartNewChat(recipient);
                        } catch (e) { console.error(e); }
                    } else {
                        const recipient = usersForNewChat.find(u => u.id === newChatUserId);
                        if (recipient) handleStartNewChat(recipient);
                    }
                }
                router.replace('/announcements', { scroll: false });
            }
        };
        if(!isLoadingConversations) { handleNewChatParam(); }
    }, [newChatUserId, user, conversations, usersForNewChat, router, isLoadingConversations, handleStartNewChat]);

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
        if (previewToRemove) URL.createObjectURL(previewToRemove.previewUrl);
        setLocalPreviews(prev => prev.filter(p => p.id !== id));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const recipient = activeItem?.type === 'conversation' ? activeItem.data.participants[0] : null;
        if (!recipient) { toast({ title: 'Error', description: 'No se ha seleccionado un destinatario.', variant: 'destructive'}); return; }
        const recipientId = recipient.id;
        if (!newMessage.trim() && localPreviews.length === 0) return;
        
        setIsSending(true);
        const attachmentsToSend = localPreviews.filter(p => p.finalUrl).map(p => ({
            name: p.file.name, url: p.finalUrl!, type: p.file.type, size: p.file.size
        }));
        
        const messageToSend = newMessage;
        setNewMessage(''); setLocalPreviews([]);
        
        try {
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId, content: messageToSend, attachments: attachmentsToSend }),
            });
            const sentMessage = await response.json();
            if (!response.ok) throw new Error(sentMessage.message || 'Error al enviar el mensaje');
            
            setMessages(prev => [...prev, sentMessage]);
            fetchConversations();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
            setNewMessage(messageToSend);
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


    const otherParticipant = activeItem?.type === 'conversation' ? activeItem.data.participants[0] : null;

    if (isAuthLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card className="flex h-full overflow-hidden shadow-none border-0 rounded-none md:rounded-xl md:border">
            {/* Sidebar con lista de chats y anuncios */}
            <aside className={cn("w-full md:w-80 lg:w-96 flex-shrink-0 border-r flex flex-col transition-transform duration-300 md:translate-x-0", activeItem ? "-translate-x-full" : "translate-x-0")}>
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Comunicaciones</h2>
                    <Button size="icon" variant="ghost" onClick={() => setIsNewChatModalOpen(true)}><UserPlus className="h-5 w-5" /></Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        <p className="px-2 pt-1 pb-2 text-xs font-semibold text-muted-foreground">MENSAJES</p>
                        {isLoadingConversations ? <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div> 
                        : conversations.length > 0 ? <ConversationList conversations={conversations} onSelect={(c) => setActiveItem({ type: 'conversation', data: c })} activeConversationId={activeItem?.type === 'conversation' ? activeItem.data.id : null} />
                        : <p className="text-xs text-center text-muted-foreground p-4">No hay conversaciones.</p>}

                        <p className="px-2 pt-4 pb-2 text-xs font-semibold text-muted-foreground">ANUNCIOS</p>
                        <AnnouncementsView onSelect={(a) => setActiveItem({ type: 'announcement', data: a })} selectedId={activeItem?.type === 'announcement' ? activeItem.data.id : null} />
                    </div>
                </ScrollArea>
            </aside>
            
            {/* Area de contenido principal */}
            <main className={cn("flex-1 flex flex-col transition-transform duration-300 w-full md:w-auto absolute md:static inset-0", activeItem ? "translate-x-0" : "translate-x-full md:translate-x-0")}>
                {activeItem?.type === 'conversation' && otherParticipant ? (
                    <>
                        <div className="p-3 border-b flex items-center gap-3 h-16">
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveItem(null)}><ArrowLeft/></Button>
                            <Avatar className="h-9 w-9 border"><AvatarImage src={otherParticipant.avatar || undefined} /><AvatarFallback><Identicon userId={otherParticipant.id} /></AvatarFallback></Avatar>
                            <h3 className="font-semibold text-sm">{otherParticipant.name}</h3>
                        </div>
                        <MessageArea messages={messages} currentUser={user} otherParticipant={otherParticipant}/>
                        <div className="p-4 border-t bg-background">
                            {/* Previsualización de adjuntos */}
                            {localPreviews.length > 0 && (
                                <div className="mb-2 p-2 border rounded-lg">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {localPreviews.map(p => (
                                            <div key={p.id} className="relative aspect-square border rounded-md overflow-hidden bg-muted/50">
                                                {p.file.type.startsWith('image/') && <Image src={p.previewUrl} alt={p.file.name} fill className="object-contain p-1" />}
                                                {!p.file.type.startsWith('image/') && <div className="flex flex-col items-center justify-center h-full text-center p-1"><FileText className="h-6 w-6 text-muted-foreground"/><p className="text-xs text-muted-foreground truncate w-full">{p.file.name}</p></div>}
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
                ) : activeItem?.type === 'announcement' ? (
                     <AnnouncementViewer announcement={activeItem.data} onBack={() => setActiveItem(null)} />
                ) : (
                    <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground p-8 text-center">
                        <MessageSquare className="h-16 w-16 mb-4"/><h3 className="text-lg font-semibold">Selecciona una conversación</h3><p className="text-sm">O inicia una nueva para empezar a chatear.</p>
                    </div>
                )}
            </main>
            
            <Dialog open={isNewChatModalOpen} onOpenChange={setIsNewChatModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Iniciar Nueva Conversación</DialogTitle><DialogDescription>Busca y selecciona un usuario para enviarle un mensaje.</DialogDescription></DialogHeader>
                    <Command><CommandInput placeholder="Buscar usuario..." /><CommandList><CommandEmpty>No se encontraron usuarios.</CommandEmpty><CommandGroup>
                       {usersForNewChat.map((u) => (
                        <CommandItem key={u.id} onSelect={() => handleStartNewChat(u)} className="flex items-center gap-3">
                             <Avatar className="h-8 w-8 border"><AvatarImage src={u.avatar || undefined} /><AvatarFallback><Identicon userId={u.id}/></AvatarFallback></Avatar>
                            <span>{u.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup></CommandList></Command>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
