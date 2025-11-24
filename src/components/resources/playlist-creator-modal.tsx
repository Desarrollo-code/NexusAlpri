// src/components/resources/playlist-creator-modal.tsx
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
import { Loader2, ListVideo, GripVertical, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlaylistCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  parentId: string | null;
}

interface VideoItem {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
}

const SortableVideoItem = ({ video, onDelete }: { video: VideoItem; onDelete: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: video.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md touch-none">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <div className="relative w-20 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
            </div>
            <p className="text-sm font-medium truncate flex-grow">{video.title}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4"/></Button>
        </div>
    );
};

export function PlaylistCreatorModal({ isOpen, onClose, onSave, parentId }: PlaylistCreatorModalProps) {
  const { toast } = useToast();
  const { settings } = useAuth();
  const [playlistName, setPlaylistName] = useState('');
  const [category, setCategory] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlaylistName('');
      setCategory(settings?.resourceCategories[0] || 'General');
      setVideos([]);
      setVideoUrl('');
    }
  }, [isOpen, settings?.resourceCategories]);

  const handleAddVideo = async () => {
    const videoId = getYoutubeVideoId(videoUrl);
    if (!videoId) {
      toast({ title: 'URL de YouTube Inválida', variant: 'destructive' });
      return;
    }
    setIsAddingVideo(true);
    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await response.json();
        if (data.error) throw new Error("No se pudo obtener la información del video.");

        const newVideo: VideoItem = {
            id: `video-${Date.now()}`,
            url: videoUrl,
            title: data.title || 'Video sin título',
            thumbnail: data.thumbnail_url
        };
        setVideos(prev => [...prev, newVideo]);
        setVideoUrl('');
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsAddingVideo(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
        setVideos((items) => {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over!.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }
  };
  
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const payload = {
            title: playlistName,
            type: 'VIDEO_PLAYLIST',
            category,
            videos,
            parentId,
        };
        const response = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).message || "No se pudo crear la lista.");
        toast({ title: "Lista de Reproducción Creada" });
        onSave();
        onClose();
    } catch (err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ListVideo className="h-5 w-5 text-primary"/>Crear Lista de Reproducción</DialogTitle>
          <DialogDescription>
            Agrupa videos de YouTube en una lista de reproducción ordenada.
          </DialogDescription>
        </DialogHeader>
        <form id="playlist-form" onSubmit={handleCreatePlaylist} className="space-y-4 py-4">
            <div className="space-y-1.5">
                <Label htmlFor="playlist-name">Nombre de la Lista</Label>
                <Input id="playlist-name" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} required />
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="category-playlist">Categoría</Label>
              <Select name="category-playlist" required value={category} onValueChange={setCategory}>
                <SelectTrigger id="category-playlist"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {(settings?.resourceCategories || []).sort().map((cat) => ( <SelectItem key={cat} value={cat}>{cat}</SelectItem> ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="video-url">Añadir Video</Label>
                <div className="flex gap-2">
                    <Input id="video-url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Pega una URL de YouTube"/>
                    <Button type="button" onClick={handleAddVideo} disabled={isAddingVideo || !videoUrl}>
                        {isAddingVideo ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Añadir'}
                    </Button>
                </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext items={videos} strategy={verticalListSortingStrategy}>
                        {videos.map(v => (
                            <SortableVideoItem key={v.id} video={v} onDelete={() => setVideos(vs => vs.filter(item => item.id !== v.id))} />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" form="playlist-form" disabled={isSaving || !playlistName || videos.length === 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
