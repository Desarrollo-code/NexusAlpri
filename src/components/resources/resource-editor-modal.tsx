// src/components/resources/resource-editor-modal.tsx
'use client';

// Importaciones base... (Mantengo las importaciones de la versión anterior)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { motion, AnimatePresence } from 'framer-motion';

// Componentes de UI
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, UploadCloud, Link as LinkIcon, XCircle, RotateCcw, Calendar as CalendarIcon, Globe, Users, FilePen, Briefcase, Check } from 'lucide-react';
import type { AppResourceType, User as AppUser, ResourceSharingMode, Process } from '@/types';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { getInitials, UploadItem, UploadState, ResourceEditorModalProps } from './resource-editor-modal-parts'; // Suponiendo que has modularizado en un archivo separado

// 💡 Nota: Asumo que las funciones getInitials, UploadItem, y las interfaces están en un archivo 
// complementario llamado `resource-editor-modal-parts` para mantener el componente principal limpio, 
// como sugerí en la mejora anterior. Si no es así, deben estar aquí.

// ====================================================================================================

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave }: ResourceEditorModalProps) {
  const { toast } = useToast();
  const { user, settings } = useAuth();
  
  // Agrupación de estados (mantengo la estructura mejorada)
  const [resourceDetails, setResourceDetails] = useState({
    title: '', description: '', content: '', observations: '', category: '', externalLink: '',
    resourceType: 'DOCUMENT' as AppResourceType['type'],
  });

  const [access, setAccess] = useState({
    sharingMode: 'PUBLIC' as ResourceSharingMode,
    sharedWithUserIds: [] as string[],
    sharedWithProcessIds: [] as string[],
    collaboratorIds: [] as string[],
    expiresAt: undefined as Date | undefined,
  });
  
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  const isEditing = !!resource;
  const { title, description, content, category, externalLink, resourceType } = resourceDetails;
  const { sharingMode, sharedWithUserIds, sharedWithProcessIds, collaboratorIds, expiresAt } = access;
  
  // ... (resetForm, useEffect, saveResourceToDb, uploadFileAndSave, handleFileSelect se mantienen igual) ...

  const resetForm = useCallback(() => { /* ... lógica de reset ... */ }, [settings?.resourceCategories]);

  useEffect(() => { /* ... lógica de inicialización ... */ }, [resource, isOpen, resetForm, settings, user]);

  const saveResourceToDb = async (payload: any): Promise<boolean> => { /* ... lógica de guardado ... */ return true; };
  
  const uploadFileAndSave = useCallback(async (upload: UploadState) => { /* ... lógica de subida y guardado ... */ }, [access, parentId, resourceDetails, uploads.length]);

  const handleFileSelect = (files: FileList | null) => { /* ... lógica de selección de archivos ... */ };
  
  const handleRemoveUpload = (id: string) => {
    setUploads(p => p.filter(item => item.id !== id));
  };
  
  const handleSave = async (e: React.FormEvent) => { /* ... lógica de guardado principal ... */ };
  
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()));
  }, [allUsers, userSearch]);

  const renderUploads = () => (
    // 💡 Aquí ya tienes una barra de desplazamiento específica para la lista de archivos
    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 thin-scrollbar">
      {uploads.map(upload => (
        <UploadItem 
          key={upload.id} 
          upload={upload} 
          onRemove={handleRemoveUpload} 
          onRetry={uploadFileAndSave}
        />
      ))}
    </div>
  );

  const renderUploadArea = () => ( /* ... lógica de área de subida ... */ );
  
  const handleResourceDetailChange = (key: keyof typeof resourceDetails, value: any) => {
    setResourceDetails(prev => ({ ...prev, [key]: value }));
  };

  const handleAccessChange = (key: keyof typeof access, value: any) => {
    setAccess(prev => ({ ...prev, [key]: value }));
  };

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
  
  const renderAccessSection = () => ( /* ... lógica de sección de acceso ... */ );


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 💡 MODIFICACIÓN 1: Aseguramos la altura máxima y que sea una columna flex */}
      <DialogContent className="w-[95vw] sm:max-w-2xl p-0 gap-0 rounded-2xl max-h-[95vh] flex flex-col"> 
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>{resource ? 'Editar Recurso' : 'Nuevo Recurso'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Actualiza la información y el acceso de tu recurso.' : 'Crea un nuevo recurso y define su tipo y visibilidad.'}
          </DialogDescription>
        </DialogHeader>
        
        {/* 💡 MODIFICACIÓN 2: El ScrollArea debe tomar el espacio restante */}
        <ScrollArea className="flex-1 min-h-0 custom-scrollbar"> 
          <form id="resource-form" onSubmit={handleSave} className="space-y-6 px-6 py-4">
            
            {/* Selector de Tipo de Recurso */}
            {!isEditing && (
              <RadioGroup 
                value={resourceType} 
                onValueChange={(v) => handleResourceDetailChange('resourceType', v as AppResourceType['type'])} 
                className="grid grid-cols-1 md:grid-cols-3 gap-2"
              >
                 {/* ... (opciones de RadioGroup) ... */}
              </RadioGroup>
            )}
            
            <Separator />

            {/* Contenido del Recurso (Condicional) */}
            <AnimatePresence mode="wait">
              <motion.div key={resourceType} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                {resourceType === 'DOCUMENT' && renderUploadArea()}
                {resourceType === 'EXTERNAL_LINK' && <Input type="url" value={externalLink} onChange={e => handleResourceDetailChange('externalLink', e.target.value)} placeholder="https://..." required />}
                {resourceType === 'DOCUMENTO_EDITABLE' && <RichTextEditor value={content} onChange={(v) => handleResourceDetailChange('content', v)} className="min-h-[150px]" />}
              </motion.div>
            </AnimatePresence>
            
            <Separator />
            
            {/* Detalles del Recurso */}
            <Card>
              <CardHeader><CardTitle className="text-base">Detalles del Recurso</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={(e) => handleResourceDetailChange('title', e.target.value)} required autoComplete="off" /></div>
                <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => handleResourceDetailChange('description', e.target.value)} placeholder="Un resumen breve del contenido del recurso..."/></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={(v) => handleResourceDetailChange('category', v)}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).sort().map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>Expiración</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{expiresAt ? format(expiresAt, "PPP", {locale: es}) : <span>Sin fecha de expiración</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiresAt} onSelect={(date) => handleAccessChange('expiresAt', date)} initialFocus /></PopoverContent></Popover></div>
                </div>
                {resourceType === 'DOCUMENTO_EDITABLE' && <div className="space-y-1.5"><Label htmlFor="observations">Observaciones (Uso interno)</Label><Textarea id="observations" value={resourceDetails.observations} onChange={e => handleResourceDetailChange('observations', e.target.value)} placeholder="Notas para otros colaboradores o administradores..."/></div>}
              </CardContent>
            </Card>

            {/* Visibilidad y Acceso */}
            {renderAccessSection()}

            {/* Colaboradores */}
            {(resourceType === 'DOCUMENTO_EDITABLE' || resourceType === 'VIDEO_PLAYLIST') && (
              <Card>
                {/* ... (Contenido de Colaboradores) ... */}
              </Card>
            )}

          </form>
        </ScrollArea>
        {/* El DialogFooter tiene flex-shrink-0 para que nunca se oculte con el scroll */}
        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-center sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button 
            type="submit" 
            form="resource-form" 
            disabled={isSubmitting || !title || (resourceType === 'EXTERNAL_LINK' && !externalLink) || (resourceType === 'DOCUMENT' && uploads.some(u => u.status === 'uploading' || u.status === 'processing'))}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}