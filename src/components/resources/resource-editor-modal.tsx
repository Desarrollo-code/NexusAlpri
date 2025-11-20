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
import { Loader2, Save, UploadCloud, Link as LinkIcon, Image as ImageIcon, XCircle, Replace, Calendar as CalendarIcon, Eye, EyeOff, X, Globe, Users, FileText, Check, Archive, FilePen, RotateCcw } from 'lucide-react';
import type { AppResourceType, User as AppUser } from '@/types';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { FileIcon } from '../ui/file-icon';
import { RichTextEditor } from '../ui/rich-text-editor';

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

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave }: ResourceEditorModalProps) {
  const { toast } = useToast();
  const { user, settings } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [observations, setObservations] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
  const [externalLink, setExternalLink] = useState('');
  
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
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
    setIsPublic(true);
    setSharedWithUserIds([]);
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
        setIsPublic(resource.ispublic);
        setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
        setExpiresAt(resource.expiresAt ? new Date(resource.expiresAt) : undefined);
        setResourceType(resource.type);
        setExternalLink(resource.type === 'EXTERNAL_LINK' ? resource.url || '' : '');
        setUploads([]);
      } else {
        resetForm();
      }

      if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
          fetch('/api/users/list')
            .then(res => res.json())
            .then(data => setAllUsers(data.users || []));
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
          description, category, isPublic, sharedWithUserIds: isPublic ? [] : sharedWithUserIds,
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
    if (resourceType !== 'DOCUMENT') {
        setIsSubmitting(true);
        const payload = {
          title, description, content, observations, category, isPublic, 
          sharedWithUserIds: isPublic ? [] : sharedWithUserIds,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          status: resource?.status || 'ACTIVE', type: resourceType,
          url: resourceType === 'EXTERNAL_LINK' ? externalLink : null,
        };
        
        const success = await saveResourceToDb(payload);
        if (success) {
            toast({ title: '¡Éxito!', description: `Recurso ${isEditing ? 'actualizado' : 'creado'}.` });
            onSave();
            onClose();
        }
        setIsSubmitting(false);
    } else {
        const isStillUploading = uploads.some(u => u.status === 'uploading' || u.status === 'processing');
        if (isStillUploading) {
            toast({description: "Por favor, espera a que finalicen todas las subidas."});
        } else {
             onSave();
             onClose();
        }
    }
  };
  
  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 gap-0 rounded-2xl">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
              <DialogTitle>{resource ? 'Editar Recurso' : 'Subir Nuevo(s) Recurso(s)'}</DialogTitle>
              <DialogDescription>{resource ? 'Modifica los detalles de tu recurso.' : 'Añade archivos, enlaces o documentos a la biblioteca.'}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 min-h-0 thin-scrollbar">
              <form id="resource-form" onSubmit={handleSave} className="space-y-6 px-6 py-4">
                  {!isEditing && (
                      <RadioGroup value={resourceType} onValueChange={(v) => {setResourceType(v as any); setUploads([]); setExternalLink('');}} className="grid grid-cols-3 gap-4">
                        <div><RadioGroupItem value="DOCUMENT" id="type-doc" className="peer sr-only"/><Label htmlFor="type-doc" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><UploadCloud className="mb-2 h-6 w-6"/>Archivo(s)</Label></div>
                        <div><RadioGroupItem value="EXTERNAL_LINK" id="type-link" className="peer sr-only"/><Label htmlFor="type-link" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><LinkIcon className="mb-2 h-6 w-6"/>Enlace</Label></div>
                         <div><RadioGroupItem value="DOCUMENTO_EDITABLE" id="type-editable" className="peer sr-only"/><Label htmlFor="type-editable" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><FileText className="mb-2 h-6 w-6"/>Doc. Editable</Label></div>
                      </RadioGroup>
                  )}

                  {resourceType === 'DOCUMENT' && (
                    <div className="space-y-2">
                      <Label>Archivo(s)</Label>
                      <UploadArea onFileSelect={(file) => handleFileSelect(file ? { 0: file, length: 1, item: () => file } as FileList : null)} multiple={!isEditing} disabled={isSubmitting}/>
                    </div>
                  )}
                   {uploads.length > 0 && resourceType === 'DOCUMENT' && (
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
                    )}

                  {resourceType === 'EXTERNAL_LINK' && <div className="space-y-1.5"><Label htmlFor="url">URL del Enlace</Label><Input id="url" type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} required placeholder="https://..."/></div>}
                    
                  { (isEditing || uploads.length <= 1) && <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoComplete="off" /></div> }
                  { (isEditing || uploads.length <= 1) && <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Un resumen breve del contenido del recurso..."/></div> }
                  
                  {resourceType === 'DOCUMENTO_EDITABLE' && (
                     <div className="space-y-4">
                       <div className="space-y-1.5"><Label htmlFor="content-editor">Contenido</Label><RichTextEditor value={content} onChange={setContent} className="h-48" /></div>
                       <div className="space-y-1.5"><Label htmlFor="observations-editor">Observaciones (Privado)</Label><Textarea id="observations-editor" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Notas internas, no visibles para estudiantes..." /></div>
                     </div>
                  )}

                  <div className="space-y-1.5"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>Expiración</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{expiresAt ? format(expiresAt, "PPP", {locale: es}) : <span>Sin fecha de expiración</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus /></PopoverContent></Popover></div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2"><Label htmlFor="is-public" className="font-semibold text-base flex items-center gap-2">{isPublic ? <Globe className="h-4 w-4 text-green-500"/> : <Users className="h-4 w-4 text-blue-500" />}Visibilidad</Label><Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} /></div>
                      <p className="text-xs text-muted-foreground -mt-2">{isPublic ? "Visible para todos los usuarios." : "Solo visible para usuarios seleccionados."}</p>
                  </div>

                  {!isPublic && (
                      <div className="space-y-1.5"><Label>Compartir con</Label><Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/>
                      <ScrollArea className="h-32 border rounded-md p-2">
                          {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                              <div key={u.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`share-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={(c) => setSharedWithUserIds(prev => c ? [...prev, u.id] : prev.filter(id => id !== u.id))} /><Label htmlFor={`share-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}</Label></div>
                          ))}
                      </ScrollArea></div>
                  )}
              </form>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex flex-row justify-center sm:justify-center gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" form="resource-form" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
    </Dialog>
  );
}
