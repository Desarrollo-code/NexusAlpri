// src/components/resources/video-playlist-view.tsx
'use client';
import React from 'react';
import type { AppResourceType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlayCircle, Folder } from 'lucide-react';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { Separator } from '@/components/ui/separator';

interface VideoPlaylistViewProps {
  resources: AppResourceType[];
  onSelectResource: (resource: AppResourceType) => void;
  folderName: string;
}

const PlaylistItem = ({ resource, index, onSelect }: { resource: AppResourceType; index: number; onSelect: () => void; }) => {
  const youtubeId = getYoutubeVideoId(resource.url);
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : resource.url; // Fallback a la url si no es youtube
  const isYoutube = !!youtubeId;

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors group"
    >
      <div className="text-muted-foreground font-semibold w-6 text-center">{index + 1}</div>
      <div className="relative w-32 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={resource.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {isYoutube && (
           <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <PlayCircle className="h-8 w-8 text-white drop-shadow-lg" />
           </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold truncate">{resource.title}</p>
        <p className="text-sm text-muted-foreground truncate">{resource.uploaderName}</p>
      </div>
    </div>
  );
};


export const VideoPlaylistView: React.FC<VideoPlaylistViewProps> = ({ resources, onSelectResource, folderName }) => {
  return (
    <Card className="w-full h-full shadow-lg">
       <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold font-headline">
             <Folder className="h-6 w-6 text-amber-500" />
             {folderName}
          </CardTitle>
          <CardDescription>
             Esta carpeta se muestra como una lista de reproducción porque contiene principalmente videos.
          </CardDescription>
       </CardHeader>
       <Separator/>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-22rem)]">
          <div className="p-2 space-y-1">
            {resources.map((resource, index) => (
              <PlaylistItem
                key={resource.id}
                resource={resource}
                index={index}
                onSelect={() => onSelectResource(resource)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
