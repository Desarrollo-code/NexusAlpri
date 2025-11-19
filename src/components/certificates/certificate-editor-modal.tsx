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
import { Loader2, Save, Image as ImageIcon, Replace, XCircle, Award, MousePointerClick, Palette as PaletteIcon, Type, CheckSquare, Droplet, User, BookOpen, Calendar, Star, FileText } from 'lucide-react';
import type { CertificateTemplate } from '@/types';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { CertificateInteractablePreview } from './certificate-interactable-preview';
import { fontMap } from '@/lib/fonts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Slider } from '../ui/slider';

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
}: {
  label: string;
  id: string;
  currentImageUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  disabled: boolean;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setLocalPreview(null);
    if (localPreview) {
        URL.revokeObjectURL(localPreview); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);

    try {
        const result = await uploadWithProgress('/api/upload/settings-image', file, setUploadProgress);
        onFileSelect(result.url); 
        toast({ title: 'Imagen Subida' });
    } catch (err) {
        toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
        URL.revokeObjectURL(preview);
        setLocalPreview(null);
    } finally {
        setIsUploading(false);
    }
  };

  const finalImageUrl = localPreview || currentImageUrl;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {isUploading ? (
         <div className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg bg-muted/80 p-2 relative">
            {localPreview && <Image src={localPreview} alt="Subiendo" fill className="object-contain opacity-30 p-2"/>}
            <div className="z-10 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                <Progress value={uploadProgress} className="w-20 h-1" />
            </div>
         </div>
      ) : finalImageUrl ? (
         <div className="relative w-full h-24 rounded-lg border overflow-hidden p-1 bg-muted/20">
            <Image src={finalImageUrl} alt={`Previsualización de ${label}`} fill className="object-contain p-1" />
             <div className="absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <UploadArea onFileSelect={(file) => file && handleUpload(file)} disabled={disabled} inputId={id} className="h-6 w-6 rounded-full shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/80 p-0 border-0">
                     <Replace className="h-3 w-3" />
                 </UploadArea>
                 <Button type="button" variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-md" onClick={onRemove} disabled={disabled}>
                     <XCircle className="h-3 w-3" />
                 </Button>
             </div>
        </div>
      ) : (
         <UploadArea onFileSelect={(file) => file && handleUpload(file)} disabled={disabled} inputId={id} className="h-24"/>
      )}
    </div>
  );
};


