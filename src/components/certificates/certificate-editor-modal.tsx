// src/components/certificates/certificate-editor-modal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Save, Image as ImageIcon, Replace, XCircle } from 'lucide-react';
import type { CertificateTemplate } from '@prisma/client';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import Image from 'next/image';

interface CertificateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: CertificateTemplate | null;
    onSave: () => void;
}

export function CertificateEditorModal({ isOpen, onClose, template, onSave }: CertificateEditorModalProps) {
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
    
    // Upload state
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (template) {
                setName(template.name);
                setBackgroundImageUrl(template.backgroundImageUrl);
            } else {
                setName('');
                setBackgroundImageUrl(null);
            }
            setLocalImagePreview(null);
            setIsUploading(false);
            setUploadProgress(0);
        } else {
             if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
            }
        }
    }, [template, isOpen, localImagePreview]);

    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        
        const previewUrl = URL.createObjectURL(file);
        setLocalImagePreview(previewUrl);

        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadWithProgress('/api/upload/settings-image', file, setUploadProgress);
            setBackgroundImageUrl(result.url);
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
        setBackgroundImageUrl(null);
    };
    
    const finalImageUrl = localImagePreview || backgroundImageUrl;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (!name || !finalImageUrl) {
            toast({ title: "Faltan datos", description: "El nombre y la imagen de fondo son requeridos.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            name,
            backgroundImageUrl: finalImageUrl,
        };
        
        // Lógica de PUT (editar) aún no implementada
        const endpoint = template ? `/api/certificates/templates/${template.id}` : '/api/certificates/templates';
        const method = template ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error((await response.json()).message || 'No se pudo guardar la plantilla.');

            toast({ title: `Plantilla ${template ? 'actualizada' : 'creada'}` });
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
                        <Award className="h-5 w-5 text-primary"/>
                        {template ? 'Editar Plantilla de Certificado' : 'Crear Nueva Plantilla'}
                    </DialogTitle>
                     <DialogDescription>
                        Configura el nombre y la imagen de fondo para tu certificado.
                    </DialogDescription>
                </DialogHeader>
                <form id="template-form" onSubmit={handleFormSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1">
                        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                        <Input id="template-name" value={name} onChange={e => setName(e.target.value)} required disabled={isSubmitting}/>
                    </div>
                     <div className="space-y-1">
                        <Label>Imagen de Fondo</Label>
                        {finalImageUrl && !isUploading ? (
                             <div className="relative w-full aspect-[1.414] rounded-lg border overflow-hidden bg-muted/20 p-2">
                                <Image src={finalImageUrl} alt="Previsualización" fill className="object-contain p-2" />
                                <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                                    <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={() => document.getElementById('cert-image-upload')?.click()} disabled={isSubmitting}>
                                        <Replace className="h-4 w-4"/>
                                    </Button>
                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={handleRemoveImage} disabled={isSubmitting}>
                                        <XCircle className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        ) : isUploading ? (
                             <div className="w-full aspect-[1.414] flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg bg-muted/50 p-2 relative">
                                {localImagePreview && <Image src={localImagePreview} alt="Subiendo" fill className="object-contain opacity-30 p-2"/>}
                                <div className="z-10 text-center space-y-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                    <p className="text-sm text-muted-foreground">Subiendo...</p>
                                    <Progress value={uploadProgress} className="w-32 h-1.5" />
                                </div>
                            </div>
                        ) : (
                            <UploadArea inputId="cert-image-upload" onFileSelect={handleImageUpload} disabled={isSubmitting} title="Sube tu fondo" description="Recomendado: 1123x794px" />
                        )}
                         <input type="file" id="cert-image-upload" className="hidden" accept="image/png, image/jpeg, image/svg+xml, image/webp" onChange={(e) => handleImageUpload(e.target.files ? e.target.files[0] : null)} />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" form="template-form" disabled={isSubmitting || !name || !finalImageUrl}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Save className="mr-2 h-4 w-4"/>
                        Guardar Plantilla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}