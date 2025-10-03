// src/components/motivations/motivation-editor-modal.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Image as ImageIcon, Video, BookOpen, Sparkles } from 'lucide-react';
import type { MotivationalMessage, MotivationalMessageTriggerType, Course } from '@/types';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';

interface MotivationEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: MotivationalMessage | null;
    onSave: () => void;
}

export function MotivationEditorModal({ isOpen, onClose, message, onSave }: MotivationEditorModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [triggerType, setTriggerType] = useState<MotivationalMessageTriggerType>('COURSE_COMPLETION');
    const [triggerId, setTriggerId] = useState<string | null>(null);

    const [courses, setCourses] = useState<Pick<Course, 'id' | 'title'>[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await fetch('/api/courses?simple=true');
            if (!res.ok) throw new Error('No se pudo cargar la lista de cursos.');
            const data = await res.json();
            setCourses(data.courses || []);
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        }
    }, [toast]);

    useEffect(() => {
        if (isOpen) {
            if (message) {
                setTitle(message.title);
                setContent(message.content || '');
                setImageUrl(message.imageUrl);
                setVideoUrl(message.videoUrl);
                setTriggerType(message.triggerType);
                setTriggerId(message.triggerId);
            } else {
                // Reset for new message
                setTitle('');
                setContent('');
                setImageUrl(null);
                setVideoUrl(null);
                setTriggerType('COURSE_COMPLETION');
                setTriggerId(null);
            }
            fetchCourses();
        }
    }, [message, isOpen, fetchCourses]);
    
    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadWithProgress('/api/upload/settings-image', file, setUploadProgress);
            setImageUrl(result.url);
            toast({ title: 'Imagen Subida'});
        } catch (err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };


    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = {
            title, content, imageUrl, videoUrl, triggerType, triggerId
        };
        
        const endpoint = message ? `/api/motivations/${message.id}` : '/api/motivations';
        const method = message ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error((await response.json()).message || 'No se pudo guardar el mensaje.');

            toast({ title: `Mensaje ${message ? 'actualizado' : 'creado'}` });
            onSave();
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary"/>
                        {message ? 'Editar Mensaje de Motivación' : 'Crear Nuevo Mensaje'}
                    </DialogTitle>
                    <DialogDescription>
                        Diseña la ventana emergente que verán tus usuarios al alcanzar un logro.
                    </DialogDescription>
                </DialogHeader>
                <form id="motivation-form" onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="msg-title">Título del Mensaje</Label>
                        <Input id="msg-title" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="msg-content">Contenido del Mensaje</Label>
                        <Textarea id="msg-content" value={content} onChange={e => setContent(e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="msg-image-url">URL de Imagen (Opcional)</Label>
                        <Input id="msg-image-url" value={imageUrl || ''} onChange={e => setImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.png"/>
                        <p className="text-xs text-muted-foreground text-center my-2">o</p>
                        <UploadArea onFileSelect={handleImageUpload} disabled={isUploading} />
                        {isUploading && <Progress value={uploadProgress} className="mt-2" />}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="msg-video-url">URL de Video (YouTube, opcional)</Label>
                        <Input id="msg-video-url" value={videoUrl || ''} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..."/>
                    </div>
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                        <Label>Disparador del Mensaje</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Select value={triggerType} onValueChange={v => setTriggerType(v as MotivationalMessageTriggerType)} disabled>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COURSE_COMPLETION">Al completar un curso</SelectItem>
                                    {/* Otros triggers se pueden añadir aquí en el futuro */}
                                </SelectContent>
                            </Select>
                            {triggerType === 'COURSE_COMPLETION' && (
                                <Select value={triggerId || ''} onValueChange={setTriggerId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un curso..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(course => (
                                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </form>
                 <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="motivation-form" disabled={isSubmitting || !title || !triggerId}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Save className="mr-2 h-4 w-4"/>
                        Guardar Mensaje
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
