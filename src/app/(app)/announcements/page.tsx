// src/app/(app)/announcements/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Announcement as AnnouncementType, Reaction, CalendarEvent } from '@/types';
import { Loader2, AlertTriangle, Edit, Trash2, Megaphone, PlusCircle, Pin, PinOff, Calendar } from 'lucide-react';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const UpcomingEventsWidget = ({ events }: { events: CalendarEvent[] }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary"/>
                    Próximos Eventos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                 {events.length > 0 ? events.map(event => {
                    const eventDate = parseISO(event.start);
                    return (
                        <Link href="/calendar" key={event.id} className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                               <span className="font-bold text-lg">{format(eventDate, 'd')}</span>
                               <span className="text-xs font-semibold">{format(eventDate, 'MMM', { locale: es })}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.allDay ? 'Todo el día' : format(eventDate, 'p', { locale: es })}</p>
                            </div>
                        </Link>
                    )
                 }) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No hay eventos próximos.</p>
                 )}
            </CardContent>
             <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/calendar">Ver calendario completo</Link>
                </Button>
             </CardFooter>
        </Card>
    )
}


export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();

  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementType | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<AnnouncementType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setPageTitle("Anuncios");
  }, [setPageTitle]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [announcementsRes, dashboardRes] = await Promise.all([
             fetch('/api/announcements?pageSize=50', { cache: 'no-store' }),
             fetch('/api/dashboard/data', { cache: 'no-store' })
        ]);
      
      if (!announcementsRes.ok) throw new Error(`Error al obtener los anuncios`);
      const announcementData: { announcements: AnnouncementType[] } = await announcementsRes.json();
      setAnnouncements(announcementData.announcements || []);

      if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          setUpcomingEvents(dashboardData.upcomingEvents || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRealtimeEvent = useCallback((payload: any) => {
    // A simple re-fetch is the most robust way to handle multiple event types
    fetchData();
  }, [fetchData]);

  useRealtime('announcements', handleRealtimeEvent);
  useRealtime('events', handleRealtimeEvent);

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
      fetchData();
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
      fetchData();
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
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Tablón de Anuncios</h1>
              <p className="text-muted-foreground">Las últimas noticias y comunicados de la organización.</p>
            </div>
            
             {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : error ? (
                <div className="text-center p-8 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" />{error}</div>
              ) : announcements.length === 0 ? (
                <Card className="text-center py-16 text-muted-foreground">
                     <CardHeader>
                        <Megaphone className="mx-auto h-12 w-12 mb-4" />
                        <CardTitle>No hay anuncios por ahora</CardTitle>
                        <CardDescription>Vuelve más tarde para ver las últimas noticias.</CardDescription>
                     </CardHeader>
                </Card>
              ) : (
                <div className="space-y-4">
                    {announcements.map(announcement => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onEdit={setEditingAnnouncement}
                        onDelete={() => setDeletingAnnouncement(announcement)}
                        onReactionChange={handleReactionChange}
                        onRead={handleMarkAsRead}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                </div>
              )}
        </div>
        
        {/* Sidebar Column */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-6 lg:sticky lg:top-24">
             {canCreate && (
               <Card>
                  <CardHeader>
                      <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={() => setIsCreatorOpen(true)} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Anuncio
                      </Button>
                  </CardContent>
               </Card>
            )}
            <UpcomingEventsWidget events={upcomingEvents} />
        </div>
      </div>


      {canCreate && (
        <AnnouncementCreator
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onAnnouncementCreated={() => {
            setIsCreatorOpen(false);
            fetchData();
          }}
        />
      )}

      {editingAnnouncement && (
        <AnnouncementEditorModal
          isOpen={!!editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          announcement={editingAnnouncement}
          onUpdateSuccess={fetchData}
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
