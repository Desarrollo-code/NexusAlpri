// src/components/certificates/certificate-editor-modal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Image as ImageIcon, Replace, XCircle, Award, MousePointerClick, Palette as PaletteIcon, Type, CheckSquare } from 'lucide-react';
import type { CertificateTemplate } from '@prisma/client';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { CertificateInteractablePreview } from './certificate-interactable-preview';
import { fontMap } from '@/lib/fonts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';

interface CertificateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: CertificateTemplate | null;
    onSave: () => void;
}

const availableFonts = [
    { value: 'Inter', label: 'Inter (Sans-serif)' },
    { value: 'Space Grotesk', label: 'Space Grotesk (Sans-serif)' },
    { value: 'Source Code Pro', label: 'Source Code Pro (Monospace)' },
    { value: 'Roboto', label: 'Roboto (Sans-serif)' },
    { value: 'Lato', label: 'Lato (Sans-serif)' },
    { value: 'Montserrat', label: 'Montserrat (Sans-serif)' },
];

const UploadWidget = ({
  label,
  id,
  currentImageUrl,
  onFileSelect,
  onRemove,
  disabled,
  isUploading,
  uploadProgress
}: {
  label: string;
  id: string;
  currentImageUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  disabled: boolean;
  isUploading: boolean;
  uploadProgress: number;
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {currentImageUrl && !isUploading ? (
             <div className="relative w-full aspect-video rounded-lg border overflow-hidden bg-muted/20 p-2">
                <Image src={currentImageUrl} alt={`Previsualización de ${label}`} fill className="object-contain p-2" />
                 <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                    <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={() => document.getElementById(id)?.click()} disabled={disabled}>
                        <Replace className="h-4 w-4" />
                        <span className="sr-only">Reemplazar imagen</span>
                    </Button>
                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={onRemove} disabled={disabled}>
                        <XCircle className="h-4 w-4" />
                        <span className="sr-only">Eliminar imagen</span>
                    </Button>
                 </div>
            </div>
      ) : isUploading ? (
         <div className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg bg-muted/50 p-2 relative">
            {currentImageUrl && <Image src={currentImageUrl} alt="Subiendo" fill className="object-contain opacity-30 p-2"/>}
            <div className="z-10 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Subiendo...</p>
                <Progress value={uploadProgress} className="w-32 h-1.5" />
            </div>
         </div>
      ) : (
        <UploadArea onFileSelect={onFileSelect} disabled={disabled} inputId={id}/>
      )}
      <input
        type="file"
        id={id}
        onChange={(e) => onFileSelect(e.target.files ? e.target.files[0] : null)}
        disabled={disabled || isUploading}
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        className="hidden"
      />
    </div>
  );
};


