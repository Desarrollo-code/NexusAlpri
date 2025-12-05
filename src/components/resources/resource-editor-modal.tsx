// src/components/resources/resource-editor-modal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button'; // Se eliminó buttonVariants, no era necesario aquí
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, UploadCloud, Link as LinkIcon, XCircle, RotateCcw, Globe, Users, FilePen, Briefcase } from 'lucide-react'; // Se eliminaron iconos no utilizados
import type { AppResourceType, User as AppUser, Process } from '@/types'; // Se añadió Process
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Se eliminó AvatarImage, no se usa
import { Identicon } from '@/components/ui/identicon'; // Se eliminó, no se usa
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
// Se eliminó Image, QuizViewer, cn, FileIcon

// Define el tipo de compartición para mayor claridad
type ResourceSharingMode = 'PUBLIC' | 'PROCESS' | 'PRIVATE';

interface ResourceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: AppResourceType | null;
  parentId: string | null;
  onSave: () => void;
}

interface UploadState {
  id: string;
  file: File;
  progress: number;
  error: string | null;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  url?: string;
}

const getInitials = (name?: string | null): string => {
  if (!name) return '??';
  const names = name.trim().split(/\s+/);
  if (names.length > 1 && names[0] && names[names.length - 1]) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  if (names.length === 1 && names[0]) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave }: ResourceEditorModalProps) {
  const { toast } = useToast();
  const { user, settings } = useAuth();
  
  // Estados principales del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [observations, setObservations] = useState('');
  const [category, setCategory] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
  const [externalLink, setExternalLink] = useState('');
  
  // ESTADO ACTUALIZADO PARA VISIBILIDAD
  const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]); // Nuevo estado para procesos
  
  // Estados de gestión y API
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]); // Lista de Procesos
  const [userSearch, setUserSearch] = useState('');
  const [processSearch, setProcessSearch] = useState('');
  
  // Estados eliminados: collaboratorIds, pin, confirmPin, showPin, isSettingPin, isPublic

  const isEditing = !!resource;

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setContent('');
    setObservations('');
    setCategory(settings?.resourceCategories[0] || 'General');
    setSharingMode('PUBLIC'); // Reiniciar modo de compartición
    setSharedWithUserIds([]);
    setSharedWithProcessIds([]); // Reiniciar procesos
    setExpiresAt(undefined);
    setResourceType('DOCUMENT');
    setExternalLink('');
    setUploads([]);
  }, [settings?.resourceCategories]);

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setTitle(resource.title || '');
        setDescription(resource.description || '');
        setContent(resource.content || '');
        setObservations(resource.observations || '');
        setCategory(resource.category || settings?.resourceCategories[0] || 'General');
        // Mapeo de la antigua 'isPublic' al nuevo 'sharingMode'
        if (resource.ispublic) {
          setSharingMode('PUBLIC');
        } else if (resource.sharedWithProcesses && resource.sharedWithProcesses.length > 0) {
          setSharingMode('PROCESS');
          setSharedWithProcessIds(resource.sharedWithProcesses.map(p => p.id));
        } else {
          setSharingMode('PRIVATE');
          setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
        }
        
        // setCollaboratorIds se elimina
        setExpiresAt(resource.expiresAt ? new Date(resource.expiresAt) : undefined);
        setResourceType(resource.type);
        setExternalLink(resource.type === 'EXTERNAL_LINK' ? resource.url || '' : '');
        setUploads([]);
      } else {
        resetForm();
      }

      if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
          Promise.all([
            fetch('/api/users/list').then(res => res.json()),
            fetch('/api/processes/list').then(res => res.json()), // Supuesta API para Procesos
          ]).then(([usersData, processesData]) => {
            setAllUsers(usersData.users || []);
            setAllProcesses(processesData.processes || []);
          }).catch(console.error);
      }
    }
  }, [resource, isOpen, resetForm, settings, user]);

  const saveResourceToDb = async (payload: any): Promise<boolean> => {
    const endpoint = isEditing ? `/api/resources/${resource!.id}` : '/api/resources';
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar en la base de datos.');
        }
        return true;
    } catch(err) {
        console.error("DB Save Error:", err);
        toast({ title: 'Error de Sincronización', description: `No se pudo guardar "${payload.title}": ${(err as Error).message}`, variant: 'destructive'});
        return false;
    }
  };

  const uploadFileAndSave = async (upload: UploadState) => {
    try {
      const result = await uploadWithProgress('/api/upload/resource-file', upload.file, (p) => {
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: p } : u));
      });
      
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 100, status: 'completed', url: result.url } : u));

      // Lógica de guardado para archivos subidos
      let shareUsers: string[] = [];
      let shareProcesses: string[] = [];
      let isPublicFlag = sharingMode === 'PUBLIC';

      if (sharingMode === 'PRIVATE') shareUsers = sharedWithUserIds;
      if (sharingMode === 'PROCESS') shareProcesses = sharedWithProcessIds;

      const payload = {
          title: uploads.length > 1 ? upload.file.name.split('.').slice(0,-1).join('.') : title,
          filename: upload.file.name,
          description, category, 
          ispublic: isPublicFlag, // Usar el campo original de la API
          sharedWithUserIds: shareUsers,
          sharedWithProcessIds: shareProcesses,
          collaboratorIds: [], // Eliminado
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          status: 'ACTIVE', type: 'DOCUMENT', url: result.url,
          size: upload.file.size, fileType: upload.file.type, parentId,
      };
      
      const success = await saveResourceToDb(payload);
      if (!success) {
          setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error', error: 'Fallo al guardar en la base de datos.' } : u));
      }

    } catch (err) {
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error', error: (err as Error).message } : u));
    }
  };
  
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newUploads = Array.from(files).map(file => ({
        id: `${file.name}-${Date.now()}`,
        file, progress: 0, error: null,
        status: 'uploading' as const,
    }));
    
    setUploads(prev => [...prev, ...newUploads]);
    
    if (newUploads.length === 1 && !title) {
        setTitle(newUploads[0].file.name.split('.').slice(0,-1).join('.'));
    }

    newUploads.forEach(uploadFileAndSave);
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploads.length > 0 && resourceType === 'DOCUMENT') {
        const isStillUploading = uploads.some(u => u.status === 'uploading' || u.status === 'processing');
        if (isStillUploading) {
            toast({description: "Por favor, espera a que finalicen todas las subidas."});
        } else {
            onSave();
            onClose();
        }
        return;
    }
    
    setIsSubmitting(true);
    
    // LÓGICA DE COMPARTICIÓN REEMPLAZADA
    let shareUsers: string[] = [];
    let shareProcesses: string[] = [];
    let isPublicFlag = sharingMode === 'PUBLIC';

    if (sharingMode === 'PRIVATE') shareUsers = sharedWithUserIds;
    if (sharingMode === 'PROCESS') shareProcesses = sharedWithProcessIds;

    const payload = {
      title, description, content, observations, category, 
      ispublic: isPublicFlag, // Usar el campo original de la API
      sharedWithUserIds: shareUsers,
      sharedWithProcessIds: shareProcesses,
      collaboratorIds: [], // Eliminado
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      status: resource?.status || 'ACTIVE', type: resourceType,
      url: resourceType === 'EXTERNAL_LINK' ? externalLink : resource?.url,
    };
    
    const success = await saveResourceToDb(payload);
    if (success) {
        toast({ title: '¡Éxito!', description: `Recurso ${isEditing ? 'actualizado' : 'creado'}.` });
        onSave();
        onClose();
    }
    setIsSubmitting(false);
  };
  
  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredProcesses = allProcesses.filter(p => p.name.toLowerCase().includes(processSearch.toLowerCase()));

  const renderUploadArea = () => (
    <div className="space-y-4">
      <UploadArea onFileSelect={(files) => handleFileSelect(files)} multiple={!isEditing} disabled={isSubmitting}/>
      {uploads.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 thin-scrollbar">
          {uploads.map(upload => (
            <div key={upload.id} className="p-2 border rounded-md">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium truncate pr-2">{upload.file.name}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setUploads(p => p.filter(item => item.id !== upload.id))}>
                  <XCircle className="h-4 w-4"/>
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={upload.progress} className="h-1 flex-grow"/>
                <div className="w-16 text-right">
                  {upload.status === 'uploading' && <span className="text-xs font-semibold">{upload.progress}%</span>}
                  {upload.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary inline-block"/>}
                  {upload.status === 'completed' && <Globe className="h-4 w-4 text-green-500 inline-block"/>}
                  {upload.status === 'error' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => uploadFileAndSave(upload)}>
                      <RotateCcw className="h-4 w-4"/>
                    </Button>
                  )}
                </div>
              </div>
              {upload.error && <p className="text-xs text-destructive mt-1">{upload.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 gap-0 rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{resource ? 'Editar Recurso' : 'Subir Nuevo Recurso'}</DialogTitle>
            <DialogDescription>{resource ? 'Modifica los detalles de tu recurso.' : 'Añade archivos, enlaces o documentos a la biblioteca.'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <form id="resource-form" onSubmit={handleSave} className="space-y-6 px-6 py-4">
              {!isEditing && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-center">Selecciona el tipo de recurso a crear</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg space-y-2">
                        <Label className="font-semibold flex items-center gap-2"><UploadCloud/> Subir Archivo(s)</Label>
                        <p className="text-xs text-muted-foreground">Sube documentos, imágenes o videos desde tu dispositivo.</p>
                        {renderUploadArea()}
                      </div>
                      <div className="p-4 border rounded-lg space-y-2">
                        <Label className="font-semibold flex items-center gap-2"><LinkIcon/> Enlace Externo</Label>
                        <p className="text-xs text-muted-foreground">Añade una URL a un sitio web o recurso externo.</p>
                        <Input type="url" value={externalLink} onChange={e => {setExternalLink(e.target.value); setResourceType('EXTERNAL_LINK');}} placeholder="https://..."/>
                      </div>
                       <div className="p-4 border rounded-lg space-y-2 flex flex-col items-center justify-center">
                        <Label className="font-semibold flex items-center gap-2"><FilePen/> Documento Editable</Label>
                        <p className="text-xs text-muted-foreground text-center">Crea y edita un documento directamente en la plataforma.</p>
                        <Button type="button" variant="secondary" onClick={() => setResourceType('DOCUMENTO_EDITABLE')}>Crear Documento</Button>
                      </div>
                  </div>
                </div>
              )}
                
              {resourceType === 'DOCUMENTO_EDITABLE' && (
                 <div className="space-y-4">
                   <div className="space-y-1.5"><Label htmlFor="content-editor">Contenido</Label><RichTextEditor value={content} onChange={setContent} className="h-48" /></div>
                   <div className="space-y-1.5"><Label htmlFor="observations-editor">Observaciones (Privado)</Label><Textarea id="observations-editor" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Notas internas, no visibles para estudiantes..." /></div>
                 </div>
              )}
              
              {(isEditing || (uploads.length <= 1 && resourceType !== 'DOCUMENT')) && (
                  <>
                  <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoComplete="off" /></div>
                  <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Un resumen breve del contenido del recurso..."/></div>
                  </>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Expiración</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{expiresAt ? format(expiresAt, "PPP", {locale: es}) : <span>Sin fecha de expiración</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus /></PopoverContent></Popover></div>
              </div>
              
              <Separator />
              
              {/* NUEVO SELECTOR DE VISIBILIDAD */}
              <div className="space-y-4">
                 <Label className="font-semibold text-base flex items-center gap-2">Visibilidad del Recurso</Label>
                 <RadioGroup value={sharingMode} onValueChange={(v: ResourceSharingMode) => setSharingMode(v)} className="grid grid-cols-3 gap-3">
                    <div className="flex-1"><RadioGroupItem value="PUBLIC" id="share-public" className="sr-only" /><Label htmlFor="share-public" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer text-sm transition-colors ${sharingMode === 'PUBLIC' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Globe className="mb-1 h-5 w-5"/>Público</Label></div>
                    <div className="flex-1"><RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/><Label htmlFor="share-process" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer text-sm transition-colors ${sharingMode === 'PROCESS' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Briefcase className="mb-1 h-5 w-5"/>Por Proceso</Label></div>
                    <div className="flex-1"><RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/><Label htmlFor="share-private" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer text-sm transition-colors ${sharingMode === 'PRIVATE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Users className="mb-1 h-5 w-5"/>Privado</Label></div>
                 </RadioGroup>
                  <p className="text-xs text-muted-foreground -mt-2">Define la audiencia para este recurso.</p>
              </div>

              {sharingMode === 'PROCESS' && (
                  <div className="space-y-1.5">
                    <Label>Procesos Seleccionados</Label>
                    <Input placeholder="Buscar procesos..." value={processSearch} onChange={e => setProcessSearch(e.target.value)} className="mb-2"/>
                    <ScrollArea className="h-32 border rounded-md p-2">
                      {filteredProcesses.map(p => (
                          <div key={p.id} className="flex items-center space-x-3 py-1.5">
                            <Checkbox id={`share-process-${p.id}`} checked={sharedWithProcessIds.includes(p.id)} onCheckedChange={(c) => setSharedWithProcessIds(prev => c ? [...prev, p.id] : prev.filter(id => id !== p.id))} />
                            <Label htmlFor={`share-process-${p.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm">{p.name}</Label>
                          </div>
                      ))}
                    </ScrollArea>
                </div>
              )}
              
              {sharingMode === 'PRIVATE' && (
                  <div className="space-y-1.5">
                    <Label>Usuarios Seleccionados</Label>
                    <Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/>
                    <ScrollArea className="h-32 border rounded-md p-2">
                      {filteredUsers.map(u => (
                          <div key={u.id} className="flex items-center space-x-3 py-1.5">
                            <Checkbox id={`share-user-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={(c) => setSharedWithUserIds(prev => c ? [...prev, u.id] : prev.filter(id => id !== u.id))} />
                            <Label htmlFor={`share-user-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm">
                              <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}
                            </Label>
                          </div>
                      ))}
                    </ScrollArea>
                </div>
              )}
              
            </form>
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-center sm:justify-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" form="resource-form" disabled={isSubmitting || (resourceType !== 'DOCUMENT' && !title) || (resourceType === 'EXTERNAL_LINK' && !externalLink) }>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}