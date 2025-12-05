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
import { Loader2, ListVideo, PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';

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
}

export function PlaylistCreatorModal({ isOpen, onClose, parentId, onSave }: PlaylistCreatorModalProps) {
    const { toast } = useToast();
    const { settings } = useAuth();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setCategory(settings?.resourceCategories[0] || 'General');
            setVideoUrl('');
            setVideos([]);
        }
    }, [isOpen, settings]);
    
    const handleAddVideo = () => {
        const youtubeId = getYoutubeVideoId(videoUrl);
        if (!youtubeId) {
            toast({ title: 'URL inválida', description: 'Por favor, ingresa una URL de YouTube válida.', variant: 'destructive'});
            return;
        }

        // Placeholder para el título, se podría obtener de la API de YouTube en el futuro.
        const videoTitle = `Video ${videos.length + 1}`;

        setVideos(prev => [
            ...prev,
            {
                id: `video-${Date.now()}`,
                url: videoUrl,
                title: videoTitle,
                thumbnail: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
            }
        ]);
        setVideoUrl('');
    };
    
    const handleRemoveVideo = (id: string) => {
        setVideos(prev => prev.filter(v => v.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, description, category, parentId,
                    type: 'VIDEO_PLAYLIST',
                    videos: videos.map(v => ({ url: v.url, title: v.title })),
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
                    <DialogDescription>Agrupa videos de YouTube en una secuencia de aprendizaje.</DialogDescription>
                </DialogHeader>
                <form id="playlist-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-1.5"><Label htmlFor="playlist-title">Título de la Lista</Label><Input id="playlist-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="playlist-description">Descripción (Opcional)</Label><Input id="playlist-description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div className="space-y-1.5">
                        <Label>Videos de YouTube</Label>
                        <div className="flex gap-2">
                           <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Pega una URL de YouTube"/>
                           <Button type="button" onClick={handleAddVideo}><PlusCircle className="h-4 w-4"/></Button>
                        </div>
                        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2">
                            {videos.map(video => (
                                <div key={video.id} className="flex items-center gap-2 p-2 border rounded-md">
                                    <Image src={video.thumbnail} alt={video.title} width={80} height={45} className="rounded aspect-video object-cover"/>
                                    <span className="text-sm font-medium truncate flex-grow">{video.title}</span>
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
