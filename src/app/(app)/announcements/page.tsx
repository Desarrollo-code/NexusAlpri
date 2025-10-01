// src/app/(app)/announcements/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';
import { AnnouncementCard } from '@/components/announcement-card';
import { Button, buttonVariants } from '@/components/ui/button';
import type { Announcement as AnnouncementType, UserRole, Attachment, Reaction } from '@/types'; 
import { PlusCircle, Megaphone, Loader2, AlertTriangle, Trash2, Edit, UploadCloud, Pin, PinOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTitle } from '@/contexts/title-context';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from '@/components/ui/progress';
import { getIconForFileType } from '@/lib/resource-utils';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import Image from 'next/image';
import Link from 'next/link';
import { uploadWithProgress } from '@/lib/upload-with-progress';

interface DisplayAnnouncement extends AnnouncementType {
  author: { id: string; name: string; email?: string, avatar?: string | null } | null;
  audience: UserRole[] | 'ALL' | string;
  attachments: Attachment[];
  isPinned: boolean;
}

const PAGE_SIZE = 5;
const MAX_FILE_SIZE_MB = 4;

const AnnouncementCreator = ({ onAnnouncementCreated }: { onAnnouncementCreated: () => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [formContent, setFormContent] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formAudience, setFormAudience] = useState<UserRole | 'ALL'>('ALL');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        const files = Array.from(event.target.files);

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                toast({ title: "Archivo demasiado grande", description: `"${file.name}" excede el límite de ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
                continue;
            }
            
            try {
                const result = await uploadWithProgress('/api/upload/announcement-attachment', file, (progress) => {
                    setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                });
                setAttachments(prev => [...prev, { id: result.path, name: file.name, url: result.publicUrl, type: file.type, size: file.size }]);
            } catch (err) {
                toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
            } finally {
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[file.name];
                    return newProgress;
                });
            }
        }
    };


    const handleSaveAnnouncement = async () => {
        if (!formTitle.trim() && !formContent.trim() && attachments.length === 0) {
            toast({ title: "Contenido vacío", description: "Por favor, añade un título, escribe un mensaje o adjunta un archivo.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formTitle,
                    content: formContent,
                    audience: formAudience,
                    attachments: attachments,
                }),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'No se pudo crear el anuncio.');
            }
            toast({ title: "Anuncio Publicado", description: "Tu anuncio ahora es visible para la audiencia seleccionada." });
            setFormContent('');
            setFormTitle('');
            setFormAudience('ALL');
            setAttachments([]);
            onAnnouncementCreated();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card className="shadow-sm card-border-animated mb-8">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar className="h-10 w-10 hidden sm:block">
                        <AvatarImage src={user?.avatar || undefined}/>
                        <AvatarFallback><Identicon userId={user?.id || ''}/></AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-3">
                         <Input 
                            value={formTitle} 
                            onChange={(e) => setFormTitle(e.target.value)} 
                            placeholder="Título del anuncio..." 
                            className="text-base font-semibold border-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary" 
                            disabled={isSubmitting}
                        />
                         <RichTextEditor
                          value={formContent}
                          onChange={setFormContent}
                          placeholder="¿Qué quieres comunicar hoy?"
                          disabled={isSubmitting}
                          className="!border-0 !bg-transparent p-0"
                        />
                         {attachments.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {attachments.map((att, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <Image src={att.url} alt={att.name} fill className="object-cover rounded-md border" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {Object.keys(uploadProgress).length > 0 && (
                             <div className="mt-2 space-y-1">
                                {Object.entries(uploadProgress).map(([id, progress]) => (
                                     <Progress key={id} value={progress} className="h-1" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center px-4 py-3 border-t">
                <div className="flex items-center gap-2">
                     <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="h-5 w-5" />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />

                    <Select value={formAudience} onValueChange={(v) => setFormAudience(v as any)} disabled={isSubmitting}>
                        <SelectTrigger className="h-8 w-auto text-xs gap-2">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="ALL">Todos</SelectItem>
                             <SelectItem value="STUDENT">Estudiantes</SelectItem>
                             <SelectItem value="INSTRUCTOR">Instructores</SelectItem>
                             <SelectItem value="ADMINISTRATOR">Administradores</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <Button size="sm" onClick={handleSaveAnnouncement} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Megaphone className="mr-2 h-4 w-4"/>}
                    Publicar
                </Button>
            </CardFooter>
        </Card>
    )
}

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
  const activeTab = user?.role === 'STUDENT' ? 'all' : (searchParams.get('tab') || 'all');
  const totalPages = Math.ceil(totalAnnouncements / PAGE_SIZE);

  const [announcementToProcess, setAnnouncementToProcess] = useState<{ action: 'delete' | 'edit', data: DisplayAnnouncement } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setPageTitle('Anuncios');
  }, [setPageTitle]);

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
      params.append('pageSize', String(PAGE_SIZE));
      if (activeTab && user?.role !== 'STUDENT') {
          params.append('filter', activeTab);
      }
      
      const response = await fetch(`/api/announcements?${params.toString()}`, { cache: 'no-store' });
      
      if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Respuesta no válida del servidor: ${response.statusText}` };
        }
        throw new Error(errorData.message || `Error al obtener los anuncios`);
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
  }, [toast, currentPage, activeTab, user?.role]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      router.push(`${pathname}?${createQueryString({ tab: activeTab, page: page })}`);
    }
  };

  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?${createQueryString({ tab, page: 1 })}`);
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
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete announcement' }));
        throw new Error(errorData.message);
      }
      toast({ title: 'Anuncio Eliminado', description: `El anuncio ha sido eliminado.` });
      fetchAnnouncements();
    } catch (err) {
      toast({ title: 'Error al eliminar', description: err instanceof Error ? err.message : 'No se pudo eliminar el anuncio.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setAnnouncementToProcess(null);
    }
  };

  const handleTogglePin = async (announcement: DisplayAnnouncement) => {
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

  const handleEditRequest = (announcement: DisplayAnnouncement) => {
      setAnnouncementToProcess({ action: 'edit', data: announcement });
  };
  
  const canCreate = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';

  return (
    <div className="container mx-auto">
        <main className="max-w-2xl mx-auto">
            <p className="text-muted-foreground text-center mb-8">Mantente informado sobre las últimas novedades de la plataforma.</p>
            
            {canCreate && <AnnouncementCreator onAnnouncementCreated={fetchAnnouncements} />}
            
            {user?.role !== 'STUDENT' && (
               <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
                    <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
                        <TabsTrigger value="by-me" className="flex-1">Creados por mí</TabsTrigger>
                        <TabsTrigger value="by-others" className="flex-1">Creados por otros</TabsTrigger>
                    </TabsList>
               </Tabs>
            )}

            <div className="space-y-6">
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
                <Button onClick={() => fetchAnnouncements()} variant="outline" className="mt-4">Reintentar</Button>
                </div>
            ) : allAnnouncements.length > 0 ? (
                <>
                {allAnnouncements.map((announcement: DisplayAnnouncement) => (
                    <div key={announcement.id} id={announcement.id}>
                        <AnnouncementCard 
                            announcement={announcement}
                            onEdit={() => handleEditRequest(announcement)}
                            onDelete={() => setAnnouncementToProcess({ action: 'delete', data: announcement })}
                            onReactionChange={handleReactionChange}
                            onRead={handleRead}
                            onTogglePin={handleTogglePin}
                        />
                    </div>
                ))}
                </>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay anuncios que mostrar</h3>
                <p className="text-muted-foreground">No se encontraron anuncios que coincidan con el filtro seleccionado.</p>
                </div>
            )}

          {totalPages > 1 && !isLoading && (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                    </PaginationItem>
                    <PaginationItem>
                        <span className="text-sm p-2 text-muted-foreground">Página {currentPage} de {totalPages}</span>
                    </PaginationItem>
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
          </div>
        </main>
        
        <AlertDialog open={announcementToProcess?.action === 'delete'} onOpenChange={(open) => !open && setAnnouncementToProcess(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El anuncio será eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing} onClick={() => setAnnouncementToProcess(null)}>
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

// --- MODAL DE EDICIÓN ---
function AnnouncementEditorModal({ announcement, isOpen, onClose, onUpdateSuccess }: { announcement: DisplayAnnouncement, isOpen: boolean, onClose: () => void, onUpdateSuccess: () => void }) {
    const { toast } = useToast();
    const [title, setTitle] = useState(announcement.title);
    const [content, setContent] = useState(announcement.content);
    const [audience, setAudience] = useState(announcement.audience as UserRole | 'ALL');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/announcements/${announcement.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, audience }),
            });
            if (!response.ok) throw new Error((await response.json()).message || "No se pudo actualizar el anuncio.");
            
            toast({ title: "Anuncio Actualizado", description: "Los cambios han sido guardados." });
            onUpdateSuccess();
            onClose();
        } catch (err) {
            toast({ title: 'Error al Guardar', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar Anuncio</DialogTitle>
                    <DialogDescription>Realiza cambios en el título, contenido o audiencia del anuncio.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Contenido</Label>
                        <div className="col-span-3">
                           <RichTextEditor value={content} onChange={setContent} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="audience" className="text-right">Audiencia</Label>
                         <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos</SelectItem>
                                <SelectItem value="STUDENT">Estudiantes</SelectItem>
                                <SelectItem value="INSTRUCTOR">Instructores</SelectItem>
                                <SelectItem value="ADMINISTRATOR">Administradores</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

```