// src/components/resources/interactive-quiz-editor.tsx
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { AppResourceType, AppQuiz, AppQuestion } from '@/types';
import { Loader2, AlertTriangle, PlayCircle, PlusCircle, Trash2, GripVertical, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import YouTube from 'react-youtube';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuizQuestionForm } from './quiz-question-form';
import { ScrollArea } from '../ui/scroll-area';

interface InteractiveQuizEditorProps {
    folderId: string;
}

const formatTime = (seconds: number) => {
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60).toString().padStart(2, '0');
    const sec = (floorSeconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
};

const QuestionItem = ({ question, isActive, onSelect, onDelete }: {
    question: AppQuestion,
    isActive: boolean,
    onSelect: () => void,
    onDelete: () => void,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="touch-none">
            <Card className={`p-2 cursor-pointer ${isActive ? 'border-primary ring-2 ring-primary' : 'bg-muted/50'}`} onClick={onSelect}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div {...listeners} className="p-1 cursor-grab">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                         <div className="w-12 text-center">
                            <p className="font-mono text-sm font-bold text-primary">{formatTime(question.timestamp || 0)}</p>
                         </div>
                        <p className="font-semibold text-sm truncate">{question.text || "Nueva Pregunta"}</p>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="h-4 w-4"/></Button>
                </div>
            </Card>
        </div>
    );
};

const VideoPlayer: React.FC<{ resource: AppResourceType | null, onReady: (event: any) => void }> = ({ resource, onReady }) => {
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
            <YouTube
                videoId={youtubeId}
                onReady={(e) => onReady(e.target)}
                className="w-full h-full"
                iframeClassName="w-full h-full"
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 0,
                    controls: 1,
                  },
                }}
            />
        );
    }

    // Para videos subidos directamente (MP4, etc.)
    return (
        <video
            key={resource.id}
            ref={onReady} // Esto podría no funcionar igual que con youtube-player. El ref es para el elemento video.
            src={resource.url}
            controls
            className="w-full h-full object-contain bg-black"
        >
            Tu navegador no soporta la etiqueta de video.
        </video>
    );
};

