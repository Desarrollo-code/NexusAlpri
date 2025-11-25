// src/components/resources/video-playlist-view.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { AppResourceType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlayCircle, Folder, Video, Edit, ListVideo } from 'lucide-react';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { BrainCircuit } from 'lucide-react';

interface PlaylistItemProps {
  resource: AppResourceType;
  onSelect: () => void;
  isActive: boolean;
  onTitleChange: (id: string, newTitle: string) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ resource, onSelect, isActive, onTitleChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(resource.title);
  const { toast } = useToast();

  const youtubeId = getYoutubeVideoId(resource.url);
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

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
        "flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-all duration-300 group relative border-2",
        isActive ? "bg-primary/10 border-primary shadow-lg" : "border-transparent hover:bg-muted"
      )}
    >
      <div className="relative w-28 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={resource.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            quality={75}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <PlayCircle className="h-8 w-8 text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
      <div className="flex-grow min-w-0">
        {isEditing ? (
             <Input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
                autoFocus
                onClick={(e) => e.stopPropagation()} // Evitar que el clic en el input seleccione el video
             />
        ) : (
            <p 
                className="font-semibold truncate text-foreground"
                title={resource.title}
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            >
                {resource.title}
            </p>
        )}
        <p className="text-sm text-muted-foreground truncate">Por: {resource.uploaderName}</p>
      </div>
       {isActive && (
            <div className="absolute top-1/2 -translate-y-1/2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow">
              VIENDO
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
  const [playlistResources, setPlaylistResources] = useState(initialResources);
  const [selectedVideo, setSelectedVideo] = useState<AppResourceType | null>(playlistResources[0] || null);

  useEffect(() => {
    setPlaylistResources(initialResources);
    if (!selectedVideo && initialResources.length > 0) {
        setSelectedVideo(initialResources[0]);
    }
  }, [initialResources, selectedVideo]);


  const playlistHeight = isMobile ? 'h-64' : 'h-[calc(100vh-22rem)]';
  const isQuizEnabled = folder.category === 'Formación Interna';

  const handleTitleChange = (id: string, newTitle: string) => {
      setPlaylistResources(prev => prev.map(r => r.id === id ? {...r, title: newTitle} : r));
      if(selectedVideo?.id === id) {
          setSelectedVideo(prev => prev ? {...prev, title: newTitle} : null);
      }
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2">
         <Card className="shadow-lg overflow-hidden border-2">
             <div className="w-full aspect-video bg-black">
                <VideoPlayer resource={selectedVideo} />
             </div>
             <CardContent className="p-4 bg-card">
                <CardTitle className="truncate text-xl">{selectedVideo?.title || "Selecciona un video"}</CardTitle>
                <CardDescription>Subido por: {selectedVideo?.uploaderName}</CardDescription>
             </CardContent>
         </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="w-full h-full shadow-lg flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-xl font-bold font-headline">
                  <ListVideo className="h-6 w-6 text-primary" />
                  {folder.title}
                </CardTitle>
                <CardDescription>{playlistResources.length} videos en esta lista.</CardDescription>
              </div>
              {isQuizEnabled && (
                  <Button asChild size="sm">
                      <Link href={`/resources/${folder.id}/edit-quiz`}>
                          <BrainCircuit className="mr-2 h-4 w-4" /> Quiz
                      </Link>
                  </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-2 flex-1 min-h-0">
            <ScrollArea className="h-full">
                {playlistResources.length > 0 ? (
                    <div className="p-2 space-y-1">
                        {playlistResources.map((resource) => (
                        <PlaylistItem
                            key={resource.id}
                            resource={resource}
                            onSelect={() => setSelectedVideo(resource)}
                            isActive={selectedVideo?.id === resource.id}
                            onTitleChange={handleTitleChange}
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
  );
};
