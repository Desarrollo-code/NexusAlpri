
// @ts-nocheck
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, XCircle, Zap, CircleOff, Paperclip, ChevronRight, Calendar as CalendarIcon, Replace, Pencil, Eye, MoreVertical, Archive, Crop, Copy, FilePlus2, ChevronDown, BookOpenText, Video, FileText, Lightbulb, File as FileGenericIcon, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, ChangeEvent, useCallback, useMemo } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, LessonType, CourseStatus, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption, ContentBlock } from '@/types';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import type { LessonTemplate, TemplateBlock } from '@prisma/client';
import { useAuth } from '@/contexts/auth-context';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from '@hello-pangea/dnd';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuizViewer } from '@/components/quiz-viewer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageCropper } from '@/components/image-cropper';
import { useTitle } from '@/contexts/title-context';
import { QuizAnalyticsView } from '@/components/analytics/quiz-analytics-view';
import { Calendar } from '@/components/ui/calendar';
import { RichTextEditor } from '@/components/ui/rich-text-editor';


// === TIPOS E INTERFACES ===
interface ApiTemplate extends LessonTemplate {
  templateBlocks: TemplateBlock[];
  creator: { name: string | null } | null;
}

interface LocalInstructor {
    id: string;
    name: string;
}

const generateUniqueId = (prefix: string) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return `${prefix}-${window.crypto.randomUUID()}`;
    }
    // Fallback robusto para entornos sin crypto.randomUUID
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}


