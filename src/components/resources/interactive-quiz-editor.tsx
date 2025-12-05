// src/components/resources/interactive-content-studio.tsx
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { AppResourceType, AppQuiz, AppQuestion } from '@/types';
import { Loader2, AlertTriangle, PlayCircle, PlusCircle, Trash2, GripVertical, Save, Video, BrainCircuit, Edit, Folder, ListVideo } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import YouTube from 'react-youtube';
import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea } from '../ui/scroll-area';
import { QuizEditorModal } from '../quizz-it/quiz-editor-modal';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface ContentBlock {
  id: string;
  type: 'VIDEO' | 'QUIZ';
  resource?: AppResourceType;
  quiz?: AppQuiz;
}

const SortableItem = ({ block, onSelect, onDelete, isActive }: {
    block: ContentBlock,
    isActive: boolean,
    onSelect: () => void,
    onDelete: () => void,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const isVideo = block.type === 'VIDEO';
    const title = isVideo ? block.resource?.title : block.quiz?.title;
    const thumbnailUrl = isVideo && block.resource?.url ? `https://img.youtube.com/vi/${getYoutubeVideoId(block.resource.url)}/mqdefault.jpg` : null;

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="touch-none">
            <Card className={cn("p-2 cursor-pointer transition-all", isActive ? 'border-primary ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted')}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-grow min-w-0" onClick={onSelect}>
                        <div {...listeners} className="p-1 cursor-grab">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="relative w-16 h-10 bg-black rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {isVideo && thumbnailUrl ? (
                                <Image src={thumbnailUrl} alt={title || 'video'} fill className="object-cover" />
                            ) : isVideo ? (
                                <Video className="h-6 w-6 text-white"/>
                            ) : (
                                <BrainCircuit className="h-6 w-6 text-primary"/>
                            )}
                        </div>
                        <p className="font-semibold text-sm truncate">{title || (isVideo ? "Video sin título" : "Quiz sin título")}</p>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const VideoPlayer: React.FC<{ resource: AppResourceType | null | undefined }> = ({ resource }) => {
    if (!resource || !resource.url) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center text-muted-foreground">
                <PlayCircle className="h-16 w-16 mb-4"/>
                <p>Selecciona un video para reproducir</p>
            </div>
        );
    }
    
    const youtubeId = getYoutubeVideoId(resource.url);

    if (youtubeId) {
        return (
            <YouTube videoId={youtubeId} className="w-full h-full" iframeClassName="w-full h-full" opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 } }} />
        );
    }

    return <video key={resource.id} src={resource.url} controls autoPlay className="w-full h-full object-contain bg-black" />;
};

