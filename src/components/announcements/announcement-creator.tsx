// src/components/announcements/announcement-creator.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Megaphone, Loader2, Paperclip, XCircle, AlertTriangle, Check, UploadCloud } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { UploadArea } from '@/components/ui/upload-area';
import type { UserRole, Attachment } from '@/types';


interface LocalAttachmentPreview {
    id: string;
    file: File;
    previewUrl: string;
    finalUrl?: string;
    uploadProgress: number;
    error?: string;
}

interface AnnouncementCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onAnnouncementCreated: () => void;
}

export function AnnouncementCreator({ isOpen, onClose, onAnnouncementCreated }: AnnouncementCreatorProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [formContent, setFormContent] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formAudience, setFormAudience] = useState<UserRole | 'ALL'>('ALL');
    const [localPreviews, setLocalPreviews] = useState<LocalAttachmentPreview[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setFormContent('');
        setFormTitle('');
        setFormAudience('ALL');
        localPreviews.forEach(p => URL.revokeObjectURL(p.previewUrl));
        setLocalPreviews([]);
    }

    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            toast({ title: 'Archivo no Soportado', description: 'Por ahora, solo se pueden adjuntar imágenes.', variant: 'destructive'});
            return;
        }

        const newPreview: LocalAttachmentPreview = {
            id: `${file.name}-${Date.now()}`,
            file,
            previewUrl: URL.createObjectURL(file),
            uploadProgress: 0,
        };

        setLocalPreviews(prev => [...prev, newPreview]);
        uploadFile(newPreview);
    };

    const uploadFile = async (preview: LocalAttachmentPreview) => {
        try {
            const result = await uploadWithProgress('/api/upload/announcement-attachment', preview.file, (progress) => {
                setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, uploadProgress: progress } : p));
            });
            setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, finalUrl: result.url, uploadProgress: 100 } : p));
        } catch (err) {
            setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, error: (err as Error).message } : p));
        }
    };
    
    const handleSaveAnnouncement = async () => {
        if (!formTitle.trim() && formContent.trim().replace(/<(.|\n)*?>/g, '').length === 0 && localPreviews.length === 0) {
            toast({ title: "Contenido vacío", description: "Por favor, añade un título, escribe un mensaje o adjunta un archivo.", variant: "destructive" });
            return;
        }

        const isStillUploading = localPreviews.some(p => p.uploadProgress > 0 && p.uploadProgress < 100);
        if (isStillUploading) {
            toast({ title: "Subida en progreso", description: "Por favor, espera a que todos los archivos terminen de subirse.", variant: "default" });
            return;
        }

        const attachmentsToSave = localPreviews.filter(p => p.finalUrl).map(p => ({
            name: p.file.name,
            url: p.finalUrl!,
            type: p.file.type,
            size: p.file.size
        }));
        
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formTitle,
                    content: formContent,
                    audience: formAudience,
                    attachments: attachmentsToSave,
                }),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'No se pudo crear el anuncio.');
            }
            toast({ title: "Anuncio Publicado", description: "Tu anuncio ahora es visible para la audiencia seleccionada." });
            resetForm();
            onAnnouncementCreated();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => {
        return () => {
            localPreviews.forEach(p => URL.revokeObjectURL(p.previewUrl));
        };
    }, [localPreviews]);

    const removePreview = (id: string) => {
        const previewToRemove = localPreviews.find(p => p.id === id);
        if (previewToRemove) {
            URL.revokeObjectURL(previewToRemove.previewUrl);
        }
        setLocalPreviews(prev => prev.filter(p => p.id !== id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if(!open) resetForm(); onClose(); }}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Crear Anuncio</DialogTitle>
                    <DialogDescription>
                        Redacta y publica un nuevo anuncio para tu audiencia.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-1">
                        <Label>Contenido</Label>
                        <RichTextEditor
                            value={formContent}
                            onChange={setFormContent}
                            placeholder="Escribe los detalles de tu anuncio aquí..."
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Adjuntar Archivos</Label>
                         <UploadArea onFileSelect={handleFileSelect} disabled={isSubmitting}/>
                    </div>

                    {localPreviews.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {localPreviews.map((p) => (
                                <div key={p.id} className="relative aspect-square border rounded-md overflow-hidden bg-muted/50">
                                    <Image src={p.previewUrl} alt={p.file.name} fill className="object-contain p-1" />
                                    <div className={cn(
                                        "absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-1 transition-opacity duration-300",
                                        p.uploadProgress === 100 && !p.error ? "opacity-0 hover:opacity-100" : "opacity-100"
                                    )}>
                                        {p.uploadProgress > 0 && p.uploadProgress < 100 && !p.error && (
                                            <div className="w-full px-2">
                                                <Progress value={p.uploadProgress} className="h-1 bg-white/30"/>
                                                <p className="text-xs text-white text-center mt-1">{Math.round(p.uploadProgress)}%</p>
                                            </div>
                                        )}
                                        {p.uploadProgress === 100 && !p.error && (
                                            <Check className="h-8 w-8 text-white bg-green-500/80 rounded-full p-1" />
                                        )}
                                        {p.error && (
                                            <AlertTriangle className="h-8 w-8 text-destructive"/>
                                        )}
                                    </div>
                                     <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removePreview(p.id)}>
                                        <XCircle className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1">
                         <Label htmlFor="audience">Audiencia</Label>
                         <Select value={formAudience} onValueChange={(v) => setFormAudience(v as any)} disabled={isSubmitting}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                 <SelectItem value="ALL">Todos</SelectItem>
                                 <SelectItem value="STUDENT">Estudiantes</SelectItem>
                                 <SelectItem value="INSTRUCTOR">Instructores</SelectItem>
                                 <SelectItem value="ADMINISTRATOR">Administradores</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={handleSaveAnnouncement} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Megaphone className="mr-2 h-4 w-4"/>}
                        Publicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
