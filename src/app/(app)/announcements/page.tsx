// src/app/(app)/announcements/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Announcement as AnnouncementType, Reaction, CalendarEvent, UserRole } from '@/types';
import { AlertTriangle, PlusCircle, Pin, PinOff, Calendar, TrendingUp } from 'lucide-react';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams, useRouter } from 'next/navigation';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { EmptyState } from '@/components/empty-state';
import { Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

function AnnouncementsPageComponent() {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementType | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<AnnouncementType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeTab = searchParams.get('filter') || 'all';

  useEffect(() => {
    setPageTitle("Anuncios");
  }, [setPageTitle]);

  const fetchData = useCallback(async (filter: string) => {
    setIsLoading(true);
    setError(null);
    try {
        const [announcementsRes, dashboardRes] = await Promise.all([
             fetch(`/api/announcements?pageSize=50&filter=${filter}`, { cache: 'no-store' }),
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
    fetchData(activeTab);
  }, [fetchData, activeTab]);

  const handleTabChange = (value: string) => {
    router.push(`/announcements?filter=${value}`);
  };

  const handleRealtimeEvent = useCallback((payload: any) => {
    fetchData(activeTab);
  }, [fetchData, activeTab]);

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
      fetchData(activeTab);
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
      fetchData(activeTab);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setDeletingAnnouncement(null);
    }
  };

  const canCreate = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';
  
  const AnnouncementSkeleton = () => (
    <div className="break-inside-avoid">
        <Card className="w-full">
            <CardHeader className="p-4 flex flex-row items-start gap-4 space-y-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="w-full space-y-2">
                    <div className="flex justify-between">
                         <Skeleton className="h-4 w-24" />
                         <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-full rounded-lg" />
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 pl-16">
                 <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between pl-16">
                 <Skeleton className="h-8 w-24" />
                 <Skeleton className="h-4 w-10" />
            </CardFooter>
        </Card>
    </div>
  );


  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Tablón de Anuncios</h1>
              <p className="text-muted-foreground">Las últimas noticias y comunicados de la organización.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="pinned"><Pin className="mr-2 h-4 w-4"/>Fijados</TabsTrigger>
                    <TabsTrigger value="trending"><TrendingUp className="mr-2 h-4 w-4"/>Tendencias</TabsTrigger>
                    {canCreate && <TabsTrigger value="by-me">Mis Anuncios</TabsTrigger>}
                </TabsList>
            </Tabs>

             {isLoading ? (
                <div className="masonry-grid">
                  {[...Array(6)].map((_, i) => <AnnouncementSkeleton key={i} />)}
                </div>
              ) : error ? (
                <div className="text-center p-8 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" />{error}</div>
              ) : announcements.length === 0 ? (
                 <EmptyState
                    icon={Megaphone}
                    title="No hay anuncios por ahora"
                    description="Vuelve más tarde para ver las últimas noticias en esta sección."
                    imageUrl={settings?.announcementsImageUrl}
                />
              ) : (
                <div className="masonry-grid">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="break-inside-avoid">
                         <AnnouncementCard
                            announcement={announcement}
                            onEdit={setEditingAnnouncement}
                            onDelete={() => setDeletingAnnouncement(announcement)}
                            onReactionChange={handleReactionChange}
                            onRead={handleMarkAsRead}
                            onTogglePin={handleTogglePin}
                          />
                      </div>
                    ))}
                </div>
              )}
        </div>
        
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
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
            fetchData(activeTab);
          }}
        />
      )}

      {editingAnnouncement && (
        <AnnouncementEditorModal
          isOpen={!!editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          announcement={editingAnnouncement}
          onUpdateSuccess={() => fetchData(activeTab)}
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
              {isProcessing && <div className="w-4 h-4 mr-2"><ColorfulLoader /></div>}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <style jsx>{`
        .masonry-grid {
          column-count: 1;
          column-gap: 1.5rem; /* Equivalent to gap-6 */
        }
        @media (min-width: 768px) {
          .masonry-grid {
            column-count: 2;
          }
        }
        @media (min-width: 1280px) {
          .masonry-grid {
            column-count: 3;
          }
        }
        .break-inside-avoid {
          break-inside: avoid;
          padding-bottom: 1.5rem; /* Add space at the bottom of each item */
        }
      `}</style>
    </>
  );
}

export default function AnnouncementsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><div className="w-8 h-8"><ColorfulLoader /></div></div>}>
            <AnnouncementsPageComponent />
        </Suspense>
    )
}
