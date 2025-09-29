
// @ts-nocheck
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, XCircle, Replace, Pencil, Eye, MoreVertical, Archive, Crop, Copy, FilePlus2, ChevronDown, BookOpenText, Video, FileText, Lightbulb, File as FileGenericIcon, BarChart3, Star, Layers3, SaveIcon, Sparkles } from 'lucide-react';
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
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { useTitle } from '@/contexts/title-context';
import { QuizAnalyticsView } from '@/components/analytics/quiz-analytics-view';
import { Calendar } from '@/components/ui/calendar';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';


// === TIPOS E INTERFACES ===
interface ApiTemplate extends LessonTemplate {
  templateBlocks: TemplateBlock[];
  creator: { name: string | null } | null;
}

interface LocalInstructor {
    id: string;
    name: string;
}

const generateUniqueId = (prefix: string): string => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        return `${prefix}-${window.crypto.randomUUID()}`;
    }
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `${prefix}-${timestamp}-${randomPart}`;
};


const ModuleItem = React.forwardRef<HTMLDivElement, { module: AppModule; onUpdate: (field: keyof AppModule, value: any) => void; onAddLesson: (type: 'blank' | 'template') => void; onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void; onLessonDelete: (lessonIndex: number) => void; onSaveLessonAsTemplate: (lessonIndex: number) => void; onAddBlock: (lessonIndex: number, type: LessonType) => void; onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void; onBlockDelete: (lessonIndex: number, blockIndex: number) => void; onQuizUpdate: (lessonIndex: number, blockIndex: number, updatedQuiz: AppQuiz) => void; isSaving: boolean; onDelete: () => void; provided: DraggableProvided }>(
    ({ module, onUpdate, onAddLesson, onLessonUpdate, onLessonDelete, onSaveLessonAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onQuizUpdate, isSaving, onDelete, provided }, ref) => {
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
                                onSaveAsTemplate={() => onSaveLessonAsTemplate(lessonIndex)}
                                onAddBlock={(type) => onAddBlock(lessonIndex, type)}
                                onBlockUpdate={(blockIndex, field, value) => onBlockUpdate(lessonIndex, blockIndex, field, value)}
                                onBlockDelete={(blockIndex) => onBlockDelete(lessonIndex, blockIndex)}
                                onQuizUpdate={(blockIndex, updatedQuiz) => onQuizUpdate(lessonIndex, blockIndex, updatedQuiz)}
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" disabled={isSaving}>
                    <PlusCircle className="mr-2 h-4 w-4" />Añadir Lección<ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => onAddLesson('blank')}><FilePlus2 className="mr-2 h-4 w-4"/>Lección en Blanco</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAddLesson('template')}><Sparkles className="mr-2 h-4 w-4"/>Usar Plantilla</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        )
    }
);
ModuleItem.displayName = 'ModuleItem';


