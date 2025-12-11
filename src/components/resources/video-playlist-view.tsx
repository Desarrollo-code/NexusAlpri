// src/components/resources/video-playlist-view.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { AppResourceType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlayCircle, Folder, Video, Edit, ListVideo, BrainCircuit, Trash2, Loader2 } from 'lucide-react';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { FileIcon } from '@/components/ui/file-icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/auth-context';


interface PlaylistItemProps {
  resource: AppResourceType;
  onSelect: () => void;
  isActive: boolean;
  onTitleChange: (id: string, newTitle: string) => void;
  onDelete: (resource: AppResourceType) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ resource, onSelect, isActive, onTitleChange, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(resource.title);
  const { toast } = useToast();
  const { user } = useAuth();

  const canModify = user?.role === 'ADMINISTRATOR' || user?.id === resource.uploaderId;

  const youtubeId = getYoutubeVideoId(resource.url);
  const fileExtension = youtubeId ? 'youtube' : (resource.filetype?.split('/')[1] || resource.url?.split('.').pop() || 'file');

  const handleTitleSave = async () => {
    if (title.trim() === resource.title) {
        setIsEditing(false);
        return;
    }
    try {
      const response = await fetch(`/api/resources/${resource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) throw new Error('No se pudo guardar el título.');
      onTitleChange(resource.id, title.trim());
      toast({ description: "Título actualizado." });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      setTitle(resource.title); // Revertir en caso de error
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleTitleSave();
      } else if (e.key === 'Escape') {
          setTitle(resource.title);
          setIsEditing(false);
      }
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 group relative",
        isActive ? "bg-primary/15 border-primary" : "border-transparent hover:bg-muted"
      )}
    >
        <div className="w-32 h-20 bg-black rounded-md overflow-hidden flex-shrink-0 relative">
            <FileIcon 
                displayMode="list" 
                type={fileExtension} 
                thumbnailUrl={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg` : resource.url}
                className="w-full h-full"
             />
             {isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-white" />
                </div>
             )}
        </div>
      <div className="flex-grow min-w-0 pt-1">
        {isEditing ? (
             <Input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
                autoFocus
                onClick={(e) => e.stopPropagation()} 
             />
        ) : (
            <p 
                className="font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary"
                title={resource.title}
            >
                {resource.title}
            </p>
        )}
        <p className="text-xs text-muted-foreground mt-1 truncate">Subido por: {resource.uploaderName}</p>
      </div>
      {canModify && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(resource); }}>
                <Trash2 className="h-4 w-4"/>
            </Button>
        </div>
      )}
    </div>
  );
};


interface VideoPlayerProps {
    resource: AppResourceType | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ resource }) => {
    if (!resource || !resource.url) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center text-muted-foreground">
                <PlayCircle className="h-16 w-16 mb-4"/>
                <p>Selecciona un video para reproducir</p>
            </div>
        );
    }
    
    const youtubeId = getYoutubeVideoId(resource.url);

    if (youtubeId) {
        return (
            <iframe
                key={resource.id}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={resource.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        );
    }

    return (
        <video
            key={resource.id}
            src={resource.url}
            controls
            autoPlay
            className="w-full h-full object-contain bg-black"
        >
            Tu navegador no soporta la etiqueta de video.
        </video>
    );
};


export const VideoPlaylistView: React.FC<{ resources: AppResourceType[], folder: AppResourceType }> = ({ resources: initialResources, folder }) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [playlistResources, setPlaylistResources] = useState(initialResources);
  const [selectedVideo, setSelectedVideo] = useState<AppResourceType | null>(playlistResources[0] || null);
  const [videoToDelete, setVideoToDelete] = useState<AppResourceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setPlaylistResources(initialResources);
    if (!selectedVideo && initialResources.length > 0) {
        setSelectedVideo(initialResources[0]);
    }
  }, [initialResources, selectedVideo]);


  const playlistHeight = isMobile ? 'h-64' : 'h-[calc(100vh-22rem)]';
  const hasQuiz = !!folder.quiz;

  const handleTitleChange = (id: string, newTitle: string) => {
      setPlaylistResources(prev => prev.map(r => r.id === id ? {...r, title: newTitle} : r));
      if(selectedVideo?.id === id) {
          setSelectedVideo(prev => prev ? {...prev, title: newTitle} : null);
      }
  }
  
  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);
    try {
        const response = await fetch(`/api/resources/${videoToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo eliminar el video.');
        }
        toast({ description: "El video ha sido eliminado de la lista." });
        
        // Update state locally
        const newPlaylist = playlistResources.filter(r => r.id !== videoToDelete.id);
        setPlaylistResources(newPlaylist);
        
        // If the deleted video was the selected one, select the next one or null
        if (selectedVideo?.id === videoToDelete.id) {
            const deletedIndex = playlistResources.findIndex(r => r.id === videoToDelete.id);
            setSelectedVideo(newPlaylist[deletedIndex] || newPlaylist[0] || null);
        }
    } catch (err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setVideoToDelete(null);
    }
  };


  return (
    <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
            <Card className="shadow-2xl overflow-hidden border-2 bg-black">
                <div className="w-full aspect-video">
                    <VideoPlayer resource={selectedVideo} />
                </div>
                 <div className="p-4">
                    <h3 className="truncate text-xl font-bold text-white">{selectedVideo?.title || "Selecciona un video"}</h3>
                    <p className="mt-1 text-sm text-white/70">Subido por: {selectedVideo?.uploaderName}</p>
                </div>
            </Card>
        </div>

        <div className="lg:col-span-4">
            <Card className="w-full h-full shadow-lg flex flex-col bg-card/90 backdrop-blur-sm">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-lg flex-shrink-0"><ListVideo className="h-6 w-6"/></div>
                    <div>
                        <CardTitle className="text-lg font-bold font-headline">{folder.title}</CardTitle>
                        <CardDescription className="text-xs">{playlistResources.length} videos en esta lista.</CardDescription>
                    </div>
                    </div>
                </div>
                <Button asChild size="sm" variant="secondary">
                    <Link href={`/resources/${folder.id}/edit-quiz`}>
                        <BrainCircuit className="mr-2 h-4 w-4" /> Quiz
                    </Link>
                </Button>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-2 flex-1 min-h-0">
                <ScrollArea className="h-full max-h-[60vh] pr-2 thin-scrollbar">
                    {playlistResources.length > 0 ? (
                        <div className="p-2 space-y-1">
                            {playlistResources.map((resource) => (
                            <PlaylistItem
                                key={resource.id}
                                resource={resource}
                                onSelect={() => setSelectedVideo(resource)}
                                isActive={selectedVideo?.id === resource.id}
                                onTitleChange={handleTitleChange}
                                onDelete={setVideoToDelete}
                            />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground text-sm">
                            Esta lista de reproducción no contiene videos.
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            </Card>
        </div>
        </div>
        
        <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar este video?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Se eliminará "<strong>{videoToDelete?.title}</strong>" de esta lista de reproducción. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteVideo} disabled={isDeleting} className={cn(buttonVariants({ variant: 'destructive'}))}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
};
