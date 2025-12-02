// src/components/resources/folder-creator-modal.tsx
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
import { Loader2, Folder, ListVideo, GripVertical, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface FolderCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  parentId: string | null;
}

export function FolderCreatorModal({ isOpen, onClose, onSave, parentId }: FolderCreatorModalProps) {
  const { toast } = useToast();
  const { settings } = useAuth();
  const [folderName, setFolderName] = useState('');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setCategory(settings?.resourceCategories[0] || 'General');
    }
  }, [isOpen, settings?.resourceCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      toast({ title: 'El nombre es requerido', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: folderName,
        type: 'FOLDER',
        category,
        isPublic: true,
        parentId,
      };

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'No se pudo crear la carpeta.');
      
      toast({ title: `Carpeta Creada`, description: `Se ha creado "${folderName}".` });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Folder className="h-5 w-5 text-amber-500"/>Crear Nueva Carpeta</DialogTitle>
          <DialogDescription>
            Crea una carpeta para organizar tus archivos y recursos.
          </DialogDescription>
        </DialogHeader>
        <form id="folder-form" onSubmit={handleCreate}>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="folder-name">Título</Label>
                <Input id="folder-name" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder={'Ej: Documentos de RRHH'} autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría</Label>
              <Select name="category" required value={category} onValueChange={setCategory}>
                <SelectTrigger id="category"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {(settings?.resourceCategories || []).sort().map((cat) => ( <SelectItem key={cat} value={cat}>{cat}</SelectItem> ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" form="folder-form" disabled={isSaving || !folderName.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
