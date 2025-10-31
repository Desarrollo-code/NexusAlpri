// src/components/resources/folder-creator-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

interface FolderCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onSave: () => void;
}

export function FolderCreatorModal({ isOpen, onClose, parentId, onSave }: FolderCreatorModalProps) {
  const { toast } = useToast();
  const [folderName, setFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
    }
  }, [isOpen]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      toast({ title: 'El nombre es requerido', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: folderName,
          type: 'FOLDER',
          parentId,
          isPublic: true, // Por defecto, las carpetas son públicas en este contexto.
        }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'No se pudo crear la carpeta.');
      toast({ title: 'Carpeta Creada', description: `La carpeta "${folderName}" se ha creado.` });
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
          <DialogDescription>
            Organiza tus recursos creando una nueva carpeta.
          </DialogDescription>
        </DialogHeader>
        <form id="folder-form" onSubmit={handleCreateFolder}>
          <div className="py-4">
            <Label htmlFor="folder-name">Nombre de la Carpeta</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ej: Documentos de Marketing"
              autoFocus
              required
            />
          </div>
        </form>
        <DialogFooter>
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
