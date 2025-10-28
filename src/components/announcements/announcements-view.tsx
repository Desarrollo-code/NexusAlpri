// src/components/announcements/announcements-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { Announcement as AnnouncementType, Reaction } from '@/types'; 
import { Megaphone, Loader2, AlertTriangle, Trash2, Edit, Pin, PinOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { AnnouncementCard } from './announcement-card';
import { AnnouncementEditorModal } from './announcement-editor-modal';
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

export function AnnouncementsView({ key: updateKey }: { key: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allAnnouncements, setAllAnnouncements] = useState<AnnouncementType[]>([]);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const activeFilter = user?.role === 'STUDENT' ? 'all' : (searchParams.get('filter') || 'all');
  const totalPages = Math.ceil(totalAnnouncements / 5);

  const [announcementToProcess, setAnnouncementToProcess] = useState<{ action: 'delete' | 'edit', data: AnnouncementType } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createQueryString = useCallback((paramsToUpdate: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([name, value]) => {
      params.set(name, String(value));
    });
    return params.toString();
  }, [searchParams]);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('pageSize', String(5));
      if (activeFilter && user?.role !== 'STUDENT') {
          params.append('filter', activeFilter);
      }
      
      const response = await fetch(`/api/announcements?${params.toString()}`, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error((await response.json()).message || `Error al obtener los anuncios`);
      }

      const data: { announcements: AnnouncementType[], totalAnnouncements: number } = await response.json();
      setAllAnnouncements(data.announcements);
      setTotalAnnouncements(data.totalAnnouncements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeFilter, user?.role, updateKey]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      router.push(`${pathname}?${createQueryString({ tab: 'announcements', filter: activeFilter, page: page })}`);
    }
  };

  const handleFilterChange = (filter: string) => {
    router.push(`${pathname}?${createQueryString({ tab: 'announcements', filter, page: 1 })}`);
  };

  const handleReactionChange = (announcementId: string, updatedReactions: Reaction[]) => {
      setAllAnnouncements(prev => 
          prev.map(ann => 
              ann.id === announcementId ? { ...ann, reactions: updatedReactions, _count: { ...ann._count, reactions: updatedReactions.length } } : ann
          )
      );
  };
  
   const handleRead = (announcementId: string) => {
      setAllAnnouncements(prev => prev.map(ann => {
        if (ann.id === announcementId) {
          const userAlreadyRead = ann.reads.some(r => r.id === user?.id);
          if (userAlreadyRead) return ann;
          return {
            ...ann,
            _count: { ...ann._count, reads: (ann._count?.reads || 0) + 1 }
          };
        }
        return ann;
      }));
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToProcess || announcementToProcess.action !== 'delete') return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/announcements/${announcementToProcess.data.id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).message || 'No se pudo eliminar el anuncio.');
      }
      toast({ title: 'Anuncio Eliminado' });
      fetchAnnouncements();
    } catch (err) {
      toast({ title: 'Error al eliminar', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setAnnouncementToProcess(null);
    }
  };

  const handleTogglePin = async (announcement: AnnouncementType) => {
    setIsProcessing(true);
    try {
        const res = await fetch(`/api/announcements/${announcement.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPinned: !announcement.isPinned })
        });
        if (!res.ok) throw new Error("No se pudo actualizar el estado.");
        toast({ title: "Anuncio " + (!announcement.isPinned ? "fijado" : "desfijado") });
        fetchAnnouncements();
    } catch(err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      {user?.role !== 'STUDENT' && (
        <Tabs value={activeFilter} onValueChange={handleFilterChange}>
          <TabsList className="w-full">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="by-me">Creados por mí</TabsTrigger>
            <TabsTrigger value="by-others">Creados por otros</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive-foreground bg-destructive/30 rounded-lg">
          <AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">Error al cargar anuncios</p><p className="text-sm">{error}</p>
        </div>
      ) : allAnnouncements.length > 0 ? (
        <>
          <div className="space-y-4">
            {allAnnouncements.map((announcement: AnnouncementType) => (
                <div key={announcement.id} id={announcement.id}>
                <AnnouncementCard 
                    announcement={announcement}
                    onEdit={() => setAnnouncementToProcess({ action: 'edit', data: announcement })}
                    onDelete={() => setAnnouncementToProcess({ action: 'delete', data: announcement })}
                    onReactionChange={handleReactionChange}
                    onRead={handleRead}
                    onTogglePin={handleTogglePin}
                />
                </div>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={cn(buttonVariants({variant: 'outline'}), currentPage === 1 ? "pointer-events-none opacity-50" : "")}/></PaginationItem>
                <PaginationItem><span className="text-sm p-2 font-semibold text-center">Página {currentPage} de {totalPages}</span></PaginationItem>
                <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={cn(buttonVariants({variant: 'outline'}), currentPage === totalPages ? "pointer-events-none opacity-50" : "")}/></PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card/50">
          <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold mb-2">No hay anuncios</h3><p className="text-muted-foreground">No se encontraron anuncios que coincidan con el filtro seleccionado.</p>
        </div>
      )}

      <AlertDialog open={announcementToProcess?.action === 'delete'} onOpenChange={(open) => !open && setAnnouncementToProcess(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>El anuncio será eliminado permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAnnouncement} disabled={isProcessing} className={buttonVariants({ variant: "destructive" })}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {announcementToProcess?.action === 'edit' && (
        <AnnouncementEditorModal
          announcement={announcementToProcess.data}
          isOpen={true}
          onClose={() => setAnnouncementToProcess(null)}
          onUpdateSuccess={fetchAnnouncements}
        />
      )}
    </div>
  );
}
