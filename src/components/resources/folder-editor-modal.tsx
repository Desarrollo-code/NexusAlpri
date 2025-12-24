'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { Loader2, FolderPlus, Save, Globe, Users, Briefcase, PlusCircle, Edit } from 'lucide-react';
import type { AppResourceType, User as AppUser, Process, ResourceSharingMode } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderContentView } from './folder-content-view';

interface FolderEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
    onSave: () => void;
    folderToEdit?: AppResourceType | null;
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}


export function FolderEditorModal({ isOpen, onClose, parentId, onSave, folderToEdit }: FolderEditorModalProps) {
    const { toast } = useToast();
    const { user, settings } = useAuth();
    const isEditing = !!folderToEdit;

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Permissions state
    const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
    const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
    const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

    // API data
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [allProcesses, setAllProcesses] = useState<Process[]>([]);
    const [folderContent, setFolderContent] = useState<AppResourceType[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const flattenProcesses = (processList: any[], level = 0): FlatProcess[] => {
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
            if (isEditing && folderToEdit) {
                setTitle(folderToEdit.title);
                setDescription(folderToEdit.description || '');
                setCategory(folderToEdit.category || settings?.resourceCategories[0] || 'General');
                setTags(folderToEdit.tags || []);

                setSharingMode(folderToEdit.sharingMode);
                setSharedWithUserIds(folderToEdit.sharedWith?.map(u => u.id) || []);
                setSharedWithProcessIds(folderToEdit.sharedWithProcesses?.map(p => p.id) || []);
                setCollaboratorIds(folderToEdit.collaborators?.map(u => u.id) || []);

                // Load content
                setIsLoadingContent(true);
                fetch(`/api/resources?parentId=${folderToEdit.id}`)
                    .then(res => res.json())
                    .then(data => setFolderContent(data.resources || []))
                    .catch(console.error)
                    .finally(() => setIsLoadingContent(false));

            } else {
                setTitle('');
                setDescription('');
                setCategory(settings?.resourceCategories[0] || 'General');
                setTags([]);
                setSharingMode('PUBLIC');
                setSharedWithUserIds([]);
                setSharedWithProcessIds([]);
                setCollaboratorIds([]);
                setFolderContent([]);
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
    }, [folderToEdit, isOpen, isEditing, user, settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const endpoint = isEditing ? `/api/resources/${folderToEdit!.id}` : '/api/resources';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                title, description, category, parentId,
                type: 'FOLDER',
                tags: tags.join(','),
                sharingMode, sharedWithUserIds, sharedWithProcessIds, collaboratorIds
            };

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'No se pudo guardar la carpeta.');

            toast({ title: '¡Éxito!', description: `Carpeta ${isEditing ? 'actualizada' : 'creada'}.` });
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
            <DialogContent className="w-[95vw] sm:max-w-3xl p-0 gap-0 rounded-2xl h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{isEditing ? 'Editar Carpeta' : 'Crear Nueva Carpeta'}</DialogTitle>
                    <DialogDescription>
                        Organiza tus recursos.
                    </DialogDescription>
                </DialogHeader>

                <form id="folder-form" onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                    <Tabs defaultValue="main" className="flex-1 min-h-0 flex flex-col">
                        <TabsList className="mx-6 mt-4 grid w-auto grid-cols-3">
                            <TabsTrigger value="main">Información</TabsTrigger>
                            <TabsTrigger value="content" disabled={!isEditing}>Contenido</TabsTrigger>
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
                                                <div className="space-y-1"><Label htmlFor="title">Nombre de la Carpeta</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                                                <div className="space-y-1"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
                                                <div className="space-y-1"><Label htmlFor="category">Categoría</Label><Select value={category} onValueChange={setCategory} required><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                                                <div className="space-y-2">
                                                    <Label>Etiquetas</Label>
                                                    <div className="flex gap-2 mb-2 flex-wrap">
                                                        {tags.map(tag => (
                                                            <span key={tag} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                                                {tag} <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive">×</button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Añadir etiqueta..."
                                                            value={tagInput}
                                                            onChange={e => setTagInput(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(''); } } }}
                                                        />
                                                        <Button type="button" variant="secondary" onClick={() => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(''); } }} size="sm">Añadir</Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    <TabsContent value="content" className="space-y-6 m-0">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Contenido de la Carpeta</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {isLoadingContent ? (
                                                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                                ) : (
                                                    <FolderContentView items={folderContent} onEdit={() => { }} onDelete={() => { }} />
                                                )}
                                                {!isLoadingContent && folderContent.length === 0 && (
                                                    <div className="text-center text-muted-foreground text-sm py-4">Carpeta vacía.</div>
                                                )}
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
                                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Edit className="h-4 w-4 text-primary" />Colaboradores</CardTitle><CardDescription className="text-xs">Permite a otros instructores editar esta carpeta.</CardDescription></CardHeader>
                                            <CardContent><UserOrProcessList type="user" items={allUsers.filter(u => u.role !== 'STUDENT')} selectedIds={collaboratorIds} onSelectionChange={setCollaboratorIds} /></CardContent>
                                        </Card>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </div>
                    </Tabs>
                    <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-end gap-2 bg-background">
                        <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" form="folder-form" disabled={isSaving || !title.trim()}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Guardar Cambios' : 'Crear Carpeta'}
                        </Button>
                    </DialogFooter>
                </form>
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
