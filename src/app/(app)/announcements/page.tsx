// src/app/(app)/announcements/page.tsx
'use client';

import React, 'useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Announcement as AnnouncementType, Reaction } from '@/types';
import { Loader2, AlertTriangle, Edit, Trash2, Megaphone, PlusCircle, Pin, PinOff } from 'lucide-react';
import { AnnouncementCard } from '@/components/announcement-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { AnnouncementCreator } from '@/components/announcements/announcement-creator';
import { AnnouncementEditorModal } from '@/components/announcements/announcement-editor-modal';
import { useRealtime } from '@/hooks/use-realtime';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();

  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementType | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<AnnouncementType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setPageTitle("Anuncios");
  }, [setPageTitle]);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/announcements', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Error al obtener los anuncios`);
      const data: { announcements: AnnouncementType[] } = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleRealtimeEvent = useCallback((payload: any) => {
    if (payload.event === 'announcement_deleted') {
      setAnnouncements(prev => prev.filter(a => a.id !== payload.payload.id));
    } else if (payload.event === 'announcement_updated' || payload.event === 'announcement_created') {
      fetchAnnouncements();
    }
  }, [fetchAnnouncements]);

  useRealtime('announcements', handleRealtimeEvent);

  const handleMarkAsRead = useCallback((announcementId: string) => {
    setAnnouncements(prev =>
      prev.map(ann => {
        if (ann.id === announcementId && user && !ann.reads.some(r => r.id === user.id)) {
          return { ...ann, reads: [...ann.reads, user] };
        }
        return ann;
      })
    );
  }, [user]);

  const handleReactionChange = useCallback((announcementId: string, updatedReactions: Reaction[]) => {
    setAnnouncements(prev =>
      prev.map(ann =>
        ann.id === announcementId ? { ...ann, reactions: updatedReactions } : ann
      )
    );
  }, []);
  
   const handleTogglePin = async (announcement: AnnouncementType) => {
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !announcement.isPinned }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el anclaje.');
      fetchAnnouncements();
      toast({ description: `Anuncio ${!announcement.isPinned ? 'fijado' : 'desfijado'}.` });
    } catch(err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
    }
  };


  const confirmDelete = async () => {
    if (!deletingAnnouncement) return;
    setIsProcessing(true);
    try {
      await fetch(`/api/announcements/${deletingAnnouncement.id}`, { method: 'DELETE' });
      toast({ description: "Anuncio eliminado." });
      fetchAnnouncements();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setDeletingAnnouncement(null);
    }
  };

  const canCreate = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Anuncios</h1>
          <p className="text-muted-foreground">Mantente al día con las últimas noticias y comunicados de la organización.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreatorOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Anuncio
          </Button>
        )}
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-center p-8 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" />{error}</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
                <Megaphone className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No hay anuncios por ahora</h3>
                <p>Vuelve más tarde para ver las últimas noticias.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-4 p-4">
                {announcements.map(announcement => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={setEditingAnnouncement}
                    onDelete={setDeletingAnnouncement}
                    onReactionChange={handleReactionChange}
                    onRead={handleMarkAsRead}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {canCreate && (
        <AnnouncementCreator
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onAnnouncementCreated={() => {
            setIsCreatorOpen(false);
            fetchAnnouncements();
          }}
        />
      )}

      {editingAnnouncement && (
        <AnnouncementEditorModal
          isOpen={!!editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          announcement={editingAnnouncement}
          onUpdateSuccess={fetchAnnouncements}
        />
      )}

      <AlertDialog open={!!deletingAnnouncement} onOpenChange={(isOpen) => !isOpen && setDeletingAnnouncement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará el anuncio "{deletingAnnouncement?.title}". Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isProcessing} className={cn(buttonVariants({ variant: 'destructive' }))}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}