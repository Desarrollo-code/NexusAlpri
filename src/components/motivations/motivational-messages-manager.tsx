// src/components/motivations/motivational-messages-manager.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { MotivationalMessage, Course } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, PlusCircle, Sparkles, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { MotivationEditorModal } from './motivation-editor-modal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { getMotivationalTriggerLabel } from '@/lib/utils';
import { EmptyState } from '../empty-state';
import { Skeleton } from '../ui/skeleton';

const MotivationCardSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader className="p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center bg-muted">
            <Skeleton className="w-full aspect-video" />
        </CardContent>
        <CardFooter className="p-2 border-t flex justify-end gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
        </CardFooter>
    </Card>
);

interface MotivationalMessagesManagerProps {
    isEditorOpen: boolean;
    onOpenEditor: (message?: MotivationalMessage | null) => void;
    onCloseEditor: () => void;
    editingMessage: MotivationalMessage | null;
    onSave: () => void;
    refreshTrigger: number;
}

const MotivationCard = ({ message, onEdit, onDelete }: { message: MotivationalMessage & { triggerCourse?: { title: string } | null }, onEdit: (m: MotivationalMessage) => void, onDelete: (m: MotivationalMessage) => void }) => {
    return (
        <Card className="flex flex-col h-full overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/60 hover:border-primary/50 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <CardHeader className="p-4 bg-muted/20 border-b border-border/50">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-bold truncate pr-2" title={message.title}>{message.title}</CardTitle>
                        <CardDescription className="text-xs truncate flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary/70" />
                            {getMotivationalTriggerLabel(message.triggerType, message.triggerCourse)}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-grow flex items-center justify-center bg-muted/10 relative overflow-hidden">
                {message.imageUrl ? (
                    <div className="relative w-full aspect-video group-hover:scale-105 transition-transform duration-500">
                        <Image src={message.imageUrl} alt={message.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-8 flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium">Solo Texto</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-3 border-t bg-card/50 flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => onEdit(message)} title="Editar">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(message)} title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}

export function MotivationalMessagesManager({
    isEditorOpen,
    onOpenEditor,
    onCloseEditor,
    editingMessage,
    onSave,
    refreshTrigger
}: MotivationalMessagesManagerProps) {
    const { user, settings } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [deletingMessage, setDeletingMessage] = useState<MotivationalMessage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const fetchMessages = useCallback(async (isMountedRef?: { current: boolean }) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/motivations');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'No se pudieron cargar los mensajes' }));
                throw new Error(errorData.message);
            }
            const data = await response.json();
            if (!isMountedRef || isMountedRef.current) {
                setMessages(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            if (!isMountedRef || isMountedRef.current) {
                const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
                setError(errorMessage);
                setMessages([]);
            }
        } finally {
            if (!isMountedRef || isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);


    useEffect(() => {
        const isMountedRef = { current: true };
        if (user) {
            fetchMessages(isMountedRef);
        }
        return () => { isMountedRef.current = false };
    }, [user, fetchMessages, refreshTrigger]);


    const handleDeleteConfirm = async () => {
        if (!deletingMessage) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/motivations/${deletingMessage.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar el mensaje.');
            }
            toast({ title: "Mensaje Eliminado", description: `El mensaje "${deletingMessage.title}" ha sido eliminado.` });
            fetchMessages();
        } catch (err) {
            toast({ title: 'Error al Eliminar', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setDeletingMessage(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-80" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <MotivationCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" />{error}</div>
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2 " id="motivations-header">
                <p className="text-muted-foreground text-lg">Crea y personaliza las ventanas emergentes de felicitación para tus usuarios.</p>
            </div>

            {Array.isArray(messages) && messages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="motivations-list">
                    {messages.map(msg => (
                        <MotivationCard key={msg.id} message={msg} onEdit={onOpenEditor} onDelete={setDeletingMessage} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Sparkles}
                    title="Sin Mensajes de Motivación"
                    description="Aún no has creado ningún mensaje. ¡Crea el primero para celebrar los logros de tus estudiantes!"
                    imageUrl={settings?.emptyStateMotivationsUrl}
                    actionButton={
                        <Button onClick={() => onOpenEditor(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Mi Primer Mensaje
                        </Button>
                    }
                />
            )}

            {isEditorOpen && (
                <MotivationEditorModal
                    isOpen={isEditorOpen}
                    onClose={onCloseEditor}
                    message={editingMessage}
                    onSave={onSave}
                />
            )}

            <AlertDialog open={!!deletingMessage} onOpenChange={(open) => !open && setDeletingMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el mensaje "<strong>{deletingMessage?.title}</strong>". No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
