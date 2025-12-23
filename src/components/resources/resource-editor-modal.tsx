// src/components/resources/resource-editor-modal.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, FileUp, Link as LinkIcon, FilePenLine, ArrowLeft, ArrowRight, UploadCloud, Info, Globe, Users, Briefcase, FileText as FileGenericIcon, Edit, BrainCircuit, PlusCircle } from 'lucide-react';
import type { AppResourceType, User as AppUser, Process, ResourceSharingMode, AppQuiz } from '@/types';
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
import { FileIcon } from '@/components/ui/file-icon';
import { formatFileSize } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { FolderContentView } from '@/components/resources/folder-content-view';
import { QuizEditorModal } from '@/components/quizz-it/quiz-editor-modal';

interface ResourceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: AppResourceType | null;
  parentId: string | null;
  onSave: () => void;
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}

const STEPS = [
  { id: 'content', name: 'Contenido' },
  { id: 'config', name: 'Configuración' },
];

const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="flex w-full px-6">
      {STEPS.map((step, index) => {
        const stepIndex = index + 1;
        const isCompleted = currentStep > stepIndex;
        const isActive = currentStep === stepIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isActive ? 'bg-primary border-primary text-primary-foreground' : isCompleted ? 'bg-primary/80 border-primary/80 text-primary-foreground' : 'bg-muted border-border'
                }`}
              >
                {isCompleted ? '✓' : stepIndex}
              </div>
              <p className={`text-xs mt-1 ${isActive || isCompleted ? "font-semibold text-primary" : "text-muted-foreground"}`}>{step.name}</p>
            </div>
            {stepIndex < STEPS.length && (
              <div className="flex-1 h-px bg-border my-4" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};


export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave }: ResourceEditorModalProps) {
    const { toast } = useToast();
    const { user, settings } = useAuth();
    
    // Step management for CREATION
    const [creationStep, setCreationStep] = useState(1);

    // Common form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
    const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
    
    const [externalLink, setExternalLink] = useState('');
    const [editableContent, setEditableContent] = useState('');
    const [observations, setObservations] = useState('');
    
    const [upload, setUpload] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [quiz, setQuiz] = useState<AppQuiz | null>(null);
    const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);

    // Permissions state
    const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
    const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
    const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    
    // API data
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [allProcesses, setAllProcesses] = useState<Process[]>([]);
    const [folderContent, setFolderContent] = useState<AppResourceType[]>([]);
    const [isLoadingFolderContent, setIsLoadingFolderContent] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);
    
    const isEditing = !!resource;
    const isEditingFolder = isEditing && resource?.type === 'FOLDER';
    
    // Tab management for EDITING
    const [activeEditTab, setActiveEditTab] = useState('content');


    const resetForm = useCallback(() => {
        setCreationStep(1);
        setTitle(''); setDescription('');
        setCategory(settings?.resourceCategories[0] || 'General');
        setExpiresAt(undefined); setResourceType('DOCUMENT');
        setExternalLink(''); setEditableContent(''); setObservations('');
        setUpload(null); setSharingMode('PUBLIC');
        setSharedWithUserIds([]); setSharedWithProcessIds([]); setCollaboratorIds([]);
        setQuiz(null);
    }, [settings?.resourceCategories]);
    
    useEffect(() => {
        if (isOpen) {
            if (isEditing && resource) {
                setTitle(resource.title || '');
                setDescription(resource.description || '');
                setCategory(resource.category || settings?.resourceCategories[0] || 'General');
                setExpiresAt(resource.expiresAt ? new Date(resource.expiresAt) : undefined);
                setResourceType(resource.type);
                setSharingMode(resource.sharingMode);
                setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
                setSharedWithProcessIds(resource.sharedWithProcesses?.map(p => p.id) || []);
                setCollaboratorIds(resource.collaborators?.map(c => c.id) || []);
                setObservations(resource.observations || '');
                setQuiz(resource.quiz || null);
                
                if (resource.type === 'EXTERNAL_LINK') setExternalLink(resource.url || '');
                if (resource.type === 'DOCUMENTO_EDITABLE') setEditableContent(resource.content || '');
                if ((resource.type === 'DOCUMENT' || resource.type === 'VIDEO') && resource.url) {
                    setUpload({ url: resource.url, file: { name: resource.title, type: resource.filetype, size: resource.size }});
                } else {
                    setUpload(null);
                }
                setActiveEditTab(isEditingFolder ? 'config' : 'content');

                if (isEditingFolder) {
                    setIsLoadingFolderContent(true);
                    fetch(`/api/resources?parentId=${resource.id}`)
                        .then(res => res.json())
                        .then(data => setFolderContent(data.resources || []))
                        .catch(console.error)
                        .finally(() => setIsLoadingFolderContent(false));
                }

            } else {
                resetForm();
            }

            if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
                Promise.all([
                  fetch('/api/users/list').then(res => res.json()),
                  fetch('/api/processes?format=flat').then(res => res.json())
                ]).then(([usersData, processesData]) => {
                    setAllUsers(usersData.users || []);
                    setAllProcesses(processesData || []);
                }).catch(console.error);
            }
        }
    }, [isEditing, resource, isOpen, resetForm, settings, user, isEditingFolder]);

    const handleFileSelect = async (file: File | null) => {
        if (!file) return;
        setIsUploading(true);
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
                setUpload((prev: any) => ({...prev, progress: p}));
            });
            setUpload((prev: any) => ({...prev, url: result.url, status: 'completed'}));
            setTitle(prevTitle => prevTitle || file.name);
        } catch(err) {
            setUpload((prev: any) => ({ ...prev, status: 'error', error: (err as Error).message }));
            toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
     };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let url: string | undefined = undefined;
            let fileType: string | undefined = undefined;
            let size: number | undefined = undefined;

            if(resourceType === 'EXTERNAL_LINK') url = externalLink;
            if((resourceType === 'DOCUMENT' || resourceType === 'VIDEO') && upload) {
                url = upload.url;
                fileType = upload.file.type;
                size = upload.file.size;
            }

            const payload: any = {
                title, description, category, type: resourceType, url, filetype: fileType, size,
                content: resourceType === 'DOCUMENTO_EDITABLE' ? editableContent : null,
                sharingMode, sharedWithUserIds, sharedWithProcessIds, collaboratorIds,
                parentId, expiresAt: expiresAt?.toISOString() || null,
                observations,
                quiz,
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
    
    const isStep1Valid = !!title && (
        (resourceType === 'DOCUMENT' && upload?.status === 'completed') || 
        (resourceType === 'EXTERNAL_LINK' && externalLink) || 
        (resourceType === 'DOCUMENTO_EDITABLE' && editableContent) ||
        (isEditingFolder)
    );
    
    const ContentStep = () => (
        <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="title">Título del Recurso</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Tipo de Recurso</Label><RadioGroup value={resourceType} onValueChange={(v) => setResourceType(v as any)} className="grid grid-cols-1 md:grid-cols-3 gap-3"><div className="flex-1"><RadioGroupItem value="DOCUMENT" id="type-doc" className="sr-only" /><Label htmlFor="type-doc" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${resourceType === 'DOCUMENT' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><FileUp className={`mb-2 h-6 w-6 ${resourceType === 'DOCUMENT' ? 'text-primary' : 'text-muted-foreground'}`}/><span className="font-semibold text-sm">Archivo</span></Label></div><div className="flex-1"><RadioGroupItem value="EXTERNAL_LINK" id="type-link" className="sr-only"/><Label htmlFor="type-link" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${resourceType === 'EXTERNAL_LINK' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><LinkIcon className={`mb-2 h-6 w-6 ${resourceType === 'EXTERNAL_LINK' ? 'text-primary' : 'text-muted-foreground'}`}/><span className="font-semibold text-sm">Enlace Web</span></Label></div><div className="flex-1"><RadioGroupItem value="DOCUMENTO_EDITABLE" id="type-editable" className="sr-only"/><Label htmlFor="type-editable" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${resourceType === 'DOCUMENTO_EDITABLE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><FilePenLine className={`mb-2 h-6 w-6 ${resourceType === 'DOCUMENTO_EDITABLE' ? 'text-primary' : 'text-muted-foreground'}`}/><span className="font-semibold text-sm">Documento</span></Label></div></RadioGroup></div>
            <div className="space-y-2">
                <Label>Contenido</Label>
                {resourceType === 'DOCUMENT' && (upload ? (<div className="p-2 border rounded-md bg-muted/50 relative"><div className="flex items-center gap-2"><FileGenericIcon className="h-5 w-5 text-primary shrink-0" /><div className="min-w-0"><p className="text-sm font-medium truncate">{upload.file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(upload.file.size)}</p></div></div>{upload.status === 'uploading' && <Progress value={upload.progress} className="h-1 mt-1" />}{upload.status === 'error' && <p className="text-xs text-destructive mt-1">{upload.error}</p>}</div>) : (<UploadArea onFileSelect={(files) => files && handleFileSelect(files[0])} disabled={isUploading} />))}
                {resourceType === 'EXTERNAL_LINK' && <Input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://ejemplo.com"/>}
                {resourceType === 'DOCUMENTO_EDITABLE' && <RichTextEditor value={editableContent} onChange={setEditableContent} className="min-h-[200px]" />}
            </div>
        </div>
    );
    
    const ConfigStep = () => (
         <div className="space-y-6">
            <Card><CardHeader><CardTitle className="text-base">Detalles Adicionales</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label>Fecha de Expiración (Opcional)</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{expiresAt ? format(expiresAt, "PPP", {locale: es}) : <span>Nunca</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus locale={es}/></PopoverContent></Popover></div><div className="space-y-2"><Label htmlFor="observations">Observaciones (Privado)</Label><Textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} /></div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Permisos</CardTitle></CardHeader><CardContent><RadioGroup value={sharingMode} onValueChange={(v) => setSharingMode(v as ResourceSharingMode)} className="grid grid-cols-1 md:grid-cols-3 gap-3"><div className="flex-1"><RadioGroupItem value="PUBLIC" id="share-public" className="sr-only" /><Label htmlFor="share-public" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PUBLIC' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Globe className={`mb-2 h-6 w-6 ${sharingMode === 'PUBLIC' ? 'text-primary' : 'text-muted-foreground'}`}/>Público</Label></div><div className="flex-1"><RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/><Label htmlFor="share-process" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PROCESS' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Briefcase className={`mb-2 h-6 w-6 ${sharingMode === 'PROCESS' ? 'text-primary' : 'text-muted-foreground'}`}/>Por Proceso</Label></div><div className="flex-1"><RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/><Label htmlFor="share-private" className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${sharingMode === 'PRIVATE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Users className={`mb-2 h-6 w-6 ${sharingMode === 'PRIVATE' ? 'text-primary' : 'text-muted-foreground'}`}/>Privado</Label></div></RadioGroup>
            {sharingMode === 'PROCESS' && (<UserOrProcessList type="process" items={flattenedProcesses} selectedIds={sharedWithProcessIds} onSelectionChange={setSharedWithProcessIds} />)}
            {sharingMode === 'PRIVATE' && (<UserOrProcessList type="user" items={allUsers} selectedIds={sharedWithUserIds} onSelectionChange={setSharedWithUserIds} />)}
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Edit className="h-4 w-4 text-primary"/>Colaboradores</CardTitle><CardDescription className="text-xs">Permite a otros instructores o administradores editar este recurso.</CardDescription></CardHeader><CardContent><UserOrProcessList type="user" items={allUsers.filter(u => u.role !== 'STUDENT')} selectedIds={collaboratorIds} onSelectionChange={setCollaboratorIds} /></CardContent></Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Evaluación (Opcional)</CardTitle>
                    <CardDescription className="text-xs">Añade un quiz para validar el conocimiento del recurso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" variant="outline" type="button" onClick={() => setIsQuizEditorOpen(true)}>
                        {quiz ? <Edit className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                        {quiz ? 'Editar Quiz' : 'Añadir Quiz'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    const renderFolderEdit = () => (
      <form id="resource-form" onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-x-6 overflow-hidden">
            <div className="md:col-span-1 h-full flex flex-col">
                <ScrollArea className="h-full">
                    <div className="px-6 py-4">
                        <ConfigStep />
                    </div>
                </ScrollArea>
            </div>
             <div className="md:col-span-1 h-full flex flex-col bg-muted/50 border-l">
                <div className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                    <h3 className="font-semibold">Contenido de la Carpeta</h3>
                    <Button type="button" size="sm"><UploadCloud className="mr-2 h-4 w-4"/>Subir Archivos</Button>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4">
                        {isLoadingFolderContent ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div> 
                        : <FolderContentView items={folderContent} onEdit={() => {}} onDelete={() => {}} />}
                    </div>
                </ScrollArea>
            </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" disabled={isSaving || !title.trim()}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                <Save className="mr-2 h-4 w-4"/>Guardar Cambios
            </Button>
        </DialogFooter>
      </form>
    );

    const renderCreationWizard = () => (
        <form id="resource-form" onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
            <ProgressBar currentStep={creationStep} />
            <ScrollArea className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={creationStep}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="px-6 py-4"
                    >
                        {creationStep === 1 && <ContentStep />}
                        {creationStep === 2 && <ConfigStep />}
                    </motion.div>
                </AnimatePresence>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-between">
                <Button type="button" variant="outline" onClick={() => creationStep === 1 ? onClose() : setCreationStep(p => p - 1)} disabled={isSaving}>
                   {creationStep > 1 && <ArrowLeft className="mr-2 h-4 w-4"/>} {creationStep === 1 ? 'Cancelar' : 'Anterior'}
                </Button>
                {creationStep < STEPS.length ? (
                    <Button type="button" onClick={() => setCreationStep(p => p + 1)} disabled={!isStep1Valid}>Siguiente <ArrowRight className="ml-2 h-4 w-4"/></Button>
                ) : (
                    <Button type="submit" disabled={isSaving || !isStep1Valid}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Crear Recurso
                    </Button>
                )}
            </DialogFooter>
        </form>
    );

    const renderEditTabs = () => (
      <form id="resource-form" onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
        <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="flex-1 min-h-0 flex flex-col">
            <div className="px-6 pt-2 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="config">Configuración</TabsTrigger>
              </TabsList>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-4">
                <TabsContent value="content" className="mt-0"><ContentStep /></TabsContent>
                <TabsContent value="config" className="mt-0"><ConfigStep /></TabsContent>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-end gap-2 bg-background">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving || !isStep1Valid}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <Save className="mr-2 h-4 w-4"/>Guardar Cambios
                </Button>
            </DialogFooter>
        </Tabs>
      </form>
    );

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:max-w-4xl p-0 gap-0 rounded-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-2 border-b flex-shrink-0">
                    <DialogTitle>{isEditing ? (isEditingFolder ? 'Editar Carpeta' : 'Editar Recurso') : 'Nuevo Recurso'}</DialogTitle>
                </DialogHeader>
                {isEditing && isEditingFolder ? renderFolderEdit() : isEditing ? renderEditTabs() : renderCreationWizard()}
            </DialogContent>
        </Dialog>
        {isQuizEditorOpen && (
                <QuizEditorModal
                    isOpen={isQuizEditorOpen}
                    onClose={() => setIsQuizEditorOpen(false)}
                    quiz={quiz || {
                        id: `new-quiz-${Date.now()}`,
                        title: `Evaluación de ${title || 'el recurso'}`,
                        questions: [],
                        maxAttempts: null,
                    }}
                    onSave={(updatedQuiz) => {
                        setQuiz(updatedQuiz);
                        setIsQuizEditorOpen(false);
                    }}
                />
            )}
        </>
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
                    <div className="space-y-1 pr-3">
                        {filteredItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                                <Checkbox id={`${type}-${item.id}`} checked={selectedIds.includes(item.id)} onCheckedChange={(c) => handleSelection(item.id, !!c)}/>
                                <Label htmlFor={`${type}-${item.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm">
                                    {type === 'user' && <Avatar className="h-7 w-7"><AvatarImage src={item.avatar || undefined} /><AvatarFallback><Identicon userId={item.id}/></AvatarFallback></Avatar>}
                                    <span style={{ paddingLeft: `${type === 'process' ? (item.level || 0) * 1.5 : 0}rem` }}>{item.name}</span>
                                </Label>
                            </div>
                        ))}
                    </div>
                 </ScrollArea>
            </CardContent>
        </Card>
    );
};
