// src/components/announcements/announcements-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Announcement as AnnouncementType, Reaction } from '@/types';
import { Megaphone, Loader2 } from 'lucide-react';
import { CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AnnouncementCreator } from './announcement-creator';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface AnnouncementItemProps {
  announcement: AnnouncementType;
  onSelect: (announcement: AnnouncementType) => void;
}

const AnnouncementItem: React.FC<AnnouncementItemProps> = ({ announcement, onSelect }) => {
  const formattedDate = announcement.date ? format(parseISO(announcement.date), 'd MMM, yyyy', { locale: es }) : '';

  return (
    <button
      onClick={() => onSelect(announcement)}
      className="w-full text-left p-4 border-b hover:bg-muted/50 transition-colors flex flex-col gap-2"
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={announcement.author?.avatar || undefined} />
            <AvatarFallback><Identicon userId={announcement.author?.id || ''} /></AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{announcement.author?.name || 'Sistema'}</span>
        </div>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      <p className="font-medium text-base text-foreground pl-8">{announcement.title}</p>
      {announcement.content && (
         <p className="text-sm text-muted-foreground pl-8 line-clamp-2" dangerouslySetInnerHTML={{ __html: announcement.content.replace(/<[^>]+>/g, '') }} />
      )}
    </button>
  );
};


interface AnnouncementsViewProps {
    onSelectAnnouncement: (announcement: AnnouncementType) => void;
}

export function AnnouncementsView({ onSelectAnnouncement }: AnnouncementsViewProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const { toast } = useToast();

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/announcements?filter=all&pageSize=50', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Error al obtener los anuncios`);
      const data: { announcements: AnnouncementType[], totalAnnouncements: number } = await response.json();
      setAnnouncements(data.announcements);
    } catch (err) {
      // Silently fail for this component
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <>
      <div className="p-2 border-b flex items-center justify-end h-16">
        <Button variant="outline" size="sm" onClick={() => setIsCreatorOpen(true)}>Crear Anuncio</Button>
      </div>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div>
            {isLoading ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                  <Megaphone className="mx-auto h-8 w-8 mb-2"/>
                  <p>No hay anuncios</p>
              </div>
            ) : (
               <div>
                 {announcements.map((announcement) => (
                    <AnnouncementItem
                        key={announcement.id}
                        announcement={announcement}
                        onSelect={onSelectAnnouncement}
                    />
                 ))}
               </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
       <AnnouncementCreator 
          isOpen={isCreatorOpen} 
          onClose={() => setIsCreatorOpen(false)} 
          onAnnouncementCreated={() => {
              setIsCreatorOpen(false);
              fetchAnnouncements();
          }}
      />
    </>
  );
}
