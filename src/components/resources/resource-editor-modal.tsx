
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { motion, AnimatePresence } from 'framer-motion';

// Componentes de UI
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, UploadCloud, Link as LinkIcon, FilePen, Briefcase, Calendar as CalendarIcon, Globe, Users, X, Edit } from 'lucide-react'; // Se eliminaron iconos no utilizados
import type { AppResourceType, User as AppUser, ResourceSharingMode, Process } from '@/types';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { FileIcon } from '@/components/ui/file-icon';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { QuizViewer } from '@/components/quiz-viewer';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle // 💡 Agregados
} from '@/components/ui/card';
// Componente de prueba (se asume que existe)
// import { QuizViewer } from '@/components/quiz-viewer'; 

// 💡 Se asume que estos se encuentran en un archivo modularizado auxiliar
import { getInitials, UploadState, ResourceEditorModalProps, renderUploads } from './resource-editor-modal-parts';

// ====================================================================================================
// ============================= COMPONENTE PRINCIPAL =================================================
// ====================================================================================================

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave }: ResourceEditorModalProps) {
  const { toast } = useToast();
  const { user, settings } = useAuth();

  // Agrupación de estados de detalles del recurso
  const [resourceDetails, setResourceDetails] = useState({
    title: '', description: '', content: '', observations: '', category: '', externalLink: '',
    resourceType: 'DOCUMENT' as AppResourceType['type'],
  });

  // Agrupación de estados de acceso
  const [access, setAccess] = useState({
    sharingMode: 'PUBLIC' as ResourceSharingMode,
    sharedWithUserIds: [] as string[],
    sharedWithProcessIds: [] as string[],
    collaboratorIds: [] as string[],
    expiresAt: undefined as Date | undefined,
  });

  // Estados funcionales
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const isEditing = !!resource;
  const { title, description, content, category, externalLink, resourceType, observations } = resourceDetails;
  const { sharingMode, sharedWithUserIds, sharedWithProcessIds, collaboratorIds, expiresAt } = access;

  // --- Lógica de Manejo de Estado ---

  const handleResourceDetailChange = (key: keyof typeof resourceDetails, value: any) => {
    setResourceDetails(prev => ({ ...prev, [key]: value }));
  };

  const handleAccessChange = (key: keyof typeof access, value: any) => {
    setAccess(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = useCallback(() => {
    setResourceDetails({
      title: '', description: '', content: '', observations: '', category: settings?.resourceCategories[0] || 'General',
      externalLink: '', resourceType: 'DOCUMENT',
    });
    setAccess({
      sharingMode: 'PUBLIC', sharedWithUserIds: [], sharedWithProcessIds: [],
      collaboratorIds: [], expiresAt: undefined,
    });
    setUploads([]);
  }, [settings?.resourceCategories]);

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setResourceDetails({
          title: resource.title || '',
          description: resource.description || '',
          content: resource.content || '',
          observations: resource.observations || '',
          category: resource.category || settings?.resourceCategories[0] || 'General',
          externalLink: resource.type === 'EXTERNAL_LINK' ? resource.url || '' : '',
          resourceType: resource.type,
        });
        setAccess({
          sharingMode: resource.sharingMode || 'PUBLIC',
          sharedWithUserIds: resource.sharedWith?.map(u => u.id) || [],
          sharedWithProcessIds: resource.sharedWithProcesses?.map(p => p.id) || [],
          collaboratorIds: resource.collaborators?.map(c => c.id) || [],
          expiresAt: resource.expiresAt ? new Date(resource.expiresAt) : undefined,
        });
        setUploads([]);
      } else {
        resetForm();
      }

      // Nota: En una aplicación real, estas llamadas API deberían ser más robustas
      if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR' || isEditing) {
        fetch('/api/users/list').then(res => res.json()).then(data => setAllUsers(data.users || []));
        fetch('/api/processes').then(res => res.json()).then(data => setAllProcesses(data || []));
      }
    }
  }, [resource, isOpen, resetForm, settings, user, isEditing]);

  // --- Lógica de Guardado y Subida ---

  const saveResourceToDb = useCallback(async (payload: any): Promise<boolean> => {
    const endpoint = isEditing ? `/api/resources/${resource!.id}` : '/api/resources';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar en la base de datos.');
      }
      onSave(responseData.resource); // Asume que el endpoint devuelve el recurso guardado
      return true;
    } catch (err) {
      console.error("DB Save Error:", err);
      toast({ title: 'Error de Sincronización', description: `No se pudo guardar "${payload.title}": ${(err as Error).message}`, variant: 'destructive' });
      return false;
    }
  }, [isEditing, resource, toast, onSave]);

  const uploadFileAndSave = useCallback(async (upload: UploadState) => {
    try {
      // 1. Subida del archivo
      const result = await uploadWithProgress('/api/upload/resource-file', upload.file, (p) => {
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: p } : u));
      });

      // 2. Actualización de estado de subida
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 100, status: 'completed', url: result.url } : u));

      // 3. Guardar metadatos en la DB
      const payload = {
        title: uploads.length > 1 ? upload.file.name.split('.').slice(0, -1).join('.') : title,
        filename: upload.file.name,
        description, category,
        sharingMode,
        sharedWithUserIds: sharingMode === 'PRIVATE' ? sharedWithUserIds : [],
        sharedWithProcessIds: sharingMode === 'PROCESS' ? sharedWithProcessIds : [],
        collaboratorIds: [],
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        status: 'ACTIVE', type: 'DOCUMENT', url: result.url,
        size: upload.file.size, filetype: upload.file.type, parentId,
      };

      const success = await saveResourceToDb(payload);
      if (!success) {
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error', error: 'Fallo al guardar en la base de datos.' } : u));
      }

    } catch (err) {
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error', error: (err as Error).message } : u));
    }
  }, [sharingMode, parentId, title, description, category, sharedWithUserIds, sharedWithProcessIds, expiresAt, uploads.length, saveResourceToDb]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newUploads = Array.from(files).map(file => ({
      id: `${file.name}-${Date.now()}`,
      file, progress: 0, error: null,
      status: 'uploading' as const,
    }));

    setUploads(prev => [...prev.filter(u => u.status !== 'uploading'), ...newUploads]); // Limpia subidas en curso para evitar duplicados en la UI

    if (newUploads.length === 1 && !title) {
      handleResourceDetailChange('title', newUploads[0].file.name.split('.').slice(0, -1).join('.'));
    }

    newUploads.forEach(uploadFileAndSave);
  };

  const handleRemoveUpload = (id: string) => {
    setUploads(p => p.filter(item => item.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploads.length > 0 && resourceType === 'DOCUMENT') {
      const isStillUploading = uploads.some(u => u.status === 'uploading' || u.status === 'processing');
      if (isStillUploading) {
        toast({ description: "Por favor, espera a que finalicen todas las subidas." });
      } else {
        // Ya se guardaron en la DB dentro de uploadFileAndSave
        onClose();
      }
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title, description, content, observations, category, sharingMode,
      sharedWithUserIds: sharingMode === 'PRIVATE' ? sharedWithUserIds : [],
      sharedWithProcessIds: sharingMode === 'PROCESS' ? sharedWithProcessIds : [],
      collaboratorIds,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      status: resource?.status || 'ACTIVE', type: resourceType,
      url: resourceType === 'EXTERNAL_LINK' ? externalLink : resource?.url,
    };

    const success = await saveResourceToDb(payload);
    if (success) {
      toast({ title: '¡Éxito!', description: `Recurso ${isEditing ? 'actualizado' : 'creado'}.` });
      onClose();
    }
    setIsSubmitting(false);
  };

  // --- Lógica de Manejo de Acceso y Colaboradores ---

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  }, [allUsers, userSearch]);

  const handleProcessShareChange = (id: string, checked: boolean) => {
    setAccess(prev => ({
      ...prev,
      sharedWithProcessIds: checked ? [...prev.sharedWithProcessIds, id] : prev.sharedWithProcessIds.filter(pid => pid !== id),
    }));
  };

  const handleUserShareChange = (id: string, checked: boolean) => {
    setAccess(prev => ({
      ...prev,
      sharedWithUserIds: checked ? [...prev.sharedWithUserIds, id] : prev.sharedWithUserIds.filter(uid => uid !== id),
    }));
  };

  const handleCollaboratorChange = (id: string, checked: boolean) => {
    setAccess(prev => ({
      ...prev,
      collaboratorIds: checked ? [...prev.collaboratorIds, id] : prev.collaboratorIds.filter(uid => uid !== id),
    }));
  };

  // --- Funciones de Renderizado Modular ---

  const renderUploadsList = () => (
    uploads.length > 0 ? (
      <div className="w-full space-y-2 max-h-[150px] overflow-y-auto mt-4">
        {uploads.map(upload => (
          <div key={upload.id} className="flex items-center space-x-3 py-1 border rounded-md p-2">
            <FileIcon type={upload.file.type} className="h-6 w-6 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.file.name}</p>
              <div className="h-1 bg-secondary rounded-full mt-1">
                <div className="h-1 bg-primary rounded-full transition-all duration-300" style={{ width: `${upload.progress}%` }}></div>
              </div>
            </div>
            {upload.status === 'error' && <span className="text-xs text-destructive">Error</span>}
            <Button variant="ghost" size="icon" onClick={() => handleRemoveUpload(upload.id)} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    ) : null
  );


  const renderUploadArea = () => (
    <div className="flex flex-col h-full items-center justify-center p-4">
      <div className="w-full flex flex-col justify-center">
        <UploadArea onFileSelect={handleFileSelect} multiple={!isEditing} disabled={isSubmitting} />
      </div>
      {/* Lista de subidas */}
      {renderUploadsList()}
    </div>
  );

  const renderAccessSection = () => (
    <Card>
      <CardHeader><CardTitle className="text-base">Visibilidad y Acceso</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={sharingMode} onValueChange={(v) => handleAccessChange('sharingMode', v as ResourceSharingMode)} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Opción Público */}
          <div className="relative">
            <RadioGroupItem value="PUBLIC" id="share-public" className="sr-only peer" />
            <Label htmlFor="share-public" className={cn("flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground h-full transition-all", sharingMode === 'PUBLIC' && 'border-primary ring-2 ring-primary text-primary')}>
              <Globe className="mb-2 h-6 w-6" />Público
            </Label>
          </div>
          {/* Opción Por Proceso */}
          <div className="relative">
            <RadioGroupItem value="PROCESS" id="share-process" className="sr-only peer" />
            <Label htmlFor="share-process" className={cn("flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground h-full transition-all", sharingMode === 'PROCESS' && 'border-primary ring-2 ring-primary text-primary')}>
              <Briefcase className="mb-2 h-6 w-6" />Por Proceso
            </Label>
          </div>
          {/* Opción Privado */}
          <div className="relative">
            <RadioGroupItem value="PRIVATE" id="share-private" className="sr-only peer" />
            <Label htmlFor="share-private" className={cn("flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground h-full transition-all", sharingMode === 'PRIVATE' && 'border-primary ring-2 ring-primary text-primary')}>
              <Users className="mb-2 h-6 w-6" />Privado
            </Label>
          </div>
        </RadioGroup>

        <AnimatePresence>
          {sharingMode === 'PROCESS' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-1.5"><Label>Compartir con Procesos</Label>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {allProcesses.map(p => (<div key={p.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`proc-${p.id}`} checked={sharedWithProcessIds.includes(p.id)} onCheckedChange={c => handleProcessShareChange(p.id, !!c)} /><Label htmlFor={`proc-${p.id}`} className="font-normal">{p.name}</Label></div>))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
          {sharingMode === 'PRIVATE' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-1.5"><Label>Compartir con Usuarios</Label><Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2" />
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {filteredUsers.map(u => (<div key={u.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`share-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={c => handleUserShareChange(u.id, !!c)} /><Label htmlFor={`share-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}</Label></div>))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator />

        {/* Sección de Caducidad */}
        <div className="space-y-1.5">
          <Label className="flex items-center justify-between">
            Fecha de Caducidad
            <Switch checked={!!expiresAt} onCheckedChange={(checked) => handleAccessChange('expiresAt', checked ? new Date() : undefined)} />
          </Label>
          <AnimatePresence>
            {expiresAt && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiresAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={(date) => handleAccessChange('expiresAt', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </CardContent>
    </Card>
  );

  // --- Renderizado JSX Principal ---

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-6xl p-0 gap-0 rounded-2xl h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>{resource ? 'Editar Recurso' : 'Nuevo Recurso'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Actualiza la información y el acceso de tu recurso.' : 'Crea un nuevo recurso y define su tipo y visibilidad.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <ScrollArea className="md:col-span-4 lg:col-span-3 border-r h-full">
            <form id="resource-form" onSubmit={handleSave} className="space-y-6 p-6">
              {!isEditing && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Tipo de Recurso</h3>
                  <div className="space-y-4">
                    <Card className={cn("transition-colors", resourceType === 'DOCUMENT' ? 'border-primary ring-2 ring-primary/50' : 'hover:border-primary/50')}>
                      <CardHeader onClick={() => handleResourceDetailChange('resourceType', 'DOCUMENT')} className="cursor-pointer">
                        <CardTitle className="text-base flex items-center gap-2"><UploadCloud className="h-5 w-5" />Subir Archivo(s)</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className={cn("transition-colors", resourceType === 'EXTERNAL_LINK' ? 'border-primary ring-2 ring-primary/50' : 'hover:border-primary/50')}>
                      <CardHeader onClick={() => handleResourceDetailChange('resourceType', 'EXTERNAL_LINK')} className="cursor-pointer">
                        <CardTitle className="text-base flex items-center gap-2"><LinkIcon className="h-5 w-5" />Enlace Externo</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className={cn("transition-colors", resourceType === 'DOCUMENTO_EDITABLE' ? 'border-primary ring-2 ring-primary/50' : 'hover:border-primary/50')}>
                      <CardHeader onClick={() => handleResourceDetailChange('resourceType', 'DOCUMENTO_EDITABLE')} className="cursor-pointer">
                        <CardTitle className="text-base flex items-center gap-2"><FilePen className="h-5 w-5" />Documento Editable</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                  <Separator className="my-6" />
                </>
              )}
              <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={(e) => handleResourceDetailChange('title', e.target.value)} required autoComplete="off" disabled={resourceType === 'DOCUMENT' && uploads.length > 0 && !isEditing} /></div>
              <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => handleResourceDetailChange('description', e.target.value)} placeholder="Un resumen breve del contenido del recurso..." /></div>
              <div className="space-y-1.5"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={(v) => handleResourceDetailChange('category', v)}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).sort().map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
              {(resourceType === 'EXTERNAL_LINK' && isEditing) && <div className="space-y-1.5"><Label htmlFor="externalLink">URL del Recurso</Label><Input id="externalLink" type="url" value={externalLink} onChange={e => handleResourceDetailChange('externalLink', e.target.value)} placeholder="https://..." required /></div>}
            </form>
          </ScrollArea>
          
          <ScrollArea className="md:col-span-5 lg:col-span-6 h-full bg-muted/20">
            <div className="p-4 h-full flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div key={resourceType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
                  {resourceType === 'DOCUMENTO_EDITABLE' ? (
                      <>
                        <div className="flex-1 min-h-0 mb-4">
                          <Label htmlFor="content-editor">Contenido Principal</Label>
                          <RichTextEditor id="content-editor" value={content} onChange={(v) => handleResourceDetailChange('content', v)} className="h-[calc(100%-1.5rem)] min-h-[300px]" />
                        </div>
                        <div className="flex-none h-1/3 min-h-[100px] mt-4">
                          <Label htmlFor="observations-editor">Observaciones (Privado)</Label>
                          <Textarea id="observations-editor" value={observations} onChange={(e) => handleResourceDetailChange('observations', e.target.value)} className="h-[calc(100%-1.5rem)] resize-none" />
                        </div>
                      </>
                    ) : resourceType === 'EXTERNAL_LINK' ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <LinkIcon className="w-16 h-16 text-primary mb-4" />
                        <p className="text-lg font-medium">Enlace Externo</p>
                        <a href={externalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground underline truncate max-w-full">{externalLink || 'URL no especificada'}</a>
                      </div>
                    ) : (
                      renderUploadArea()
                    )}
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollArea>
          
          <ScrollArea className="md:col-span-3 lg:col-span-3 border-l h-full bg-card/50">
            <div className="p-6 space-y-6">
              {renderAccessSection()}
              {(resourceType === 'DOCUMENTO_EDITABLE' || resource?.type === 'VIDEO_PLAYLIST') && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Colaboradores</CardTitle><CardDescription className="text-xs">Usuarios que pueden editar este recurso.</CardDescription></CardHeader>
                  <CardContent>
                    <Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2" />
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1">
                        {filteredUsers.map(u => (<div key={u.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`collab-${u.id}`} checked={collaboratorIds.includes(u.id)} onCheckedChange={c => handleCollaboratorChange(u.id, !!c)} /><Label htmlFor={`collab-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}</Label></div>))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2 bg-background/90 backdrop-blur-sm">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button
            type="submit"
            form="resource-form"
            disabled={
              isSubmitting ||
              (resourceType !== 'DOCUMENT' && !title) || 
              (resourceType === 'EXTERNAL_LINK' && !externalLink) ||
              (uploads.length > 0 && uploads.some(u => u.status === 'uploading'))
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
