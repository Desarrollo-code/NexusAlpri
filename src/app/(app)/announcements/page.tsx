

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
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      const data: { announcements: PrismaAnnouncement[], totalAnnouncements: number } = await response.json();
      
      const displayData: DisplayAnnouncement[] = data.announcements.map(ann => {
        let parsedAudience: UserRole[] | 'ALL' = 'ALL';
        if (ann.audience === 'ALL') {
          parsedAudience = 'ALL';
        } else if (Array.isArray(ann.audience)) { 
            parsedAudience = ann.audience as UserRole[];
        }
        return {
          ...ann,
          audience: parsedAudience, 
          author: ann.author ? { id: ann.author.id, name: ann.author.name } : null,
        };
      });
      setAllAnnouncements(displayData);
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
    return allAnnouncements
      .filter(ann => {
        if (ann.audience === 'ALL') return true;
        if (user && Array.isArray(ann.audience) && ann.audience.includes(user.role)) return true;
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete announcement');
      }
      toast({ title: 'Anuncio Eliminado', description: `El anuncio "${announcementToDelete.title}" ha sido eliminado.` });
      fetchAnnouncements();
    } catch (err) {
      toast({ title: 'Error al eliminar', description: err instanceof Error ? err.message : 'No se pudo eliminar el anuncio.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirmDialog(false);
      setAnnouncementToDelete(null);
    }
  };

  const openDeleteConfirmation = (announcementId: string) => {
    const annToDel = allAnnouncements.find(ann => ann.id === announcementId);
    if (annToDel) {
      setAnnouncementToDelete(annToDel);
      setShowDeleteConfirmDialog(true);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2">Anuncios y Comunicados</h1>
            <p className="text-muted-foreground">Mantente informado sobre las últimas novedades de NexusAlpri.</p>
        </div>
        {(user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') && (
          <div className="flex flex-row flex-wrap items-center gap-2">
            <Dialog open={showCreateEditModal} onOpenChange={(isOpen) => {
                setShowCreateEditModal(isOpen);
                if (!isOpen) resetFormAndState();
            }}>
              <DialogTrigger asChild>
                <button className="relative flex items-center justify-start w-[100px] h-[40px] border-none p-5 bg-purple-600 text-white font-medium cursor-pointer rounded-lg shadow-[5px_5px_0px_rgb(140,32,212)] transition-all duration-300 hover:text-transparent active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_rgb(140,32,212)]">
                  {announcementToEdit ? 'Editar' : 'Crear'}
                  <svg className="w-[13px] absolute right-5 fill-white transition-all duration-300 group-hover:right-[43%] group-hover:m-0 group-hover:p-0 group-hover:border-none" viewBox="0 0 512 512">
                    <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                  </svg>
                </button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{announcementToEdit ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}</DialogTitle>
                  <DialogDescription>
                    {announcementToEdit ? 'Modifica los detalles del anuncio.' : 'Redacta y publica un nuevo comunicado para los usuarios.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveAnnouncement} className="grid gap-4 py-4">
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
                      <div className="styled-input-container">
                        <div className="styled-input-chat">
                          <div className="relative flex">
                              <textarea 
                                id="content" 
                                name="content" 
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                placeholder="Imagina algo...✦˚"
                                className="styled-input-textarea"
                                required
                                disabled={isProcessing}
                              />
                          </div>
                           <div className="styled-input-options">
                                <div className="styled-input-btns-add">
                                  {/* Decorative buttons */}
                                  <button type="button"><svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8" /></svg></button>
                                  <button type="button"><svg viewBox="0 0 24 24" height={20} width={20} xmlns="http://www.w3.org/2000/svg"><path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0-8h6m-3-3v6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" fill="none" /></svg></button>
                                </div>
                                <button type="submit" className="styled-input-btn-submit" disabled={isProcessing}>
                                    <i><svg viewBox="0 0 512 512"><path fill="currentColor" d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05" /></svg></i>
                                </button>
                           </div>
                        </div>
                      </div>
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
                  <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setShowCreateEditModal(false); resetFormAndState();}} disabled={isProcessing}>Cancelar</Button>
                    <Button type="submit" disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (announcementToEdit ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />) }
                      {announcementToEdit ? 'Guardar Cambios' : 'Publicar Anuncio'}
                    </Button>
                  </DialogFooter>
                </form>
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
          <Button onClick={fetchAnnouncements} variant="outline" className="mt-4">Reintentar</Button>
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

      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El anuncio "<strong>{announcementToDelete?.title}</strong>" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel disabled={isProcessing}>
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
