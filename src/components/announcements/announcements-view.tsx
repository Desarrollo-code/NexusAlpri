// src/components/announcements/announcements-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Announcement as AnnouncementType, Reaction } from '@/types'; 
import { Megaphone, Loader2 } from 'lucide-react';
import { CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AnnouncementCreator } from './announcement-creator';
import { ScrollArea } from '../ui/scroll-area';
import { AnnouncementCard } from './announcement-card'; 
import Link from 'next/link';
import { AnnouncementEditorModal } from './announcement-editor-modal';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';

interface AnnouncementsViewProps {
    onSelectAnnouncement: (announcement: AnnouncementType) => void;
}

export function AnnouncementsView({ onSelectAnnouncement }: AnnouncementsViewProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementType | null>(null);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleUpdateSuccess = () => {
    fetchAnnouncements();
    setEditingAnnouncement(null);
  };
  
  const handleReactionChange = (announcementId: string, updatedReactions: Reaction[]) => {
      setAnnouncements(prev => prev.map(ann => 
          ann.id === announcementId ? { ...ann, reactions: updatedReactions } : ann
      ));
  };
  
  const handleTogglePin = async (announcement: AnnouncementType) => {
    try {
        const response = await fetch(`/api/announcements/${announcement.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPinned: !announcement.isPinned }),
        });
        if (!response.ok) throw new Error("No se pudo actualizar el estado de fijado.");
        toast({ title: announcement.isPinned ? "Anuncio desfijado" : "Anuncio fijado" });
        fetchAnnouncements();
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  const handleDelete = async () => {
    if (!deletingAnnouncementId) return;
    setIsProcessing(true);
    try {
        const response = await fetch(`/api/announcements/${deletingAnnouncementId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("No se pudo eliminar el anuncio.");
        toast({ title: "Anuncio Eliminado" });
        fetchAnnouncements();
    } catch (err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsProcessing(false);
        setDeletingAnnouncementId(null);
    }
  };

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Anuncios Globales</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setIsCreatorOpen(true)}>Crear</Button>
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
               <div className="space-y-3">
                 {announcements.map((announcement: AnnouncementType) => (
                    <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onEdit={setEditingAnnouncement}
                        onDelete={setDeletingAnnouncementId}
                        onReactionChange={handleReactionChange}
                        onTogglePin={handleTogglePin}
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
       {editingAnnouncement && (
            <AnnouncementEditorModal
                announcement={editingAnnouncement}
                isOpen={!!editingAnnouncement}
                onClose={() => setEditingAnnouncement(null)}
                onUpdateSuccess={handleUpdateSuccess}
            />
       )}
       <AlertDialog open={!!deletingAnnouncementId} onOpenChange={(open) => !open && setDeletingAnnouncementId(null)}>
           <AlertDialogContent>
               <AlertDialogHeader>
                   <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                   <AlertDialogDescription>Esta acción no se puede deshacer. El anuncio será eliminado permanentemente.</AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                   <AlertDialogCancel>Cancelar</AlertDialogCancel>
                   <AlertDialogAction onClick={handleDelete} disabled={isProcessing} className={cn(buttonVariants({variant: 'destructive'}))}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Eliminar
                   </AlertDialogAction>
               </AlertDialogFooter>
           </AlertDialogContent>
       </AlertDialog>
    </>
  );
}
