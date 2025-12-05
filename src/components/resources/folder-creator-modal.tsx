// src/components/resources/folder-creator-modal.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderPlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface FolderCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
    onSave: () => void;
}

export function FolderCreatorModal({ isOpen, onClose, parentId, onSave }: FolderCreatorModalProps) {
    const { toast } = useToast();
    const { settings } = useAuth();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setCategory(settings?.resourceCategories[0] || 'General');
        }
    }, [isOpen, settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    category,
                    parentId,
                    type: 'FOLDER',
                    isPublic: true, // Folders are public by default, permissions on contents
                }),
            });
            if (!response.ok) throw new Error('No se pudo crear la carpeta.');
            
            toast({ title: "Carpeta Creada" });
            onSave();
            onClose();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nueva Carpeta</DialogTitle>
                    <DialogDescription>Organiza tus recursos creando una nueva carpeta.</DialogDescription>
                </DialogHeader>
                <form id="folder-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                     <div className="space-y-1.5">
                        <Label htmlFor="folder-title">Nombre de la Carpeta</Label>
                        <Input id="folder-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="folder-category">Categoría</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="folder-category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" form="folder-form" disabled={isSaving || !title}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FolderPlus className="mr-2 h-4 w-4"/>}
                        Crear Carpeta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
