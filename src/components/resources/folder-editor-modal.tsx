'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Loader2, Save, Folder as FolderIcon, BrainCircuit, PlusCircle, Edit, Sparkles } from 'lucide-react';
import type { AppResourceType, User as AppUser, Process, ResourceSharingMode, Quiz as AppQuiz } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderContentView } from './folder-content-view';
import { QuizEditorModal } from '@/components/quizz-it/quiz-editor-modal';
import { ResourcePermissions } from './shared/resource-permissions';
import { FolderBanner } from './folder-banner';

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
    const [titleError, setTitleError] = useState<string | null>(null);
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

    const [quiz, setQuiz] = useState<AppQuiz | null>(null);
    const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

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
                setQuiz(folderToEdit.quiz || null);

                // Load content
                setIsLoadingContent(true);
                fetch(`/api/resources?parentId=${folderToEdit.id}`)
                    .then(res => res.json())
                    .then(data => setFolderContent(data.resources || []))
                    .catch(console.error)
                    .finally(() => setIsLoadingContent(false));

                setActiveTab('info');
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
                setQuiz(null);
                setActiveTab('info');
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

    // Title validation function
    const validateTitle = (value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return "El título no puede estar vacío";
        if (trimmed.length < 2) return "El título debe tener al menos 2 caracteres";
        if (!/[a-zA-Z0-9]/.test(trimmed)) return "El título debe contener al menos una letra o número";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateTitle(title);
        if (error) {
            setTitleError(error);
            toast({ title: 'Validación fallida', description: error, variant: 'destructive' });
            return;
        }

        setIsSaving(true);

        try {
            const endpoint = isEditing ? `/api/resources/${folderToEdit!.id}` : '/api/resources';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                title, description, category, parentId,
                type: 'FOLDER',
                tags: tags.join(','),
                sharingMode, sharedWithUserIds, sharedWithProcessIds, collaboratorIds,
                quiz
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

    // Live preview mock object
    const previewFolder = {
        id: folderToEdit?.id || 'preview-id',
        title: title || 'Título de Carpeta',
        description: description || 'Descripción de la carpeta...',
        uploadDate: new Date().toISOString(),
        uploaderName: user?.name,
    } as any;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:max-w-4xl p-0 gap-0 rounded-2xl h-[90vh] flex flex-col bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0 bg-background/50">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <FolderIcon className="h-6 w-6 text-primary" />
                        </div>
                        {isEditing ? 'Editar Carpeta' : 'Nueva Carpeta'}
                    </DialogTitle>
                </DialogHeader>

                <form id="folder-form" onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
                        <div className="px-6 pt-4 flex-shrink-0">
                            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
                                <TabsTrigger value="info" className="rounded-lg">Información</TabsTrigger>
                                <TabsTrigger value="content" disabled={!isEditing} className="rounded-lg">Contenido</TabsTrigger>
                                <TabsTrigger value="access" className="rounded-lg">Permisos</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 min-h-0">
                            <ScrollArea className="h-full">
                                <div className="p-6 space-y-6">
                                    <TabsContent value="info" className="space-y-6 m-0 focus-visible:ring-0">
                                        {/* Preview Banner */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Vista Previa de Cabecera</Label>
                                            <div className="transform scale-[0.98] origin-center opacity-90 hover:opacity-100 hover:scale-100 transition-all duration-500">
                                                <FolderBanner folder={previewFolder} onEdit={() => { }} canManage={false} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="title" className="text-sm font-semibold">Nombre de la Carpeta</Label>
                                                    <Input
                                                        id="title"
                                                        value={title}
                                                        onChange={(e) => {
                                                            setTitle(e.target.value);
                                                            if (titleError) setTitleError(null);
                                                        }}
                                                        className={cn("h-11 bg-muted/30 focus:bg-background transition-all", titleError && "border-destructive focus-visible:ring-destructive")}
                                                        placeholder="Ej: Documentación Técnica 2024"
                                                        required
                                                    />
                                                    {titleError && <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{titleError}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="category" className="text-sm font-semibold">Categoría</Label>
                                                    <Select value={category} onValueChange={setCategory} required>
                                                        <SelectTrigger className="h-11 bg-muted/30 focus:bg-background">
                                                            <SelectValue placeholder="Selecciona una categoría" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(settings?.resourceCategories || []).map(c => (
                                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold">Etiquetas</Label>
                                                    <div className="p-3 rounded-xl border bg-muted/30 space-y-3">
                                                        <div className="flex flex-wrap gap-2 min-h-[28px]">
                                                            {tags.length === 0 && <span className="text-xs text-muted-foreground italic">Sin etiquetas...</span>}
                                                            {tags.map(tag => (
                                                                <span key={tag} className="bg-background text-foreground shadow-sm px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border animate-in zoom-in-50">
                                                                    {tag}
                                                                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive transition-colors rounded-full p-0.5"><span className="sr-only">Eliminar</span>×</button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Nueva etiqueta..."
                                                                value={tagInput}
                                                                onChange={e => setTagInput(e.target.value)}
                                                                className="h-9 text-sm bg-background"
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                                                                            setTags([...tags, tagInput.trim()]);
                                                                            setTagInput('');
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                onClick={() => {
                                                                    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                                                                        setTags([...tags, tagInput.trim()]);
                                                                        setTagInput('');
                                                                    }
                                                                }}
                                                                size="sm"
                                                                className="h-9 px-3"
                                                            >
                                                                Añadir
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2 h-[150px] flex flex-col">
                                                    <Label htmlFor="description" className="text-sm font-semibold">Descripción</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={description}
                                                        onChange={e => setDescription(e.target.value)}
                                                        className="flex-1 resize-none bg-muted/30 focus:bg-background"
                                                        placeholder="Proporciona contexto sobre el contenido de esta carpeta..."
                                                    />
                                                </div>

                                                <Card className="border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <CardHeader className="p-4 pb-2">
                                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                                            <BrainCircuit className="h-4 w-4" /> Evaluación Rápida
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-4 pt-2">
                                                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                                            Añade un cuestionario opcional para validar el conocimiento adquirido en esta carpeta.
                                                        </p>
                                                        <Button
                                                            className="w-full h-9 text-xs transition-transform active:scale-95"
                                                            variant={quiz ? "default" : "outline"}
                                                            onClick={() => setIsQuizEditorOpen(true)}
                                                            type="button"
                                                        >
                                                            {quiz ? <Edit className="mr-2 h-3.5 w-3.5" /> : <PlusCircle className="mr-2 h-3.5 w-3.5" />}
                                                            {quiz ? `Editar: ${quiz.title}` : 'Crear Cuestionario'}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="content" className="space-y-6 m-0 focus-visible:ring-0">
                                        <div className="flex flex-col gap-4 min-h-[400px]">
                                            <div className="bg-muted/30 rounded-xl p-4 border border-dashed text-center">
                                                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
                                                    <FolderIcon className="h-6 w-6 text-primary" />
                                                </div>
                                                <h3 className="font-semibold text-foreground">Contenido Actual</h3>
                                                <p className="text-sm text-muted-foreground">Gestiona los archivos dentro de <span className="font-medium text-foreground">"{title}"</span></p>
                                            </div>

                                            {isLoadingContent ? (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                                </div>
                                            ) : (
                                                <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex-1">
                                                    {folderContent.length > 0 ? (
                                                        <FolderContentView items={folderContent} onEdit={() => { }} onDelete={() => { }} />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-8">
                                                            <Sparkles className="h-10 w-10 mb-3 opacity-20" />
                                                            <p>Esta carpeta está vacía.</p>
                                                            <p className="text-xs">Sube archivos desde la vista principal.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="access" className="m-0 focus-visible:ring-0">
                                        <ResourcePermissions
                                            sharingMode={sharingMode}
                                            setSharingMode={setSharingMode}
                                            sharedWithUserIds={sharedWithUserIds}
                                            setSharedWithUserIds={setSharedWithUserIds}
                                            sharedWithProcessIds={sharedWithProcessIds}
                                            setSharedWithProcessIds={setSharedWithProcessIds}
                                            collaboratorIds={collaboratorIds}
                                            setCollaboratorIds={setCollaboratorIds}
                                            allUsers={allUsers}
                                            flattenedProcesses={flattenedProcesses}
                                        />
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-between bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {isEditing && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> ID: {folderToEdit?.id.slice(0, 8)}...</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={onClose} disabled={isSaving} className="hover:bg-destructive/10 hover:text-destructive transition-colors">Cancelar</Button>
                                <Button type="submit" form="folder-form" disabled={isSaving || !title.trim()} className="min-w-[140px] shadow-lg shadow-primary/20">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isEditing ? 'Guardar Cambios' : 'Crear Carpeta'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </Tabs>
                </form>
            </DialogContent>

            {isQuizEditorOpen && (
                <QuizEditorWrapper
                    isOpen={isQuizEditorOpen}
                    onClose={() => setIsQuizEditorOpen(false)}
                    quiz={quiz}
                    onSave={setQuiz}
                />
            )}
        </Dialog>
    );
}

function QuizEditorWrapper({ isOpen, onClose, quiz, onSave }: { isOpen: boolean, onClose: () => void, quiz: AppQuiz | null, onSave: (q: AppQuiz) => void }) {
    return (
        <QuizEditorModal
            isOpen={isOpen}
            onClose={onClose}
            quiz={quiz || {
                id: `new-quiz-${Date.now()}`,
                title: 'Evaluación de Carpeta',
                questions: [],
                maxAttempts: null,
            }}
            onSave={(updatedQuiz) => {
                onSave(updatedQuiz);
                onClose();
            }}
        />
    );
}
