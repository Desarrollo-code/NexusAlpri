// src/components/resources/playlist-creator-modal.tsx
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, ListVideo, PlusCircle, Trash2, Youtube, UploadCloud } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';

interface PlaylistCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
    onSave: () => void;
}

interface VideoItem {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    source: 'youtube' | 'upload';
}

export function PlaylistCreatorModal({ isOpen, onClose, parentId, onSave }: PlaylistCreatorModalProps) {
    const { toast } = useToast();
    const { settings } = useAuth();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    
    const [videoSource, setVideoSource] = useState<'youtube' | 'upload'>('youtube');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setCategory(settings?.resourceCategories[0] || 'General');
            setVideoUrl('');
            setVideos([]);
            setVideoSource('youtube');
        }
    }, [isOpen, settings]);

    const handleAddVideoFromUrl = () => {
        const youtubeId = getYoutubeVideoId(videoUrl);
        if (!youtubeId) {
            toast({ title: 'URL inválida', description: 'Por favor, ingresa una URL de YouTube válida.', variant: 'destructive'});
            return;
        }

        // Placeholder para el título, se podría obtener de la API de YouTube en el futuro.
        const videoTitle = `Video de YouTube ${videos.length + 1}`;

        setVideos(prev => [
            ...prev,
            {
                id: `video-${Date.now()}`,
                url: videoUrl,
                title: videoTitle,
                thumbnail: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
                source: 'youtube'
            }
        ]);
        setVideoUrl('');
    };

    const handleVideoFileUpload = async (files: FileList | null) => {
      if (!files) return;
      
      setIsUploading(true);
      const newUploads: VideoItem[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const tempId = `upload-${file.name}-${Date.now()}`;
        const newUploadItem: VideoItem = {
            id: tempId,
            url: '',
            title: file.name,
            thumbnail: '',
            source: 'upload',
        };
        newUploads.push(newUploadItem);

        uploadWithProgress('/api/upload/resource-file', file, (progress) => {
            setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
        })
        .then(result => {
             setVideos(prev => prev.map(v => v.id === tempId ? {...v, url: result.url} : v));
             setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));
        })
        .catch(err => {
            toast({ title: `Error subiendo ${file.name}`, description: (err as Error).message, variant: 'destructive' });
            // Eliminar el video fallido de la lista de videos a añadir
            setVideos(prev => prev.filter(v => v.id !== tempId));
        });
      }
      setVideos(prev => [...prev, ...newUploads.map(u => ({...u, url: '#placeholder'}))]);
      setIsUploading(false);
    };
    
    const handleRemoveVideo = (id: string) => {
        setVideos(prev => prev.filter(v => v.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalVideos = videos.filter(v => v.url && v.url !== '#placeholder');
            if (finalVideos.length === 0) {
                throw new Error("Añade al menos un video válido a la lista.");
            }

            const response = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, description, category, parentId,
                    type: 'VIDEO_PLAYLIST',
                    videos: finalVideos.map(v => ({ url: v.url, title: v.title })),
                }),
            });
            if (!response.ok) throw new Error('No se pudo crear la lista de reproducción.');
            
            toast({ title: "Lista de Reproducción Creada" });
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Lista de Videos</DialogTitle>
                    <DialogDescription>Agrupa videos en una secuencia de aprendizaje.</DialogDescription>
                </DialogHeader>
                <form id="playlist-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-1.5"><Label htmlFor="playlist-title">Título de la Lista</Label><Input id="playlist-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="playlist-description">Descripción (Opcional)</Label><Input id="playlist-description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div className="space-y-1.5">
                        <Label>Añadir Videos</Label>
                        <RadioGroup value={videoSource} onValueChange={(v) => setVideoSource(v as 'youtube' | 'upload')} className="grid grid-cols-2 gap-2">
                           <div>
                             <RadioGroupItem value="youtube" id="src-youtube" className="sr-only"/>
                             <Label htmlFor="src-youtube" className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer ${videoSource === 'youtube' ? 'border-primary' : 'border-muted'}`}><Youtube className="h-5 w-5"/> YouTube</Label>
                           </div>
                           <div>
                             <RadioGroupItem value="upload" id="src-upload" className="sr-only"/>
                             <Label htmlFor="src-upload" className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer ${videoSource === 'upload' ? 'border-primary' : 'border-muted'}`}><UploadCloud className="h-5 w-5"/> Subir Video</Label>
                           </div>
                        </RadioGroup>

                        {videoSource === 'youtube' ? (
                          <div className="flex gap-2">
                            <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Pega una URL de YouTube"/>
                            <Button type="button" onClick={handleAddVideoFromUrl} disabled={!videoUrl}><PlusCircle className="h-4 w-4"/></Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <UploadArea onFileSelect={handleVideoFileUpload} disabled={isUploading} inputId="video-upload-input" multiple={true} />
                          </div>
                        )}
                        
                        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2">
                            {videos.map(video => (
                                <div key={video.id} className="flex items-center gap-2 p-2 border rounded-md">
                                    <div className="w-20 h-12 bg-black rounded flex-shrink-0 relative">
                                        {video.thumbnail ? (
                                            <Image src={video.thumbnail} alt={video.title} fill className="object-cover"/>
                                        ) : (
                                            <div className="flex items-center justify-center h-full"><Youtube className="h-6 w-6 text-red-500"/></div>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                       <p className="text-sm font-medium truncate">{video.title}</p>
                                       {uploadProgress[video.id] < 100 && <Progress value={uploadProgress[video.id] || 0} className="h-1 mt-1"/>}
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveVideo(video.id)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" form="playlist-form" disabled={isSaving || !title || videos.length === 0}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListVideo className="mr-2 h-4 w-4"/>}
                        Crear Lista
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