export const InteractiveQuizEditor: React.FC<InteractiveQuizEditorProps> = ({ folderId }) => {
    const [playlist, setPlaylist] = useState<AppResourceType[] | null>(null);
    const [quiz, setQuiz] = useState<AppQuiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const playerRef = useRef<any>(null);
    const { toast } = useToast();

    const activeVideo = playlist?.[activeVideoIndex];
    const activeQuestion = quiz?.questions.find(q => q.id === activeQuestionId);

    const fetchPlaylistAndQuiz = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/resources?parentId=${folderId}`);
            if (!res.ok) throw new Error("No se pudo cargar la lista de reproducción.");
            const data = await res.json();
            const videos = data.resources.filter((r: AppResourceType) => r.type === 'VIDEO');
            setPlaylist(videos);

            // Fetch or initialize quiz data
            const quizRes = await fetch(`/api/quizzes/resource/${folderId}`);
            if (quizRes.ok) {
                const quizData = await quizRes.json();
                setQuiz(quizData);
                 if (quizData?.questions.length > 0) {
                    setActiveQuestionId(quizData.questions[0].id);
                }
            } else {
                 const newQuiz: AppQuiz = { id: `new-${Date.now()}`, title: `Quiz para ${data.folder?.title || 'Playlist'}`, questions: [] };
                 setQuiz(newQuiz);
            }
            
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsLoading(false);
        }
    }, [folderId]);

    useEffect(() => {
        fetchPlaylistAndQuiz();
    }, [fetchPlaylistAndQuiz]);
    
    const handlePlayerReady = (event: any) => {
        // En el caso de react-youtube, el evento es el target.
        // Para el tag de video, el ref es el elemento mismo.
        if (event.target) {
            playerRef.current = event.target;
        } else {
            // Adaptador simple para el tag de <video>
            playerRef.current = {
                getCurrentTime: () => event.currentTime,
                seekTo: (seconds: number) => { event.currentTime = seconds; }
            };
        }
    };


    const handleAddTimePoint = async () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const timestamp = await playerRef.current.getCurrentTime();
            setQuiz(prev => {
                if (!prev) return null;
                const newQuestion: AppQuestion = {
                    id: `new-q-${Date.now()}`,
                    text: 'Nueva Pregunta',
                    order: prev.questions.length,
                    type: 'SINGLE_CHOICE',
                    options: [{id: `new-o-1`, text: 'Opción Correcta', isCorrect: true, points: 10}, {id: `new-o-2`, text: 'Opción Incorrecta', isCorrect: false, points: 0}],
                    timestamp: Math.round(timestamp)
                };
                const newQuestions = [...prev.questions, newQuestion].sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
                
                return {
                    ...prev,
                    questions: newQuestions
                }
            });
        } else {
            toast({ title: "Error", description: "El reproductor de video no está listo o no soporta esta función.", variant: "destructive"})
        }
    };
    
    const handleQuestionChange = (updatedQuestion: AppQuestion) => {
        setQuiz(prev => prev ? ({ ...prev, questions: prev.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q).sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0))}) : null);
    };

    const handleQuestionDelete = (questionId: string) => {
        setQuiz(prev => prev ? ({ ...prev, questions: prev.questions.filter(q => q.id !== questionId)}) : null);
        if (activeQuestionId === questionId) {
            setActiveQuestionId(quiz?.questions[0]?.id || null);
        }
    }
    
     const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && quiz) {
            const oldIndex = quiz.questions.findIndex(q => q.id === active.id);
            const newIndex = quiz.questions.findIndex(q => q.id === over?.id);
            setQuiz(prev => prev ? ({...prev, questions: arrayMove(prev.questions, oldIndex, newIndex)}) : null);
        }
    };
    
    const handleSaveQuiz = async () => {
        if(!quiz) return;
        try {
            const res = await fetch(`/api/quizzes/resource/${folderId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quiz)
            });
            if(!res.ok) throw new Error("No se pudo guardar el quiz");
            toast({title: "¡Guardado!", description: "El quiz interactivo ha sido guardado."});
            fetchPlaylistAndQuiz(); // Re-fetch to get saved data
        } catch(err) {
            toast({title: "Error", description: (err as Error).message, variant: 'destructive'});
        }
    }

    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="p-8 text-destructive text-center"><AlertTriangle className="mx-auto h-12 w-12" /><p>{error}</p></div>;
    if (!playlist || playlist.length === 0) return <div className="p-8 text-center text-muted-foreground">Esta lista de reproducción no contiene videos.</div>;

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-4">
                <div className="lg:col-span-2 space-y-4">
                    <Card className="overflow-hidden shadow-lg">
                        <div className="aspect-video bg-black">
                            <VideoPlayer resource={activeVideo} onReady={handlePlayerReady} />
                        </div>
                    </Card>
                    <div className="flex items-center gap-4">
                         <Button onClick={handleAddTimePoint} disabled={!playerRef.current}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Pregunta en este punto
                        </Button>
                        <Button onClick={handleSaveQuiz}><Save className="mr-2 h-4 w-4"/> Guardar Quiz</Button>
                    </div>
                     {activeQuestion && (
                        <QuizQuestionForm 
                            key={activeQuestion.id}
                            question={activeQuestion} 
                            onQuestionChange={handleQuestionChange} 
                        />
                    )}
                </div>
                <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Línea de Tiempo del Quiz</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ScrollArea className="h-[calc(100vh-300px)]">
                                <SortableContext items={(quiz?.questions || []).map(q => q.id)}>
                                    <div className="space-y-2 pr-3">
                                    {(quiz?.questions || []).map(q => (
                                        <QuestionItem 
                                            key={q.id}
                                            question={q} 
                                            isActive={q.id === activeQuestionId}
                                            onSelect={() => {
                                                setActiveQuestionId(q.id);
                                                if(playerRef.current && q.timestamp && typeof playerRef.current.seekTo === 'function') {
                                                    playerRef.current.seekTo(q.timestamp, true);
                                                }
                                            }}
                                            onDelete={() => handleQuestionDelete(q.id)}
                                        />
                                    ))}
                                    </div>
                                </SortableContext>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DndContext>
    );
};
