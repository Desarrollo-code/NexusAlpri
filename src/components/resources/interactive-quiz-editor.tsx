// src/components/resources/interactive-quiz-editor.tsx
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { AppResourceType, AppQuiz, AppQuestion } from '@/types';
import { Loader2, AlertTriangle, PlayCircle, PlusCircle, Trash2, GripVertical, Save, Video, BrainCircuit } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import YouTube from 'react-youtube';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuizQuestionForm } from './quiz-question-form';
import { ScrollArea } from '../ui/scroll-area';
import { QuizEditorModal } from '../quizz-it/quiz-editor-modal';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface ContentBlock {
  id: string;
  type: 'VIDEO' | 'QUIZ';
  resource?: AppResourceType;
  quiz?: AppQuiz;
}

const SortableItem = ({ block, onSelect, onDelete, isActive, onEditQuiz }: {
    block: ContentBlock,
    isActive: boolean,
    onSelect: () => void,
    onDelete: () => void,
    onEditQuiz?: (quiz: AppQuiz) => void
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const isVideo = block.type === 'VIDEO';
    const title = isVideo ? block.resource?.title : block.quiz?.title;
    const thumbnailUrl = isVideo && block.resource?.url ? getYoutubeVideoId(block.resource.url) : null;

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
                                <Image src={`https://img.youtube.com/vi/${thumbnailUrl}/mqdefault.jpg`} alt={title || 'video'} fill className="object-cover" />
                            ) : isVideo ? (
                                <Video className="h-6 w-6 text-white"/>
                            ) : (
                                <BrainCircuit className="h-6 w-6 text-primary"/>
                            )}
                        </div>
                        <p className="font-semibold text-sm truncate">{title || (isVideo ? "Video sin título" : "Quiz sin título")}</p>
                    </div>
                     <div className="flex-shrink-0">
                        {block.type === 'QUIZ' && onEditQuiz && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEditQuiz(block.quiz!); }}>
                                <Edit className="h-4 w-4"/>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
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
            <YouTube videoId={youtubeId} className="w-full h-full" iframeClassName="w-full h-full" opts={{ height: '100%', width: '100%', playerVars: { autoplay: 0, controls: 1 } }} />
        );
    }

    return <video key={resource.id} src={resource.url} controls className="w-full h-full object-contain bg-black" />;
};


export const InteractiveQuizEditor: React.FC<InteractiveQuizEditorProps> = ({ folderId }) => {
    const [playlistInfo, setPlaylistInfo] = useState<{ title: string } | null>(null);
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [quizToEdit, setQuizToEdit] = useState<AppQuiz | null>(null);
    const [blockToDelete, setBlockToDelete] = useState<ContentBlock | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { toast } = useToast();
    
    const activeBlock = contentBlocks.find(b => b.id === activeBlockId);

    const fetchContent = useCallback(async () => {
      // ... (fetch logic remains the same)
    }, [folderId]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setContentBlocks((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over!.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    
    const addBlock = (type: 'VIDEO' | 'QUIZ', index: number) => {
      const newBlock: ContentBlock = {
        id: `new-${type.toLowerCase()}-${Date.now()}`,
        type,
        quiz: type === 'QUIZ' ? {
            id: `new-quiz-${Date.now()}`,
            title: "Nuevo Quiz de Repaso",
            description: "Evalúa lo aprendido en los videos anteriores.",
            questions: [],
            maxAttempts: null
        } : undefined
      };
      const newBlocks = [...contentBlocks];
      newBlocks.splice(index, 0, newBlock);
      setContentBlocks(newBlocks);
    };

    const handleDelete = (blockId: string) => {
        setBlockToDelete(contentBlocks.find(b => b.id === blockId) || null);
    };
    
    const confirmDelete = () => {
        if (!blockToDelete) return;
        setContentBlocks(prev => prev.filter(b => b.id !== blockToDelete.id));
        setBlockToDelete(null);
    };
    
    const handleEditQuiz = (quiz: AppQuiz) => {
      setQuizToEdit(quiz);
    };

    const handleSaveQuiz = (updatedQuiz: AppQuiz) => {
        setContentBlocks(prev => prev.map(block => 
            block.quiz?.id === updatedQuiz.id ? { ...block, quiz: updatedQuiz } : block
        ));
        setQuizToEdit(null);
    };

    const handleSaveChanges = async () => {
      // Implement save logic here
    };

    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="p-8 text-destructive text-center"><AlertTriangle className="mx-auto h-12 w-12" /><p>{error}</p></div>;

    return (
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-4">
            <div className="lg:col-span-2 space-y-4">
                <Card className="overflow-hidden shadow-lg">
                    <div className="aspect-video bg-black">
                       <VideoPlayer resource={activeBlock?.type === 'VIDEO' ? activeBlock.resource : null} />
                    </div>
                </Card>
                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                       <Save className="mr-2 h-4 w-4"/> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
            <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>{playlistInfo?.title || 'Contenido de la Lista'}</CardTitle>
                        <CardDescription>Arrastra los bloques para reordenar la secuencia.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow p-2">
                        <ScrollArea className="h-[calc(100vh-300px)]">
                            <div className="space-y-2 pr-3">
                                <div className="flex justify-center"><Button variant="outline" size="sm" onClick={() => addBlock('QUIZ', 0)}><PlusCircle className="mr-2 h-4"/>Añadir Quiz</Button></div>
                                <SortableContext items={contentBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    {contentBlocks.map((block, index) => (
                                        <React.Fragment key={block.id}>
                                            <SortableItem 
                                                block={block} 
                                                isActive={block.id === activeBlockId}
                                                onSelect={() => setActiveBlockId(block.id)}
                                                onDelete={() => handleDelete(block.id)}
                                                onEditQuiz={handleEditQuiz}
                                            />
                                            <div className="flex justify-center"><Button variant="outline" size="sm" onClick={() => addBlock('QUIZ', index + 1)}><PlusCircle className="mr-2 h-4"/>Añadir Quiz</Button></div>
                                        </React.Fragment>
                                    ))}
                                </SortableContext>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>

        {quizToEdit && (
            <QuizEditorModal
                isOpen={!!quizToEdit}
                onClose={() => setQuizToEdit(null)}
                quiz={quizToEdit}
                onSave={handleSaveQuiz}
            />
        )}
        
         <AlertDialog open={!!blockToDelete} onOpenChange={(open) => !open && setBlockToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>
                       Se eliminará el bloque "{blockToDelete?.type === 'VIDEO' ? blockToDelete.resource?.title : blockToDelete?.quiz?.title}". Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: 'destructive'})}>Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </DndContext>
    );
};