const ModuleItem = React.forwardRef<HTMLDivElement, { module: AppModule; onUpdate: (field: keyof AppModule, value: any) => void; onAddLesson: () => void; onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void; onLessonDelete: (lessonIndex: number) => void; onAddBlock: (lessonIndex: number, type: LessonType) => void; onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void; onBlockDelete: (lessonIndex: number, blockIndex: number) => void; isSaving: boolean; onDelete: () => void; provided: DraggableProvided }>(
    ({ module, onUpdate, onAddLesson, onLessonUpdate, onLessonDelete, onAddBlock, onBlockUpdate, onBlockDelete, isSaving, onDelete, provided }, ref) => {
        return (
            <div ref={ref} {...provided.draggableProps}>
                <Accordion type="single" collapsible className="w-full bg-muted/30 rounded-lg border" defaultValue={`item-${module.id}`}>
                    <AccordionItem value={`item-${module.id}`} className="border-0">
                         <div className="flex items-center px-4 py-2" {...provided.dragHandleProps}>
                             <AccordionTrigger className="flex-grow hover:no-underline p-0">
                                <div className="flex items-center gap-2 w-full">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    <Input value={module.title} onChange={e => onUpdate('title', e.target.value)} className="text-base font-semibold" disabled={isSaving} />
                                </div>
                            </AccordionTrigger>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-2 shrink-0" onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <AccordionContent className="p-4 pt-0 border-t">
                            <Droppable droppableId={module.id} type="LESSONS">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                      {module.lessons.map((lesson, lessonIndex) => (
                                        <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                          {(provided) => (
                                            <LessonItem
                                              lesson={lesson}
                                              onDelete={() => onLessonDelete(lessonIndex)}
                                              onUpdate={(field, value) => onLessonUpdate(lessonIndex, field, value)}
                                              onAddBlock={(type) => onAddBlock(lessonIndex, type)}
                                              onBlockUpdate={(blockIndex, field, value) => onBlockUpdate(lessonIndex, blockIndex, field, value)}
                                              onBlockDelete={(blockIndex) => onBlockDelete(lessonIndex, blockIndex)}
                                              isSaving={isSaving}
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                            />
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </div>

                                )}
                            </Droppable>
                            <div className="mt-4 flex gap-2">
                                <Button size="sm" variant="secondary" onClick={onAddLesson} disabled={isSaving}><PlusCircle className="mr-2 h-4 w-4" />Añadir Lección</Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        )
    }
);
ModuleItem.displayName = 'ModuleItem';


const LessonItem = React.forwardRef<HTMLDivElement, { lesson: AppLesson; onUpdate: (field: keyof AppLesson, value: any) => void; onAddBlock: (type: LessonType) => void; onBlockUpdate: (blockIndex: number, field: string, value: any) => void; onBlockDelete: (blockIndex: number) => void; isSaving: boolean; onDelete: () => void; }>(
    ({ lesson, onUpdate, onAddBlock, onBlockUpdate, onBlockDelete, isSaving, onDelete, ...rest }, ref) => {
        return (
            <div ref={ref} {...rest} className="bg-card p-3 rounded-md border">
                <div className="flex items-center gap-2 mb-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <Input value={lesson.title} onChange={e => onUpdate('title', e.target.value)} placeholder="Título de la lección" disabled={isSaving} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
                </div>
                 <Droppable droppableId={lesson.id} type="BLOCKS">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {lesson.contentBlocks.map((block, blockIndex) => (
                                <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                                     {(provided) => (
                                        <ContentBlockItem
                                            block={block} 
                                            onUpdate={(field, value) => onBlockUpdate(blockIndex, field, value)} 
                                            onDelete={() => onBlockDelete(blockIndex)} 
                                            isSaving={isSaving}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        />
                                     )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                 </Droppable>
                 <div className="mt-2 border-t pt-2">
                     <BlockTypeSelector onSelect={onAddBlock} />
                 </div>
            </div>
        );
    }
);
LessonItem.displayName = 'LessonItem';


const ContentBlockItem = React.forwardRef<HTMLDivElement, { block: ContentBlock; onUpdate: (field: string, value: any) => void; isSaving: boolean; onDelete: () => void; }>(
    ({ block, onUpdate, isSaving, onDelete, ...rest }, ref) => {
        const [showQuizAnalytics, setShowQuizAnalytics] = useState(false);

        const renderBlockContent = () => {
            switch(block.type) {
                case 'TEXT': return <RichTextEditor value={block.content} onChange={e => onUpdate('content', e.target.value)} placeholder="Escribe aquí texto o pega un enlace..." rows={4} disabled={isSaving} />;
                case 'VIDEO': return <Input value={block.content} onChange={e => onUpdate('content', e.target.value)} placeholder="URL del video de YouTube" disabled={isSaving} />;
                case 'FILE': return <Input value={block.content} onChange={e => onUpdate('content', e.target.value)} placeholder="URL del archivo (PDF, imagen, etc.)" disabled={isSaving} />;
                case 'QUIZ': return (
                    <div className="flex items-center gap-2 w-full">
                        <Input value={block.quiz?.title || ''} onChange={e => onUpdate('quiz', { ...block.quiz, title: e.target.value })} placeholder="Título del Quiz" disabled={isSaving} />
                        <Dialog open={showQuizAnalytics} onOpenChange={setShowQuizAnalytics}>
                            <DialogTrigger asChild>
                               <Button variant="outline" size="sm" className="shrink-0" disabled={!block.quiz?.id || block.quiz.id.startsWith('new-quiz-')}>
                                  <BarChart3 className="mr-2 h-4 w-4" /> Analíticas
                               </Button>
                            </DialogTrigger>
                             <DialogContent className="max-w-4xl h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle>Analíticas del Quiz: {block.quiz?.title}</DialogTitle>
                                    <DialogDescription>Revisa el rendimiento de los estudiantes en este quiz.</DialogDescription>
                                </DialogHeader>
                                {block.quiz?.id && <QuizAnalyticsView quizId={block.quiz.id} />}
                            </DialogContent>
                        </Dialog>
                    </div>
                );
                default: return null;
            }
        };

        return (
            <div ref={ref} {...rest} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                 <GripVertical className="h-5 w-5 text-muted-foreground" />
                 <div className="flex-grow">{renderBlockContent()}</div>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
            </div>
        );
    }
);
ContentBlockItem.displayName = 'ContentBlockItem';


// === COMPONENTE PRINCIPAL DE LA PÁGINA (CourseEditor) ===
export function CourseEditor({ courseId }: { courseId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const { user, settings, isLoading: isAuthLoading } = useAuth();
    const { setPageTitle } = useTitle();

    const [course, setCourse] = useState<AppCourse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    const [itemToDeleteDetails, setItemToDeleteDetails] = useState<any>(null);
    
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchCourseData = async () => {
            if (courseId === 'new') {
                setCourse({
                    id: generateUniqueId('course'),
                    title: 'Nuevo Curso sin Título',
                    description: 'Añade una descripción aquí.',
                    instructor: user?.name || 'N/A',
                    instructorId: user?.id,
                    status: 'DRAFT',
                    category: '',
                    modules: [],
                    modulesCount: 0,
                });
                setIsLoading(false);
                setPageTitle('Crear Nuevo Curso');
                return;
            }

            try {
                setIsLoading(true);
                const response = await fetch(`/api/courses/${courseId}`);
                if (!response.ok) throw new Error("Course not found");
                const courseData: AppCourse = await response.json();
                setCourse(courseData);
                setPageTitle(`Editando: ${courseData.title}`);
            } catch (err) {
                 toast({ title: "Error", description: "No se pudo cargar el curso para editar.", variant: "destructive" });
                 router.push('/manage-courses');
            } finally {
                 setIsLoading(false);
            }
        };
        
        if (user) {
            fetchCourseData();
        }
    }, [courseId, user, router, toast, setPageTitle]);

    // --- State Updaters ---
    const updateCourseField = (field: keyof AppCourse, value: any) => {
        setCourse(prev => prev ? { ...prev, [field]: value } : null);
        setIsDirty(true);
    };

    const updateModuleField = (moduleIndex: number, field: keyof AppModule, value: any) => {
        setCourse(prev => {
            if (!prev) return null;
            const newModules = [...prev.modules];
            newModules[moduleIndex] = { ...newModules[moduleIndex], [field]: value };
            return { ...prev, modules: newModules };
        });
        setIsDirty(true);
    };

    const updateLessonField = (moduleIndex: number, lessonIndex: number, field: keyof AppLesson, value: any) => {
        setCourse(prev => {
            if (!prev) return null;
            const newModules = [...prev.modules];
            const newLessons = [...newModules[moduleIndex].lessons];
            newLessons[lessonIndex] = { ...newLessons[lessonIndex], [field]: value };
            newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
            return { ...prev, modules: newModules };
        });
        setIsDirty(true);
    };

    const updateBlockField = (moduleIndex: number, lessonIndex: number, blockIndex: number, field: keyof ContentBlock, value: any) => {
         setCourse(prev => {
            if (!prev) return null;
            const newModules = [...prev.modules];
            const newLessons = [...newModules[moduleIndex].lessons];
            const newBlocks = [...newLessons[lessonIndex].contentBlocks];
            newBlocks[blockIndex] = { ...newBlocks[blockIndex], [field]: value };
            newLessons[lessonIndex] = { ...newLessons[lessonIndex], contentBlocks: newBlocks };
            newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
            return { ...prev, modules: newModules };
        });
        setIsDirty(true);
    };

    const handleAddModule = () => {
        const newModule: AppModule = {
            id: generateUniqueId('module'),
            title: 'Nuevo Módulo',
            order: course?.modules.length || 0,
            lessons: [],
        };
        setCourse(prev => prev ? { ...prev, modules: [...prev.modules, newModule] } : null);
        setIsDirty(true);
    };
    
    const handleAddLesson = (moduleIndex: number) => {
        const newLesson: AppLesson = {
            id: generateUniqueId('lesson'),
            title: 'Nueva Lección',
            order: course?.modules[moduleIndex].lessons.length || 0,
            contentBlocks: [],
        };
        setCourse(prev => {
            if (!prev) return null;
            const newModules = [...prev.modules];
            newModules[moduleIndex].lessons.push(newLesson);
            return { ...prev, modules: newModules };
        });
        setIsDirty(true);
    };
    
     const handleAddBlock = (moduleIndex: number, lessonIndex: number, type: LessonType) => {
        const newBlock: ContentBlock = {
            id: generateUniqueId('block'),
            type: type,
            content: '',
            order: course?.modules[moduleIndex].lessons[lessonIndex].contentBlocks.length || 0,
            quiz: type === 'QUIZ' ? { id: generateUniqueId('quiz'), title: 'Nuevo Quiz', description: '', questions: [] } : undefined
        };
         setCourse(prev => {
            if (!prev) return null;
            const newModules = [...prev.modules];
            newModules[moduleIndex].lessons[lessonIndex].contentBlocks.push(newBlock);
            return { ...prev, modules: newModules };
        });
        setIsDirty(true);
    };

    const handleRemoveModule = (moduleIndex: number) => {
         setItemToDeleteDetails({
            name: course?.modules[moduleIndex].title,
            onDelete: () => {
                setCourse(prev => {
                    if (!prev) return null;
                    const newModules = prev.modules.filter((_, index) => index !== moduleIndex);
                    return { ...prev, modules: newModules };
                });
                setIsDirty(true);
            }
        })
    };

    const handleRemoveLesson = (moduleIndex: number, lessonIndex: number) => {
         setItemToDeleteDetails({
            name: course?.modules[moduleIndex].lessons[lessonIndex].title,
            onDelete: () => {
                setCourse(prev => {
                    if (!prev) return null;
                    const newModules = [...prev.modules];
                    const newLessons = newModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
                    newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
                    return { ...prev, modules: newModules };
                });
                setIsDirty(true);
            }
        })
    };
    
    const handleRemoveBlock = (moduleIndex: number, lessonIndex: number, blockIndex: number) => {
        setCourse(prev => {
            if (!prev) return null;
            const newModules = [...prev.modules];
            const newLessons = [...newModules[moduleIndex].lessons];
            const newBlocks = newLessons[lessonIndex].contentBlocks.filter((_, index) => index !== blockIndex);
            newLessons[lessonIndex] = { ...newLessons[lessonIndex], contentBlocks: newBlocks };
            newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
            return { ...prev, modules: newModules };
        });
        setIsDirty(true);
    };

    
    // --- Drag and Drop ---
    const onDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination || !course) return;

        let newModules = JSON.parse(JSON.stringify(course.modules));

        if (type === 'MODULES') {
            const [reorderedItem] = newModules.splice(source.index, 1);
            newModules.splice(destination.index, 0, reorderedItem);
        } else if (type === 'LESSONS') {
            const sourceModuleIndex = newModules.findIndex((m: AppModule) => m.id === source.droppableId);
            const destModuleIndex = newModules.findIndex((m: AppModule) => m.id === destination.droppableId);

            if (sourceModuleIndex === -1 || destModuleIndex === -1) return;

            const sourceModule = newModules[sourceModuleIndex];
            const [movedItem] = sourceModule.lessons.splice(source.index, 1);

            if (source.droppableId === destination.droppableId) {
                sourceModule.lessons.splice(destination.index, 0, movedItem);
            } else {
                const destModule = newModules[destModuleIndex];
                destModule.lessons.splice(destination.index, 0, movedItem);
            }
        }

        updateCourseField('modules', newModules);
    };
    
    const handleCropComplete = (croppedFileUrl: string) => {
        updateCourseField('imageUrl', croppedFileUrl);
        setImageToCrop(null);
    };

    // --- Submission ---
    const handleSaveCourse = async () => {
        if (!course) return;
        setIsSaving(true);
        
        // Re-assign order based on current array index before saving
        const payload = { ...course };
        payload.modules.forEach((mod, mIdx) => {
            mod.order = mIdx;
            mod.lessons.forEach((les, lIdx) => {
                les.order = lIdx;
                les.contentBlocks.forEach((block, bIdx) => {
                    block.order = bIdx;
                });
            });
        });
        
        try {
            const endpoint = courseId === 'new' ? '/api/courses' : `/api/courses/${courseId}`;
            const method = courseId === 'new' ? 'POST' : 'PUT';

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Error al guardar el curso.');

            const savedCourse = await response.json();
            
            toast({ title: "Curso Guardado", description: "La información del curso se ha guardado correctamente." });
            
            // CRITICAL: Sync local state with the state returned from the server
            setCourse(savedCourse); 
            setPageTitle(`Editando: ${savedCourse.title}`);
            setIsDirty(false); // Reset dirty state after successful save & sync
            
            if (courseId === 'new') {
                router.replace(`/manage-courses/${savedCourse.id}/edit`, { scroll: false });
            }


        } catch (error: any) {
            console.error('Error al guardar el curso:', error);
            toast({ title: "Error al Guardar", description: error.message || "No se pudo guardar.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }


    if (isLoading || isAuthLoading || !course) {
        return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (courseId !== 'new' && !isAuthLoading && user?.role !== 'ADMINISTRATOR' && user?.id !== course.instructorId) {
        return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-4"><ShieldAlert className="h-20 w-20 text-red-500 mb-4" /><h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2><p className="text-muted-foreground mb-4">No tienes permiso para editar este curso.</p><Link href="/manage-courses" className={buttonVariants({ variant: "outline" })}>Volver</Link></div>;
    }

    return (
        <div className="space-y-4 pb-24">
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b bg-background sticky top-[63px] sm:top-0 z-20 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button asChild variant="outline" type="button" size="sm" className="shrink-0"><Link href="/manage-courses"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link></Button>
                    <h1 className="text-xl font-semibold truncate">{courseId === 'new' ? 'Crear Nuevo Curso' : 'Editar Curso'}</h1>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button asChild variant="secondary" type="button" className="w-full sm:w-auto"><Link href={`/courses/${courseId}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Vista Previa</Link></Button>
                    <div className="w-full sm:w-48">
                         <Select value={course.status} onValueChange={v => updateCourseField('status', v as CourseStatus)} disabled={isSaving}>
                            <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Borrador</SelectItem>
                                <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                <SelectItem value="SCHEDULED">Programado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Información General</CardTitle><CardDescription>Detalles básicos y descripción.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div><Label htmlFor="title">Título del Curso</Label><Input id="title" value={course.title} onChange={e => updateCourseField('title', e.target.value)} placeholder="Título atractivo" disabled={isSaving} /></div>
                            <div><Label htmlFor="description">Descripción</Label><Textarea id="description" value={course.description} onChange={e => updateCourseField('description', e.target.value)} placeholder="Describe el contenido y objetivos." rows={6} disabled={isSaving} /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div><CardTitle>Contenido del Curso</CardTitle><CardDescription>Arrastra los módulos para reordenarlos.</CardDescription></div>
                            <Button type="button" onClick={handleAddModule} disabled={isSaving} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Módulo</Button>
                        </CardHeader>
                        <CardContent>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="course-modules" type="MODULES">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                            {course.modules.map((moduleItem, moduleIndex) => (
                                                <Draggable key={moduleItem.id} draggableId={moduleItem.id} index={moduleIndex}>
                                                    {(provided) => (
                                                        <ModuleItem
                                                            module={moduleItem}
                                                            onDelete={() => handleRemoveModule(moduleIndex)}
                                                            onUpdate={(field, value) => updateModuleField(moduleIndex, field, value)}
                                                            onAddLesson={() => handleAddLesson(moduleIndex)}
                                                            onLessonUpdate={(lessonIndex, field, value) => updateLessonField(moduleIndex, lessonIndex, field, value)}
                                                            onLessonDelete={(lessonIndex) => handleRemoveLesson(moduleIndex, lessonIndex)}
                                                            onAddBlock={(lessonIndex, type) => handleAddBlock(moduleIndex, lessonIndex, type)}
                                                            onBlockUpdate={(lessonIndex, blockIndex, field, value) => updateBlockField(moduleIndex, lessonIndex, blockIndex, field, value)}
                                                            onBlockDelete={(lessonIndex, blockIndex) => handleRemoveBlock(moduleIndex, lessonIndex, blockIndex)}
                                                            isSaving={isSaving}
                                                            provided={provided}
                                                            ref={provided.innerRef}
                                                        />
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                            {course.modules.length === 0 && <p className="text-center text-muted-foreground py-8">No hay módulos.</p>}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Publicación</CardTitle><CardDescription>Controla la visibilidad y el estado del curso.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                             <div><Label htmlFor="status">Estado</Label>
                                <Select value={course.status} onValueChange={v => updateCourseField('status', v as CourseStatus)} disabled={isSaving}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Borrador</SelectItem>
                                        <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                        <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                        <SelectItem value="SCHEDULED">Programado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {course.status === 'SCHEDULED' && 
                                <div>
                                    <Label htmlFor="publicationDate">Fecha de Publicación</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !course.publicationDate && "text-muted-foreground")} disabled={isSaving}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {course.publicationDate ? format(new Date(course.publicationDate), "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar 
                                                mode="single" 
                                                selected={course.publicationDate ? new Date(course.publicationDate) : undefined} 
                                                onSelect={d => updateCourseField('publicationDate', d)} 
                                                initialFocus 
                                                locale={es}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            }
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Categoría e Imagen</CardTitle></CardHeader>
                         <CardContent className="space-y-4">
                              <div><Label htmlFor="category">Categoría</Label>
                                <Select value={course.category || ''} onValueChange={v => updateCourseField('category', v)} disabled={isSaving}>
                                <SelectTrigger id="category"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                <SelectContent>{(settings?.resourceCategories || []).sort().map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                           
                            {course.imageUrl ? (
                                <div className="relative aspect-video rounded-md overflow-hidden border w-full">
                                    <Image src={course.imageUrl} alt="Imagen del Curso" fill className="object-contain" onError={() => updateCourseField('imageUrl', null)} data-ai-hint="online course" />
                                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                                        <Button type="button" variant="secondary" size="icon" className="rounded-full h-8 w-8" onClick={() => document.getElementById('image-upload')?.click()} disabled={isSaving}><Replace className="h-4 w-4" /></Button>
                                        <Button type="button" variant="destructive" size="icon" className="rounded-full h-8 w-8" onClick={() => updateCourseField('imageUrl', null)} disabled={isSaving}><XCircle className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ) : (
                                <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors">
                                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Haz clic para subir</span>
                                </Label>
                            )}
                            <Input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const reader = new FileReader();
                                    reader.onload = () => setImageToCrop(reader.result as string);
                                    reader.readAsDataURL(e.target.files[0]);
                                }
                                e.target.value = '';
                            }} disabled={isSaving} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 md:left-72 group-data-[collapsed=true]:md:left-20 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-20">
                <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row justify-end gap-2">
                    <Button type="button" onClick={handleSaveCourse} disabled={isSaving || !isDirty} className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4" />{isSaving ? 'Guardando...' : (courseId === 'new' ? 'Crear y Guardar' : 'Guardar Cambios')}</Button>
                </div>
            </div>
            
            <ImageCropper imageSrc={imageToCrop} onCropComplete={handleCropComplete} onClose={() => setImageToCrop(null)} uploadUrl="/api/upload/course-image" />
            <AlertDialog open={!!itemToDeleteDetails} onOpenChange={(isOpen) => !isOpen && setItemToDeleteDetails(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar eliminación</AlertDialogTitle><AlertDialogDescription>¿Estás seguro? Esta acción eliminará "{itemToDeleteDetails?.name}" y su contenido.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { itemToDeleteDetails.onDelete(); setItemToDeleteDetails(null) }} className={buttonVariants({ variant: "destructive" })}>Sí, eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

const BlockTypeSelector = ({ onSelect }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Contenido</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
             <DropdownMenuItem onSelect={() => onSelect('TEXT')}><FileText className="mr-2 h-4 w-4"/>Texto/Enlace</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => onSelect('VIDEO')}><Video className="mr-2 h-4 w-4"/>Video (YouTube)</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => onSelect('FILE')}><FileGenericIcon className="mr-2 h-4 w-4"/>Archivo (PDF, Img)</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => onSelect('QUIZ')}><Pencil className="mr-2 h-4 w-4"/>Quiz</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);