const LessonItem = React.forwardRef<HTMLDivElement, { lesson: AppLesson; onUpdate: (field: keyof AppLesson, value: any) => void; onSaveAsTemplate: () => void; onAddBlock: (type: LessonType) => void; onBlockUpdate: (blockIndex: number, field: string, value: any) => void; onBlockDelete: (blockIndex: number) => void; onQuizUpdate: (blockIndex: number, updatedQuiz: AppQuiz) => void; isSaving: boolean; onDelete: () => void; }>(
    ({ lesson, onUpdate, onSaveAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onQuizUpdate, isSaving, onDelete, ...rest }, ref) => {
        return (
            <div ref={ref} {...rest} className="bg-card p-3 rounded-md border">
                <div className="flex items-center gap-2 mb-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <Input value={lesson.title} onChange={e => onUpdate('title', e.target.value)} placeholder="Título de la lección" disabled={isSaving} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onSelect={onSaveAsTemplate}><SaveIcon className="mr-2 h-4 w-4"/>Guardar como Plantilla</DropdownMenuItem>
                           <DropdownMenuSeparator/>
                           <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Eliminar Lección</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                            onQuizUpdate={(updatedQuiz) => onQuizUpdate(blockIndex, updatedQuiz)}
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


const ContentBlockItem = React.forwardRef<HTMLDivElement, { block: ContentBlock; onUpdate: (field: string, value: any) => void; onQuizUpdate: (updatedQuiz: AppQuiz) => void; isSaving: boolean; onDelete: () => void; }>(
    ({ block, onUpdate, onQuizUpdate, isSaving, onDelete, ...rest }, ref) => {
        const [showQuizEditor, setShowQuizEditor] = useState(false);
        const [isFileUploading, setIsFileUploading] = useState(false);
        const [fileUploadProgress, setFileUploadProgress] = useState(0);
        const { toast } = useToast();

        const handleFileSelect = async (file: File | null) => {
            if (!file) return;

            setIsFileUploading(true);
            setFileUploadProgress(0);
            
            try {
                const result = await uploadWithProgress('/api/upload/lesson-file', file, setFileUploadProgress);
                onUpdate('content', result.publicUrl);
                toast({ title: 'Archivo Subido', description: `El archivo ${file.name} se ha subido correctamente.`});
            } catch (err) {
                 toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
            } finally {
                setIsFileUploading(false);
            }
        };

        const renderBlockContent = () => {
            const isImageFile = block.content && /\.(jpg|jpeg|png|gif|webp)$/i.test(block.content);
            
            switch(block.type) {
                case 'TEXT': return <RichTextEditor value={block.content || ''} onChange={value => onUpdate('content', value)} placeholder="Escribe aquí el contenido o pega un enlace externo..." disabled={isSaving} />;
                case 'VIDEO': return <Input value={block.content} onChange={e => onUpdate('content', e.target.value)} placeholder="URL del video de YouTube" disabled={isSaving} />;
                case 'FILE': 
                    if (block.content && isImageFile) {
                        return (
                            <div className="relative w-full h-48 rounded-md border bg-muted/20 overflow-hidden">
                                <Image src={block.content} alt="Previsualización" fill className="object-contain p-2" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full z-10" onClick={() => onUpdate('content', '')}>
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        )
                    }
                    return (
                        <div className="w-full space-y-2">
                            <UploadArea onFileSelect={handleFileSelect} disabled={isSaving || isFileUploading} />
                            {isFileUploading && <Progress value={fileUploadProgress} />}
                            {block.content && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 break-all">
                                    <FileGenericIcon className="h-3 w-3 shrink-0" />
                                    <span className="truncate">URL actual: {block.content}</span>
                                </div>
                            )}
                        </div>
                    );
                case 'QUIZ': return (
                     <div className="flex items-center gap-2 w-full">
                        <Input value={block.quiz?.title || ''} onChange={e => onUpdate('quiz', { ...block.quiz, title: e.target.value })} placeholder="Título del Quiz" disabled={isSaving} />
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setShowQuizEditor(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar Quiz
                        </Button>
                        <QuizEditorModal 
                            isOpen={showQuizEditor} 
                            onClose={() => setShowQuizEditor(false)} 
                            quiz={block.quiz}
                            onSave={onQuizUpdate}
                        />
                    </div>
                );
                default: return null;
            }
        };

        return (
            <div ref={ref} {...rest} className="flex items-start gap-2 bg-muted/50 p-2 rounded">
                 <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-2" />
                 <div className="flex-grow">{renderBlockContent()}</div>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={onDelete} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
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
    const { setPageTitle, setHeaderActions, setShowBackButton } = useTitle();

    const [course, setCourse] = useState<AppCourse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    const [itemToDeleteDetails, setItemToDeleteDetails] = useState<any>(null);
    
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [templates, setTemplates] = useState<ApiTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [activeModuleIndexForTemplate, setActiveModuleIndexForTemplate] = useState<number | null>(null);

    const [lessonToSaveAsTemplate, setLessonToSaveAsTemplate] = useState<AppLesson | null>(null);

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
                if (!response.ok) throw new Error("Curso no encontrado");
                const courseData: AppCourse = await response.json();
                setCourse(courseData);
            } catch (err) {
                 toast({ title: "Error", description: "No se pudo cargar el curso para editar.", variant: "destructive" });
                 router.push('/manage-courses');
            } finally {
                 setIsLoading(false);
            }
        };
        
        const fetchTemplates = async () => {
            try {
                const res = await fetch('/api/templates');
                if (res.ok) setTemplates(await res.json());
            } catch (e) {
                console.error("Failed to fetch templates", e);
            }
        };

        if (user) {
            fetchCourseData();
            fetchTemplates();
        }
    }, [courseId, user, router, toast, setPageTitle]);
    
     const handleSaveCourse = useCallback(async () => {
        if (!course) return;
        setIsSaving(true);
        
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
            
            setCourse(savedCourse); 
            setIsDirty(false); 
            
            if (courseId === 'new') {
                router.replace(`/manage-courses/${savedCourse.id}/edit`, { scroll: false });
            }

        } catch (error: any) {
            console.error('Error al guardar el curso:', error);
            toast({ title: "Error al Guardar", description: error.message || "No se pudo guardar.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [course, courseId, router, toast]);

    useEffect(() => {
        const EditorActions = () => (
             <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/courses/${courseId}`} target="_blank">
                        <Eye className="mr-2 h-4 w-4" /> Vista Previa
                    </Link>
                </Button>
                <Button onClick={handleSaveCourse} disabled={isSaving || !isDirty} size="sm">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
            </div>
        );

        if (course) {
            setPageTitle(`Editando: ${course.title}`);
            setHeaderActions(<EditorActions />);
            setShowBackButton(true);
        }
        return () => {
            setPageTitle(''); // Reset on unmount
            setHeaderActions(null);
            setShowBackButton(false);
        }
    }, [course, isSaving, isDirty, courseId, setPageTitle, setHeaderActions, setShowBackButton, handleSaveCourse]);


    const handleStateUpdate = useCallback((updater: (prev: AppCourse) => AppCourse) => {
        setCourse(prev => prev ? updater(prev) : null);
        setIsDirty(true);
    }, []);

    const updateCourseField = (field: keyof AppCourse, value: any) => {
        handleStateUpdate(prev => ({ ...prev, [field]: value }));
    };
    
    const updateModuleField = (moduleIndex: number, field: keyof AppModule, value: any) => {
        handleStateUpdate(prev => {
            const newModules = [...prev.modules];
            newModules[moduleIndex] = { ...newModules[moduleIndex], [field]: value };
            return { ...prev, modules: newModules };
        });
    };
    
    const updateLessonField = (moduleIndex: number, lessonIndex: number, field: keyof AppLesson, value: any) => {
        handleStateUpdate(prev => {
            const newCourse = JSON.parse(JSON.stringify(prev));
            newCourse.modules[moduleIndex].lessons[lessonIndex][field] = value;
            return newCourse;
        });
    };
    
    const updateBlockField = (moduleIndex: number, lessonIndex: number, blockIndex: number, field: string, value: any) => {
        handleStateUpdate(prev => {
            const newCourse = JSON.parse(JSON.stringify(prev));
            newCourse.modules[moduleIndex].lessons[lessonIndex].contentBlocks[blockIndex][field] = value;
            return newCourse;
        });
    };

    const updateQuizForBlock = (moduleIndex: number, lessonIndex: number, blockIndex: number, updatedQuiz: AppQuiz) => {
        handleStateUpdate(prev => {
            const newCourse = JSON.parse(JSON.stringify(prev));
            newCourse.modules[moduleIndex].lessons[lessonIndex].contentBlocks[blockIndex].quiz = updatedQuiz;
            return newCourse;
        });
    };

    const handleAddModule = () => {
        const newModule: AppModule = {
            id: generateUniqueId('module'),
            title: 'Nuevo Módulo',
            order: course?.modules.length || 0,
            lessons: [],
        };
        handleStateUpdate(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
    };
    
    const handleAddLessonAction = (moduleIndex: number, type: 'blank' | 'template') => {
        if (type === 'blank') {
            handleAddLesson(moduleIndex);
        } else {
            setActiveModuleIndexForTemplate(moduleIndex);
            setShowTemplateModal(true);
        }
    };
    
    const handleAddLesson = useCallback((moduleIndex: number, template?: ApiTemplate) => {
        if (!course) return;

        let newBlocks: ContentBlock[] = [];
        if (template) {
            newBlocks = template.templateBlocks.map(tb => ({
                id: generateUniqueId('block'),
                type: tb.type as LessonType,
                content: '',
                order: tb.order,
                quiz: tb.type === 'QUIZ' ? {
                    id: generateUniqueId('quiz'),
                    title: 'Nuevo Quiz desde Plantilla',
                    description: '',
                    questions: [],
                    maxAttempts: null,
                } : undefined
            }));
        }

        const newLesson: AppLesson = {
            id: generateUniqueId('lesson'),
            title: template ? `Lección de "${template.name}"` : 'Nueva Lección',
            order: course.modules[moduleIndex].lessons.length,
            contentBlocks: newBlocks,
        };

        handleStateUpdate(prev => {
            const newCourse = JSON.parse(JSON.stringify(prev));
            newCourse.modules[moduleIndex].lessons.push(newLesson);
            return newCourse;
        });
        
        setShowTemplateModal(false);
        setActiveModuleIndexForTemplate(null);
    }, [course, handleStateUpdate]);
    
     const handleAddBlock = useCallback((moduleIndex: number, lessonIndex: number, type: LessonType) => {
        if (!course) return;

        const newBlock: ContentBlock = {
            id: generateUniqueId('block'),
            type: type,
            content: '',
            order: course.modules[moduleIndex].lessons[lessonIndex].contentBlocks.length,
            quiz: type === 'QUIZ' ? { 
                id: generateUniqueId('quiz'), 
                title: 'Nuevo Quiz', 
                description: '', 
                questions: [],
                maxAttempts: null,
            } : undefined
        };
        
        handleStateUpdate(prev => {
            const newCourse = JSON.parse(JSON.stringify(prev));
            newCourse.modules[moduleIndex].lessons[lessonIndex].contentBlocks.push(newBlock);
            return newCourse;
        });
    }, [course, handleStateUpdate]);

    const handleRemoveModule = (moduleIndex: number) => {
         setItemToDeleteDetails({
            name: course?.modules[moduleIndex].title,
            onDelete: () => handleStateUpdate(prev => ({ ...prev, modules: prev.modules.filter((_, index) => index !== moduleIndex) }))
        })
    };

    const handleRemoveLesson = (moduleIndex: number, lessonIndex: number) => {
         setItemToDeleteDetails({
            name: course?.modules[moduleIndex].lessons[lessonIndex].title,
            onDelete: () => {
                handleStateUpdate(prev => {
                    const newModules = [...prev.modules];
                    const newLessons = newModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
                    newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
                    return { ...prev, modules: newModules };
                });
            }
        })
    };
    
    const handleRemoveBlock = (moduleIndex: number, lessonIndex: number, blockIndex: number) => {
        handleStateUpdate(prev => {
            const newModules = [...prev.modules];
            const newLessons = [...newModules[moduleIndex].lessons];
            const newBlocks = newLessons[lessonIndex].contentBlocks.filter((_, index) => index !== blockIndex);
            newLessons[lessonIndex] = { ...newLessons[lessonIndex], contentBlocks: newBlocks };
            newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
            return { ...prev, modules: newModules };
        });
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination || !course) return;

        const newCourse = JSON.parse(JSON.stringify(course));

        if (type === 'MODULES') {
            const [reorderedItem] = newCourse.modules.splice(source.index, 1);
            newCourse.modules.splice(destination.index, 0, reorderedItem);
        } else if (type === 'LESSONS') {
             const sourceModule = newCourse.modules.find(m => m.id === source.droppableId);
             const destModule = newCourse.modules.find(m => m.id === destination.droppableId);
             if (!sourceModule || !destModule) return;

             const [movedItem] = sourceModule.lessons.splice(source.index, 1);
             destModule.lessons.splice(destination.index, 0, movedItem);
        } else if (type === 'BLOCKS') {
             const sourceLesson = newCourse.modules.flatMap(m => m.lessons).find(l => l.id === source.droppableId);
             const destLesson = newCourse.modules.flatMap(m => m.lessons).find(l => l.id === destination.droppableId);
             if (!sourceLesson || !destLesson) return;

             const [movedItem] = sourceLesson.contentBlocks.splice(source.index, 1);
             destLesson.contentBlocks.splice(destination.index, 0, movedItem);
        }
        
        handleStateUpdate(() => newCourse);
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            setIsUploadingImage(true);
            setUploadProgress(0);

            try {
                const result = await uploadWithProgress('/api/upload/course-image', file, setUploadProgress);
                updateCourseField('imageUrl', result.publicUrl);
                toast({ title: 'Imagen Subida', description: 'La imagen de portada se ha actualizado.'});
            } catch (err) {
                 toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
            } finally {
                setIsUploadingImage(false);
            }
        }
    };
    
    const handleSaveTemplate = async (templateName: string, templateDescription: string) => {
        if (!lessonToSaveAsTemplate) return;
        try {
            const res = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: templateName, description: templateDescription, lessonId: lessonToSaveAsTemplate.id })
            });
            if (!res.ok) throw new Error('No se pudo guardar la plantilla');
            toast({ title: 'Plantilla Guardada', description: `La plantilla "${templateName}" se ha guardado correctamente.`});
            const newTemplate = await res.json();
            setTemplates(prev => [...prev, newTemplate]);
            setLessonToSaveAsTemplate(null);
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive"});
        }
    };


    if (isLoading || isAuthLoading || !course) {
        return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (courseId !== 'new' && !isAuthLoading && user?.role !== 'ADMINISTRATOR' && user?.id !== course.instructorId) {
        return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-4"><ShieldAlert className="h-20 w-20 text-red-500 mb-4" /><h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2><p className="text-muted-foreground mb-4">No tienes permiso para editar este curso.</p><Link href="/manage-courses" className={buttonVariants({ variant: "outline" })}>Volver</Link></div>;
    }

    return (
        <div className="space-y-6 pb-24 md:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                                                            onAddLesson={(type) => handleAddLessonAction(moduleIndex, type)}
                                                            onLessonUpdate={(lessonIndex, field, value) => updateLessonField(moduleIndex, lessonIndex, field, value)}
                                                            onLessonDelete={(lessonIndex) => handleRemoveLesson(moduleIndex, lessonIndex)}
                                                            onSaveLessonAsTemplate={(lessonIndex) => setLessonToSaveAsTemplate(course.modules[moduleIndex].lessons[lessonIndex])}
                                                            onAddBlock={(lessonIndex, type) => handleAddBlock(moduleIndex, lessonIndex, type)}
                                                            onBlockUpdate={(lessonIndex, blockIndex, field, value) => updateBlockField(moduleIndex, lessonIndex, blockIndex, field, value)}
                                                            onBlockDelete={(lessonIndex, blockIndex) => handleRemoveBlock(moduleIndex, lessonIndex, blockIndex)}
                                                            onQuizUpdate={(lessonIndex, blockIndex, updatedQuiz) => updateQuizForBlock(moduleIndex, lessonIndex, blockIndex, updatedQuiz)}
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

                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
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
                                    </SelectContent>
                                </Select>
                            </div>
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
                           
                            <div className="space-y-2">
                                <Label>Imagen de Portada</Label>
                                {course.imageUrl && !isUploadingImage ? (
                                    <div className="relative h-32 w-full rounded-md border overflow-hidden p-2 bg-muted/20 mt-2">
                                        <Image src={course.imageUrl} alt="Imagen del Curso" fill className="object-contain p-2" />
                                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-7 w-7" onClick={() => updateCourseField('imageUrl', null)} disabled={isSaving || isUploadingImage}><XCircle className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <>
                                        <UploadArea onFileSelect={(file) => { if(file) handleFileChange({ target: { files: [file] } } as any) }} disabled={isSaving || isUploadingImage} />
                                        {isUploadingImage && <Progress value={uploadProgress} className="mt-2" />}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <AlertDialog open={!!itemToDeleteDetails} onOpenChange={(isOpen) => !isOpen && setItemToDeleteDetails(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar eliminación</AlertDialogTitle><AlertDialogDescription>¿Estás seguro? Esta acción eliminará "{itemToDeleteDetails?.name}" y su contenido.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { itemToDeleteDetails.onDelete(); setItemToDeleteDetails(null) }} className={buttonVariants({ variant: "destructive" })}>Sí, eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <TemplateSelectorModal 
                isOpen={showTemplateModal}
                templates={templates}
                onClose={() => { setShowTemplateModal(false); setActiveModuleIndexForTemplate(null); }}
                onSelect={(template) => {
                    if (activeModuleIndexForTemplate !== null) {
                        handleAddLesson(activeModuleIndexForTemplate, template);
                    }
                }}
            />
             {lessonToSaveAsTemplate && (
                <SaveTemplateModal 
                    isOpen={!!lessonToSaveAsTemplate}
                    onClose={() => setLessonToSaveAsTemplate(null)}
                    onSave={handleSaveTemplate}
                />
            )}
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

// === COMPONENTE PARA EL MODAL DE EDICIÓN DE QUIZ ===
function QuizEditorModal({ isOpen, onClose, quiz, onSave }: { isOpen: boolean, onClose: () => void, quiz: AppQuiz, onSave: (updatedQuiz: AppQuiz) => void }) {
    const [localQuiz, setLocalQuiz] = useState(quiz);

    useEffect(() => {
        setLocalQuiz(quiz);
    }, [quiz, isOpen]);

    const handleQuizMetaChange = (field: 'title' | 'description' | 'maxAttempts', value: string | number | null) => {
        setLocalQuiz(prev => ({...prev, [field]: value}));
    };

    const handleQuestionChange = (qIndex: number, text: string) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[qIndex].text = text;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (qIndex: number, oIndex: number, field: 'text' | 'feedback' | 'points', value: string | number) => {
        const newQuestions = [...localQuiz.questions];
        if (field === 'points') {
             newQuestions[qIndex].options[oIndex][field] = Number(value);
        } else {
            newQuestions[qIndex].options[oIndex][field] = value as string;
        }
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };
    
    const handleSetCorrect = (qIndex: number, correctOptionId: string) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[qIndex].options = newQuestions[qIndex].options.map(opt => ({
            ...opt,
            isCorrect: opt.id === correctOptionId
        }));
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const addQuestion = () => {
        const newQuestion: AppQuestion = {
            id: generateUniqueId('question'),
            text: 'Nueva Pregunta',
            order: localQuiz.questions.length,
            options: [
                { id: generateUniqueId('option'), text: 'Opción 1', isCorrect: true, points: 10 },
                { id: generateUniqueId('option'), text: 'Opción 2', isCorrect: false, points: 0 }
            ]
        };
        setLocalQuiz(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
    };
    
    const addOption = (qIndex: number) => {
        const newOption: AppAnswerOption = {
             id: generateUniqueId('option'),
             text: `Opción ${localQuiz.questions[qIndex].options.length + 1}`,
             isCorrect: false,
             feedback: '',
             points: 0,
        };
        const newQuestions = [...localQuiz.questions];
        newQuestions[qIndex].options.push(newOption);
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const deleteQuestion = (qIndex: number) => {
         setLocalQuiz(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }));
    };

    const deleteOption = (qIndex: number, oIndex: number) => {
        if (localQuiz.questions[qIndex].options.length <= 2) return; // Must have at least 2 options
        const newQuestions = [...localQuiz.questions];
        newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
        
        // If the deleted option was the correct one, set the first one as correct
        if (!newQuestions[qIndex].options.some(opt => opt.isCorrect)) {
            newQuestions[qIndex].options[0].isCorrect = true;
        }

        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSaveChanges = () => {
        onSave(localQuiz);
        onClose();
    };

    if (!localQuiz) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary"/>Editor de Quiz</DialogTitle>
                    <DialogDescription>Añade, edita y gestiona las preguntas y respuestas de este quiz.</DialogDescription>
                </DialogHeader>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-4 border-b">
                    <div className="space-y-1">
                        <Label>Título del Quiz</Label>
                        <Input value={localQuiz.title} onChange={(e) => handleQuizMetaChange('title', e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label>Nº Máximo de Intentos</Label>
                        <Input 
                            type="number" 
                            value={localQuiz.maxAttempts === null ? '' : localQuiz.maxAttempts} 
                            onChange={(e) => handleQuizMetaChange('maxAttempts', e.target.value === '' ? null : parseInt(e.target.value, 10))} 
                            placeholder="Ilimitados"
                            min="1"
                        />
                        <p className="text-xs text-muted-foreground">Deja en blanco para intentos ilimitados.</p>
                    </div>
                </div>
                <ScrollArea className="flex-grow">
                    <div className="space-y-6 p-6">
                        {localQuiz.questions.map((q, qIndex) => (
                            <Card key={q.id} className="bg-muted/30">
                                <CardHeader className="flex flex-row items-center justify-between p-4">
                                     <CardTitle className="text-base flex-grow">
                                        <Input value={q.text} onChange={(e) => handleQuestionChange(qIndex, e.target.value)} placeholder="Texto de la pregunta" className="font-semibold bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:border-primary"/>
                                     </CardTitle>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteQuestion(qIndex)}><Trash2 className="h-4 w-4"/></Button>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <RadioGroup value={q.options.find(opt => opt.isCorrect)?.id} onValueChange={(val) => handleSetCorrect(qIndex, val)}>
                                        <div className="space-y-3">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={opt.id} className={cn("p-3 bg-card border rounded-md space-y-2 transition-colors", opt.isCorrect && "border-green-500/50 bg-green-500/10")}>
                                                    <div className="flex items-center gap-2">
                                                        <RadioGroupItem value={opt.id} id={`q${qIndex}-o${oIndex}`} />
                                                        <Label htmlFor={`q${qIndex}-o${oIndex}`} className="flex-grow font-normal">
                                                            <Input value={opt.text} placeholder="Texto de la opción" onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)} />
                                                        </Label>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                           <Input type="number" value={opt.points || 0} onChange={(e) => handleOptionChange(qIndex, oIndex, 'points', e.target.value)} className="w-16 h-8 text-center"/>
                                                           <span className="text-xs text-muted-foreground">pts</span>
                                                        </div>
                                                         <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70" onClick={() => deleteOption(qIndex, oIndex)}><XCircle className="h-4 w-4"/></Button>
                                                    </div>
                                                    <Input value={opt.feedback || ''} placeholder="Retroalimentación para esta opción (opcional)" onChange={(e) => handleOptionChange(qIndex, oIndex, 'feedback', e.target.value)} className="text-xs h-8"/>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                    <Button size="sm" variant="outline" onClick={() => addOption(qIndex)} className="mt-3">
                                        <PlusCircle className="mr-2 h-4 w-4"/>Añadir Opción
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        <Button variant="secondary" onClick={addQuestion} className="w-full">
                            <FilePlus2 className="mr-2 h-4 w-4"/> Añadir Pregunta
                        </Button>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 border-t">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Guardar Cambios del Quiz</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Modal para seleccionar una plantilla
const TemplateSelectorModal = ({ isOpen, onClose, templates, onSelect }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Usar Plantilla de Lección</DialogTitle>
                    <DialogDescription>Elige una plantilla para crear rápidamente una nueva lección con una estructura predefinida.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4">
                    <div className="p-1 space-y-2">
                        {templates.map(template => (
                            <button key={template.id} onClick={() => onSelect(template)} className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors">
                                <p className="font-semibold">{template.name}</p>
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                                   {template.templateBlocks.map((b,i) => <Badge key={i} variant="secondary">{b.type}</Badge>)}
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

// Modal para guardar una lección como plantilla
const SaveTemplateModal = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(name, description);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <form onSubmit={handleFormSubmit}>
                    <DialogHeader>
                        <DialogTitle>Guardar Lección como Plantilla</DialogTitle>
                        <DialogDescription>Dale un nombre y una descripción a tu nueva plantilla para reutilizarla más tarde.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                            <Input id="template-name" value={name} onChange={e => setName(e.target.value)} required disabled={isSaving}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="template-description">Descripción</Label>
                            <Textarea id="template-description" value={description} onChange={e => setDescription(e.target.value)} disabled={isSaving}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving || !name.trim()}>
                            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <SaveIcon className="mr-2 h-4 w-4"/>}
                            Guardar Plantilla
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
};

    
