// src/components/resources/video-playlist-view.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { AppResourceType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlayCircle, Folder, Video } from 'lucide-react';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlaylistItemProps {
  resource: AppResourceType;
  index: number;
  onSelect: () => void;
  isActive: boolean;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ resource, index, onSelect, isActive }) => {
  const youtubeId = getYoutubeVideoId(resource.url);
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors group",
        isActive && "bg-primary/10"
      )}
    >
      <div className="text-muted-foreground font-semibold w-6 text-center shrink-0">{index + 1}</div>
      <div className="relative w-32 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
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
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <PlayCircle className="h-8 w-8 text-white drop-shadow-lg" />
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold truncate">{resource.title}</p>
        <p className="text-sm text-muted-foreground truncate">{resource.uploaderName}</p>
      </div>
    </div>
  );
};


interface VideoPlayerProps {
    resource: AppResourceType | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ resource }) => {
    if (!resource || !resource.url) {
        return (
            <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground">
                <PlayCircle className="h-16 w-16 mb-4"/>
                <p>Selecciona un video para reproducir</p>
            </div>
        );
    }
    
    const youtubeId = getYoutubeVideoId(resource.url);

    if (youtubeId) {
        return (
            <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={resource.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        );
    }

    // Para videos subidos directamente (MP4, etc.)
    return (
        <video
            src={resource.url}
            controls
            autoPlay
            className="w-full h-full object-contain bg-black"
        >
            Tu navegador no soporta la etiqueta de video.
        </video>
    );
};


export const VideoPlaylistView: React.FC<{ resources: AppResourceType[], folderName: string }> = ({ resources, folderName }) => {
  const isMobile = useIsMobile();
  const [selectedVideo, setSelectedVideo] = useState<AppResourceType | null>(resources[0] || null);

  const playlistHeight = isMobile ? 'h-64' : 'h-[calc(100vh-22rem)]';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2">
         <Card className="shadow-lg overflow-hidden">
             <div className="w-full aspect-video bg-muted">
                <VideoPlayer resource={selectedVideo} />
             </div>
             <CardContent className="p-4">
                <CardTitle>{selectedVideo?.title || "Selecciona un video"}</CardTitle>
                <CardDescription>Subido por: {selectedVideo?.uploaderName}</CardDescription>
             </CardContent>
         </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="w-full h-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold font-headline">
              <Folder className="h-6 w-6 text-amber-500" />
              {folderName}
            </CardTitle>
            <CardDescription>{resources.length} videos en esta lista.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className={playlistHeight}>
              <div className="p-2 space-y-1">
                {resources.map((resource, index) => (
                  <PlaylistItem
                    key={resource.id}
                    resource={resource}
                    index={index}
                    onSelect={() => setSelectedVideo(resource)}
                    isActive={selectedVideo?.id === resource.id}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
