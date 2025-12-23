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
import { Loader2, FolderPlus, Video, XCircle, Trash2, Edit, Save, Globe, Users, Briefcase, MoreVertical, UploadCloud, BrainCircuit, PlusCircle } from 'lucide-react';
import type { AppResourceType, User as AppUser, Process, ResourceSharingMode, Quiz as AppQuiz, Quiz as PrismaQuiz } from '@/types';
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
import { FileIcon } from '@/components/ui/file-icon';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { QuizEditorModal } from '@/components/quizz-it/quiz-editor-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const generateUniqueId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface ContentBlock {
    id: string;
    type: 'VIDEO' | 'QUIZ';
    title: string;
    url?: string; // Para videos
    quiz?: AppQuiz; // Para quizzes
}


const SortableItem = ({ block, onRemove }: { block: ContentBlock, onRemove: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const isVideo = block.type === 'VIDEO';
    const youtubeId = isVideo ? getYoutubeVideoId(block.url) : null;
    const fileExtension = youtubeId ? 'youtube' : (block.url?.split('.').pop() || 'file');

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="p-2 bg-card border rounded-lg flex items-center gap-2 touch-none">
            <div {...listeners} className="cursor-grab p-1">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="w-20 h-12 flex-shrink-0 bg-muted rounded-md overflow-hidden relative">
                {isVideo ? (
                    <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={block.url} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary"><BrainCircuit className="h-6 w-6" /></div>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate">{block.title}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
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

    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [uploads, setUploads] = useState<any[]>([]);

    const [quizToEdit, setQuizToEdit] = useState<AppQuiz | null>(null);
    const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);

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
                const videoBlocks: ContentBlock[] = (playlistToEdit.children || [])
                    .map(c => ({ id: c.id, type: 'VIDEO', title: c.title, url: c.url || '' }));
                const quizBlock = playlistToEdit.quiz ? [{ id: `quiz-${playlistToEdit.quiz.id}`, type: 'QUIZ' as const, title: playlistToEdit.quiz.title, quiz: playlistToEdit.quiz }] : [];
                setContentBlocks([...videoBlocks, ...quizBlock]);

                setSharingMode(playlistToEdit.sharingMode);
                setSharedWithUserIds(playlistToEdit.sharedWith?.map(u => u.id) || []);
                setSharedWithProcessIds(playlistToEdit.sharedWithProcesses?.map(p => p.id) || []);
                setCollaboratorIds(playlistToEdit.collaborators?.map(u => u.id) || []);
            } else {
                setTitle('');
                setDescription('');
                setCategory(settings?.resourceCategories[0] || 'General');
                setContentBlocks([]);
                setSharingMode('PUBLIC');
                setSharedWithUserIds([]);
                setSharedWithProcessIds([]);
                setCollaboratorIds([]);
            }
            setUploads([]);

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
            toast({ title: 'URL Inválida', description: 'Por favor, ingresa una URL de YouTube válida.', variant: 'destructive' });
            return;
        }
        setIsFetchingInfo(true);
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!response.ok) throw new Error('No se pudo obtener la información del video.');
            const data = await response.json();
            const newVideoBlock: ContentBlock = { id: generateUniqueId('vid'), type: 'VIDEO', title: data.title, url: newVideoUrl };
            setContentBlocks(prev => [...prev, newVideoBlock]);
            setNewVideoUrl('');
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsFetchingInfo(false);
        }
    }

    const handleFileUpload = async (file: File) => {
        const newUpload = {
            id: `upload-${file.name}-${Date.now()}`,
            file,
            progress: 0,
            error: null,
        };
        setUploads(prev => [...prev, newUpload]);

        try {
            const result = await uploadWithProgress('/api/upload/resource-file', file, (progress) => {
                setUploads(prev => prev.map(up => up.id === newUpload.id ? { ...up, progress } : up));
            });
            const newVideoBlock: ContentBlock = { id: generateUniqueId('vid'), type: 'VIDEO', title: file.name, url: result.url };
            setContentBlocks(prev => [...prev, newVideoBlock]);
            setUploads(prev => prev.filter(up => up.id !== newUpload.id));
        } catch (err) {
            setUploads(prev => prev.map(up => up.id === newUpload.id ? { ...up, error: (err as Error).message, progress: 100 } : up));
            toast({ title: "Error de subida", description: (err as Error).message, variant: 'destructive' });
        }
    };

    const handleRemoveBlock = (idToRemove: string) => {
        setContentBlocks(prev => prev.filter(v => v.id !== idToRemove));
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setContentBlocks((items) => {
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
        const videosToSave = contentBlocks.filter(b => b.type === 'VIDEO');
        const quizToSave = contentBlocks.find(b => b.type === 'QUIZ')?.quiz || null;

        try {
            const endpoint = isEditing ? `/api/resources/${playlistToEdit!.id}` : '/api/resources';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                title, description, category, parentId,
                type: 'VIDEO_PLAYLIST',
                videos: videosToSave.map(v => ({ id: v.id, title: v.title, url: v.url })),
                quiz: quizToSave,
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

    const handleSaveQuiz = (updatedQuiz: AppQuiz) => {
        const quizExists = contentBlocks.some(b => b.type === 'QUIZ');

        if (quizExists) {
            setContentBlocks(prev => prev.map(block =>
                block.type === 'QUIZ' ? { ...block, title: updatedQuiz.title, quiz: updatedQuiz } : block
            ));
        } else {
            const newQuizBlock: ContentBlock = { id: `quiz-${updatedQuiz.id}`, type: 'QUIZ', title: updatedQuiz.title, quiz: updatedQuiz };
            setContentBlocks(prev => [...prev, newQuizBlock]);
        }

        setIsQuizEditorOpen(false);
        toast({ description: "Quiz actualizado. Recuerda guardar los cambios de la lista." });
    };

    const handleEditQuiz = () => {
        const existingQuiz = contentBlocks.find(b => b.type === 'QUIZ')?.quiz;
        setQuizToEdit(existingQuiz || {
            id: generateUniqueId('quiz'),
            title: `Evaluación de ${title || 'la lista'}`,
            questions: [],
            maxAttempts: null,
        });
        setIsQuizEditorOpen(true);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[95vw] sm:max-w-3xl p-0 gap-0 rounded-2xl h-[90vh] flex flex-col">
                    <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle>{isEditing ? 'Editar Lista de Videos' : 'Crear Nueva Lista de Videos'}</DialogTitle>
                        <DialogDescription>
                            Agrupa videos en una secuencia ordenada para crear un micro-curso.
                        </DialogDescription>
                    </DialogHeader>

                    <form id="playlist-form" onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                        <Tabs defaultValue="content" className="flex-1 min-h-0 flex flex-col">
                            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-3">
                                <TabsTrigger value="main">Información</TabsTrigger>
                                <TabsTrigger value="content">Contenido</TabsTrigger>
                                <TabsTrigger value="access">Acceso</TabsTrigger>
                            </TabsList>
                            <div className="flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    <div className="px-6 py-4">
                                        <TabsContent value="main" className="space-y-6 m-0">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Información General</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-1"><Label htmlFor="title">Título de la Lista</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                                                    <div className="space-y-1"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
                                                    <div className="space-y-1"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory} required><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="content" className="space-y-6 m-0">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Añadir Videos</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center gap-2">
                                                        <Input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="Pega una URL de YouTube..." className="h-10" />
                                                        <Button type="button" variant="outline" size="icon" onClick={handleAddYoutubeVideo} disabled={isFetchingInfo} className="h-10 w-10 shrink-0">{isFetchingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}</Button>
                                                        <UploadArea onFileSelect={(files) => files && handleFileUpload(files[0])} disabled={isSaving} className="h-10 w-10 p-0 shrink-0">
                                                            <UploadCloud className="h-5 w-5" />
                                                        </UploadArea>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Contenido de la Lista</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ScrollArea className="h-72 pr-3 border rounded-lg bg-muted/50 p-2">
                                                        <div className="space-y-2">
                                                            {uploads.map(up => (
                                                                <div key={up.id} className="p-2 border rounded-md bg-background relative">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileIcon displayMode="list" type={up.file.type.split('/')[1]} />
                                                                        <span className="text-xs font-medium truncate">{up.file.name}</span>
                                                                    </div>
                                                                    <Progress value={up.progress} className="h-1 mt-1" />
                                                                </div>
                                                            ))}
                                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                                                <SortableContext items={contentBlocks.map(v => v.id)} strategy={verticalListSortingStrategy}>
                                                                    {contentBlocks.map((block) => (
                                                                        <SortableItem key={block.id} block={block} onRemove={() => handleRemoveBlock(block.id)} />
                                                                    ))}
                                                                </SortableContext>
                                                            </DndContext>
                                                            {contentBlocks.length === 0 && uploads.length === 0 && (
                                                                <div className="text-center text-muted-foreground text-sm py-12">La lista está vacía.</div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader><CardTitle className="text-base">Evaluación Final (Opcional)</CardTitle></CardHeader>
                                                <CardContent>
                                                    <Button className="w-full" variant="outline" type="button" onClick={handleEditQuiz}>
                                                        {contentBlocks.some(b => b.type === 'QUIZ') ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                                        {contentBlocks.some(b => b.type === 'QUIZ') ? 'Editar Quiz' : 'Añadir Quiz'}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="access" className="space-y-6 m-0">
                                            <Card>
                                                <CardHeader><CardTitle className="text-base">Visibilidad</CardTitle></CardHeader>
                                                <CardContent>
                                                    <RadioGroup value={sharingMode} onValueChange={(v) => setSharingMode(v as ResourceSharingMode)} className="grid grid-cols-1 gap-2">
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="PUBLIC" id="share-public" /><Label htmlFor="share-public">Público</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="PROCESS" id="share-process" /><Label htmlFor="share-process">Por Proceso</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="PRIVATE" id="share-private" /><Label htmlFor="share-private">Privado</Label></div>
                                                    </RadioGroup>
                                                    {sharingMode === 'PROCESS' && (<UserOrProcessList type="process" items={flattenedProcesses} selectedIds={sharedWithProcessIds} onSelectionChange={setSharedWithProcessIds} />)}
                                                    {sharingMode === 'PRIVATE' && (<UserOrProcessList type="user" items={allUsers} selectedIds={sharedWithUserIds} onSelectionChange={setSharedWithUserIds} />)}
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Edit className="h-4 w-4 text-primary" />Colaboradores</CardTitle><CardDescription className="text-xs">Permite a otros instructores o administradores editar esta lista.</CardDescription></CardHeader>
                                                <CardContent><UserOrProcessList type="user" items={allUsers.filter(u => u.role !== 'STUDENT')} selectedIds={collaboratorIds} onSelectionChange={setCollaboratorIds} /></CardContent>
                                            </Card>
                                        </TabsContent>
                                    </div>
                                </ScrollArea>
                            </div>
                        </Tabs>
                        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-end gap-2 bg-background">
                            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                            <Button type="submit" form="playlist-form" disabled={isSaving || !title.trim() || contentBlocks.filter(b => b.type === 'VIDEO').length === 0}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isEditing ? 'Guardar Cambios' : 'Crear Lista'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {isQuizEditorOpen && (
                <QuizEditorModal
                    isOpen={isQuizEditorOpen}
                    onClose={() => setIsQuizEditorOpen(false)}
                    quiz={contentBlocks.find(b => b.type === 'QUIZ')?.quiz || {
                        id: `new-quiz-${Date.now()}`,
                        title: `Evaluación de ${title || 'la lista'}`,
                        questions: [],
                        maxAttempts: null,
                    }}
                    onSave={handleSaveQuiz}
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
                                <Checkbox id={`${type}-${item.id}`} checked={selectedIds.includes(item.id)} onCheckedChange={(c) => handleSelection(item.id, !!c)} />
                                <Label htmlFor={`${type}-${item.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm">
                                    {type === 'user' && <Avatar className="h-7 w-7"><AvatarImage src={item.avatar || undefined} /><AvatarFallback><Identicon userId={item.id} /></AvatarFallback></Avatar>}
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