export function CertificateEditorModal({ isOpen, onClose, template, onSave }: CertificateEditorModalProps) {
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.1);
    const [footerText, setFooterText] = useState('');
    const [textColor, setTextColor] = useState('#000000');
    const [fontFamilyHeadline, setFontFamilyHeadline] = useState('Space Grotesk');
    const [fontFamilyBody, setFontFamilyBody] = useState('Inter');
    const [showScore, setShowScore] = useState(false);

    // Positions state
    const [positions, setPositions] = useState({
        studentName: { x: 50, y: 45, fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
        courseName: { x: 50, y: 60, fontSize: 24, fontWeight: 'normal', textAlign: 'center' },
        date: { x: 50, y: 75, fontSize: 18, fontWeight: 'normal', textAlign: 'center' },
        score: { x: 80, y: 85, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
        logo: { x: 5, y: 5, width: 20, height: 15 },
        footerText: { x: 50, y: 90, fontSize: 14, fontWeight: 'normal', textAlign: 'center'},
    });
    
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
                    logo: (template.logoPosition as any) || positions.logo,
                    footerText: (template.footerTextPosition as any) || positions.footerText,
                });
                setShowScore(!!template.scorePosition);
                setLogoUrl(template.logoUrl || null);
                setWatermarkUrl(template.watermarkUrl || null);
                setWatermarkOpacity(template.watermarkOpacity === null || template.watermarkOpacity === undefined ? 0.1 : template.watermarkOpacity);
                setFooterText(template.footerText || '');
            } else {
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
                    logo: { x: 5, y: 5, width: 20, height: 15 },
                    footerText: { x: 50, y: 90, fontSize: 14, fontWeight: 'normal', textAlign: 'center'},
                });
                setShowScore(false);
                setLogoUrl(null);
                setWatermarkUrl(null);
                setWatermarkOpacity(0.1);
                setFooterText('');
            }
        }
    }, [template, isOpen]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!name || !backgroundImageUrl) {
            toast({ title: "Faltan datos", description: "El nombre y la imagen de fondo son requeridos.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            name, backgroundImageUrl, textColor, fontFamilyHeadline, fontFamilyBody,
            studentNamePosition: positions.studentName,
            courseNamePosition: positions.courseName,
            datePosition: positions.date,
            scorePosition: showScore ? positions.score : null,
            logoUrl, watermarkUrl, footerText, logoPosition: positions.logo,
            footerTextPosition: positions.footerText, watermarkOpacity,
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
        name, backgroundImageUrl, textColor, fontFamilyHeadline, fontFamilyBody,
        studentNamePosition: positions.studentName, courseNamePosition: positions.courseName,
        datePosition: positions.date, scorePosition: showScore ? positions.score : null,
        logoUrl, watermarkUrl, footerText, logoPosition: positions.logo, footerTextPosition: positions.footerText,
        watermarkOpacity,
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col md:flex-row p-0 gap-0 rounded-2xl">
                <div className="w-full md:w-1/3 lg:w-1/4 min-w-[320px] flex flex-col bg-muted/50 border-r">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold"><Award className="h-5 w-5 text-primary"/>{template ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1">
                      <form id="template-form" onSubmit={handleFormSubmit} className="p-4 space-y-4">
                        <Card>
                          <CardHeader><CardTitle className="text-base">Información Básica</CardTitle></CardHeader>
                          <CardContent><Input id="template-name" placeholder="Nombre de la plantilla" value={name} onChange={e => setName(e.target.value)} required disabled={isSubmitting}/></CardContent>
                        </Card>
                        <Card>
                          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Imágenes</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                            <UploadWidget id="bg-upload" label="Fondo" currentImageUrl={backgroundImageUrl} onFileSelect={setBackgroundImageUrl} onRemove={() => setBackgroundImageUrl(null)} disabled={isSubmitting}/>
                            <UploadWidget id="logo-upload" label="Logo" currentImageUrl={logoUrl} onFileSelect={setLogoUrl} onRemove={() => setLogoUrl(null)} disabled={isSubmitting}/>
                            <UploadWidget id="watermark-upload" label="Marca de Agua" currentImageUrl={watermarkUrl} onFileSelect={setWatermarkUrl} onRemove={() => setWatermarkUrl(null)} disabled={isSubmitting}/>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Droplet className="h-4 w-4"/>Opacidad Marca de Agua</Label>
                                <Slider value={[watermarkOpacity]} min={0} max={1} step={0.05} onValueChange={(v) => setWatermarkOpacity(v[0])} disabled={!watermarkUrl}/>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/>Textos</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                               <div className="space-y-1"><Label htmlFor="footerText">Texto del pie de página</Label><Input id="footerText" value={footerText} onChange={e => setFooterText(e.target.value)} disabled={isSubmitting} placeholder="Certificado interno de capacitación"/></div>
                               <div className="flex items-center justify-between p-3 border rounded-lg"><Label htmlFor="showScore" className="font-medium">Mostrar Calificación</Label><Switch id="showScore" checked={showScore} onCheckedChange={setShowScore} /></div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><PaletteIcon className="h-4 w-4"/>Estilos</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1"><Label htmlFor="textColor">Color del Texto</Label><Input id="textColor" type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full p-1 h-10" /></div>
                                <div className="space-y-1"><Label htmlFor="fontHeadline">Fuente de Títulos</Label><Select value={fontFamilyHeadline} onValueChange={setFontFamilyHeadline}><SelectTrigger id="fontHeadline"><SelectValue/></SelectTrigger><SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{fontFamily: (fontMap[f.value] as any)?.style.fontFamily}}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-1"><Label htmlFor="fontBody">Fuente del Cuerpo</Label><Select value={fontFamilyBody} onValueChange={setFontFamilyBody}><SelectTrigger id="fontBody"><SelectValue/></SelectTrigger><SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{fontFamily: (fontMap[f.value] as any)?.style.fontFamily}}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                            </CardContent>
                        </Card>
                      </form>
                    </ScrollArea>
                     <div className="p-4 border-t flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" form="template-form" disabled={isSubmitting || !name || !backgroundImageUrl}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Guardar Plantilla
                        </Button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col p-4 bg-background">
                    <div className="text-center mb-2">
                        <p className="text-lg font-semibold">Previsualización Interactiva</p>
                        <p className="text-xs text-primary flex items-center justify-center gap-1"><MousePointerClick className="h-3 w-3"/>Arrastra los elementos para reposicionarlos</p>
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
