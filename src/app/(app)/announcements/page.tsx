

'use client';

import { AnnouncementCard } from '@/components/announcement-card';
import { Button, buttonVariants } from '@/components/ui/button';
import type { Announcement as AnnouncementType, UserRole } from '@/types'; 
import { PlusCircle, Megaphone, Loader2, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Announcement as PrismaAnnouncement, User as PrismaUser } from '@prisma/client';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTitle } from '@/contexts/title-context';

interface DisplayAnnouncement extends Omit<PrismaAnnouncement, 'author' | 'audience'> {
  author: { id: string; name: string; email?: string } | null;
  audience: UserRole[] | 'ALL' | string;
}

const PAGE_SIZE = 6; // 2x3 grid

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setPageTitle } = useTitle();

  const [allAnnouncements, setAllAnnouncements] = useState<DisplayAnnouncement[]>([]);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalAnnouncements / PAGE_SIZE);

  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState<DisplayAnnouncement | null>(null);

  const [formAudience, setFormAudience] = useState<UserRole | 'ALL'>('ALL');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const [announcementToDelete, setAnnouncementToDelete] = useState<DisplayAnnouncement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setPageTitle('Anuncios');
  }, [setPageTitle]);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('pageSize', String(PAGE_SIZE));

      const response = await fetch(`/api/announcements?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch announcements: ${response.statusText}`);
      }
      const data: { announcements: DisplayAnnouncement[], totalAnnouncements: number } = await response.json();
      
      setAllAnnouncements(data.announcements);
      setTotalAnnouncements(data.totalAnnouncements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar los anuncios');
      setAllAnnouncements([]);
      setTotalAnnouncements(0);
      toast({ title: "Error al cargar anuncios", description: err instanceof Error ? err.message : 'No se pudieron cargar los anuncios.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentPage]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const relevantAnnouncements = useMemo(() => {
    if (!user) return [];
    return allAnnouncements
      .filter(ann => {
        if (ann.audience === 'ALL') return true;
        if (Array.isArray(ann.audience) && ann.audience.includes(user.role)) return true;
        return false;
      });
  }, [user, allAnnouncements]);
  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  );
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      router.push(`${pathname}?${createQueryString('page', String(page))}`);
    }
  };

  const resetFormAndState = () => {
    setFormTitle('');
    setFormContent('');
    setFormAudience('ALL');
    setAnnouncementToEdit(null);
  }

  const handleOpenCreateModal = () => {
    resetFormAndState();
    setShowCreateEditModal(true);
  };

  const handleOpenEditModal = (announcement: DisplayAnnouncement) => {
    setAnnouncementToEdit(announcement);
    setFormTitle(announcement.title);
    setFormContent(announcement.content);
    
    if (announcement.audience === 'ALL') {
        setFormAudience('ALL');
    } else if (Array.isArray(announcement.audience) && announcement.audience.length > 0) {
        setFormAudience(announcement.audience[0]);
    } else {
        setFormAudience('ALL');
    }
    
    setShowCreateEditModal(true);
  };


  const handleSaveAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formTitle || !formContent) {
      toast({ title: "Error", description: "El título y el contenido son obligatorios.", variant: "destructive" });
      return;
    }
    if (!user || !user.id) {
        toast({ title: "Error", description: "Debes estar autenticado para guardar un anuncio.", variant: "destructive"});
        return;
    }

    setIsProcessing(true);
    const method = announcementToEdit ? 'PUT' : 'POST';
    const endpoint = announcementToEdit ? `/api/announcements/${announcementToEdit.id}` : '/api/announcements';
    
    const audiencePayload = formAudience === 'ALL' ? 'ALL' : [formAudience];

    const payload = {
        title: formTitle,
        content: formContent,
        authorId: user.id, 
        audience: audiencePayload,
    };

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${announcementToEdit ? 'update' : 'create'} announcement`);
      }
      
      toast({ 
          title: announcementToEdit ? "Anuncio Actualizado" : "Anuncio Creado", 
          description: `El anuncio "${formTitle}" ha sido ${announcementToEdit ? 'actualizado' : 'publicado'}.` 
      });
      setShowCreateEditModal(false);
      resetFormAndState();
      fetchAnnouncements();
    } catch (err) {
      toast({ 
          title: `Error al ${announcementToEdit ? 'actualizar' : 'crear'} anuncio`, 
          description: err instanceof Error ? err.message : `No se pudo ${announcementToEdit ? 'actualizar' : 'crear'} el anuncio.`, 
          variant: "destructive" 
      });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/announcements/${announcementToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete announcement' }));
        throw new Error(errorData.message);
      }
      toast({ title: 'Anuncio Eliminado', description: `El anuncio "${announcementToDelete.title}" ha sido eliminado.` });
      fetchAnnouncements();
    } catch (err) {
      toast({ title: 'Error al eliminar', description: err instanceof Error ? err.message : 'No se pudo eliminar el anuncio.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setAnnouncementToDelete(null);
    }
  };

  const openDeleteConfirmation = (announcementId: string) => {
    const annToDelete = allAnnouncements.find(ann => ann.id === announcementId);
    if(annToDelete) {
        setAnnouncementToDelete(annToDelete);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <p className="text-muted-foreground">Mantente informado sobre las últimas novedades de NexusAlpri.</p>
        </div>
        {(user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') && (
          <div className="flex flex-row flex-wrap items-center gap-2">
            <Dialog open={showCreateEditModal} onOpenChange={(isOpen) => {
                setShowCreateEditModal(isOpen);
                if (!isOpen) resetFormAndState();
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCreateModal}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Anuncio
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] flex flex-col">
                <form onSubmit={handleSaveAnnouncement} id="announcement-form">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{announcementToEdit ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}</DialogTitle>
                    <DialogDescription>
                      {announcementToEdit ? 'Modifica los detalles del anuncio.' : 'Redacta y publica un nuevo comunicado para los usuarios.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto px-6 py-4 thin-scrollbar">
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="title">Título <span className="text-destructive">*</span></Label>
                      <Input 
                        id="title" 
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Título del anuncio" 
                        required
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="content">Contenido <span className="text-destructive">*</span></Label>
                        <Textarea
                          id="content"
                          value={formContent}
                          onChange={(e) => setFormContent(e.target.value)}
                          placeholder="Escribe aquí el contenido del anuncio para los usuarios..."
                          required
                          disabled={isProcessing}
                          rows={5}
                        />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="audience">Dirigido a <span className="text-destructive">*</span></Label>
                      <Select 
                          name="audience" 
                          value={formAudience}
                          onValueChange={(value) => setFormAudience(value as UserRole | 'ALL')}
                          required
                          disabled={isProcessing}
                        >
                          <SelectTrigger id="audience" className="col-span-3">
                            <SelectValue placeholder="Seleccionar audiencia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="STUDENT">Estudiantes</SelectItem>
                            <SelectItem value="INSTRUCTOR">Instructores</SelectItem>
                            <SelectItem value="ADMINISTRATOR">Administradores</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground text-center pt-2">
                        Los campos marcados con <span className="text-destructive">*</span> son obligatorios.
                    </p>
                    </div>
                    </div>
                    </form>
                    <DialogFooter className="p-6 pt-4 flex-row justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => { setShowCreateEditModal(false); resetFormAndState();}} disabled={isProcessing}>Cancelar</Button>
                      <Button type="submit" form="announcement-form" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (announcementToEdit ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />) }
                        {announcementToEdit ? 'Guardar Cambios' : 'Publicar Anuncio'}
                      </Button>
                    </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Cargando anuncios...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error al cargar anuncios</p>
          <p className="text-sm">{error}</p>
          <Button onClick={() => router.refresh()} variant="outline" className="mt-4">Reintentar</Button>
        </div>
      ) : relevantAnnouncements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relevantAnnouncements.map((announcement: DisplayAnnouncement) => (
            <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement}
                onDelete={openDeleteConfirmation}
                onEdit={handleOpenEditModal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay anuncios recientes</h3>
          <p className="text-muted-foreground">Vuelve más tarde para ver las últimas novedades o crea uno nuevo si tienes permisos.</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>
                        {i + 1}
                    </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El anuncio "<strong>{announcementToDelete?.title}</strong>" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => setAnnouncementToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAnnouncement} 
              disabled={isProcessing}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
