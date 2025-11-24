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
import { Loader2, Video } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { AppResourceType } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import Image from 'next/image';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { FileIcon } from '../ui/file-icon';

interface FolderCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function FolderCreatorModal({ isOpen, onClose, onSave }: FolderCreatorModalProps) {
  const { toast } = useToast();
  const { settings } = useAuth();
  const [folderName, setFolderName] = useState('');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<AppResourceType[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setCategory(settings?.resourceCategories[0] || 'General');
      setSelectedVideoIds([]);
      // Fetch available videos when modal opens
      fetch('/api/resources?type=video')
        .then(res => res.json())
        .then(data => setAvailableVideos(data.resources || []));
    }
  }, [isOpen, settings?.resourceCategories]);

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
          category,
          isPublic: true,
          videoIds: selectedVideoIds, // Enviar los IDs de los videos seleccionados
        }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'No se pudo crear la carpeta.');
      toast({ title: 'Lista de Reproducción Creada', description: `La lista "${folderName}" se ha creado.` });
      onSave();
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVideoSelection = (videoId: string, isSelected: boolean) => {
    setSelectedVideoIds(prev => isSelected ? [...prev, videoId] : prev.filter(id => id !== videoId));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Nueva Lista de Reproducción</DialogTitle>
          <DialogDescription>
            Agrupa videos existentes en una nueva lista de reproducción.
          </DialogDescription>
        </DialogHeader>
        <form id="folder-form" onSubmit={handleCreateFolder}>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="folder-name">Título de la Lista</Label>
                <Input id="folder-name" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Ej: Inducción a Nuevos Colaboradores" autoFocus required />
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
             <div className="space-y-1.5">
                <Label>Asignar Videos</Label>
                 <ScrollArea className="h-48 border rounded-md p-2">
                    {availableVideos.length > 0 ? (
                        <div className="space-y-2">
                        {availableVideos.map(video => {
                            const youtubeId = getYoutubeVideoId(video.url);
                            const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : video.url;
                            const fileExtension = youtubeId ? 'youtube' : (video.fileType?.split('/')[1] || video.url?.split('.').pop() || 'file');

                            return (
                                <div key={video.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted">
                                    <Checkbox id={`video-${video.id}`} checked={selectedVideoIds.includes(video.id)} onCheckedChange={(checked) => handleVideoSelection(video.id, !!checked)} />
                                    <Label htmlFor={`video-${video.id}`} className="flex items-center gap-2 font-normal cursor-pointer w-full">
                                       <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={thumbnailUrl} className="w-12 h-8" />
                                       <span className="truncate">{video.title}</span>
                                    </Label>
                                </div>
                            )
                        })}
                        </div>
                    ) : <p className="text-sm text-center text-muted-foreground p-4">No hay videos disponibles para añadir.</p>}
                 </ScrollArea>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" form="folder-form" disabled={isSaving || !folderName.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
