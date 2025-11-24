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
import { Loader2, ListVideo, GripVertical, Trash2, Youtube, UploadCloud } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '../ui/switch';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';

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
    thumbnail: string | null;
}

const SortableVideoItem = ({ video, onDelete }: { video: VideoItem; onDelete: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: video.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md touch-none">
            <div {...listeners} className="cursor-grab p-1">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="relative w-20 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                {video.thumbnail ? (
                    <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center text-white"><Youtube className="h-6 w-6"/></div>
                )}
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
  const [videoSource, setVideoSource] = useState<'youtube' | 'upload'>('youtube');

  useEffect(() => {
    if (isOpen) {
      setPlaylistName('');
      setCategory(settings?.resourceCategories[0] || 'General');
      setVideos([]);
      setVideoUrl('');
      setVideoSource('youtube');
    }
  }, [isOpen, settings?.resourceCategories]);

  const handleAddYoutubeVideo = async () => {
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
  
  const handleFileUpload = async (file: File) => {
      setIsAddingVideo(true);
      const tempId = `upload-${Date.now()}`;
      // Optimistic update
      const newVideoStub: VideoItem = { id: tempId, url: '', title: file.name, thumbnail: null };
      setVideos(prev => [...prev, newVideoStub]);
      try {
          const result = await uploadWithProgress('/api/upload/resource-file', file, (progress) => {
              // Can implement progress update here if needed
          });
          setVideos(prev => prev.map(v => v.id === tempId ? { ...v, url: result.url, title: file.name, thumbnail: null } : v));
      } catch (err) {
           toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
           setVideos(prev => prev.filter(v => v.id !== tempId)); // Revert optimistic update
      } finally {
          setIsAddingVideo(false);
      }
  }


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
        const validVideos = videos.filter(v => v.url); // Ensure we only save videos with a URL
        const payload = {
            title: playlistName,
            type: 'VIDEO_PLAYLIST',
            category,
            videos: validVideos,
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
            Agrupa videos en una lista de reproducción ordenada.
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
            
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                     <Label>Añadir Video</Label>
                      <div className="flex items-center gap-2">
                          <Youtube className="h-4 w-4"/>
                          <Switch checked={videoSource === 'upload'} onCheckedChange={(c) => setVideoSource(c ? 'upload' : 'youtube')}/>
                          <UploadCloud className="h-4 w-4"/>
                      </div>
                </div>
                {videoSource === 'youtube' ? (
                    <div className="flex gap-2">
                        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Pega una URL de YouTube"/>
                        <Button type="button" onClick={handleAddYoutubeVideo} disabled={isAddingVideo || !videoUrl}>
                            {isAddingVideo ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Añadir'}
                        </Button>
                    </div>
                ) : (
                    <UploadArea onFileSelect={(file) => file && handleFileUpload(file)} compact disabled={isAddingVideo}>
                       <div className="text-center text-muted-foreground p-2">
                            <UploadCloud className="mx-auto h-6 w-6"/>
                            <p className="text-sm font-semibold">Sube un video</p>
                            <p className="text-xs">O arrastra y suelta el archivo aquí.</p>
                       </div>
                    </UploadArea>
                )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
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