export function CertificateEditorModal({ isOpen, onClose, template, onSave }: CertificateEditorModalProps) {
    const { toast } = useToast();

    // Form state for template properties
    const [name, setName] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#000000');
    const [fontFamilyHeadline, setFontFamilyHeadline] = useState('Space Grotesk');
    const [fontFamilyBody, setFontFamilyBody] = useState('Inter');
    const [showScore, setShowScore] = useState(false);

    // Form state for element positions
    const [positions, setPositions] = useState({
        studentName: { x: 50, y: 45, fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
        courseName: { x: 50, y: 60, fontSize: 24, fontWeight: 'normal', textAlign: 'center' },
        date: { x: 50, y: 75, fontSize: 18, fontWeight: 'normal', textAlign: 'center' },
        score: { x: 80, y: 85, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    });
    
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
                setTextColor(template.textColor || '#000000');
                setFontFamilyHeadline(template.fontFamilyHeadline || 'Space Grotesk');
                setFontFamilyBody(template.fontFamilyBody || 'Inter');
                setPositions({
                    studentName: (template.studentNamePosition as any) || positions.studentName,
                    courseName: (template.courseNamePosition as any) || positions.courseName,
                    date: (template.datePosition as any) || positions.date,
                    score: (template.scorePosition as any) || positions.score,
                });
                setShowScore(!!template.scorePosition);
            } else {
                // Reset for a new template
                setName('');
                setBackgroundImageUrl(null);
                setTextColor('#000000');
                setFontFamilyHeadline('Space Grotesk');
                setFontFamilyBody('Inter');
                setPositions({
                    studentName: { x: 50, y: 45, fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
                    courseName: { x: 50, y: 60, fontSize: 24, fontWeight: 'normal', textAlign: 'center' },
                    date: { x: 50, y: 75, fontSize: 18, fontWeight: 'normal', textAlign: 'center' },
                    score: { x: 80, y: 85, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
                });
                setShowScore(false);
            }
            setLocalImagePreview(null);
            setIsUploading(false);
            setUploadProgress(0);
        } else {
             if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
            }
        }
    }, [template, isOpen]);

    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        
        const previewUrl = URL.createObjectURL(file);
        setLocalImagePreview(previewUrl);

        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadWithProgress('/api/upload/settings-image', file, (progress) => setUploadProgress(progress));
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
        if (localImagePreview) URL.revokeObjectURL(localImagePreview);
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
            textColor,
            fontFamilyHeadline,
            fontFamilyBody,
            studentNamePosition: positions.studentName,
            courseNamePosition: positions.courseName,
            datePosition: positions.date,
            scorePosition: showScore ? positions.score : null,
        };
        
        const endpoint = template ? `/api/certificates/templates/${template.id}` : '/api/certificates/templates';
        const method = template ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'No se pudo guardar la plantilla.');
            toast({ title: `Plantilla ${template ? 'actualizada' : 'creada'}` });
            onSave();
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const fakeTemplateForPreview: Partial<CertificateTemplate> = {
        name, backgroundImageUrl: finalImageUrl || '', textColor, fontFamilyHeadline, fontFamilyBody,
        studentNamePosition: positions.studentName,
        courseNamePosition: positions.courseName,
        datePosition: positions.date,
        scorePosition: showScore ? positions.score : null,
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col md:flex-row p-0 gap-0">
                <div className="w-full md:w-1/3 min-w-[320px] flex flex-col bg-muted/50 border-r">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold"><Award className="h-5 w-5 text-primary"/>{template ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
                    </DialogHeader>
                    {/* The form now wraps the scrollable area */}
                    <form id="template-form" onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Identidad Visual</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="template-name">Nombre</Label>
                                        <Input id="template-name" value={name} onChange={e => setName(e.target.value)} required disabled={isSubmitting}/>
                                    </div>
                                    <UploadWidget
                                       id="cert-image-upload"
                                       label="Imagen de Fondo"
                                       currentImageUrl={finalImageUrl}
                                       onFileSelect={(file) => file && handleImageUpload(file)}
                                       onRemove={handleRemoveImage}
                                       disabled={isSubmitting}
                                       isUploading={isUploading}
                                       uploadProgress={uploadProgress}
                                    />
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><PaletteIcon className="h-4 w-4"/> Estilos de Texto</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1"><Label htmlFor="textColor" className="flex items-center gap-2">Color del Texto</Label><Input id="textColor" type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full p-1 h-10" /></div>
                                    <div className="space-y-1"><Label htmlFor="fontHeadline" className="flex items-center gap-2">Fuente de Títulos</Label><Select value={fontFamilyHeadline} onValueChange={setFontFamilyHeadline}><SelectTrigger id="fontHeadline"><SelectValue/></SelectTrigger><SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{fontFamily: (fontMap[f.value] as any)?.style.fontFamily}}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-1"><Label htmlFor="fontBody" className="flex items-center gap-2">Fuente del Cuerpo</Label><Select value={fontFamilyBody} onValueChange={setFontFamilyBody}><SelectTrigger id="fontBody"><SelectValue/></SelectTrigger><SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{fontFamily: (fontMap[f.value] as any)?.style.fontFamily}}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                                 </CardContent>
                            </Card>

                             <Card>
                                 <CardHeader>
                                     <CardTitle className="text-base flex items-center gap-2">
                                         <CheckSquare className="h-4 w-4" />
                                         Opciones Adicionales
                                     </CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                     <div className="flex items-center justify-between">
                                         <Label htmlFor="showScore" className="font-medium">
                                             Mostrar Calificación
                                         </Label>
                                         <Switch id="showScore" checked={showScore} onCheckedChange={setShowScore} />
                                     </div>
                                 </CardContent>
                             </Card>
                        </div>
                        <div className="p-4 border-t sticky bottom-0 bg-muted/50 backdrop-blur-sm mt-auto flex justify-end gap-2 w-full">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" form="template-form" disabled={isSubmitting || !name || !finalImageUrl}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                <Save className="mr-2 h-4 w-4"/>
                                Guardar Plantilla
                            </Button>
                        </div>
                    </form>
                </div>
                <div className="flex-1 flex flex-col p-4">
                    <div className="text-center mb-2">
                        <p className="text-lg font-semibold">Previsualización Interactiva</p>
                        <p className="text-xs text-primary flex items-center justify-center gap-1"><MousePointerClick className="h-3 w-3"/>Arrastra los textos para reposicionarlos</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                        <CertificateInteractablePreview
                           template={fakeTemplateForPreview}
                           positions={positions}
                           onPositionsChange={setPositions}
                           showScore={showScore}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
