
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
import { Loader2, Save, Image as ImageIcon, Replace, XCircle, Award, MousePointerClick, Palette as PaletteIcon, Type, FileText } from 'lucide-react';
import type { CertificateTemplate } from '@/types';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { CertificateInteractablePreview } from './certificate-interactable-preview';
import { fontMap } from '@/lib/fonts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Slider } from '../ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CertificateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: CertificateTemplate | null;
    onSave: () => void;
}

const availableFonts = [
    { value: 'Inter', label: 'Inter (Moderno)' },
    { value: 'Space Grotesk', label: 'Space Grotesk (Tech)' },
    { value: 'Source Code Pro', label: 'Source Code Pro (Mono)' },
    { value: 'Roboto', label: 'Roboto (Clásico)' },
    { value: 'Lato', label: 'Lato (Elegante)' },
    { value: 'Montserrat', label: 'Montserrat (Bold)' },
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

    const handleFileSelectInternal = (files: FileList | null) => {
        if (files && files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const finalImageUrl = localPreview || currentImageUrl;

    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">{label}</Label>
            {isUploading ? (
                <div className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg bg-muted/50 p-2 relative">
                    <div className="z-10 text-center space-y-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                        <Progress value={uploadProgress} className="w-16 h-1" />
                    </div>
                </div>
            ) : finalImageUrl ? (
                <div className="relative w-full h-32 rounded-lg border bg-slate-50 overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('/images/transparent-pattern.png')] opacity-20" />
                    <Image src={finalImageUrl} alt={`Previsualización de ${label}`} fill className="object-contain p-2" />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadArea onFileSelect={(file) => file && handleUpload(file)} disabled={disabled} inputId={id} className="h-8 w-8 rounded-full shadow-md bg-white text-slate-700 hover:bg-slate-100 p-0 border-0 flex items-center justify-center">
                            <Replace className="h-4 w-4" />
                        </UploadArea>
                        <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-md" onClick={onRemove} disabled={disabled}>
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <UploadArea onFileSelect={(files) => files && handleFileSelectInternal(files)} disabled={disabled} inputId={id} className="h-24 hover:bg-slate-50 transition-colors border-dashed" />
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
        footerText: { x: 50, y: 90, fontSize: 14, fontWeight: 'normal', textAlign: 'center' },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (template) {
                // Populate state
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
                setWatermarkOpacity(template.watermarkOpacity ?? 0.1);
                setFooterText(template.footerText || '');
            } else {
                // Reset state
                setName('');
                setBackgroundImageUrl(null);
                setTextColor('#000000');
                setFontFamilyHeadline('Space Grotesk');
                setFontFamilyBody('Inter');
                // Reset positions to default
                setPositions({
                    studentName: { x: 50, y: 45, fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
                    courseName: { x: 50, y: 60, fontSize: 24, fontWeight: 'normal', textAlign: 'center' },
                    date: { x: 50, y: 75, fontSize: 18, fontWeight: 'normal', textAlign: 'center' },
                    score: { x: 80, y: 85, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
                    logo: { x: 5, y: 5, width: 20, height: 15 },
                    footerText: { x: 50, y: 90, fontSize: 14, fontWeight: 'normal', textAlign: 'center' },
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
            toast({ title: `Plantilla ${template ? 'actualizada' : 'creada'} correctamente.` });
            onSave();
        } catch (err) {
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
            <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col md:flex-row p-0 gap-0 rounded-2xl overflow-hidden">
                {/* SIDEBAR */}
                <div className="w-full md:w-[400px] flex flex-col bg-slate-50/50 border-r h-full">
                    <DialogHeader className="p-5 border-b bg-white">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold font-headline">
                            <Award className="h-6 w-6 text-primary" />
                            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1">
                        <form id="template-form" onSubmit={handleFormSubmit} className="p-5 space-y-6">

                            <div className="space-y-3">
                                <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                                <Input id="template-name" placeholder="Ej: Certificado de Excelencia 2024" value={name} onChange={e => setName(e.target.value)} required disabled={isSubmitting} className="bg-white" />
                            </div>

                            <Tabs defaultValue="images" className="w-full">
                                <TabsList className="w-full grid grid-cols-3 mb-4">
                                    <TabsTrigger value="images"><ImageIcon className="h-4 w-4 mr-2" />Gráficos</TabsTrigger>
                                    <TabsTrigger value="style"><PaletteIcon className="h-4 w-4 mr-2" />Estilo</TabsTrigger>
                                    <TabsTrigger value="content"><FileText className="h-4 w-4 mr-2" />Contenido</TabsTrigger>
                                </TabsList>

                                <TabsContent value="images" className="space-y-4">
                                    <Card className="border-none shadow-sm">
                                        <CardContent className="p-4 space-y-4">
                                            <UploadWidget id="bg-upload" label="Fondo del Certificado (Required)" currentImageUrl={backgroundImageUrl} onFileSelect={setBackgroundImageUrl} onRemove={() => setBackgroundImageUrl(null)} disabled={isSubmitting} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <UploadWidget id="logo-upload" label="Logo Institucional" currentImageUrl={logoUrl} onFileSelect={setLogoUrl} onRemove={() => setLogoUrl(null)} disabled={isSubmitting} />
                                                <UploadWidget id="watermark-upload" label="Marca de Agua" currentImageUrl={watermarkUrl} onFileSelect={setWatermarkUrl} onRemove={() => setWatermarkUrl(null)} disabled={isSubmitting} />
                                            </div>
                                            {watermarkUrl && (
                                                <div className="space-y-2 pt-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>Opacidad Marca de Agua</span>
                                                        <span>{Math.round(watermarkOpacity * 100)}%</span>
                                                    </div>
                                                    <Slider value={[watermarkOpacity]} min={0} max={1} step={0.05} onValueChange={(v) => setWatermarkOpacity(v[0])} />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="style" className="space-y-4">
                                    <Card className="border-none shadow-sm">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="textColor" className="text-xs uppercase text-muted-foreground">Color Principal</Label>
                                                <div className="flex items-center gap-3">
                                                    <Input id="textColor" type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-12 h-12 p-1 rounded-full cursor-pointer" />
                                                    <Input value={textColor} onChange={e => setTextColor(e.target.value)} className="font-mono uppercase bg-white" maxLength={7} />
                                                </div>
                                            </div>
                                            <Separator />
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label htmlFor="fontHeadline" className="text-xs uppercase text-muted-foreground">Fuente Títulos (Nombre)</Label>
                                                    <Select value={fontFamilyHeadline} onValueChange={setFontFamilyHeadline}>
                                                        <SelectTrigger id="fontHeadline" className="bg-white"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{ fontFamily: (fontMap[f.value] as any)?.style.fontFamily }}>{f.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="fontBody" className="text-xs uppercase text-muted-foreground">Fuente Texto General</Label>
                                                    <Select value={fontFamilyBody} onValueChange={setFontFamilyBody}>
                                                        <SelectTrigger id="fontBody" className="bg-white"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{ fontFamily: (fontMap[f.value] as any)?.style.fontFamily }}>{f.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="content" className="space-y-4">
                                    <Card className="border-none shadow-sm">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="footerText">Texto al Pie (Footer)</Label>
                                                <Input id="footerText" value={footerText} onChange={e => setFooterText(e.target.value)} disabled={isSubmitting} placeholder="ID Verificación: {{uuid}}" className="bg-white" />
                                                <p className="text-[10px] text-muted-foreground">Aparecerá en la parte inferior del certificado.</p>
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="showScore" className="text-base">Mostrar Calificación</Label>
                                                    <p className="text-xs text-muted-foreground">Incluir el puntaje final del curso.</p>
                                                </div>
                                                <Switch id="showScore" checked={showScore} onCheckedChange={setShowScore} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>

                        </form>
                    </ScrollArea>

                    <div className="p-4 border-t bg-white flex justify-end gap-3 z-10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" form="template-form" disabled={isSubmitting || !name || !backgroundImageUrl} className="min-w-[140px]">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar
                        </Button>
                    </div>
                </div>

                {/* PREVIEW AREA */}
                <div className="flex-1 flex flex-col bg-slate-100/50 overflow-hidden relative">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border">
                        <MousePointerClick className="h-4 w-4 text-primary animate-pulse" />
                        <span className="text-sm font-medium text-slate-700">Arrastra los elementos para posicionarlos</span>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                        <div className="shadow-2xl rounded-lg overflow-hidden ring-1 ring-slate-900/5 max-w-[90%] max-h-[90%]">
                            <CertificateInteractablePreview
                                template={fakeTemplateForPreview}
                                positions={positions}
                                onPositionsChange={setPositions}
                                showScore={showScore}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
