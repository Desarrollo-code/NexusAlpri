// src/components/messages/announcement-viewer.tsx
'use client';
import React from 'react';
import type { Announcement as AnnouncementType } from '@/types';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { AnnouncementCard } from '../announcements/announcement-card';

// Usamos el componente `AnnouncementCard` ya existente y lo envolvemos
// para proporcionar una vista detallada.
export const AnnouncementViewer = ({ announcement, onBack }: { announcement: AnnouncementType, onBack: () => void }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b flex items-center gap-3 h-16">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}><ArrowLeft/></Button>
                <h3 className="font-semibold text-sm">Anuncio</h3>
            </div>
            <ScrollArea className="flex-1 p-4 bg-muted/30">
                <AnnouncementCard announcement={announcement} onSelect={() => {}} isSelected={false} />
            </ScrollArea>
        </div>
    );
}
