// src/components/resources/resource-editor-modal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
import { Loader2, Save, UploadCloud, FileWarning, Link as LinkIcon, Image as ImageIcon, XCircle, Trash2 } from 'lucide-react';
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
import bcrypt from 'bcryptjs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';

interface ResourceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: AppResourceType | null;
  parentId: string | null;
  onSave: () => void;
}

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave }: ResourceEditorModalProps) {
  const { toast } = useToast();
  const { user, settings } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  
  const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
  const [externalLink, setExternalLink] = useState('');

  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  const [pin, setPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);


  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(settings?.resourceCategories[0] || 'General');
    setIsPublic(true);
    setSharedWithUserIds([]);
    setExpiresAt(undefined);
    setStatus('ACTIVE');
    setResourceType('DOCUMENT');
    setExternalLink('');
    setLocalFile(null);
    setPin('');
  };

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setTitle(resource.title);
        setDescription(resource.description || '');
        setCategory(resource.category || settings?.resourceCategories[0] || 'General');
        setIsPublic(resource.ispublic);
        setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
        setExpiresAt(resource.expiresAt ? new Date(resource.expiresAt) : undefined);
        setStatus(resource.status);
        setResourceType(resource.type);
        setExternalLink(resource.type === 'EXTERNAL_LINK' ? resource.url || '' : '');
        setPin(''); // No pre-cargamos el PIN por seguridad
      } else {
        resetForm();
      }
      
       if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
          fetch('/api/users/list')
            .then(res => res.json())
            .then(data => setAllUsers(data.users || []));
        }
    }
  }, [resource, isOpen, settings]);

  const handleFileSelect = (file: File | null) => {
    setLocalFile(file);
    if(file) {
      setTitle(prev => prev || file.name.split('.').slice(0, -1).join('.'));
    }
  };
  
  const handleSetPin = async () => {
    if (!resource || !pin) return;
    setIsSettingPin(true);
    try {
      const endpoint = pin ? `/api/resources/${resource.id}/pin` : `/api/resources/${resource.id}/pin`;
      const method = pin ? 'POST' : 'DELETE';
      const res = await fetch(endpoint, {
        method: pin ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if(!res.ok) throw new Error((await res.json()).message);
      toast({ title: "PIN actualizado" });
      setPin('');
      onSave(); // Refrescar datos
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
    } finally {
      setIsSettingPin(false);
    }
  }
  
  const handleRemovePin = async () => {
      if (!resource) return;
      setIsSettingPin(true);
      try {
          const res = await fetch(`/api/resources/${resource.id}/pin`, { method: 'DELETE' });
          if(!res.ok) throw new Error((await res.json()).message);
          toast({ title: "PIN eliminado" });
          onSave();
      } catch (err) {
          toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
      } finally {
          setIsSettingPin(false);
      }
  }


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
        toast({ title: 'Título requerido', variant: 'destructive'});
        return;
    }

    setIsSaving(true);
    let finalUrl = resource?.url || null;
    let finalSize = resource?.size || 0;
    let finalFileType = resource?.fileType || '';
    
    if (resourceType === 'EXTERNAL_LINK') {
        finalUrl = externalLink;
    } else if (localFile) {
        setIsUploading(true);
        try {
            const uploadedFile = await uploadWithProgress('/api/upload/resource-file', localFile, setUploadProgress);
            finalUrl = uploadedFile.url;
            finalSize = localFile.size;
            finalFileType = localFile.type;
        } catch (err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
            setIsSaving(false);
            setIsUploading(false);
            return;
        }
        setIsUploading(false);
    }
    
    const payload = {
        title, description, category, isPublic, sharedWithUserIds: isPublic ? [] : sharedWithUserIds,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        status, type: resourceType, url: finalUrl,
        size: finalSize, fileType: finalFileType,
        parentId: resource ? resource.parentId : parentId
    };
    
    const endpoint = resource ? `/api/resources/${resource.id}` : '/api/resources';
    const method = resource ? 'PUT' : 'POST';

    try {
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error((await response.json()).message || 'No se pudo guardar el recurso.');
        }
        
        toast({ title: 'Éxito', description: `Recurso ${resource ? 'actualizado' : 'creado'}.` });
        onSave();
        onClose();

    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{resource ? 'Editar Recurso' : 'Subir Nuevo Recurso'}</DialogTitle>
                <DialogDescription>{resource ? 'Modifica los detalles de tu recurso.' : 'Añade un nuevo archivo, enlace o documento a la biblioteca.'}</DialogDescription>
            </DialogHeader>
            <form id="resource-form" onSubmit={handleSave}>
                <ScrollArea className="max-h-[60vh] p-1 pr-4">
                    <div className="space-y-4 pr-2">
                      {!resource && (
                         <RadioGroup defaultValue="DOCUMENT" onValueChange={(v) => {setResourceType(v as any); setLocalFile(null); setExternalLink('');}} className="grid grid-cols-2 gap-4">
                            <div><RadioGroupItem value="DOCUMENT" id="type-doc" className="peer sr-only"/><Label htmlFor="type-doc" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><ImageIcon className="mb-2 h-6 w-6"/>Archivo</Label></div>
                            <div><RadioGroupItem value="EXTERNAL_LINK" id="type-link" className="peer sr-only"/><Label htmlFor="type-link" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><LinkIcon className="mb-2 h-6 w-6"/>Enlace</Label></div>
                         </RadioGroup>
                      )}
                      
                      {resourceType !== 'EXTERNAL_LINK' && (
                          <UploadArea onFileSelect={handleFileSelect} disabled={isSaving || isUploading}>
                              {localFile ? <p className="text-sm font-semibold">{localFile.name}</p> : (resource && <p className="text-sm">Reemplazar archivo (opcional)</p>)}
                          </UploadArea>
                      )}
                      {isUploading && <Progress value={uploadProgress} />}

                      {resourceType === 'EXTERNAL_LINK' && <div className="space-y-2"><Label htmlFor="url">URL del Enlace</Label><Input id="url" type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} required placeholder="https://..."/></div>}
                        
                       <div className="space-y-2"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                       <div className="space-y-2"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)}/></div>
                       <div className="space-y-2"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                       <div className="space-y-2"><Label>Expiración</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{expiresAt ? format(expiresAt, "PPP", {locale: es}) : <span>Sin fecha de expiración</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus /></PopoverContent></Popover></div>
                       <div className="flex items-center space-x-2 pt-2"><Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} /><Label htmlFor="is-public">Público (visible para todos)</Label></div>
                        {!isPublic && (
                            <div className="space-y-2"><Label>Compartir con</Label><Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/>
                            <ScrollArea className="h-32 border rounded-md p-2">
                                {filteredUsers.map(u => (
                                    <div key={u.id} className="flex items-center space-x-3 py-1"><Checkbox id={`share-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={(c) => setSharedWithUserIds(prev => c ? [...prev, u.id] : prev.filter(id => id !== u.id))} /><Label htmlFor={`share-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{u.name?.charAt(0)}</AvatarFallback></Avatar>{u.name}</Label></div>
                                ))}
                            </ScrollArea></div>
                        )}
                        {resource && (
                          <div className="space-y-2 pt-4 border-t">
                            <Label>Seguridad</Label>
                            <div className="flex gap-2">
                              <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Nuevo PIN (4-8 dígitos)"/>
                              <Button type="button" onClick={handleSetPin} disabled={isSettingPin || !pin}>Establecer</Button>
                              <Button type="button" variant="ghost" size="icon" onClick={handleRemovePin} disabled={isSettingPin}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                          </div>
                        )}
                    </div>
                </ScrollArea>
            </form>
            <DialogFooter className="border-t pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" form="resource-form" disabled={isSaving || isUploading}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Guardar
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
