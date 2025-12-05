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
import { Folder, Loader2 } from 'lucide-react';
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
        sharingMode: 'PUBLIC', // Por defecto, las carpetas son públicas en su acceso
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
      <DialogContent className="sm:max-w-xl p-0 gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Folder className="h-5 w-5 text-amber-500"/>
            Crear Nueva Carpeta
          </DialogTitle>
          <DialogDescription>
            Organiza tus archivos y recursos en carpetas temáticas.
          </DialogDescription>
        </DialogHeader>
        <form id="folder-form" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 flex items-center justify-center bg-amber-500/10 rounded-lg">
                <Folder className="w-12 h-12 text-amber-500"/>
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1.5">
                  <Label htmlFor="folder-name">Nombre de la Carpeta</Label>
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
          </div>
        </form>
        <DialogFooter className="p-6 pt-4 border-t flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" form="folder-form" disabled={isSaving || !folderName.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Carpeta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
