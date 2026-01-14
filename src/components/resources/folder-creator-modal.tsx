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
import { Loader2, FolderPlus, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
    const [showOptions, setShowOptions] = useState(false);

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
                <form id="folder-form" onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-title" className="text-sm font-semibold">Nombre de la Carpeta</Label>
                        <Input
                            id="folder-title"
                            placeholder="Ej. Material de Estudio 2024"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="h-11 text-base focus-visible:ring-primary/30"
                        />
                    </div>

                    <Collapsible open={showOptions} onOpenChange={setShowOptions} className="border rounded-xl p-1 bg-muted/30">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full flex justify-between items-center px-3 h-10 hover:bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Settings2 className="h-4 w-4" />
                                    <span className="text-sm">Ajustes Opcionales</span>
                                </div>
                                {showOptions ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-3 pt-2 space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="folder-category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Categoría</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="folder-category" className="bg-background border-border/50">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(settings?.resourceCategories || []).map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" form="folder-form" disabled={isSaving || !title}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                        Crear Carpeta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
