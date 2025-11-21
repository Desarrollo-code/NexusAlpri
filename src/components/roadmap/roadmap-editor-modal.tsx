// src/components/roadmap/roadmap-editor-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { RoadmapItem } from '@/types';
import * as LucideIcons from 'lucide-react';

const ICONS = ['Lightbulb', 'Code', 'Database', 'Paintbrush', 'Rocket', 'CheckCircle', 'Award', 'Sparkles', 'UsersRound', 'FileText', 'Shield'];

interface RoadmapEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: RoadmapItem | null;
    onSave: () => void;
}

export function RoadmapEditorModal({ isOpen, onClose, item, onSave }: RoadmapEditorModalProps) {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [phase, setPhase] = useState('FASE_5');
    const [icon, setIcon] = useState('Lightbulb');
    const [color, setColor] = useState('#3b82f6');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (item) {
            setTitle(item.title);
            setDescription(item.description);
            setDate(new Date(item.date));
            setPhase(item.phase);
            setIcon(item.icon);
            setColor(item.color);
        } else {
            setTitle('');
            setDescription('');
            setDate(new Date());
            setPhase('FASE_5');
            setIcon('Lightbulb');
            setColor('#3b82f6');
        }
    }, [item, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const endpoint = item ? `/api/roadmap/${item.id}` : '/api/roadmap';
            const method = item ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, date, phase, icon, color }),
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item ? 'Editar Hito' : 'Nuevo Hito en la Hoja de Ruta'}</DialogTitle>
                    <DialogDescription>Añade o modifica un evento importante en la evolución del proyecto.</DialogDescription>
                </DialogHeader>
                <form id="roadmap-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-1">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required/>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required/>
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
                            <Select value={phase} onValueChange={setPhase}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FASE_1">Fase 1: Planificación</SelectItem>
                                    <SelectItem value="FASE_2">Fase 2: Backend</SelectItem>
                                    <SelectItem value="FASE_3">Fase 3: Interfaz</SelectItem>
                                    <SelectItem value="FASE_4">Fase 4: Despliegue</SelectItem>
                                    <SelectItem value="FASE_5">Fase 5: Evolución</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Icono</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger><div className="flex items-center gap-2">{(LucideIcons as any)[icon] && React.createElement((LucideIcons as any)[icon], {className: "h-4 w-4"})}<span>{icon}</span></div></SelectTrigger>
                                <SelectContent>
                                    {ICONS.map(iconName => {
                                        const IconComponent = (LucideIcons as any)[iconName];
                                        return <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><IconComponent className="h-4 w-4"/><span>{iconName}</span></div></SelectItem>
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label>Color</Label>
                            <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1"/>
                         </div>
                    </div>
                </form>
                <DialogFooter>
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
