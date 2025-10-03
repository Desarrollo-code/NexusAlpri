// src/components/motivations/motivational-messages-manager.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { MotivationalMessage, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, PlusCircle, Sparkles, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { MotivationEditorModal } from './motivation-editor-modal';

const MotivationCard = ({ message, onEdit, onDelete }: { message: MotivationalMessage & { triggerCourse?: { title: string } | null }, onEdit: (m: MotivationalMessage) => void, onDelete: (m: MotivationalMessage) => void }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="truncate">{message.title}</CardTitle>
                <CardDescription>
                    Se muestra al completar el curso: <strong>{message.triggerCourse?.title || 'Curso no encontrado'}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 {message.imageUrl ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                        <Image src={message.imageUrl} alt={message.title} fill className="object-cover" />
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <Sparkles className="mx-auto h-8 w-8" />
                        <p>Mensaje de texto</p>
                    </div>
                )}
            </CardContent>
             <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(message)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(message)}><Trash2 className="mr-2 h-4 w-4"/>Eliminar</Button>
             </CardContent>
        </Card>
    )
}

export function MotivationalMessagesManager() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<MotivationalMessage | null>(null);

    const fetchMessages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/motivations');
            const data = await response.json();
            console.log('API response for messages:', data); // Log para depuración
            if (!response.ok) {
                throw new Error(data.message || 'No se pudieron cargar los mensajes');
            }
            
            // Asegurarse de que data es un array antes de establecerlo
            if (Array.isArray(data)) {
                setMessages(data);
            } else {
                console.warn("API did not return an array for messages, setting to empty array.", data);
                setMessages([]);
                // Opcional: mostrar un error si la respuesta no es la esperada pero la petición fue "ok"
                // setError("La respuesta del servidor no tuvo el formato esperado.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
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
    
    // Lógica de eliminación (se completará con el modal de confirmación)
    const handleDeleteMessage = (message: MotivationalMessage) => {
        console.log("Eliminar mensaje (lógica pendiente):", message.id);
        toast({ title: "Función en desarrollo", description: "La eliminación se implementará pronto."});
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" />{error}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {messages.map(msg => (
                        <MotivationCard key={msg.id} message={msg} onEdit={handleOpenEditor} onDelete={handleDeleteMessage}/>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16 border-dashed">
                    <CardHeader>
                        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>Sin Mensajes de Motivación</CardTitle>
                        <CardDescription>Aún no has creado ningún mensaje. ¡Crea el primero para celebrar los logros de tus estudiantes!</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => handleOpenEditor()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Mi Primer Mensaje
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isEditorOpen && (
                <MotivationEditorModal
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    message={editingMessage}
                    onSave={handleSaveChanges}
                />
            )}
        </div>
    );
}
