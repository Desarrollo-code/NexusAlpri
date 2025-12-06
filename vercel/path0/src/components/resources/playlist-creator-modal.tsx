// src/components/resources/playlist-creator-modal.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, FolderPlus, Video, XCircle, Trash2, Edit, Save, Globe, Users, Briefcase, MoreVertical, UploadCloud } from 'lucide-react';
import type { AppResourceType, User as AppUser, Process, ResourceSharingMode } from '@/types';
import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileIcon } from '../ui/file-icon';
import { UploadArea } from '../ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';

const generateUniqueId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const SortableVideoItem = ({ video, onRemove }: { video: { id: string, title: string, url: string }, onRemove: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: video.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const youtubeId = getYoutubeVideoId(video.url);
    const fileExtension = youtubeId ? 'youtube' : (video.url?.split('.').pop() || 'file');

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="p-2 bg-card border rounded-lg flex items-center gap-3">
             <div {...listeners} className="cursor-grab p-1">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="w-20 h-12 flex-shrink-0 bg-muted rounded-md overflow-hidden relative">
                <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={video.url} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate">{video.title}</p>
                 <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary truncate">{video.title}</a>
            </div>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
                <Trash2 className="h-4 w-4"/>
            </Button>
        </div>
    );
};


interface PlaylistCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
    onSave: () => void;
    playlistToEdit?: AppResourceType & { children?: AppResourceType[] } | null;
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}


