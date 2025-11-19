// src/components/course-comments.tsx
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Loader2, Paperclip, XCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Identicon } from './ui/identicon';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from './ui/scroll-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from './ui/progress';
import { FileIcon } from './ui/file-icon';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from './ui/verified-badge';
import type { Attachment } from '@/types';

interface CommentAuthor {
    id: string;
    name: string | null;
    avatar: string | null;
    role: string;
}

interface CourseComment {
    id: string;
    content: string;
    createdAt: string;
    author: CommentAuthor;
    attachments: Attachment[];
}

interface LocalAttachment {
    id: string;
    file: File;
    progress: number;
    url?: string;
    error?: string;
}

const CommentCard = ({ comment }: { comment: CourseComment }) => {
    const { user } = useAuth();
    const isAuthor = user?.id === comment.author.id;

    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={comment.author.avatar || undefined} />
                <AvatarFallback><Identicon userId={comment.author.id} /></AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm flex items-center gap-1.5">
                        {comment.author.name}
                        <VerifiedBadge role={comment.author.role as any} />
                    </span>
                    <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "d MMM, HH:mm", { locale: es })}</span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                 {comment.attachments.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {comment.attachments.map(att => (
                             <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors border">
                                <FileIcon displayMode="list" type={att.type.split('/')[1] || 'file'} />
                                <span className="text-sm font-medium truncate flex-grow">{att.name}</span>
                            </a>
                        ))}
                    </div>
                 )}
            </div>
        </div>
    );
};

export const CourseComments = ({ courseId }: { courseId: string }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<CourseComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/comments`);
            if (!res.ok) throw new Error("No se pudieron cargar los comentarios.");
            const data = await res.json();
            setComments(data);
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [courseId, toast]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        const files = Array.from(event.target.files);
        const newAttachments: LocalAttachment[] = files.map(file => ({
            id: `${file.name}-${Date.now()}`,
            file,
            progress: 0,
        }));
        
        setAttachments(prev => [...prev, ...newAttachments]);

        newAttachments.forEach(att => {
            uploadWithProgress('/api/upload/comment-attachment', att.file, (progress) => {
                setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, progress } : a));
            }).then(result => {
                setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, url: result.url } : a));
            }).catch(err => {
                setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, error: (err as Error).message } : a));
            });
        });
        
        event.target.value = ''; // Reset input
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = async () => {
        if (!newComment.trim() && attachments.length === 0) return;
        
        const uploadingFiles = attachments.filter(att => att.progress < 100);
        if (uploadingFiles.length > 0) {
            toast({ title: "Archivos subiendo", description: "Espera a que todos los archivos terminen de subirse.", variant: "default" });
            return;
        }

        setIsSubmitting(true);
        try {
            const attachmentPayload = attachments
                .filter(att => att.url)
                .map(att => ({ name: att.file.name, url: att.url, type: att.file.type, size: att.file.size }));
            
            const response = await fetch(`/api/courses/${courseId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment, attachments: attachmentPayload }),
            });

            if (!response.ok) throw new Error("No se pudo publicar el comentario.");

            const createdComment = await response.json();
            setComments(prev => [...prev, createdComment]);
            setNewComment('');
            setAttachments([]);

        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin"/></div>
                    ) : comments.length > 0 ? (
                        comments.map(comment => <CommentCard key={comment.id} comment={comment} />)
                    ) : (
                        <div className="text-center py-10 text-muted-foreground text-sm">Sé el primero en iniciar la discusión.</div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-muted/50 rounded-b-xl">
                 {attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                        {attachments.map(att => (
                            <div key={att.id} className="p-2 border rounded-md bg-background relative">
                                <div className="flex items-center gap-2">
                                    <FileIcon displayMode="list" type={att.file.type.split('/')[1] || 'file'} />
                                    <span className="text-xs font-medium truncate">{att.file.name}</span>
                                </div>
                                <Progress value={att.progress} className="h-1 mt-1" />
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeAttachment(att.id)}><XCircle className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <Textarea 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder="Escribe tu comentario o pregunta aquí..." 
                        className="pr-24 min-h-[60px]"
                        disabled={isSubmitting}
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}><Paperclip className="h-5 w-5"/></Button>
                        <Button size="icon" onClick={handleSubmit} disabled={isSubmitting || (!newComment.trim() && attachments.length === 0)}>
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
