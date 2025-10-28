// src/components/announcements/announcements-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Announcement as AnnouncementType } from '@/types'; 
import { Megaphone, Loader2 } from 'lucide-react';
import { AnnouncementCard } from './announcement-card';
import { CardHeader, CardTitle, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { AnnouncementCreator } from './announcement-creator';

export function AnnouncementsView({ onSelect, selectedId }: { onSelect: (announcement: AnnouncementType) => void, selectedId: string | null }) {
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/announcements?filter=all&pageSize=20', { cache: 'no-store' });
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Anuncios Globales</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsCreatorOpen(true)}>Crear</Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                  <Megaphone className="mx-auto h-8 w-8 mb-2"/>
                  <p>No hay anuncios</p>
              </div>
            ) : (
               <div className="space-y-1">
                 {announcements.map((announcement: AnnouncementType) => (
                    <AnnouncementCard 
                        key={announcement.id}
                        announcement={announcement}
                        onSelect={() => onSelect(announcement)}
                        isSelected={selectedId === announcement.id}
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