export function PlaylistCreatorModal({ isOpen, onClose, parentId, onSave, playlistToEdit }: PlaylistCreatorModalProps) {
    const { toast } = useToast();
    const { user, settings } = useAuth();
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [videos, setVideos] = useState<{id: string, title: string, url: string}[]>([]);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    
    // Permissions state
    const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
    const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
    const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    
    // API data
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [allProcesses, setAllProcesses] = useState<Process[]>([]);

    const [isFetchingInfo, setIsFetchingInfo] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const isEditing = !!playlistToEdit;
    
    const flattenProcesses = (processList: Process[], level = 0): FlatProcess[] => {
      let list: FlatProcess[] = [];
      processList.forEach(p => {
        list.push({ id: p.id, name: p.name, level });
        if (p.children && p.children.length > 0) {
          list.push(...flattenProcesses(p.children, level + 1));
        }
      });
      return list;
    };
    const flattenedProcesses = flattenProcesses(allProcesses);


    useEffect(() => {
        if (isOpen) {
             if (isEditing && playlistToEdit) {
                setTitle(playlistToEdit.title);
                setDescription(playlistToEdit.description || '');
                setCategory(playlistToEdit.category || (settings?.resourceCategories[0] || 'General'));
                setVideos(playlistToEdit.children?.map(c => ({ id: c.id, title: c.title, url: c.url || '' })) || []);
                setSharingMode(playlistToEdit.sharingMode);
                setSharedWithUserIds(playlistToEdit.sharedWith?.map(u => u.id) || []);
                setSharedWithProcessIds(playlistToEdit.sharedWithProcesses?.map(p => p.id) || []);
                setCollaboratorIds(playlistToEdit.collaborators?.map(u => u.id) || []);
             } else {
                setTitle('');
                setDescription('');
                setCategory(settings?.resourceCategories[0] || 'General');
                setVideos([]);
                setSharingMode('PUBLIC');
                setSharedWithUserIds([]);
                setSharedWithProcessIds([]);
                setCollaboratorIds([]);
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
    }, [playlistToEdit, isOpen, isEditing, user, settings]);
    
    const handleAddYoutubeVideo = async () => {
        if (!newVideoUrl.trim()) return;
        const videoId = getYoutubeVideoId(newVideoUrl);
        if (!videoId) {
            toast({ title: 'URL Inválida', description: 'Por favor, ingresa una URL de YouTube válida.', variant: 'destructive'});
            return;
        }
        setIsFetchingInfo(true);
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!response.ok) throw new Error('No se pudo obtener la información del video.');
            const data = await response.json();
            setVideos(prev => [...prev, { id: generateUniqueId('vid'), title: data.title, url: newVideoUrl }]);
            setNewVideoUrl('');
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        } finally {
            setIsFetchingInfo(false);
        }
    }
    
    const handleLocalVideoUpload = async (file: File | null) => {
        if (!file) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadWithProgress('/api/upload/resource-file', file, setUploadProgress);
            setVideos(prev => [...prev, { id: generateUniqueId('vid'), title: file.name, url: result.url }]);
            toast({ title: "Video Subido", description: `${file.name} se ha añadido a la lista.` });
        } catch(err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    }
    
    const handleRemoveVideo = (idToRemove: string) => {
        setVideos(prev => prev.filter(v => v.id !== idToRemove));
    }
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setVideos((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const endpoint = isEditing ? `/api/resources/${playlistToEdit.id}` : '/api/resources';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                title, description, category, parentId,
                type: 'VIDEO_PLAYLIST', videos,
                sharingMode, sharedWithUserIds, sharedWithProcessIds, collaboratorIds
            };

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'No se pudo guardar la lista.');
            
            toast({ title: '¡Éxito!', description: `Lista de videos ${isEditing ? 'actualizada' : 'creada'}.` });
            onSave();
            onClose();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:max-w-4xl p-0 gap-0 rounded-2xl h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{isEditing ? 'Editar Lista de Videos' : 'Crear Nueva Lista de Videos'}</DialogTitle>
                     <DialogDescription>
                        Agrupa videos en una secuencia ordenada para crear un micro-curso.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        <form id="playlist-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 px-6 py-4">
                            {/* Columna Izquierda: Detalles e Hijos */}
                            <div className="space-y-4">
                                <div className="space-y-1"><Label htmlFor="title">Título de la Lista</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                                <div className="space-y-1"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
                                <div className="space-y-1"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory} required><SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Añadir Videos</Label>
                                    <div className="flex gap-2">
                                        <Input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="Pega una URL de YouTube..."/>
                                        <Button type="button" variant="outline" onClick={handleAddYoutubeVideo} disabled={isFetchingInfo}>{isFetchingInfo ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Añadir'}</Button>
                                    </div>
                                    <div className="relative flex items-center justify-center">
                                       <div className="flex-grow border-t"></div>
                                       <span className="flex-shrink mx-4 text-xs text-muted-foreground">O</span>
                                       <div className="flex-grow border-t"></div>
                                    </div>
                                    <UploadArea onFileSelect={(files) => files && handleLocalVideoUpload(files[0])} disabled={isUploading} className="h-20">
                                         <div className="text-center text-muted-foreground"><UploadCloud className="mx-auto h-6 w-6 mb-1"/><p className="text-sm font-semibold">Subir video local</p></div>
                                    </UploadArea>
                                    {isUploading && <Progress value={uploadProgress} className="h-1"/>}
                                    <div className="h-64 border rounded-lg p-2 bg-muted/50">
                                       <ScrollArea className="h-full pr-3">
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
                                                <div className="space-y-2">
                                                {videos.map((video) => (
                                                    <SortableVideoItem key={video.id} video={video} onRemove={() => handleRemoveVideo(video.id)} />
                                                ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                       </ScrollArea>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Permisos */}
                            <div className="space-y-4">
                               <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary"/>Visibilidad</CardTitle></CardHeader><CardContent><RadioGroup value={sharingMode} onValueChange={(v) => setSharingMode(v as ResourceSharingMode)} className="grid grid-cols-1 sm:grid-cols-3 gap-2"><RadioGroupItem value="PUBLIC" id="share-public" className="sr-only" /><Label htmlFor="share-public" className={`flex flex-col items-center justify-center p-3 text-center border-2 rounded-lg cursor-pointer ${sharingMode === 'PUBLIC' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Globe className={`mb-1 h-5 w-5 ${sharingMode === 'PUBLIC' ? 'text-primary' : 'text-muted-foreground'}`}/><span className="text-xs font-semibold">Público</span></Label><RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/><Label htmlFor="share-process" className={`flex flex-col items-center justify-center p-3 text-center border-2 rounded-lg cursor-pointer ${sharingMode === 'PROCESS' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Briefcase className={`mb-1 h-5 w-5 ${sharingMode === 'PROCESS' ? 'text-primary' : 'text-muted-foreground'}`}/><span className="text-xs font-semibold">Por Proceso</span></Label><RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/><Label htmlFor="share-private" className={`flex flex-col items-center justify-center p-3 text-center border-2 rounded-lg cursor-pointer ${sharingMode === 'PRIVATE' ? 'border-primary ring-2 ring-primary/50' : 'border-muted hover:border-primary/50'}`}><Users className={`mb-1 h-5 w-5 ${sharingMode === 'PRIVATE' ? 'text-primary' : 'text-muted-foreground'}`}/><span className="text-xs font-semibold">Privado</span></Label></RadioGroup>
                                   {sharingMode === 'PROCESS' && (<UserOrProcessList type="process" items={flattenedProcesses} selectedIds={sharedWithProcessIds} onSelectionChange={setSharedWithProcessIds} />)}
                                   {sharingMode === 'PRIVATE' && (<UserOrProcessList type="user" items={allUsers} selectedIds={sharedWithUserIds} onSelectionChange={setSharedWithUserIds} />)}
                               </CardContent></Card>
                               <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Edit className="h-4 w-4 text-primary"/>Colaboradores</CardTitle><CardDescription className="text-xs">Permite a otros instructores o administradores editar esta lista de reproducción.</CardDescription></CardHeader><CardContent><UserOrProcessList type="user" items={allUsers.filter(u => u.role !== 'STUDENT')} selectedIds={collaboratorIds} onSelectionChange={setCollaboratorIds} /></CardContent></Card>
                            </div>
                        </form>
                    </ScrollArea>
                </div>
                
                 <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" form="playlist-form" disabled={isSaving || !title.trim() || videos.length === 0}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        {isEditing ? 'Guardar Cambios' : 'Crear Lista'}
                    </Button>
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
        <div className="mt-4 border rounded-lg p-3">
             <Input placeholder={`Buscar ${type === 'user' ? 'usuario' : 'proceso'}...`} value={search} onChange={e => setSearch(e.target.value)} className="mb-2"/>
             <ScrollArea className="h-32">
                <div className="space-y-1 pr-3">
                    {filteredItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                            <Checkbox id={`${type}-${item.id}`} checked={selectedIds.includes(item.id)} onCheckedChange={(c) => handleSelection(item.id, !!c)}/>
                            <Label htmlFor={`${type}-${item.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm">
                                {type === 'user' && <Avatar className="h-7 w-7"><AvatarImage src={item.avatar || undefined} /><AvatarFallback><Identicon userId={item.id}/></AvatarFallback></Avatar>}
                                <span style={{ paddingLeft: `${(item.level || 0) * 1.5}rem` }}>{item.name}</span>
                            </Label>
                        </div>
                    ))}
                </div>
             </ScrollArea>
        </div>
    );
};
