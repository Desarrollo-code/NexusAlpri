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
import { Loader2, Save, ImageIcon, Video, Sparkles, XCircle, Replace } from 'lucide-react';
import type { MotivationalMessage, MotivationalMessageTriggerType, Course } from '@/types';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '../ui/rich-text-editor';


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

const triggerLabels: Record<MotivationalMessageTriggerType, string> = {
    COURSE_ENROLLMENT: 'Al inscribirse a un curso',
    COURSE_MID_PROGRESS: 'Al 50% de un curso',
    COURSE_NEAR_COMPLETION: 'Al 90% de un curso',
    COURSE_COMPLETION: 'Al completar un curso',
    LEVEL_UP: 'Al subir de nivel',
    LESSON_COMPLETION: 'Al completar una lección'
};

export function MotivationEditorModal({ isOpen, onClose, message, onSave }: MotivationEditorModalProps) {
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
        // Cleanup local preview URL when modal closes
        return () => {
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
            }
        };
    }, [isOpen, localImagePreview]);


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
            toast({ title: 'Imagen Subida' });
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
        } catch (err) {
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-0 gap-0 rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {message ? 'Editar Mensaje' : 'Nuevo Mensaje Motivacional'}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Crea mensajes que inspiren a tus estudiantes en momentos clave de su aprendizaje.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-x">
                    {/* Left Column - Form */}
                    <ScrollArea className="h-full">
                        <form id="motivation-form" onSubmit={handleFormSubmit} className="space-y-6 p-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="msg-title" className="text-base font-semibold">Título del Mensaje</Label>
                                <Input
                                    id="msg-title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ej: ¡Felicidades por tu progreso!"
                                    className="text-base h-11"
                                    required
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Contenido del Mensaje</Label>
                                <RichTextEditor
                                    value={content}
                                    onChange={setContent}
                                    variant="mini"
                                    className="min-h-[120px]"
                                    placeholder="Escribe un mensaje motivador para tus estudiantes..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Imagen (Opcional)
                                </Label>
                                {finalImageUrl && !isUploading ? (
                                    <div className="relative w-full aspect-video rounded-xl border-2 overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 p-3 group">
                                        <Image src={finalImageUrl} alt="Previsualización" fill className="object-contain p-2 rounded-lg" />
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="h-9 w-9 rounded-full shadow-lg backdrop-blur-sm bg-background/80"
                                                onClick={() => document.getElementById('image-upload-input-motivation')?.click()}
                                                disabled={isSubmitting}
                                            >
                                                <Replace className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-9 w-9 rounded-full shadow-lg"
                                                onClick={handleRemoveImage}
                                                disabled={isSubmitting}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : isUploading ? (
                                    <div className="w-full aspect-video flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl bg-muted/30 p-4 relative">
                                        {localImagePreview && <Image src={localImagePreview} alt="Subiendo" fill className="object-contain opacity-20 p-4 rounded-lg" />}
                                        <div className="z-10 text-center space-y-3">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                                            <p className="text-sm font-medium text-muted-foreground">Subiendo imagen...</p>
                                            <Progress value={uploadProgress} className="w-40 h-2" />
                                        </div>
                                    </div>
                                ) : (
                                    <UploadArea
                                        inputId="image-upload-input-motivation"
                                        onFileSelect={handleImageUpload}
                                        disabled={isSubmitting}
                                        className="aspect-video"
                                    />
                                )}
                                <input
                                    type="file"
                                    id="image-upload-input-motivation"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files ? e.target.files[0] : null)}
                                />
                            </div>

                            {/* Video URL */}
                            <div className="space-y-2">
                                <Label htmlFor="msg-video-url" className="text-base font-semibold flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Video de YouTube (Opcional)
                                </Label>
                                <Input
                                    id="msg-video-url"
                                    value={videoUrl || ''}
                                    onChange={e => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="text-base h-11"
                                />
                            </div>

                            {/* Trigger Configuration */}
                            <div className="space-y-3 p-5 border-2 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                                <Label className="text-base font-semibold">¿Cuándo se mostrará este mensaje?</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Evento disparador</Label>
                                        <Select value={triggerType} onValueChange={(v: MotivationalMessageTriggerType) => { setTriggerType(v); setTriggerId(null); }}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(triggerLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">
                                            {triggerType === 'LEVEL_UP' ? 'Nivel específico' : 'Curso específico'}
                                        </Label>
                                        <Select value={triggerId || ''} onValueChange={setTriggerId} required>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Selecciona una opción..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(triggerOptions[triggerType] || []).map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id}>{opt.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    {/* Right Column - Live Preview */}
                    <div className="hidden lg:flex flex-col bg-gradient-to-br from-muted/30 to-muted/10">
                        <div className="p-6 border-b bg-background/50 backdrop-blur-sm">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Vista Previa
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Así verán el mensaje tus estudiantes</p>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <div className="max-w-md mx-auto">
                                {/* Preview Card */}
                                <div className="bg-background rounded-2xl shadow-2xl border-2 overflow-hidden">
                                    {/* Image/Video Preview */}
                                    {finalImageUrl && (
                                        <div className="relative w-full aspect-video bg-gradient-to-br from-primary/10 to-primary/5">
                                            <Image
                                                src={finalImageUrl}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="h-5 w-5 text-primary-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-xl leading-tight mb-2">
                                                    {title || 'Título del mensaje'}
                                                </h4>
                                                {content ? (
                                                    <div
                                                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                                                        dangerouslySetInnerHTML={{ __html: content }}
                                                    />
                                                ) : (
                                                    <p className="text-muted-foreground italic text-sm">
                                                        El contenido aparecerá aquí...
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Button className="w-full h-11 rounded-xl font-semibold" disabled>
                                            ¡Continuar!
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 bg-muted/20">
                    <Button variant="outline" onClick={onClose} className="h-11 px-6">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="motivation-form"
                        disabled={isSubmitting || !title || !triggerId}
                        className="h-11 px-6 font-semibold"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {message ? 'Actualizar' : 'Crear'} Mensaje
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
