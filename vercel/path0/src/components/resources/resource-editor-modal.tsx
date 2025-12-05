// src/components/resources/resource-editor-modal.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Loader2, Save, FileUp, Link as LinkIcon, FilePenLine, ArrowLeft, ArrowRight, UploadCloud, Info, Globe, Users, Briefcase } from 'lucide-react';
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
import { getFileTypeDetails } from '@/lib/resource-utils';
import { formatFileSize } from '@/lib/utils';
import { Alert, AlertDescription } from '../ui/alert';
import { QuizViewer } from '../quiz-viewer';
import { QuizEditorModal } from '../quizz-it/quiz-editor-modal';
import type { AppQuiz } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TOTAL_STEPS = 3;

interface ResourceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: AppResourceType | null;
  parentId: string | null;
  onSave: () => void;
  initialStep?: 'content' | 'config' | 'quiz';
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}

export function ResourceEditorModal({ isOpen, onClose, resource, parentId, onSave, initialStep = 'content' }: ResourceEditorModalProps) {
    const { toast } = useToast();
    const { user, settings } = useAuth();
    
    // Step management
    const [activeTab, setActiveTab] = useState(initialStep);
    
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
        setActiveTab(initialStep);
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
    }, [settings?.resourceCategories, initialStep]);
    
    useEffect(() => {
        if (isOpen) {
            if (isEditing && resource) {
                setTitle(resource.title || '');
                setDescription(resource.description || '');
                setCategory(resource.category || settings?.resourceCategories[0] || 'General');
                setResourceType(resource.type);
                setSharingMode(resource.sharingMode);
                setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
                setSharedWithProcessIds(resource.sharedWithProcesses?.map(p => p.id) || []);
                
                if (resource.type === 'EXTERNAL_LINK') setExternalLink(resource.url || '');
                if (resource.type === 'DOCUMENTO_EDITABLE') setEditableContent(resource.content || '');
                if (resource.type === 'DOCUMENT' && resource.url) {
                    setUpload({ url: resource.url, file: { name: resource.title, type: resource.filetype, size: resource.size }});
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
    }, [isEditing, resource, isOpen, resetForm, settings, user]);

    
     const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let url: string | undefined = undefined;
            let fileType: string | undefined = undefined;
            let size: number | undefined = undefined;

            if(resourceType === 'EXTERNAL_LINK') url = externalLink;
            if(resourceType === 'DOCUMENT' && upload) {
                url = upload.url;
                fileType = upload.file.type;
                size = upload.file.size;
            }

            const payload: any = {
                title, description, category, type: resourceType, url, filetype: fileType, size,
                content: resourceType === 'DOCUMENTO_EDITABLE' ? editableContent : null,
                sharingMode,
                sharedWithUserIds: sharingMode === 'PRIVATE' ? sharedWithUserIds : [],
                sharedWithProcessIds: sharingMode === 'PROCESS' ? sharedWithProcessIds : [],
                parentId,
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:max-w-4xl p-0 gap-0 rounded-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{isEditing ? 'Editar Recurso' : 'Nuevo Recurso'}</DialogTitle>
                </DialogHeader>
                <form id="resource-form" onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
                        <div className="px-6 flex-shrink-0">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="content">1. Contenido</TabsTrigger>
                                <TabsTrigger value="config">2. Configuración</TabsTrigger>
                                <TabsTrigger value="quiz">3. Quiz</TabsTrigger>
                            </TabsList>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="px-6 py-4">
                                <TabsContent value="content" className="space-y-4 mt-0">
                                   {/* Contenido del Paso 1 (Content) */}
                                </TabsContent>
                                <TabsContent value="config" className="space-y-6 mt-0">
                                   {/* Contenido del Paso 2 (Config) */}
                                </TabsContent>
                                <TabsContent value="quiz" className="mt-0">
                                   {/* Contenido del Paso 3 (Quiz) */}
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                    <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
                        <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" form="resource-form" disabled={isSaving || !title}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {isEditing ? 'Guardar Cambios' : 'Crear Recurso'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Los componentes de los pasos (Step1, Step2, Step3) y UserOrProcessList se mantendrían igual.

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
                                <Label htmlFor={`${type}-${item.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm">
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
