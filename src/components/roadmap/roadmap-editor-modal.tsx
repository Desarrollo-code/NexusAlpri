// src/components/roadmap/roadmap-editor-modal.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, Save, Trash2, Image as ImageIcon, Type, User, UploadCloud, XCircle, Replace, HelpCircle, ImagePlay, Building, FolderOpen, MousePointer, Rocket, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { RoadmapItem } from '@/types';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { RichTextEditor } from '../ui/rich-text-editor';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { IconLightbulb } from '../icons/icon-lightbulb';
import { IconCode } from '../icons/icon-code';
import { IconDatabase } from '../icons/icon-database';
import { IconPaintbrush } from '../icons/icon-paintbrush';
import { IconRocket } from '../icons/icon-rocket';
import { IconCheckCheck } from '../icons/icon-check-check';
import { IconSparkles } from '../icons/icon-sparkles';
import { IconAward } from '../icons/icon-award';
import { IconUsersRound } from '../icons/icon-users-round';
import { IconFileText } from '../icons/icon-file-text';
import { IconShield } from '../icons/icon-shield';
import { IconMessageSquare } from '../icons/icon-message-square';
import { IconScreenShare } from '../icons/icon-screen-share';
import { IconListChecks } from '../icons/icon-list-checks';
import { IconTestTube2 } from '../icons/icon-test-tube-2';
import { IconNetwork } from '../icons/icon-network';
import { IconMegaphone } from '../icons/icon-megaphone';

const ICONS = ['Lightbulb', 'Code', 'Database', 'Paintbrush', 'Rocket', 'CheckCircle', 'Award', 'Sparkles', 'UsersRound', 'FileText', 'Shield', 'MessageSquare', 'ScreenShare', 'Network', 'ListChecks', 'Megaphone', 'Folder', 'Users', 'TestTube2'];

const iconMap = {
    ...LucideIcons,
    Lightbulb: IconLightbulb,
    Code: IconCode,
    Database: IconDatabase,
    Paintbrush: IconPaintbrush,
    Rocket: IconRocket,
    CheckCircle: IconCheckCheck,
    Award: IconAward,
    Sparkles: IconSparkles,
    UsersRound: IconUsersRound,
    FileText: IconFileText,
    Shield: IconShield,
    MessageSquare: IconMessageSquare,
    ScreenShare: IconScreenShare,
    Network: IconNetwork,
    ListChecks: IconListChecks,
    Megaphone: IconMegaphone,
    Folder: LucideIcons.Folder,
    Users: LucideIcons.Users,
    TestTube2: IconTestTube2,
};

const iconTranslations: { [key: string]: string } = {
  Lightbulb: 'Idea',
  Code: 'Código',
  Database: 'Base de Datos',
  Paintbrush: 'Diseño',
  Rocket: 'Lanzamiento',
  CheckCircle: 'Completado',
  Award: 'Reconocimiento',
  Sparkles: 'Mejora',
  UsersRound: 'Colaboradores',
  FileText: 'Documentación',
  Shield: 'Seguridad',
  MessageSquare: 'Comunicación',
  ScreenShare: 'Demostración',
  Network: 'Organización',
  ListChecks: 'Tareas',
  Megaphone: 'Anuncios',
  Folder: 'Organización',
  TestTube2: 'Pruebas',
};

interface RoadmapEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: RoadmapItem | null;
    onSave: () => void;
}

export function RoadmapEditorModal({ isOpen, onClose, item, onSave }: RoadmapEditorModalProps) {
    const { toast } = useToast();
    const { settings } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [phase, setPhase] = useState('');
    const [icon, setIcon] = useState('Lightbulb');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roadmapPhases = settings?.roadmapPhases || [];

    useEffect(() => {
        if (item) {
            setTitle(item.title);
            setDescription(item.description);
            setDate(new Date(item.date));
            setPhase(item.phase);
            setIcon(item.icon);
            setImageUrl(item.imageUrl);
        } else {
            setTitle('');
            setDescription('');
            setDate(new Date());
            setPhase(roadmapPhases.length > 0 ? roadmapPhases[0] : '');
            setIcon('Lightbulb');
            setImageUrl(null);
        }
    }, [item, isOpen, roadmapPhases]);
    
    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadWithProgress('/api/upload/roadmap-image', file, setUploadProgress);
            setImageUrl(result.url);
            toast({ title: "Imagen Subida" });
        } catch(err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const endpoint = item ? `/api/roadmap/${item.id}` : '/api/roadmap';
            const method = item ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, date, phase, icon, imageUrl }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo guardar el hito.');
            }
            
            toast({ title: 'Éxito', description: `Hito ${item ? 'actualizado' : 'creado'} correctamente.`});
            onSave();
            onClose();

        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl flex flex-col h-[90vh] p-0 gap-0 rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{item ? 'Editar Hito' : 'Nuevo Hito en la Hoja de Ruta'}</DialogTitle>
                    <DialogDescription>Añade o modifica un evento importante en la evolución del proyecto.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <form id="roadmap-form" onSubmit={handleSubmit} className="space-y-4 p-6">
                        <div className="space-y-1">
                            <Label htmlFor="roadmap-title">Título</Label>
                            <Input id="roadmap-title" name="roadmap-title" value={title} onChange={(e) => setTitle(e.target.value)} required/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="roadmap-description">Descripción</Label>
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                variant="mini"
                                className="min-h-[120px]"
                            />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Fecha</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start font-normal">{date ? format(date, "PPP", {locale: es}) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es}/></PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-1">
                                <Label>Fase</Label>
                                <Select name="roadmap-phase" value={phase} onValueChange={setPhase}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {roadmapPhases.map(phaseName => (
                                            <SelectItem key={phaseName} value={phaseName}>{phaseName.replace('_', ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Imagen Representativa</Label>
                            {isUploading ? (
                                 <div className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg"><Loader2 className="h-8 w-8 animate-spin text-primary"/><Progress value={uploadProgress} className="w-1/2 h-2"/></div>
                            ) : imageUrl ? (
                                <div className="relative w-full aspect-video rounded-lg border overflow-hidden"><Image src={imageUrl} alt="preview" fill className="object-cover" /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setImageUrl(null)}><Trash2 className="h-4 w-4"/></Button></div>
                            ) : <UploadArea onFileSelect={(files) => files && handleImageUpload(files[0])} inputId="roadmap-image-upload" />}
                         </div>
                        <div className="space-y-1">
                            <Label>Icono</Label>
                            <Select name="roadmap-icon" value={icon} onValueChange={setIcon}>
                                <SelectTrigger><div className="flex items-center gap-2">{(iconMap as any)[icon] && React.createElement((iconMap as any)[icon], {className: "h-4 w-4"})}<span>{iconTranslations[icon] || icon}</span></div></SelectTrigger>
                                <SelectContent>
                                    {ICONS.map(iconName => {
                                        const IconComponent = (iconMap as any)[iconName];
                                        return <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><IconComponent className="h-4 w-4"/><span>{iconTranslations[iconName] || iconName}</span></div></SelectItem>
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </form>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" form="roadmap-form" disabled={isSubmitting || !title || !date}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}