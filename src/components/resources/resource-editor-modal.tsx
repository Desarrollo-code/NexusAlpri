// src/components/resources/resource-editor-modal.tsx
'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
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
import { Info } from 'lucide-react';

const TOTAL_STEPS = 2;

interface ResourceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: AppResourceType | null;
  parentId: string | null;
  onSave: () => void;
}

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
    
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
    
    const [externalLink, setExternalLink] = useState('');
    const [editableContent, setEditableContent] = useState('');
    
    const [upload, setUpload] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
    const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
    const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);

    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [allProcesses, setAllProcesses] = useState<Process[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const isEditing = !!resource;

    const resetForm = useCallback(() => {
        setStep(1);
        setTitle('');
        setDescription('');
        setCategory(settings?.resourceCategories[0] || 'General');
        setResourceType('DOCUMENT');
        setExternalLink('');
        setEditableContent('');
        setUpload(null);
        setSharingMode('PUBLIC');
        setSharedWithUserIds([]);
        setSharedWithProcessIds([]);
    }, [settings?.resourceCategories]);
    
    useEffect(() => {
        if (isOpen) {
            setStep(1); 
            if (isEditing && resource) {
                setTitle(resource.title || '');
                setDescription(resource.description || '');
                setCategory(resource.category || settings?.resourceCategories[0] || 'General');
                setResourceType(resource.type);
                setSharingMode(resource.sharingMode || 'PUBLIC');
                setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
                setSharedWithProcessIds(resource.sharedWithProcesses?.map(p => p.id) || []);
                if (resource.type === 'EXTERNAL_LINK') setExternalLink(resource.url || '');
                if (resource.type === 'DOCUMENTO_EDITABLE') setEditableContent(resource.content || '');
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
    }, [isEditing, resource, isOpen, resetForm, settings?.resourceCategories]);

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
        const newUpload = { id: `upload-${file.name}-${Date.now()}`, file, progress: 0, error: null, status: 'uploading' as const };
        setUpload(newUpload);
        
        try {
            const result = await uploadWithProgress('/api/upload/resource-file', file, (p) => setUpload(prev => ({...prev, progress: p})));
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
            
            if (resourceType === 'EXTERNAL_LINK') url = externalLink;
            else if (resourceType === 'DOCUMENT') url = upload?.url;
            else if (resourceType === 'DOCUMENTO_EDITABLE') content = editableContent;
            
            const payload: any = {
                title, description, category, type: determinedType, url, content,
                sharingMode, 
                sharedWithUserIds: sharingMode === 'PRIVATE' ? sharedWithUserIds : [],
                sharedWithProcessIds: sharingMode === 'PROCESS' ? sharedWithProcessIds : [],
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

    const Step1Content = () => (
         <div className="space-y-6">
            <div className="space-y-1"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} required /></div>
            <div className="space-y-1"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
             <Separator/>
             <RadioGroup value={resourceType} onValueChange={(v) => setResourceType(v as any)} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex-1"><RadioGroupItem value="DOCUMENT" id="type-doc" className="sr-only" /><Label htmlFor="type-doc" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${resourceType === 'DOCUMENT' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><FileUp className="mb-2 h-6 w-6"/><span className="font-semibold">Archivo</span></Label></div>
                <div className="flex-1"><RadioGroupItem value="EXTERNAL_LINK" id="type-link" className="sr-only"/><Label htmlFor="type-link" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${resourceType === 'EXTERNAL_LINK' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><LinkIcon className="mb-2 h-6 w-6"/><span className="font-semibold">Enlace Web</span></Label></div>
                <div className="flex-1"><RadioGroupItem value="DOCUMENTO_EDITABLE" id="type-editable" className="sr-only"/><Label htmlFor="type-editable" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${resourceType === 'DOCUMENTO_EDITABLE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><FilePenLine className="mb-2 h-6 w-6"/><span className="font-semibold">Documento</span></Label></div>
             </RadioGroup>

            <AnimatePresence mode="wait">
              <motion.div key={resourceType} initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} transition={{duration: 0.3}}>
                {resourceType === 'DOCUMENT' && <div className="pt-4"><UploadArea onFileSelect={(f) => handleFileSelect(f)} disabled={isUploading} />{upload && <div className="p-2 border rounded-md mt-2"><div className="flex justify-between items-start"><p className="text-sm font-medium truncate pr-2">{upload.file.name}</p><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setUpload(null)}><XCircle className="h-4 w-4"/></Button></div><div className="flex items-center gap-2 mt-1"><Progress value={upload.progress} className="h-1 flex-grow"/>{upload.status === 'uploading' && <span className="text-xs font-semibold">{upload.progress}%</span>}{upload.status === 'completed' && <Check className="h-4 w-4 text-green-500"/>}{upload.status === 'error' && <AlertTriangle className="h-4 w-4 text-destructive"/>}</div></div>}</div>}
                {resourceType === 'EXTERNAL_LINK' && <div className="pt-4"><Input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://..."/></div>}
                {resourceType === 'DOCUMENTO_EDITABLE' && <div className="pt-4"><RichTextEditor value={editableContent} onChange={setEditableContent} className="h-48" /></div>}
              </motion.div>
            </AnimatePresence>
        </div>
    );
    
    const Step2Permissions = () => (
        <div className="space-y-6">
            <RadioGroup value={sharingMode} onValueChange={(v) => setSharingMode(v as ResourceSharingMode)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex-1"><RadioGroupItem value="PUBLIC" id="share-public" className="sr-only" /><Label htmlFor="share-public" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PUBLIC' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Globe className="mb-2 h-6 w-6"/><span className="font-semibold">Público</span></Label></div>
                <div className="flex-1"><RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/><Label htmlFor="share-process" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PROCESS' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Briefcase className="mb-2 h-6 w-6"/><span className="font-semibold">Por Proceso</span></Label></div>
                <div className="flex-1"><RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/><Label htmlFor="share-private" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PRIVATE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Users className="mb-2 h-6 w-6"/><span className="font-semibold">Privado</span></Label></div>
            </RadioGroup>
            
            <AnimatePresence>
                {sharingMode === 'PROCESS' && <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}><UserOrProcessList type="process" items={allProcesses} selectedIds={sharedWithProcessIds} onSelectionChange={setSharedWithProcessIds} /></motion.div>}
                {sharingMode === 'PRIVATE' && <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}><UserOrProcessList type="user" items={allUsers} selectedIds={sharedWithUserIds} onSelectionChange={setSharedWithUserIds} /></motion.div>}
            </AnimatePresence>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl">
                 <DialogHeader className="p-6 pb-2 flex-shrink-0">
                    <DialogTitle>{isEditing ? 'Editar Recurso' : 'Añadir Nuevo Recurso'}</DialogTitle>
                     <div className="flex items-center gap-4 pt-2">
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div className="h-full bg-primary rounded-full" initial={{width: '0%'}} animate={{width: `${(step / TOTAL_STEPS) * 100}%`}} />
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Paso {step} de {TOTAL_STEPS}</span>
                    </div>
                </DialogHeader>
                <div className="flex-1 min-h-0 relative overflow-hidden">
                    <ScrollArea className="h-full">
                         <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={step} custom={direction} variants={stepVariants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}
                                className="w-full px-6 py-4"
                             >
                                {step === 1 && <Step1Content />}
                                {step === 2 && <Step2Permissions />}
                            </motion.div>
                         </AnimatePresence>
                    </ScrollArea>
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