export const InteractiveContentStudio: React.FC<{ folderId: string }> = ({ folderId }) => {
    const [playlistInfo, setPlaylistInfo] = useState<{ title: string, description: string } | null>(null);
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [quizToEdit, setQuizToEdit] = useState<AppQuiz | null>(null);
    const [blockToDelete, setBlockToDelete] = useState<ContentBlock | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const { toast } = useToast();
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));
    
    const activeBlock = contentBlocks.find(b => b.id === activeBlockId);
    const existingQuizBlock = contentBlocks.find(b => b.type === 'QUIZ');

    const fetchContent = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const folderRes = await fetch(`/api/resources/${folderId}`);
        if (!folderRes.ok) throw new Error('No se pudo cargar la lista.');
        const folderData: AppResourceType = await folderRes.json();
        setPlaylistInfo({ title: folderData.title, description: folderData.description || '' });

        const childrenRes = await fetch(`/api/resources?parentId=${folderId}`);
        if (!childrenRes.ok) throw new Error('No se pudieron cargar los videos.');
        const childrenData = await childrenRes.json();

        const videoBlocks: ContentBlock[] = (childrenData.resources || [])
            .filter((r: AppResourceType) => r.type === 'VIDEO')
            .map((r: AppResourceType) => ({ id: r.id, type: 'VIDEO', resource: r }));
        
        let allBlocks = [...videoBlocks];

        if (folderData.quiz) {
            allBlocks.push({ id: `quiz-${folderData.quiz.id}`, type: 'QUIZ', quiz: folderData.quiz });
        }
        
        setContentBlocks(allBlocks);
        if (allBlocks.length > 0) setActiveBlockId(allBlocks[0].id);

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }, [folderId]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setContentBlocks((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over!.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    
    const confirmDelete = () => {
        if (!blockToDelete) return;
        setContentBlocks(prev => prev.filter(b => b.id !== blockToDelete.id));
        if(activeBlockId === blockToDelete.id) {
            setActiveBlockId(contentBlocks.length > 1 ? contentBlocks.find(b => b.id !== blockToDelete.id)!.id : null);
        }
        setBlockToDelete(null);
    };
    
    const handleEditQuiz = () => {
        const quiz = existingQuizBlock?.quiz || {
            id: `new-quiz-obj-${Date.now()}`,
            title: `Evaluación para ${playlistInfo?.title || 'la lista'}`,
            description: "Evalúa lo aprendido en los videos.",
            questions: [],
            maxAttempts: null,
        };
        setQuizToEdit(quiz);
    };

    const handleSaveQuiz = (updatedQuiz: AppQuiz) => {
        const quizExists = contentBlocks.some(b => b.type === 'QUIZ' && b.quiz?.id === updatedQuiz.id);
        
        if (quizExists) {
             setContentBlocks(prev => prev.map(block =>
                block.type === 'QUIZ' ? { ...block, quiz: updatedQuiz } : block
            ));
        } else {
             const newQuizBlock: ContentBlock = { id: `quiz-block-${updatedQuiz.id}`, type: 'QUIZ', quiz: updatedQuiz };
             setContentBlocks(prev => [...prev, newQuizBlock]);
        }
       
        setQuizToEdit(null);
    };

    const handleSaveChanges = async () => {
      setIsSaving(true);
      const quizBlock = contentBlocks.find(b => b.type === 'QUIZ');
      try {
          const payload = {
              title: playlistInfo?.title,
              description: playlistInfo?.description,
              quiz: quizBlock ? quizBlock.quiz : null,
          }
           const res = await fetch(`/api/resources/${folderId}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(payload)
           });
          if (!res.ok) throw new Error('No se pudo guardar la lista de reproducción.');
          
          toast({ title: 'Guardado', description: 'La estructura y el quiz han sido guardados.' });
          fetchContent();

      } catch(err) {
          toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
      } finally {
          setIsSaving(false);
      }
    };

    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="p-8 text-destructive text-center"><AlertTriangle className="mx-auto h-12 w-12" /><p>{error}</p></div>;

    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-4">
            <div className="lg:col-span-3">
                <Card className="h-full flex flex-col">
                    <CardHeader><CardTitle className="flex items-center gap-2"><ListVideo className="h-5 w-5"/>Contenido</CardTitle></CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                       <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
                           <div className="space-y-2 pr-3">
                                <SortableContext items={contentBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    {contentBlocks.map((block) => (
                                        <SortableItem key={block.id} block={block} isActive={block.id === activeBlockId} onSelect={() => setActiveBlockId(block.id)} onDelete={() => setBlockToDelete(block)} />
                                    ))}
                                </SortableContext>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-6 space-y-4">
                <Card className="overflow-hidden shadow-lg">
                    <div className="aspect-video bg-black">
                       <VideoPlayer resource={activeBlock?.type === 'VIDEO' ? activeBlock.resource : null} />
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Card className="h-full flex flex-col">
                     <CardHeader><CardTitle className="text-lg">Configuración</CardTitle></CardHeader>
                     <CardContent className="flex-1 space-y-4">
                        <div className="space-y-1"><Label>Título de la Lista</Label><Input value={playlistInfo?.title || ''} onChange={e => setPlaylistInfo(prev => prev ? {...prev, title: e.target.value} : null)} /></div>
                        <div className="space-y-1"><Label>Descripción</Label><Textarea value={playlistInfo?.description || ''} onChange={e => setPlaylistInfo(prev => prev ? {...prev, description: e.target.value} : null)} rows={4} /></div>
                         <Card>
                            <CardHeader className="p-4"><CardTitle className="text-base">Evaluación</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0">
                                <Button className="w-full" variant="outline" onClick={handleEditQuiz}>
                                    {existingQuizBlock ? <Edit className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                                    {existingQuizBlock ? 'Editar Quiz' : 'Añadir Quiz'}
                                </Button>
                            </CardContent>
                         </Card>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
                           <Save className="mr-2 h-4 w-4"/> {isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>

        {quizToEdit && <QuizEditorModal isOpen={!!quizToEdit} onClose={() => setQuizToEdit(null)} quiz={quizToEdit} onSave={handleSaveQuiz} />}
        
         <AlertDialog open={!!blockToDelete} onOpenChange={(open) => !open && setBlockToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>Se eliminará el bloque "{blockToDelete?.type === 'VIDEO' ? blockToDelete.resource?.title : blockToDelete?.quiz?.title}". Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className={cn(buttonVariants({ variant: 'destructive'}))}>Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </DndContext>
    );
};
