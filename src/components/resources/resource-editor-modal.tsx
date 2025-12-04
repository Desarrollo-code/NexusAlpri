// src/components/resources/resource-editor-modal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Loader2, Save, UploadCloud, Link as LinkIcon, XCircle, Replace, Calendar as CalendarIcon, X, Globe, Users, FileText, Check, Archive, FilePen, RotateCcw, PlusCircle, Briefcase } from 'lucide-react';
import type { AppResourceType, User as AppUser, ResourceSharingMode, Process } from '@/types';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { FileIcon } from '@/components/ui/file-icon';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';


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
  const names = name.trim().split(/\s+/); // Use regex to handle multiple spaces
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
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [observations, setObservations] = useState('');
  const [category, setCategory] = useState('');
  
  const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);
  
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
  const [externalLink, setExternalLink] = useState('');
  
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);

  const isEditing = !!resource;

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setContent('');
    setObservations('');
    setCategory(settings?.resourceCategories[0] || 'General');
    setSharingMode('PUBLIC');
    setSharedWithUserIds([]);
    setSharedWithProcessIds([]);
    setCollaboratorIds([]);
    setExpiresAt(undefined);
    setResourceType('DOCUMENT');
    setExternalLink('');
    setUploads([]);
    setPin('');
    setConfirmPin('');
  }, [settings?.resourceCategories]);

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setTitle(resource.title || '');
        setDescription(resource.description || '');
        setContent(resource.content || '');
        setObservations(resource.observations || '');
        setCategory(resource.category || settings?.resourceCategories[0] || 'General');
        setSharingMode(resource.sharingMode || 'PUBLIC');
        setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
        setSharedWithProcessIds(resource.sharedWithProcesses?.map(p => p.id) || []);
        setCollaboratorIds(resource.collaborators?.map(u => u.id) || []);
        setExpiresAt(resource.expiresAt ? new Date(resource.expiresAt) : undefined);
        setResourceType(resource.type);
        setExternalLink(resource.type === 'EXTERNAL_LINK' ? resource.url || '' : '');
        setUploads([]);
      } else {
        resetForm();
      }

      if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
          fetch('/api/users/list').then(res => res.json()).then(data => setAllUsers(data.users || []));
          fetch('/api/processes?format=flat').then(res => res.json()).then(data => setAllProcesses(data || []));
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

      const payload = {
          title: uploads.length > 1 ? upload.file.name.split('.').slice(0,-1).join('.') : title,
          filename: upload.file.name,
          description, category,
          sharingMode, 
          sharedWithUserIds: sharingMode === 'PRIVATE' ? sharedWithUserIds : [],
          sharedWithProcessIds: sharingMode === 'PROCESS' ? sharedWithProcessIds : [],
          collaboratorIds: [],
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
    
    setResourceType('DOCUMENT');
    
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
    const payload = {
      title, description, content, observations, category, 
      sharingMode,
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
        onSave();
        onClose();
    }
    setIsSubmitting(false);
  };
  
  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));

  const renderUploads = () => (
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
              {upload.status === 'completed' && <Check className="h-4 w-4 text-green-500 inline-block"/>}
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 gap-0 rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{resource ? 'Editar Recurso' : 'Nuevo Recurso'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <form id="resource-form" onSubmit={handleSave} className="space-y-6 px-6 py-4">
              
              {!isEditing && (
                <RadioGroup value={resourceType} onValueChange={(v) => setResourceType(v as AppResourceType['type'])} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Label htmlFor="type-document" className={cn("border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors", resourceType === 'DOCUMENT' && 'border-primary ring-2 ring-primary')}>
                     <UploadCloud className="h-6 w-6 text-primary"/> <span className="font-semibold text-sm">Subir Archivo</span><RadioGroupItem value="DOCUMENT" id="type-document" className="sr-only" />
                  </Label>
                  <Label htmlFor="type-link" className={cn("border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors", resourceType === 'EXTERNAL_LINK' && 'border-primary ring-2 ring-primary')}>
                      <LinkIcon className="h-6 w-6 text-primary"/> <span className="font-semibold text-sm">Enlace Externo</span><RadioGroupItem value="EXTERNAL_LINK" id="type-link" className="sr-only" />
                  </Label>
                  <Label htmlFor="type-editable" className={cn("border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors", resourceType === 'DOCUMENTO_EDITABLE' && 'border-primary ring-2 ring-primary')}>
                      <FilePen className="h-6 w-6 text-primary"/> <span className="font-semibold text-sm">Documento Editable</span><RadioGroupItem value="DOCUMENTO_EDITABLE" id="type-editable" className="sr-only" />
                  </Label>
                </RadioGroup>
              )}
              
              <AnimatePresence>
                <motion.div key={resourceType} initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}}>
                   {resourceType === 'DOCUMENT' && renderUploadArea()}
                   {resourceType === 'EXTERNAL_LINK' && <Input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://..."/>}
                   {resourceType === 'DOCUMENTO_EDITABLE' && <RichTextEditor value={content} onChange={setContent} className="h-48" />}
                </motion.div>
              </AnimatePresence>
              
               <Separator />
              
              <Card>
                <CardHeader><CardTitle className="text-base">Detalles del Recurso</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoComplete="off" /></div>
                  <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Un resumen breve del contenido del recurso..."/></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1.5"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).sort().map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                     <div className="space-y-1.5"><Label>Expiración</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{expiresAt ? format(expiresAt, "PPP", {locale: es}) : <span>Sin fecha de expiración</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus /></PopoverContent></Popover></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Visibilidad y Acceso</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                     <RadioGroup value={sharingMode} onValueChange={(v) => setSharingMode(v as ResourceSharingMode)} className="grid grid-cols-3 gap-2">
                       <div><RadioGroupItem value="PUBLIC" id="share-public" className="sr-only"/><Label htmlFor="share-public" className={cn("flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer text-xs h-full", sharingMode === 'PUBLIC' && 'border-primary ring-2 ring-primary')}><Globe className="mb-1 h-5 w-5"/>Público</Label></div>
                       <div><RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/><Label htmlFor="share-process" className={cn("flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer text-xs h-full", sharingMode === 'PROCESS' && 'border-primary ring-2 ring-primary')}><Briefcase className="mb-1 h-5 w-5"/>Por Proceso</Label></div>
                       <div><RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/><Label htmlFor="share-private" className={cn("flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer text-xs h-full", sharingMode === 'PRIVATE' && 'border-primary ring-2 ring-primary')}><Users className="mb-1 h-5 w-5"/>Privado</Label></div>
                     </RadioGroup>
                     {sharingMode === 'PROCESS' && (<div className="space-y-1.5"><ScrollArea className="h-32 border rounded-md p-2">{allProcesses.map(p => (<div key={p.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`proc-${p.id}`} checked={sharedWithProcessIds.includes(p.id)} onCheckedChange={(c) => setSharedWithProcessIds(prev => c ? [...prev, p.id] : prev.filter(id => id !== p.id))} /><Label htmlFor={`proc-${p.id}`} className="font-normal" style={{ paddingLeft: `${(p.level || 0) * 1.5}rem` }}>{p.name}</Label></div>))}</ScrollArea></div>)}
                     {sharingMode === 'PRIVATE' && (<div className="space-y-1.5"><Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/><ScrollArea className="h-32 border rounded-md p-2">{filteredUsers.map(u => (<div key={u.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`share-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={(c) => setSharedWithUserIds(prev => c ? [...prev, u.id] : prev.filter(id => id !== u.id))} /><Label htmlFor={`share-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}</Label></div>))}</ScrollArea></div>)}
                 </CardContent>
              </Card>

              {resourceType === 'VIDEO_PLAYLIST' && (
                 <Card><CardHeader><CardTitle className="text-base">Colaboradores</CardTitle></CardHeader><CardContent><div className="space-y-1.5"><Label>Usuarios que pueden editar esta lista</Label><Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/><ScrollArea className="h-32 border rounded-md p-2">{filteredUsers.map(u => (<div key={u.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`collab-${u.id}`} checked={collaboratorIds.includes(u.id)} onCheckedChange={(c) => setCollaboratorIds(prev => c ? [...prev, u.id] : prev.filter(id => id !== u.id))} /><Label htmlFor={`collab-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}</Label></div>))}</ScrollArea></div></CardContent></Card>
              )}

            </form>
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-center sm:justify-end gap-2">
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
