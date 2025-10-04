// src/components/announcements/announcement-editor-modal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { Announcement as AnnouncementType, UserRole } from '@/types';

interface AnnouncementEditorModalProps {
    announcement: AnnouncementType;
    isOpen: boolean;
    onClose: () => void;
    onUpdateSuccess: () => void;
}

export function AnnouncementEditorModal({ announcement, isOpen, onClose, onUpdateSuccess }: AnnouncementEditorModalProps) {
    const { toast } = useToast();
    const [title, setTitle] = useState(announcement.title);
    const [content, setContent] = useState(announcement.content);
    const [audience, setAudience] = useState(announcement.audience as UserRole | 'ALL');
    const [isSaving, setIsSaving] = useState(false);

     useEffect(() => {
        if (isOpen) {
            setTitle(announcement.title);
            setContent(announcement.content);
            setAudience(announcement.audience as UserRole | 'ALL');
        }
    }, [announcement, isOpen]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/announcements/${announcement.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, audience }),
            });
            if (!response.ok) throw new Error((await response.json()).message || "No se pudo actualizar el anuncio.");
            
            toast({ title: "Anuncio Actualizado", description: "Los cambios han sido guardados." });
            onUpdateSuccess();
            onClose();
        } catch (err) {
            toast({ title: 'Error al Guardar', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar Anuncio</DialogTitle>
                    <DialogDescription>Realiza cambios en el título, contenido o audiencia del anuncio.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Contenido</Label>
                        <div className="col-span-3">
                           <RichTextEditor value={content} onChange={setContent} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="audience" className="text-right">Audiencia</Label>
                         <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
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
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
