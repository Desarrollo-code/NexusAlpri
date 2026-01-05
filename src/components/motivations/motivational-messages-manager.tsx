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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="flex flex-col h-full overflow-hidden group hover:shadow-2xl transition-all duration-500 border-primary/10 hover:border-primary/30 bg-card/40 backdrop-blur-xl rounded-[2rem]">
                <CardHeader className="p-5 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-b border-primary/5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <CardTitle className="text-lg font-black tracking-tight truncate pr-2" title={message.title}>{message.title}</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-primary/10 text-primary">
                                    <Sparkles className="h-3 w-3" />
                                </div>
                                <CardDescription className="text-xs font-bold text-muted-foreground truncate">
                                    {getMotivationalTriggerLabel(message.triggerType, message.triggerCourse)}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow flex items-center justify-center bg-muted/5 relative overflow-hidden aspect-video">
                    {message.imageUrl ? (
                        <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-700">
                            <Image src={message.imageUrl} alt={message.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                <Sparkles className="h-8 w-8 text-primary opacity-60" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-40">Diseño Visual Solo Texto</p>
                        </div>
                    )}

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-2xl shadow-xl hover:scale-110 transition-transform bg-white/90 backdrop-blur-md border-none text-primary" onClick={() => onEdit(message)}>
                            <Edit className="h-5 w-5" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-12 w-12 rounded-2xl shadow-xl hover:scale-110 transition-transform border-none" onClick={() => onDelete(message)}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/5 flex justify-between items-center border-t border-primary/5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Visualización Activa</span>
                    <div className="flex items-center -space-x-2">
                        <div className="w-6 h-6 rounded-full border-2 border-background bg-primary/20" />
                        <div className="w-6 h-6 rounded-full border-2 border-background bg-accent/20" />
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-3" id="motivations-header">
                <h2 className="text-3xl font-black tracking-tighter">Gestor de Experiencia</h2>
                <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl">
                    Crea y personaliza las ventanas emergentes de felicitación. Estos mensajes aparecerán automáticamente cuando el estudiante logre un hito.
                </p>
            </div>

            {Array.isArray(messages) && messages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="motivations-list">
                    {messages.map(msg => (
                        <MotivationCard key={msg.id} message={msg} onEdit={onOpenEditor} onDelete={setDeletingMessage} />
                    ))}
                </div>
            ) : (
                <div className="p-4 rounded-[3rem] border-4 border-dashed border-primary/5">
                    <EmptyState
                        icon={Sparkles}
                        title="Tu Canvas Motivacional Está Vacío"
                        description="Aún no has creado ningún mensaje. Empieza ahora y transforma los logros de tus estudiantes en experiencias inolvidables."
                        imageUrl={settings?.emptyStateMotivationsUrl}
                        actionButton={
                            <Button onClick={() => onOpenEditor(null)} size="lg" className="rounded-2xl font-black px-10 h-14 shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                <PlusCircle className="mr-3 h-6 w-6" />
                                Crear Mi Primer Mensaje
                            </Button>
                        }
                    />
                </div>
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
