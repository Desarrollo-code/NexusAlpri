// src/app/(app)/announcements/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';
import { AnnouncementCard } from '@/components/announcement-card';
import { Button, buttonVariants } from '@/components/ui/button';
import type { Announcement as AnnouncementType, UserRole, Attachment, Reaction } from '@/types'; 
import { PlusCircle, Megaphone, Loader2, AlertTriangle, Trash2, Edit, UploadCloud, Pin, PinOff, Check } from 'lucide-react';
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

interface LocalAttachmentPreview {
    id: string; // Temporary client-side ID
    file: File;
    previewUrl: string; // Object URL for local preview
    finalUrl?: string; // Supabase URL after upload
    uploadProgress: number;
    error?: string;
}


const AnnouncementCreator = ({ onAnnouncementCreated }: { onAnnouncementCreated: () => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [formContent, setFormContent] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formAudience, setFormAudience] = useState<UserRole | 'ALL'>('ALL');
    const [localPreviews, setLocalPreviews] = useState<LocalAttachmentPreview[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        const files = Array.from(event.target.files);

        const newPreviews: LocalAttachmentPreview[] = files.map(file => ({
            id: `${file.name}-${Date.now()}`,
            file,
            previewUrl: URL.createObjectURL(file),
            uploadProgress: 0,
        }));

        setLocalPreviews(prev => [...prev, ...newPreviews]);
        
        newPreviews.forEach(preview => {
            uploadFile(preview);
        });
    };

    const uploadFile = async (preview: LocalAttachmentPreview) => {
        try {
            const result = await uploadWithProgress('/api/upload/announcement-attachment', preview.file, (progress) => {
                setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, uploadProgress: progress } : p));
            });
            setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, finalUrl: result.publicUrl, uploadProgress: 100 } : p));
        } catch (err) {
            setLocalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, error: (err as Error).message } : p));
        }
    };

    const handleSaveAnnouncement = async () => {
        if (!formTitle.trim() && !formContent.trim() && localPreviews.length === 0) {
            toast({ title: "Contenido vacío", description: "Por favor, añade un título, escribe un mensaje o adjunta un archivo.", variant: "destructive" });
            return;
        }

        const isStillUploading = localPreviews.some(p => p.uploadProgress > 0 && p.uploadProgress < 100);
        if (isStillUploading) {
            // Este toast fue eliminado por solicitud del usuario
            return;
        }

        const attachmentsToSave = localPreviews.filter(p => p.finalUrl).map(p => ({
            name: p.file.name,
            url: p.finalUrl!,
            type: p.file.type,
            size: p.file.size
        }));
        
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formTitle,
                    content: formContent,
                    audience: formAudience,
                    attachments: attachmentsToSave,
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
            setLocalPreviews([]);
            onAnnouncementCreated();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            localPreviews.forEach(p => URL.revokeObjectURL(p.previewUrl));
        };
    }, [localPreviews]);

    const removePreview = (id: string) => {
        const previewToRemove = localPreviews.find(p => p.id === id);
        if (previewToRemove) {
            URL.revokeObjectURL(previewToRemove.previewUrl);
        }
        setLocalPreviews(prev => prev.filter(p => p.id !== id));
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
                         {localPreviews.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {localPreviews.map((p) => (
                                    <div key={p.id} className="relative aspect-square border rounded-md overflow-hidden">
                                        <Image src={p.previewUrl} alt={p.file.name} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-1 transition-opacity duration-300">
                                            {p.uploadProgress > 0 && p.uploadProgress < 100 && !p.error && (
                                                <div className="w-full px-2">
                                                    <Progress value={p.uploadProgress} className="h-1 bg-white/30"/>
                                                    <p className="text-xs text-white text-center mt-1">{Math.round(p.uploadProgress)}%</p>
                                                </div>
                                            )}
                                            {p.uploadProgress === 100 && !p.error && (
                                                <Check className="h-8 w-8 text-white bg-green-500/80 rounded-full p-1" />
                                            )}
                                            {p.error && (
                                                <AlertTriangle className="h-8 w-8 text-destructive"/>
                                            )}
                                        </div>
                                         <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removePreview(p.id)}>
                                            <Trash2 className="h-3 w-3"/>
                                        </Button>
                                    </div>
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

  const [allAnnouncements, setAllAnnouncements] = useState<AnnouncementType[]>([]);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const activeTab = user?.role === 'STUDENT' ? 'all' : (searchParams.get('tab') || 'all');
  const totalPages = Math.ceil(totalAnnouncements / 5); // Assuming PAGE_SIZE is 5

  const [announcementToProcess, setAnnouncementToProcess] = useState<{ action: 'delete' | 'edit', data: AnnouncementType } | null>(null);
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
      params.append('pageSize', String(5));
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

      const data: { announcements: AnnouncementType[], totalAnnouncements: number } = await response.json();
      
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

  const handleEditRequest = (announcement: AnnouncementType) => {
      setAnnouncementToProcess({ action: 'edit', data: announcement });
  };
  
  const canCreate = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';

  return (
    <div className="container mx-auto announcement-pattern-bg">
        <div className="bg-transparent">
            <main className="max-w-2xl mx-auto relative z-10">
                <p className="text-muted-foreground text-center mb-8">Mantente informado sobre las últimas novedades de la plataforma.</p>
                
                {canCreate && <AnnouncementCreator onAnnouncementCreated={fetchAnnouncements} />}
                
                {user?.role !== 'STUDENT' && (
                <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
                        <TabsList className="w-full">
                            <TabsTrigger value="all">Todos</TabsTrigger>
                            <TabsTrigger value="by-me">Creados por mí</TabsTrigger>
                            <TabsTrigger value="by-others">Creados por otros</TabsTrigger>
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
                    {allAnnouncements.map((announcement: AnnouncementType) => (
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
        </div>
        
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
function AnnouncementEditorModal({ announcement, isOpen, onClose, onUpdateSuccess }: { announcement: AnnouncementType, isOpen: boolean, onClose: () => void, onUpdateSuccess: () => void }) {
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