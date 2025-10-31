// @ts-nocheck
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, XCircle, Replace, Pencil, Eye, MoreVertical, Archive, Crop, Copy, FilePlus2, ChevronDown, BookOpenText, Video, FileText, Lightbulb, File as FileGenericIcon, BarChart3, Star, Layers3, SaveIcon, Sparkles, Award, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, ChangeEvent, useCallback, useMemo } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, LessonType, CourseStatus, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption, ContentBlock } from '@/types';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import type { LessonTemplate, TemplateBlock, CertificateTemplate as PrismaCertificateTemplate } from '@prisma/client';
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
import { Switch } from '@/components/ui/switch';
import { CourseAssignmentModal } from '@/components/course-assignment-modal';
import { QuizEditorModal, optionShapes, optionColors } from '@/components/quizz-it/quiz-editor-modal';

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


const ModuleItem = React.forwardRef<HTMLDivElement, { module: AppModule; onUpdate: (field: keyof AppModule, value: any) => void; onAddLesson: (type: 'blank' | 'template') => void; onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void; onLessonDelete: (lessonIndex: number) => void; onSaveLessonAsTemplate: (lessonIndex: number) => void; onAddBlock: (lessonIndex: number, type: LessonType) => void; onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void; onBlockDelete: (lessonIndex: number, blockIndex: number) => void; onQuizUpdate: (lessonIndex: number, blockIndex: number, updatedQuiz: AppQuiz) => void; onEditQuiz: (moduleIndex: number, lessonIndex: number, blockIndex: number) => void; isSaving: boolean; onDelete: () => void; moduleIndex: number, provided: DraggableProvided }>(
    ({ module, moduleIndex, onUpdate, onAddLesson, onLessonUpdate, onLessonDelete, onSaveLessonAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onQuizUpdate, onEditQuiz, isSaving, onDelete, provided }, ref) => {
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
                                                        onEditQuiz={(blockIndex) => onEditQuiz(moduleIndex, lessonIndex, blockIndex)}
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


const LessonItem = React.forwardRef<HTMLDivElement, { lesson: AppLesson; onUpdate: (field: keyof AppLesson, value: any) => void; onSaveAsTemplate: () => void; onAddBlock: (type: LessonType) => void; onBlockUpdate: (blockIndex: number, field: string, value: any) => void; onBlockDelete: (blockIndex: number) => void; onQuizUpdate: (blockIndex: number, updatedQuiz: AppQuiz) => void; onEditQuiz: (blockIndex: number) => void; isSaving: boolean; onDelete: () => void; }>(
    ({ lesson, onUpdate, onSaveAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onQuizUpdate, onEditQuiz, isSaving, onDelete, ...rest }, ref) => {
        return (
            <div ref={ref} {...rest} className="bg-card p-3 rounded-md border">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 cursor-grab touch-none"><GripVertical className="h-5 w-5 text-muted-foreground" /></div>
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
                                            onEditQuiz={() => onEditQuiz(blockIndex)}
                                            isSaving={isSaving}
                                            dragHandleProps={provided.dragHandleProps}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
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


const ContentBlockItem = React.forwardRef<HTMLDivElement, { block: ContentBlock; onUpdate: (field: string, value: any) => void; onQuizUpdate: (updatedQuiz: AppQuiz) => void; onEditQuiz: () => void; isSaving: boolean; onDelete: () => void; dragHandleProps: any; }>(
    ({ block, onUpdate, onQuizUpdate, onEditQuiz, isSaving, onDelete, dragHandleProps, ...rest }, ref) => {
        const [isFileUploading, setIsFileUploading] = useState(false);
        const [fileUploadProgress, setFileUploadProgress] = useState(0);
        const [localPreview, setLocalPreview] = useState<string | null>(null);
        const { toast } = useToast();

        useEffect(() => {
            return () => { if (localPreview) URL.revokeObjectURL(localPreview); };
        }, [localPreview]);


        const handleFileSelect = async (file: File | null) => {
            if (!file) return;

            if (file.type.startsWith('image/')) setLocalPreview(URL.createObjectURL(file));
            
            setIsFileUploading(true);
            setFileUploadProgress(0);
            
            try {
                const result = await uploadWithProgress('/api/upload/lesson-file', file, setFileUploadProgress);
                onUpdate('content', result.url);
                toast({ title: 'Archivo Subido', description: `El archivo ${file.name} se ha subido correctamente.`});
            } catch (err) {
                toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
                if (localPreview) URL.revokeObjectURL(localPreview);
                setLocalPreview(null);
            } finally {
                setIsFileUploading(false);
            }
        };

        const renderBlockContent = () => {
            if (block.type === 'TEXT') return <RichTextEditor value={block.content || ''} onChange={value => onUpdate('content', value)} placeholder="Escribe aquí el contenido o pega un enlace externo..." disabled={isSaving} />;
            if (block.type === 'VIDEO') return <Input value={block.content} onChange={e => onUpdate('content', e.target.value)} placeholder="URL del video de YouTube" disabled={isSaving} />;
            if (block.type === 'FILE') {
                const displayUrl = localPreview || block.content;
                const isImage = displayUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || localPreview?.startsWith('blob:');

                if (displayUrl && !isFileUploading) {
                    const fileName = block.content?.split('/').pop()?.split('-').slice(2).join('-') || 'Archivo';
                    return (
                        <div className="flex items-center gap-2 p-2 rounded-md border bg-background min-w-0">
                            {isImage ? (<div className="w-10 h-10 relative rounded flex-shrink-0"><Image src={displayUrl} alt="Preview" fill className="object-cover" /></div>) : (<FileGenericIcon className="h-5 w-5 text-primary shrink-0" />)}
                            <span className="text-sm font-medium text-foreground truncate flex-grow min-w-0" title={fileName}>{fileName}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive rounded-full" onClick={() => { onUpdate('content', ''); setLocalPreview(null); }}><XCircle className="h-4 w-4"/></Button>
                        </div>
                    );
                }
                return (
                    <div className="space-y-2">
                        <UploadArea onFileSelect={handleFileSelect} disabled={isSaving || isFileUploading} />
                        {isFileUploading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Progress value={fileUploadProgress} className="w-full h-1.5" /><span>{fileUploadProgress}%</span></div>}
                    </div>
                );
            }
            if (block.type === 'QUIZ') return (
                <div className="flex items-center gap-2 w-full">
                    <Input value={block.quiz?.title || ''} onChange={e => onUpdate('quiz', { ...block.quiz, title: e.target.value })} placeholder="Título del Quiz" disabled={isSaving} />
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onEditQuiz}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar Quiz
                    </Button>
                </div>
            );
            return null;
        };

        return (
            <div ref={ref} {...rest} className="flex items-start gap-2 bg-muted/50 p-2 rounded">
                <div {...dragHandleProps} className="p-1 cursor-grab touch-none mt-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-grow min-w-0">{renderBlockContent()}</div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={onDelete} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
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
    const [allCoursesForPrereq, setAllCoursesForPrereq] = useState<AppCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    const [itemToDeleteDetails, setItemToDeleteDetails] = useState<any>(null);
    
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [localCoverImagePreview, setLocalCoverImagePreview] = useState<string | null>(null);

    const [templates, setTemplates] = useState<ApiTemplate[]>([]);
    const [certificateTemplates, setCertificateTemplates] = useState<PrismaCertificateTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [activeModuleIndexForTemplate, setActiveModuleIndexForTemplate] = useState<number | null>(null);

    const [lessonToSaveAsTemplate, setLessonToSaveAsTemplate] = useState<AppLesson | null>(null);
    
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    
    const [quizToEdit, setQuizToEdit] = useState<{ moduleIndex: number; lessonIndex: number; blockIndex: number; quiz: AppQuiz } | null>(null);


    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllCoursesForPrereq = async () => {
            try {
                const res = await fetch('/api/courses?simple=true');
                if (!res.ok) return;
                const data = await res.json();
                setAllCoursesForPrereq((data.courses || []).filter((c: AppCourse) => c.id !== courseId));
            } catch (e) { console.error(e); }
        };

        const fetchCourseData = async () => {
            if (courseId === 'new') {
                setCourse({
                    id: generateUniqueId('course'),
                    title: 'Nuevo Curso sin Título',
                    description: 'Añade una descripción aquí.',
                    instructor: user as any,
                    instructorId: user?.id,
                    status: 'DRAFT',
                    category: '',
                    modules: [],
                    modulesCount: 0,
                    prerequisiteId: null,
                    isMandatory: false,
                    certificateTemplateId: null,
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

        const fetchCertificateTemplates = async () => {
            try {
                const res = await fetch('/api/certificates/templates');
                if (res.ok) setCertificateTemplates(await res.json());
            } catch (e) {
                console.error("Failed to fetch certificate templates", e);
            }
        }

        if (user) {
            fetchCourseData();
            fetchTemplates();
            fetchCertificateTemplates();
            fetchAllCoursesForPrereq();
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
            
            return savedCourse; // Devolver el curso guardado para encadenar acciones

        } catch (error: any) {
            console.error('Error al guardar el curso:', error);
            toast({ title: "Error al Guardar", description: error.message || "No se pudo guardar.", variant: "destructive" });
            return null; // Devolver null en caso de error
        } finally {
            setIsSaving(false);
        }
    }, [course, courseId, router, toast]);

    const handleMandatorySwitchChange = async (checked: boolean) => {
        if (!course) return;
        
        updateCourseField('isMandatory', checked);
        
        if (checked) {
            const savedCourse = await handleSaveCourse(); // Guardar primero
            if (savedCourse) {
                 // Abrir el modal de asignación después de guardar exitosamente
                 setTimeout(() => setIsAssignmentModalOpen(true), 100);
            }
        }
    };
    
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
        setCourse(prev => {
            if (!prev) return null;
            const newCourse = JSON.parse(JSON.stringify(prev));
            return updater(newCourse);
        });
        setIsDirty(true);
    }, []);

    const updateCourseField = (field: keyof AppCourse, value: any) => {
        handleStateUpdate(prev => {
            prev[field] = value;
            return prev;
        });
    };
    
    const updateModuleField = (moduleIndex: number, field: keyof AppModule, value: any) => {
        handleStateUpdate(prev => {
            prev.modules[moduleIndex][field] = value;
            return prev;
        });
    };
    
    const updateLessonField = (moduleIndex: number, lessonIndex: number, field: keyof AppLesson, value: any) => {
        handleStateUpdate(prev => {
            prev.modules[moduleIndex].lessons[lessonIndex][field] = value;
            return prev;
        });
    };
    
    const updateBlockField = (moduleIndex: number, lessonIndex: number, blockIndex: number, field: string, value: any) => {
        handleStateUpdate(prev => {
            prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks[blockIndex][field] = value;
            return prev;
        });
    };

    const updateQuizForBlock = (moduleIndex: number, lessonIndex: number, blockIndex: number, updatedQuiz: AppQuiz) => {
        handleStateUpdate(prev => {
            prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks[blockIndex].quiz = updatedQuiz;
            return prev;
        });
    };

    const handleAddModule = () => {
        handleStateUpdate(prev => {
            const newModule: AppModule = {
                id: generateUniqueId('module'),
                title: 'Nuevo Módulo',
                order: prev.modules.length,
                lessons: [],
            };
            prev.modules.push(newModule);
            return prev;
        });
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
        handleStateUpdate(prev => {
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
                order: prev.modules[moduleIndex].lessons.length,
                contentBlocks: newBlocks,
            };
            
            prev.modules[moduleIndex].lessons.push(newLesson);
            return prev;
        });
        setShowTemplateModal(false);
        setActiveModuleIndexForTemplate(null);
    }, [handleStateUpdate]);
    
     const handleAddBlock = useCallback((moduleIndex: number, lessonIndex: number, type: LessonType) => {
        handleStateUpdate(prev => {
            const newBlock: ContentBlock = {
                id: generateUniqueId('block'),
                type: type,
                content: '',
                order: prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks.length,
                quiz: type === 'QUIZ' ? { 
                    id: generateUniqueId('quiz'), 
                    title: 'Nuevo Quiz', 
                    description: '', 
                    questions: [],
                    maxAttempts: null,
                } : undefined
            };
            prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks.push(newBlock);
            return prev;
        });
    }, [handleStateUpdate]);

    const handleRemoveModule = (moduleIndex: number) => {
         setItemToDeleteDetails({
            name: course?.modules[moduleIndex].title,
            onDelete: () => handleStateUpdate(prev => {
                prev.modules.splice(moduleIndex, 1);
                return prev;
            })
        })
    };

    const handleRemoveLesson = (moduleIndex: number, lessonIndex: number) => {
         setItemToDeleteDetails({
            name: course?.modules[moduleIndex].lessons[lessonIndex].title,
            onDelete: () => {
                handleStateUpdate(prev => {
                    prev.modules[moduleIndex].lessons.splice(lessonIndex, 1);
                    return prev;
                });
            }
        })
    };
    
    const handleRemoveBlock = (moduleIndex: number, lessonIndex: number, blockIndex: number) => {
        handleStateUpdate(prev => {
            prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks.splice(blockIndex, 1);
            return prev;
        });
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination || !course) return;

        handleStateUpdate(prev => {
            if (type === 'MODULES') {
                const [reorderedItem] = prev.modules.splice(source.index, 1);
                prev.modules.splice(destination.index, 0, reorderedItem);
            } else if (type === 'LESSONS') {
                 const sourceModule = prev.modules.find(m => m.id === source.droppableId);
                 const destModule = prev.modules.find(m => m.id === destination.droppableId);
                 if (!sourceModule || !destModule) return prev;

                 const [movedItem] = sourceModule.lessons.splice(source.index, 1);
                 destModule.lessons.splice(destination.index, 0, movedItem);
            } else if (type === 'BLOCKS') {
                 const sourceLesson = prev.modules.flatMap(m => m.lessons).find(l => l.id === source.droppableId);
                 const destLesson = prev.modules.flatMap(m => m.lessons).find(l => l.id === destination.droppableId);
                 if (!sourceLesson || !destLesson) return prev;

                 const [movedItem] = sourceLesson.contentBlocks.splice(source.index, 1);
                 destLesson.contentBlocks.splice(destination.index, 0, movedItem);
            }
            return prev;
        });
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setLocalCoverImagePreview(previewUrl);

            setIsUploadingImage(true);
            setUploadProgress(0);

            try {
                const result = await uploadWithProgress('/api/upload/course-image', file, setUploadProgress);
                updateCourseField('imageUrl', result.url);
                toast({ title: 'Imagen Subida', description: 'La imagen de portada se ha actualizado.'});
            } catch (err) {
                 toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
                 setLocalCoverImagePreview(null);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };
    
    useEffect(() => {
        // Cleanup local URL on unmount
        return () => {
            if (localCoverImagePreview) {
                URL.revokeObjectURL(localCoverImagePreview);
            }
        };
    }, [localCoverImagePreview]);
    
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
    
    const handleEditQuiz = (moduleIndex: number, lessonIndex: number, blockIndex: number) => {
        const quiz = course?.modules[moduleIndex].lessons[lessonIndex].contentBlocks[blockIndex].quiz;
        if (quiz) {
            setQuizToEdit({ moduleIndex, lessonIndex, blockIndex, quiz });
        }
    };
    
    const handleSaveQuiz = (updatedQuiz: AppQuiz) => {
        if (quizToEdit) {
            updateQuizForBlock(quizToEdit.moduleIndex, quizToEdit.lessonIndex, quizToEdit.blockIndex, updatedQuiz);
            setQuizToEdit(null);
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
                                                            moduleIndex={moduleIndex}
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
                                                            onEditQuiz={(lessonIndex, blockIndex) => handleEditQuiz(moduleIndex, lessonIndex, blockIndex)}
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
                        <CardHeader><CardTitle>Publicación</CardTitle><CardDescription>Controla la visibilidad y dependencias del curso.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select value={course.status} onValueChange={v => updateCourseField('status', v as CourseStatus)} disabled={isSaving}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Borrador</SelectItem>
                                        <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                        <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator/>
                            <div className="space-y-2">
                                <Label htmlFor="prerequisite">Prerrequisito del Curso</Label>
                                <Select value={course.prerequisiteId || 'none'} onValueChange={v => updateCourseField('prerequisiteId', v === 'none' ? null : v)} disabled={isSaving}>
                                    <SelectTrigger id="prerequisite"><SelectValue placeholder="Ninguno"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguno</SelectItem>
                                        <Separator/>
                                        {allCoursesForPrereq.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                 <p className="text-xs text-muted-foreground mt-1">Elige un curso que deba ser completado antes de poder inscribirse a este.</p>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="certificateTemplate">Plantilla de Certificado</Label>
                                <Select value={course.certificateTemplateId || 'none'} onValueChange={v => updateCourseField('certificateTemplateId', v === 'none' ? null : v)} disabled={isSaving}>
                                    <SelectTrigger id="certificateTemplate"><SelectValue placeholder="Sin certificado"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin certificado</SelectItem>
                                        <Separator/>
                                        {certificateTemplates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                 <p className="text-xs text-muted-foreground mt-1">Elige el diseño del certificado que se generará al completar el curso.</p>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="isMandatory" className="flex flex-col space-y-1">
                                    <span>Curso Obligatorio</span>
                                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                                        Si se activa, este curso podrá ser asignado a usuarios específicos.
                                    </span>
                                </Label>
                                <Switch
                                    id="isMandatory"
                                    checked={course.isMandatory}
                                    onCheckedChange={handleMandatorySwitchChange}
                                    disabled={isSaving}
                                />
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
                                {isUploadingImage && (
                                    <div className="w-full space-y-2">
                                        <Progress value={uploadProgress} />
                                        <p className="text-xs text-center text-muted-foreground">Subiendo imagen...</p>
                                    </div>
                                )}
                                {(localCoverImagePreview || course.imageUrl) && !isUploadingImage ? (
                                    <div className="relative aspect-video w-full rounded-md border overflow-hidden p-2 bg-muted/20">
                                        <Image src={localCoverImagePreview || course.imageUrl!} alt="Imagen del Curso" fill className="object-contain p-2" />
                                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-7 w-7" onClick={() => { updateCourseField('imageUrl', null); setLocalCoverImagePreview(null); }} disabled={isSaving}>
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : !isUploadingImage && (
                                    <UploadArea onFileSelect={(file) => { if(file) handleFileChange({ target: { files: [file] } } as any) }} disabled={isSaving || isUploadingImage} />
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
             {isAssignmentModalOpen && (
                <CourseAssignmentModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    courseId={course.id}
                    courseTitle={course.title}
                />
            )}
            {quizToEdit && (
                <QuizEditorModal 
                    isOpen={!!quizToEdit} 
                    onClose={() => setQuizToEdit(null)} 
                    quiz={quizToEdit.quiz}
                    onSave={handleSaveQuiz}
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
             <DropdownMenuItem onSelect={() => onSelect('QUIZ')}><Pencil className="mr-2 h-4 w-4"/>Quiz Interactivo</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

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
