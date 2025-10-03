
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
import { Loader2, Save, Image as ImageIcon, Video, BookOpen, Sparkles, XCircle, Replace, Users } from 'lucide-react';
import type { MotivationalMessage, MotivationalMessageTriggerType, Course } from '@/types';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MotivationEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: MotivationalMessage | null;
    onSave: () => void;
}

const levelTriggers = Array.from({ length: 20 }, (_, i) => ({
  id: `level-${i + 2}`,
  title: `Alcanzar Nivel ${i + 2}`,
}));

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
    
    // State for local image preview and upload progress
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
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
        // Reset and cleanup local preview URL when modal closes or changes
        return () => {
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
            }
        };
    }, [isOpen, message, localImagePreview]);

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
            setLocalImagePreview(null);
            setIsUploading(false);
            setUploadProgress(0);
            fetchCourses();
        }
    }, [message, isOpen, fetchCourses]);
    
    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        
        const previewUrl = URL.createObjectURL(file);
        setLocalImagePreview(previewUrl);

        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadWithProgress('/api/upload/settings-image', file, setUploadProgress);
            setImageUrl(result.url);
            toast({ title: 'Imagen Subida'});
        } catch (err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
            URL.revokeObjectURL(previewUrl);
            setLocalImagePreview(null);
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleRemoveImage = () => {
        if (localImagePreview) {
            URL.revokeObjectURL(localImagePreview);
        }
        setLocalImagePreview(null);
        setImageUrl(null);
    }


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
    
    const finalImageUrl = localImagePreview || imageUrl;
    
    const triggerOptions = {
        'COURSE_ENROLLMENT': courses,
        'COURSE_MID_PROGRESS': courses,
        'COURSE_NEAR_COMPLETION': courses,
        'COURSE_COMPLETION': courses,
        'LEVEL_UP': levelTriggers,
    };

    const triggerLabels = {
        'COURSE_ENROLLMENT': 'Al inscribirse a un curso',
        'COURSE_MID_PROGRESS': 'Al 50% de un curso',
        'COURSE_NEAR_COMPLETION': 'Al 90% de un curso',
        'COURSE_COMPLETION': 'Al completar un curso',
        'LEVEL_UP': 'Al subir de nivel',
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
                        <Label htmlFor="msg-image-url">Imagen (Opcional)</Label>
                        {finalImageUrl && !isUploading ? (
                            <div className="relative w-full aspect-video rounded-lg border overflow-hidden bg-muted/20 p-2">
                                <Image src={finalImageUrl} alt="Previsualización" fill className="object-contain p-2" />
                                <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                                    <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={() => document.getElementById('image-upload-input')?.click()} disabled={isSubmitting}>
                                        <Replace className="h-4 w-4"/>
                                    </Button>
                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={handleRemoveImage} disabled={isSubmitting}>
                                        <XCircle className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        ) : isUploading ? (
                             <div className="w-full aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg bg-muted/50 p-2 relative">
                                {localImagePreview && <Image src={localImagePreview} alt="Subiendo" fill className="object-contain opacity-30 p-2"/>}
                                <div className="z-10 text-center space-y-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                    <p className="text-sm text-muted-foreground">Subiendo...</p>
                                    <Progress value={uploadProgress} className="w-32 h-1.5" />
                                </div>
                            </div>
                        ) : (
                            <UploadArea inputId="image-upload-input" onFileSelect={handleImageUpload} disabled={isSubmitting} />
                        )}
                         <input type="file" id="image-upload-input" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files ? e.target.files[0] : null)} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="msg-video-url">URL de Video (YouTube, opcional)</Label>
                        <Input id="msg-video-url" value={videoUrl || ''} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..."/>
                    </div>
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                        <Label>Disparador del Mensaje</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Select value={triggerType} onValueChange={(v: MotivationalMessageTriggerType) => { setTriggerType(v); setTriggerId(null); }}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(triggerLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={triggerId || ''} onValueChange={setTriggerId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona..."/>
                                </SelectTrigger>
                                <SelectContent>
                                    {(triggerOptions[triggerType] || []).map(opt => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
