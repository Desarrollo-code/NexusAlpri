// src/components/resources/resource-editor-modal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Save, FileUp, Link as LinkIcon, FilePenLine, ArrowLeft, ArrowRight, Globe, Users, Briefcase } from 'lucide-react';
import type { AppResourceType, User as AppUser, Process, ResourceSharingMode } from '@/types';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion, AnimatePresence } from 'framer-motion';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileIcon } from '../ui/file-icon';
import { formatFileSize } from '@/lib/utils';
import { Alert, AlertDescription } from '../ui/alert';

const TOTAL_STEPS = 2; // Reducido a 2 pasos

interface ResourceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: AppResourceType | null;
  parentId: string | null;
  onSave: () => void;
}

// ... (El resto de las importaciones y componentes auxiliares se mantienen igual)

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave }: ResourceEditorModalProps) {
    const { toast } = useToast();
    const { settings } = useAuth();
    
    // Step management
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
    
    const [externalLink, setExternalLink] = useState('');
    const [editableContent, setEditableContent] = useState('');
    
    const [upload, setUpload] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Permissions state
    const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
    const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
    const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);

    // API related state
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [allProcesses, setAllProcesses] = useState<Process[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const isEditing = !!resource;

    const resetForm = useCallback(() => {
        setStep(1);
        setTitle('');
        setDescription('');
        setCategory(settings?.resourceCategories[0] || 'General');
        // El resourceType ya no se elige aquí
        setResourceType('DOCUMENT'); // O se puede basar en lo que abrió el modal
        setExternalLink('');
        setEditableContent('');
        setUpload(null);
        setSharingMode('PUBLIC');
        setSharedWithUserIds([]);
        setSharedWithProcessIds([]);
    }, [settings?.resourceCategories]);
    
    useEffect(() => {
        if (isOpen) {
            // El primer paso ahora es el contenido.
            setStep(1); 

            if (isEditing && resource) {
                // ... (lógica para editar existente)
            } else {
                resetForm();
            }

            Promise.all([
              fetch('/api/users/list').then(res => res.json()),
              fetch('/api/processes').then(res => res.json())
            ]).then(([usersData, processesData]) => {
                setAllUsers(usersData.users || []);
                setAllProcesses(processesData || []);
            }).catch(console.error);
        }
    }, [isEditing, resource, isOpen, resetForm]);

    const handleNextStep = () => {
        setDirection(1);
        setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    };

    const handlePrevStep = () => {
        setDirection(-1);
        setStep(prev => Math.max(prev - 1, 1));
    };
    
    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const file = files[0];
        const newUpload = {
            id: `upload-${file.name}-${Date.now()}`,
            file,
            progress: 0,
            error: null,
            status: 'uploading' as const,
        };
        setUpload(newUpload);
        
        try {
            const result = await uploadWithProgress('/api/upload/resource-file', file, (p) => {
                setUpload(prev => ({...prev, progress: p}));
            });
            setUpload(prev => ({...prev, url: result.url, status: 'completed'}));
            setTitle(prevTitle => prevTitle || file.name.split('.').slice(0,-1).join('.'));
            setResourceType('DOCUMENT');
        } catch(err) {
            setUpload(prev => ({ ...prev, status: 'error', error: (err as Error).message }));
            toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let determinedType = resourceType;
            let url: string | undefined = undefined;
            let content: string | undefined = undefined;
            
            if (externalLink) {
                determinedType = 'EXTERNAL_LINK';
                url = externalLink;
            } else if (upload) {
                determinedType = 'DOCUMENT';
                url = upload.url;
            } else {
                 determinedType = 'DOCUMENTO_EDITABLE';
                 content = editableContent;
            }

            const payload: any = {
                title, description, category, type: determinedType, url, content,
                sharingMode, sharedWithUserIds, sharedWithProcessIds,
                parentId,
                size: upload?.file.size,
                fileType: upload?.file.type,
                filename: upload?.file.name,
            };
            
            const endpoint = isEditing ? `/api/resources/${resource!.id}` : '/api/resources';
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'No se pudo guardar.');
            
            toast({ title: "¡Éxito!", description: `Recurso ${isEditing ? 'actualizado' : 'creado'}.` });
            onSave();
            onClose();

        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    // Componente Step1 (Contenido)
    const Step1Content = () => (
         <div className="space-y-6">
            <div className="text-center"><h3 className="text-lg font-semibold">Contenido del Recurso</h3><p className="text-sm text-muted-foreground">Sube un archivo, pega un enlace o crea un documento.</p></div>
             <div className="space-y-1"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} required /></div>
             <div className="space-y-1"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
             <div className="space-y-1"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
             
             <Separator />

             <Alert variant="default" className="text-sm">
                <Info className="h-4 w-4" />
                <AlertDescription>Puedes proporcionar **solo una** de las siguientes opciones.</AlertDescription>
             </Alert>

             <div className="space-y-4">
                 <div className="space-y-1"><Label>Subir Archivo</Label><UploadArea onFileSelect={(f) => handleFileSelect(f)} disabled={isUploading} /></div>
                 {upload && <div className="p-2 border rounded-md bg-muted/50 relative"><div className="flex items-center gap-2"><FileIcon displayMode="list" type={upload.file.type.split('/')[1]} /><div className="min-w-0"><p className="text-sm font-medium truncate">{upload.file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(upload.file.size)}</p></div></div>{upload.status === 'uploading' && <Progress value={upload.progress} className="h-1 mt-1" />}</div>}

                 <div className="relative flex items-center"><Separator className="flex-1"/><span className="mx-2 text-xs text-muted-foreground">O</span><Separator className="flex-1"/></div>
                 
                 <div className="space-y-1"><Label>Enlace Externo</Label><Input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://..."/></div>

                 <div className="relative flex items-center"><Separator className="flex-1"/><span className="mx-2 text-xs text-muted-foreground">O</span><Separator className="flex-1"/></div>

                 <div className="space-y-1"><Label>Documento Editable</Label><RichTextEditor value={editableContent} onChange={setEditableContent} className="h-48" /></div>
             </div>
        </div>
    );
    
    // Componente Step2 (Permisos)
    const Step2Permissions = () => {
        const [userSearch, setUserSearch] = useState('');
        const filteredUsers = allUsers.filter((u: AppUser) => u.name.toLowerCase().includes(userSearch.toLowerCase()));
    
        return (
            <div className="space-y-6">
                 <div className="text-center"><h3 className="text-lg font-semibold">Visibilidad y Permisos</h3><p className="text-sm text-muted-foreground">Elige quién podrá ver este recurso.</p></div>
                 <RadioGroup value={sharingMode} onValueChange={(v) => setSharingMode(v as ResourceSharingMode)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex-1"><RadioGroupItem value="PUBLIC" id="share-public" className="sr-only" /><Label htmlFor="share-public" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PUBLIC' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Globe className="mb-2 h-6 w-6"/><span className="font-semibold">Público</span></Label></div>
                    <div className="flex-1"><RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/><Label htmlFor="share-process" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PROCESS' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Briefcase className="mb-2 h-6 w-6"/><span className="font-semibold">Por Proceso</span></Label></div>
                    <div className="flex-1"><RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/><Label htmlFor="share-private" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PRIVATE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Users className="mb-2 h-6 w-6"/><span className="font-semibold">Privado</span></Label></div>
                </RadioGroup>
                
                <AnimatePresence>
                    {sharingMode === 'PROCESS' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <UserOrProcessList type="process" items={allProcesses} selectedIds={sharedWithProcessIds} onSelectionChange={setSharedWithProcessIds} />
                        </motion.div>
                    )}
                    {sharingMode === 'PRIVATE' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <UserOrProcessList type="user" items={allUsers} selectedIds={sharedWithUserIds} onSelectionChange={setSharedWithUserIds} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl">
                 <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{isEditing ? 'Editar Recurso' : 'Añadir Nuevo Recurso'}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 relative px-6 py-4">
                     <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={step} custom={direction} variants={stepVariants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}
                            className="absolute w-full px-6"
                         >
                            {step === 1 && <Step1Content />}
                            {step === 2 && <Step2Permissions />}
                        </motion.div>
                     </AnimatePresence>
                </div>
                 <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-between sm:justify-between items-center">
                    <Button variant="ghost" onClick={handlePrevStep} disabled={step === 1 || isSaving}>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Anterior
                    </Button>
                    {step < TOTAL_STEPS ? (
                        <Button onClick={handleNextStep}>Siguiente <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    ) : (
                        <Button onClick={handleSave} disabled={isSaving || !title}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Guardar Recurso
                        </Button>
                    )}
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const UserOrProcessList = ({ type, items, selectedIds, onSelectionChange }: { type: 'user' | 'process', items: any[], selectedIds: string[], onSelectionChange: (ids: string[]) => void }) => {
    const [search, setSearch] = useState('');
    const filteredItems = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const handleSelection = (id: string, checked: boolean) => {
        onSelectionChange(checked ? [...selectedIds, id] : selectedIds.filter(i => i !== id));
    };

    return (
        <Card className="mt-4">
            <CardContent className="p-4 space-y-3">
                 <Input placeholder={`Buscar ${type === 'user' ? 'usuario' : 'proceso'}...`} value={search} onChange={e => setSearch(e.target.value)} />
                 <ScrollArea className="h-40">
                    <div className="space-y-2 pr-2">
                        {filteredItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                                <Checkbox id={`${type}-${item.id}`} checked={selectedIds.includes(item.id)} onCheckedChange={(c) => handleSelection(item.id, !!c)}/>
                                <Label htmlFor={`${type}-${item.id}`} className="flex items-center gap-2 font-normal cursor-pointer">
                                    {type === 'user' && <Avatar className="h-7 w-7"><AvatarImage src={item.avatar || undefined} /><AvatarFallback><Identicon userId={item.id}/></AvatarFallback></Avatar>}
                                    {item.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                 </ScrollArea>
            </CardContent>
        </Card>
    );
};
