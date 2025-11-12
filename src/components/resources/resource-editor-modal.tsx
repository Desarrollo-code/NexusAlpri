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
import { Loader2, Save, UploadCloud, Link as LinkIcon, Image as ImageIcon, XCircle, Replace, Calendar as CalendarIcon, Eye, EyeOff, X, Globe, Users, FileText, Check } from 'lucide-react';
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
  completed: boolean;
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (isEditing) {
        const file = files[0];
        setUploads([{ id: file.name, file, progress: 0, error: null, completed: false }]);
        if(!title) setTitle(file.name.split('.').slice(0,-1).join('.'));
    } else {
        const newUploads = Array.from(files).map(file => ({
            id: `${file.name}-${Date.now()}`,
            file,
            progress: 0,
            error: null,
            completed: false,
        }));
        setUploads(prev => [...prev, ...newUploads]);
        
        if (newUploads.length === 1 && !title) {
            setTitle(newUploads[0].file.name.split('.').slice(0,-1).join('.'));
        }
    }
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && uploads.length <= 1 && resourceType !== 'DOCUMENTO_EDITABLE' && resourceType !== 'EXTERNAL_LINK') {
        toast({ title: 'Título requerido', description: 'Por favor, añade un título para el recurso.', variant: 'destructive'});
        return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;

    if (resourceType === 'EXTERNAL_LINK' || resourceType === 'DOCUMENTO_EDITABLE' || isEditing) {
        let finalUrl = isEditing ? resource.url : null;
        let finalSize = resource?.size || 0;
        let finalFileType = resource?.fileType || '';

        if (resourceType === 'EXTERNAL_LINK') finalUrl = externalLink;

        const fileToUpload = uploads[0];
        if (fileToUpload) {
             setUploads(prev => prev.map(u => ({...u, progress: 0})));
             try {
                const uploadedFile = await uploadWithProgress('/api/upload/resource-file', fileToUpload.file, (p) => {
                   setUploads(prev => prev.map(u => u.id === fileToUpload.id ? {...u, progress: p} : u));
                });
                finalUrl = uploadedFile.url;
                finalSize = fileToUpload.file.size;
                finalFileType = fileToUpload.file.type;
             } catch (err) {
                 toast({ title: "Error de subida", description: (err as Error).message, variant: "destructive" });
                 setIsSubmitting(false); return;
             }
        }
        
        const payload = {
          title, description, content, observations, category, isPublic, 
          sharedWithUserIds: isPublic ? [] : sharedWithUserIds,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          status: resource?.status || 'ACTIVE', type: resourceType, url: finalUrl,
          size: finalSize, fileType: finalFileType, parentId: resource ? resource.parentId : parentId,
        };
        
        const endpoint = resource ? `/api/resources/${resource.id}` : '/api/resources';
        const method = resource ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'No se pudo guardar el recurso.');
            successCount = 1;
        } catch(err) {
            toast({ title: 'Error al Guardar', description: (err as Error).message, variant: 'destructive' });
        }
    } 
    else if (!isEditing && uploads.length > 0) {
        for (const upload of uploads) {
            try {
                const uploadedFile = await uploadWithProgress('/api/upload/resource-file', upload.file, (p) => {
                    setUploads(prev => prev.map(u => u.id === upload.id ? {...u, progress: p} : u));
                });

                const payload = {
                    title: upload.file.name.split('.').slice(0,-1).join('.'),
                    description: '', category, isPublic, sharedWithUserIds: isPublic ? [] : sharedWithUserIds,
                    expiresAt: expiresAt ? expiresAt.toISOString() : null,
                    status: 'ACTIVE', type: 'DOCUMENT', url: uploadedFile.url,
                    size: upload.file.size, fileType: upload.file.type, parentId,
                };

                const response = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`Error al crear recurso para ${upload.file.name}`);
                setUploads(prev => prev.map(u => u.id === upload.id ? {...u, completed: true} : u));
                successCount++;

            } catch (err) {
                 setUploads(prev => prev.map(u => u.id === upload.id ? {...u, error: (err as Error).message} : u));
            }
        }
    }

    if (successCount > 0) {
        toast({ title: '¡Éxito!', description: `${successCount} recurso(s) se ha(n) ${isEditing ? 'actualizado' : 'creado'}.` });
        onSave();
        onClose();
    }
    
    setIsSubmitting(false);
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

                  {resourceType !== 'EXTERNAL_LINK' && resourceType !== 'DOCUMENTO_EDITABLE' && (
                    <div className="space-y-2">
                      <Label>Archivo(s)</Label>
                      <UploadArea onFileSelect={(files) => handleFileSelect(files)} multiple={!isEditing} disabled={isSubmitting}/>
                    </div>
                  )}
                   {uploads.length > 0 && resourceType !== 'EXTERNAL_LINK' && resourceType !== 'DOCUMENTO_EDITABLE' && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 thin-scrollbar">
                            {uploads.map(upload => (
                                <div key={upload.id} className="p-2 border rounded-md">
                                    <p className="text-sm font-medium truncate">{upload.file.name}</p>
                                    <Progress value={upload.progress} className="h-1 mt-1"/>
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
                          {filteredUsers.filter(u => u.id !== user?.id).map(u => (
                              <div key={u.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`share-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={(c) => setSharedWithUserIds(prev => c ? [...prev, u.id] : prev.filter(id => id !== u.id))} /><Label htmlFor={`share-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}</Label></div>
                          ))}
                      </ScrollArea></div>
                  )}
                  
                  {resource && (
                    <div className="space-y-4 pt-4 border-t">
                      <Label className="font-semibold text-base">Seguridad con PIN</Label>
                      <div className="relative"><Input type={showPin ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Nuevo PIN (4-8 dígitos)" autoComplete="new-password"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPin(!showPin)}>{showPin ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}</Button></div>
                      {pin && <div className="relative"><Input type={showPin ? "text" : "password"} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="Confirmar nuevo PIN" disabled={!pin} autoComplete="new-password"/></div>}
                      {pin && confirmPin && pin !== confirmPin && <p className="text-xs text-destructive">Los PIN no coinciden.</p>}
                      <div className="flex gap-2">
                          <Button type="button" onClick={()=>{}} disabled={isSettingPin || !pin || pin.length < 4 || (pin !== confirmPin)} className="w-full">
                              <Check className="mr-2 h-4 w-4" />Establecer PIN
                          </Button>
                          <Button type="button" variant="destructive" onClick={()=>{}} disabled={isSettingPin} className="w-full">
                              <X className="mr-2 h-4 w-4" />Quitar PIN
                          </Button>
                      </div>
                    </div>
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
