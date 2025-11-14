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
            <Skeleton className="h-5 w-3/4"/>
            <Skeleton className="h-4 w-1/2"/>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center bg-muted">
            <Skeleton className="w-full aspect-video"/>
        </CardContent>
        <CardFooter className="p-2 border-t flex justify-end gap-2">
            <Skeleton className="h-9 w-24"/>
            <Skeleton className="h-9 w-24"/>
        </CardFooter>
    </Card>
);

const MotivationCard = ({ message, onEdit, onDelete }: { message: MotivationalMessage & { triggerCourse?: { title: string } | null }, onEdit: (m: MotivationalMessage) => void, onDelete: (m: MotivationalMessage) => void }) => {
    return (
        <Card className="flex flex-col h-full overflow-hidden group card-border-animated">
            <CardHeader className="p-4">
                <CardTitle className="text-base font-bold truncate">{message.title}</CardTitle>
                <CardDescription className="text-xs truncate">
                    {getMotivationalTriggerLabel(message.triggerType, message.triggerCourse)}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-grow flex items-center justify-center bg-muted/30">
                 {message.imageUrl ? (
                    <div className="relative w-full aspect-video">
                        <Image src={message.imageUrl} alt={message.title} fill className="object-contain" />
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <Sparkles className="mx-auto h-8 w-8" />
                        <p className="text-sm mt-2">Mensaje de texto</p>
                    </div>
                )}
            </CardContent>
             <CardFooter className="p-2 border-t bg-card flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(message)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(message)}><Trash2 className="mr-2 h-4 w-4"/>Eliminar</Button>
             </CardFooter>
        </Card>
    )
}

export function MotivationalMessagesManager() {
    const { user, settings } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<MotivationalMessage | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<MotivationalMessage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const fetchMessages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/motivations');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'No se pudieron cargar los mensajes' }));
                throw new Error(errorData.message);
            }
            const data = await response.json();
            
            setMessages(Array.isArray(data) ? data : []);
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
            setError(errorMessage);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);


    useEffect(() => {
        if (user) {
            fetchMessages();
        }
    }, [user, fetchMessages]);

    const handleOpenEditor = (message: MotivationalMessage | null = null) => {
        setEditingMessage(message);
        setIsEditorOpen(true);
    };

    const handleSaveChanges = () => {
        fetchMessages();
        setIsEditorOpen(false);
    }
    
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <Skeleton className="h-8 w-80" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <Skeleton className="h-10 w-48" />
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="motivations-header">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Gestionar Mensajes de Motivación</h1>
                    <p className="text-muted-foreground">Crea y personaliza las ventanas emergentes de felicitación para tus usuarios.</p>
                </div>
                <Button onClick={() => handleOpenEditor()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Nuevo Mensaje
                </Button>
            </div>

            {Array.isArray(messages) && messages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="motivations-list">
                    {messages.map(msg => (
                        <MotivationCard key={msg.id} message={msg} onEdit={handleOpenEditor} onDelete={setDeletingMessage}/>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Sparkles}
                    title="Sin Mensajes de Motivación"
                    description="Aún no has creado ningún mensaje. ¡Crea el primero para celebrar los logros de tus estudiantes!"
                    imageUrl={settings?.emptyStateMotivationsUrl}
                    actionButton={
                         <Button onClick={() => handleOpenEditor()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Mi Primer Mensaje
                        </Button>
                    }
                />
            )}

            {isEditorOpen && (
                <MotivationEditorModal 
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    message={editingMessage}
                    onSave={handleSaveChanges}
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
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
