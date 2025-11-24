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
    uploadProgress?: number;
    error?: string;
    file?: File; // Keep the original file for retries
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
            <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate flex-grow">{video.title}</p>
                {video.uploadProgress !== undefined && video.uploadProgress < 100 && (
                     <Progress value={video.uploadProgress} className="h-1 mt-1" />
                )}
                 {video.error && <p className="text-xs text-destructive">{video.error}</p>}
            </div>
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
  
  const handleFileUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      
      const filesArray = Array.from(files);
      const newUploads: VideoItem[] = filesArray.map(file => ({
          id: `upload-${file.name}-${Date.now()}`,
          url: '',
          title: file.name,
          thumbnail: null,
          uploadProgress: 0,
          file,
      }));
      
      setVideos(prev => [...prev, ...newUploads]);
      
      newUploads.forEach(async (upload) => {
          try {
              const result = await uploadWithProgress('/api/upload/resource-file', upload.file!, (progress) => {
                  setVideos(prev => prev.map(v => v.id === upload.id ? { ...v, uploadProgress: progress } : v));
              });
              setVideos(prev => prev.map(v => v.id === upload.id ? { ...v, url: result.url, uploadProgress: 100 } : v));
          } catch (err) {
              setVideos(prev => prev.map(v => v.id === upload.id ? { ...v, error: (err as Error).message } : v));
          }
      });
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
        const validVideos = videos.filter(v => v.url);
        const payload = {
            title: playlistName,
            type: 'VIDEO_PLAYLIST',
            category,
            videos: validVideos, // Envía la lista completa de videos.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                     <Label>Añadir Video</Label>
                      <div className="flex items-center gap-2">
                          <Youtube className="h-5 w-5 text-red-500"/>
                          <Switch checked={videoSource === 'upload'} onCheckedChange={(c) => setVideoSource(c ? 'upload' : 'youtube')}/>
                          <UploadCloud className="h-5 w-5 text-blue-500"/>
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
                    <UploadArea onFileSelect={handleFileUpload} multiple compact disabled={isAddingVideo} className="h-28" accept="video/*">
                       <div className="text-center text-muted-foreground p-2">
                            <UploadCloud className="mx-auto h-6 w-6"/>
                            <p className="text-sm font-semibold">Sube uno o varios videos</p>
                            <p className="text-xs">O arrastra los archivos aquí.</p>
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
