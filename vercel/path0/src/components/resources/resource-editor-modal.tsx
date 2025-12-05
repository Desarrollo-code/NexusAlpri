
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
import { Loader2, Save, UploadCloud, Link as LinkIcon, FilePen, Globe, Users, Briefcase, Calendar as CalendarIcon, Tag, BrainCircuit, FileText, Settings, BookOpen } from 'lucide-react';
import type { AppResourceType, User as AppUser, Process, AppQuiz } from '@/types';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials } from '@/lib/utils';
import { FileIcon } from '../ui/file-icon';
import { QuizEditorModal } from '../quizz-it/quiz-editor-modal';
import { QuizGameView } from '../quizz-it/quiz-game-view';

type ResourceSharingMode = 'PUBLIC' | 'PROCESS' | 'PRIVATE';

interface ResourceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: AppResourceType | null;
  parentId: string | null;
  onSave: () => void;
  initialStep?: 'content' | 'config';
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave, initialStep = 'content' }: ResourceEditorModalProps) {
  const { toast } = useToast();
  const { user, settings } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [resourceType, setResourceType] = useState<AppResourceType['type']>('DOCUMENT');
  const [externalLink, setExternalLink] = useState('');
  
  const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);
  
  const [uploads, setUploads] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [processSearch, setProcessSearch] = useState('');

  const [localQuiz, setLocalQuiz] = useState<AppQuiz | null>(null);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  
  const isEditing = !!resource;

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setContent('');
    setCategory(settings?.resourceCategories[0] || 'General');
    setSharingMode('PUBLIC');
    setSharedWithUserIds([]);
    setSharedWithProcessIds([]);
    setExpiresAt(undefined);
    setResourceType('DOCUMENT');
    setExternalLink('');
    setUploads([]);
    setLocalQuiz(null);
  }, [settings?.resourceCategories]);

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setTitle(resource.title || '');
        setDescription(resource.description || '');
        setContent(resource.content || '');
        setCategory(resource.category || settings?.resourceCategories[0] || 'General');
        setSharingMode(resource.sharingMode || 'PUBLIC');
        setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
        setSharedWithProcessIds(resource.sharedWithProcesses?.map(p => p.id) || []);
        setExpiresAt(resource.expiresAt ? new Date(resource.expiresAt) : undefined);
        setResourceType(resource.type);
        setExternalLink(resource.type === 'EXTERNAL_LINK' ? resource.url || '' : '');
        setLocalQuiz(resource.quiz || null);
        setUploads([]);
      } else {
        resetForm();
      }

      if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
          Promise.all([
            fetch('/api/users/list').then(res => res.json()),
            fetch('/api/processes?format=flat').then(res => res.json()),
          ]).then(([usersData, processesData]) => {
            setAllUsers(usersData.users || []);
            setAllProcesses(processesData || []);
          }).catch(console.error);
      }
    }
  }, [resource, isOpen, resetForm, settings, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      title, description, content, category, sharingMode,
      sharedWithUserIds: sharingMode === 'PRIVATE' ? sharedWithUserIds : [],
      sharedWithProcessIds: sharingMode === 'PROCESS' ? sharedWithProcessIds : [],
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      status: resource?.status || 'ACTIVE', type: resourceType,
      url: resourceType === 'EXTERNAL_LINK' ? externalLink : (uploads.length > 0 ? uploads[0].url : resource?.url),
      size: uploads.length > 0 ? uploads[0].file.size : resource?.size,
      filetype: uploads.length > 0 ? uploads[0].file.type : resource?.filetype,
      parentId,
      quiz: localQuiz,
    };
    
    const endpoint = isEditing ? `/api/resources/${resource!.id}` : '/api/resources';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el recurso.');
        }
        toast({ title: '¡Éxito!', description: `Recurso ${isEditing ? 'actualizado' : 'creado'}.` });
        onSave();
        onClose();
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredProcesses = allProcesses.filter((p: any) => p.name.toLowerCase().includes(processSearch.toLowerCase()));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-4xl p-0 gap-0 rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{resource ? 'Editar Recurso' : 'Nuevo Recurso'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue={initialStep} className="flex-1 min-h-0 flex flex-col">
            <div className="px-6 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">1. Contenido</TabsTrigger>
                    <TabsTrigger value="config">2. Configuración</TabsTrigger>
                    <TabsTrigger value="quiz">3. Quiz</TabsTrigger>
                </TabsList>
            </div>
            <form id="resource-form" onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
                <ScrollArea className="flex-1 min-h-0">
                    <div className="px-6 py-4">
                        <TabsContent value="content" className="space-y-4 mt-0">
                             <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoComplete="off" /></div>
                             <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Un resumen breve del contenido..."/></div>
                            <Separator />
                            <div className="space-y-4">
                                {!isEditing && (
                                    <RadioGroup value={resourceType} onValueChange={(v: AppResourceType['type']) => setResourceType(v)} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <Label htmlFor="type-document" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer ${resourceType === 'DOCUMENT' ? 'border-primary' : 'border-muted'}`}><UploadCloud className="mb-1"/>Subir Archivo</Label><RadioGroupItem value="DOCUMENT" id="type-document" className="sr-only" />
                                        <Label htmlFor="type-link" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer ${resourceType === 'EXTERNAL_LINK' ? 'border-primary' : 'border-muted'}`}><LinkIcon className="mb-1"/>Enlace Externo</Label><RadioGroupItem value="EXTERNAL_LINK" id="type-link" className="sr-only" />
                                        <Label htmlFor="type-editable" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer ${resourceType === 'DOCUMENTO_EDITABLE' ? 'border-primary' : 'border-muted'}`}><FilePen className="mb-1"/>Doc. Editable</Label><RadioGroupItem value="DOCUMENTO_EDITABLE" id="type-editable" className="sr-only" />
                                    </RadioGroup>
                                )}
                                <AnimatePresence>
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    {resourceType === 'DOCUMENT' && !isEditing && <p className="text-sm text-muted-foreground mb-2">Sube un archivo. Para reemplazar uno existente, edita el recurso.</p>}
                                    {resourceType === 'EXTERNAL_LINK' && <div className="space-y-1.5"><Label htmlFor="external-link">URL del Enlace</Label><Input id="external-link" type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://ejemplo.com"/></div>}
                                    {resourceType === 'DOCUMENTO_EDITABLE' && <div className="space-y-1.5"><Label>Contenido del Documento</Label><RichTextEditor value={content} onChange={setContent} className="h-48" /></div>}
                                </motion.div>
                                </AnimatePresence>
                            </div>
                        </TabsContent>
                        <TabsContent value="config" className="space-y-6 mt-0">
                           <Card>
                             <CardHeader><CardTitle className="text-base">Detalles Adicionales</CardTitle></CardHeader>
                             <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="category"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                                <div className="space-y-1.5"><Label>Expiración (Opcional)</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{expiresAt ? format(expiresAt, "PPP", {locale: es}) : <span>Sin fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus /></PopoverContent></Popover></div>
                            </CardContent>
                           </Card>
                           <Card>
                                <CardHeader><CardTitle className="text-base">Visibilidad</CardTitle></CardHeader>
                                <CardContent>
                                    <RadioGroup value={sharingMode} onValueChange={(v: ResourceSharingMode) => setSharingMode(v)} className="grid grid-cols-3 gap-3">
                                        <Label htmlFor="share-public" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer text-sm transition-colors ${sharingMode === 'PUBLIC' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Globe className="mb-1 h-5 w-5"/>Público</Label><RadioGroupItem value="PUBLIC" id="share-public" className="sr-only" />
                                        <Label htmlFor="share-process" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer text-sm transition-colors ${sharingMode === 'PROCESS' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Briefcase className="mb-1 h-5 w-5"/>Por Proceso</Label><RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/>
                                        <Label htmlFor="share-private" className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer text-sm transition-colors ${sharingMode === 'PRIVATE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Users className="mb-1 h-5 w-5"/>Privado</Label><RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/>
                                    </RadioGroup>
                                    <AnimatePresence>
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                                            {sharingMode === 'PROCESS' && (
                                                <div className="space-y-1.5"><Label>Seleccionar Procesos</Label><Input placeholder="Buscar procesos..." value={processSearch} onChange={e => setProcessSearch(e.target.value)} className="mb-2"/><ScrollArea className="h-32 border rounded-md p-2">{filteredProcesses.map((p: FlatProcess) => (<div key={p.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`share-process-${p.id}`} checked={sharedWithProcessIds.includes(p.id)} onCheckedChange={(c) => setSharedWithProcessIds(prev => c ? [...prev, p.id] : prev.filter(id => id !== p.id))} /><Label htmlFor={`share-process-${p.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm" style={{ paddingLeft: `${p.level * 1}rem`}}>{p.name}</Label></div>))}</ScrollArea></div>
                                            )}
                                            {sharingMode === 'PRIVATE' && (
                                                <div className="space-y-1.5"><Label>Seleccionar Usuarios</Label><Input placeholder="Buscar usuarios..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/><ScrollArea className="h-32 border rounded-md p-2">{filteredUsers.map(u => (<div key={u.id} className="flex items-center space-x-3 py-1.5"><Checkbox id={`share-user-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={(c) => setSharedWithUserIds(prev => c ? [...prev, u.id] : prev.filter(id => id !== u.id))} /><Label htmlFor={`share-user-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm"><Avatar className="h-6 w-6"><AvatarImage src={u.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>{u.name}</Label></div>))}</ScrollArea></div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </CardContent>
                           </Card>
                        </TabsContent>
                        <TabsContent value="quiz" className="mt-0">
                            {localQuiz ? (
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                    <QuizGameView form={{...localQuiz, fields: localQuiz.questions.map(q => ({...q, label: q.text})) }} isEditorPreview={true} />
                                    <Button variant="secondary" onClick={() => setIsQuizEditorOpen(true)} className="w-full">
                                        <Edit className="mr-2 h-4 w-4" /> Editar Preguntas del Quiz
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                                    <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
                                    <h4 className="font-semibold text-lg">Añadir Evaluación</h4>
                                    <p className="text-sm text-muted-foreground mb-4">Convierte este recurso en una experiencia interactiva añadiendo un quiz.</p>
                                    <Button onClick={() => setLocalQuiz({ id: 'new-quiz', title: `Evaluación de ${title}`, questions: [] })}>
                                        <PlusCircle className="mr-2 h-4 w-4"/> Crear Quiz
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" form="resource-form" disabled={isSubmitting || !title}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Save className="mr-2 h-4 w-4" />
                        {isEditing ? 'Guardar Cambios' : 'Crear Recurso'}
                    </Button>
                </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {localQuiz && isQuizEditorOpen && (
        <QuizEditorModal 
          isOpen={isQuizEditorOpen} 
          onClose={() => setIsQuizEditorOpen(false)}
          quiz={localQuiz}
          onSave={(updatedQuiz) => { setLocalQuiz(updatedQuiz); setIsDirty(true); setIsQuizEditorOpen(false); }}
        />
      )}
    </>
  );
}
