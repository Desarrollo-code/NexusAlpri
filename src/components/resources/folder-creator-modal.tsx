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
import { Loader2, Video, ListVideo } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { AppResourceType } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import Image from 'next/image';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { FileIcon } from '../ui/file-icon';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

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
  const [availableVideos, setAvailableVideos] = useState<AppResourceType[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  
  // Nuevo estado para el tipo de carpeta a crear
  const [folderType, setFolderType] = useState<'FOLDER' | 'VIDEO_PLAYLIST'>('FOLDER');

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setCategory(settings?.resourceCategories[0] || 'General');
      setSelectedVideoIds([]);
      
      // Cargar videos solo si se está creando una playlist
      if (folderType === 'VIDEO_PLAYLIST') {
        fetch('/api/resources?type=video')
          .then(res => res.json())
          .then(data => setAvailableVideos(data.resources || []));
      }
    }
  }, [isOpen, settings?.resourceCategories, folderType]);

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
        type: folderType,
        category,
        isPublic: true,
        parentId,
        videoIds: folderType === 'VIDEO_PLAYLIST' ? selectedVideoIds : [],
      };

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'No se pudo crear el elemento.');
      
      const typeLabel = folderType === 'FOLDER' ? 'Carpeta' : 'Lista de Reproducción';
      toast({ title: `${typeLabel} Creada`, description: `Se ha creado "${folderName}".` });
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
          <DialogTitle>Crear Nuevo Elemento</DialogTitle>
          <DialogDescription>
            Elige si quieres crear una carpeta para organizar archivos o una lista de reproducción de videos.
          </DialogDescription>
        </DialogHeader>
        <form id="folder-form" onSubmit={handleCreate}>
          <div className="py-4 space-y-4">
             <RadioGroup defaultValue="FOLDER" onValueChange={(value) => setFolderType(value as any)} className="grid grid-cols-2 gap-4">
                <div>
                    <RadioGroupItem value="FOLDER" id="r1" className="peer sr-only" />
                    <Label htmlFor="r1" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <Folder className="mb-2 h-6 w-6" />
                        Carpeta
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="VIDEO_PLAYLIST" id="r2" className="peer sr-only" />
                    <Label htmlFor="r2" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <ListVideo className="mb-2 h-6 w-6" />
                        Lista de Vídeos
                    </Label>
                </div>
            </RadioGroup>

            <div className="space-y-1.5">
                <Label htmlFor="folder-name">Título</Label>
                <Input id="folder-name" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder={folderType === 'FOLDER' ? 'Ej: Documentos de RRHH' : 'Ej: Inducción a Nuevos Colaboradores'} autoFocus required />
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
             {folderType === 'VIDEO_PLAYLIST' && (
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
             )}
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
