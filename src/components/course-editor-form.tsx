// @ts-nocheck
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, XCircle, Replace, Pencil, Eye, MoreVertical, Archive, Crop, Copy, FilePlus2, ChevronDown, BookOpenText, Video, FileText, Lightbulb, File as FileGenericIcon, BarChart3, Star, Layers3, SaveIcon, Sparkles, Award, Check, Calendar as CalendarIcon, Info, Users, BookOpen, Settings2, Layout, Sliders, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuizGameView } from '@/components/quizz-it/quiz-game-view';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { useTitle } from '@/contexts/title-context';
import { QuizAnalyticsView } from '@/components/analytics/quiz-analytics-view';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Switch } from '@/components/ui/switch';
import { CourseAssignmentModal } from '@/components/course-assignment-modal';
import { QuizEditorModal } from '@/components/quizz-it/quiz-editor-modal';
import type { DateRange } from 'react-day-picker';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';

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


const ModuleItem = React.forwardRef<HTMLDivElement, { module: AppModule; onUpdate: (field: keyof AppModule, value: any) => void; onAddLesson: (type: 'blank' | 'template') => void; onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void; onLessonDelete: (lessonIndex: number) => void; onSaveLessonAsTemplate: (lessonIndex: number) => void; onAddBlock: (lessonIndex: number, type: LessonType) => void; onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void; onBlockDelete: (lessonIndex: number, blockIndex: number) => void; onEditQuiz: (quiz: AppQuiz) => void; isSaving: boolean; onDelete: () => void; moduleIndex: number, provided: any }>(
    ({ module, moduleIndex, onUpdate, onAddLesson, onLessonUpdate, onLessonDelete, onSaveLessonAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, provided }, ref) => {
        return (
            <motion.div
                ref={ref}
                {...provided.draggableProps}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: moduleIndex * 0.05 }}
            >
                <Accordion type="single" collapsible className="w-full bg-card/20 backdrop-blur-xl rounded-[2rem] border border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden group" defaultValue={`item-${module.id}`}>
                    <AccordionItem value={`item-${module.id}`} className="border-0">
                        <div className="flex items-center px-8 py-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-2 hover:bg-primary/20 rounded-xl transition-all mr-4 text-primary/40 hover:text-primary">
                                <GripVertical className="h-6 w-6" />
                            </div>
                            <AccordionTrigger className="flex-grow hover:no-underline p-0 flex items-center gap-5">
                                <div className="bg-primary shadow-lg shadow-primary/20 p-3 rounded-2xl">
                                    <Layers3 className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Módulo {moduleIndex + 1}</span>
                                    <Input
                                        value={module.title}
                                        onChange={e => onUpdate('title', e.target.value)}
                                        className="text-2xl font-black bg-transparent border-0 focus-visible:ring-0 p-0 h-auto tracking-tighter"
                                        placeholder="Nombre del Módulo"
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={isSaving}
                                    />
                                </div>
                            </AccordionTrigger>
                            <div className="flex items-center gap-4 ml-6">
                                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-primary/10 text-[10px] px-4 py-1.5 font-black uppercase tracking-widest hidden sm:flex rounded-full">
                                    {module.lessons.length} Lecciones
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-2xl transition-all" onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={isSaving}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <AccordionContent className="p-8 pt-6 border-t border-primary/5 bg-background/20">
                            <Droppable droppableId={module.id} type="LESSONS">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                        <AnimatePresence>
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
                                                            onEditQuiz={onEditQuiz}
                                                            isSaving={isSaving}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        />
                                                    )}
                                                </Draggable>
                                            ))}
                                        </AnimatePresence>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                            <div className="mt-6 flex justify-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="lg" variant="outline" disabled={isSaving} className="rounded-2xl border-dashed border-2 px-10 py-7 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary font-black text-lg">
                                            <PlusCircle className="mr-3 h-6 w-6" /> Añadir Lección <ChevronDown className="ml-3 h-5 w-5 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-xl border-primary/10 p-1">
                                        <DropdownMenuItem onSelect={() => onAddLesson('blank')} className="rounded-lg gap-2">
                                            <div className="p-1 bg-blue-500/10 rounded-md text-blue-500"><FilePlus2 className="h-4 w-4" /></div>
                                            Lección en Blanco
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onAddLesson('template')} className="rounded-lg gap-2">
                                            <div className="p-1 bg-amber-500/10 rounded-md text-amber-500"><Sparkles className="h-4 w-4" /></div>
                                            Usar de Plantilla
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </motion.div>
        )
    }
);
ModuleItem.displayName = 'ModuleItem';


const LessonItem = React.forwardRef<HTMLDivElement, { lesson: AppLesson; onUpdate: (field: keyof AppLesson, value: any) => void; onSaveAsTemplate: () => void; onAddBlock: (type: LessonType) => void; onBlockUpdate: (blockIndex: number, field: string, value: any) => void; onBlockDelete: (blockIndex: number) => void; onEditQuiz: (quiz: AppQuiz) => void; isSaving: boolean; onDelete: () => void; }>(
    ({ lesson, onUpdate, onSaveAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, ...rest }, ref) => {
        return (
            <motion.div
                ref={ref}
                {...rest}
                className="bg-background/40 backdrop-blur-sm p-4 rounded-xl border border-primary/10 shadow-sm transition-all hover:shadow-md group/lesson"
                layout
            >
                <div className="flex items-center gap-5 mb-6">
                    <div className="p-2 cursor-grab active:cursor-grabbing touch-none hover:bg-primary/10 rounded-xl transition-all text-muted-foreground/30 hover:text-primary">
                        <GripVertical className="h-6 w-6" />
                    </div>
                    <div className="bg-primary/10 p-3 rounded-2xl">
                        <BookOpenText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-grow flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Lección Académica</span>
                        <Input
                            value={lesson.title}
                            onChange={e => onUpdate('title', e.target.value)}
                            placeholder="Título de la lección"
                            className="bg-transparent border-0 font-black focus-visible:ring-0 p-0 h-auto text-xl tracking-tight"
                            disabled={isSaving}
                        />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover/lesson:opacity-100 transition-all">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 rounded-xl"><MoreVertical className="h-5 w-5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-primary/10 p-1 shadow-2xl">
                                <DropdownMenuItem onSelect={onSaveAsTemplate} className="rounded-xl gap-3 py-3 px-4 font-bold">
                                    <SaveIcon className="h-4 w-4 text-primary" /> Guardar como Plantilla
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-primary/5" />
                                <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:bg-destructive/10 rounded-xl gap-3 py-3 px-4 font-bold">
                                    <Trash2 className="h-4 w-4" /> Eliminar Lección
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Droppable droppableId={lesson.id} type="BLOCKS">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {lesson.contentBlocks.map((block, blockIndex) => (
                                <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                                    {(provided) => (
                                        <ContentBlockItem
                                            block={block}
                                            onUpdate={(field, value) => onBlockUpdate(blockIndex, field, value)}
                                            onDelete={() => onBlockDelete(blockIndex)}
                                            onEditQuiz={() => onEditQuiz(block.quiz!)}
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

                <div className="mt-4 pt-4 border-t border-primary/5">
                    <BlockTypeSelector onSelect={onAddBlock} />
                </div>
            </motion.div>
        );
    }
);
LessonItem.displayName = 'LessonItem';


const ContentBlockItem = React.forwardRef<HTMLDivElement, { block: ContentBlock; onUpdate: (field: string, value: any) => void; onEditQuiz: () => void; isSaving: boolean; onDelete: () => void; dragHandleProps: any; }>(
    ({ block, onUpdate, onEditQuiz, isSaving, onDelete, dragHandleProps, ...rest }, ref) => {
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
                toast({ title: 'Archivo Subido', description: `El archivo ${file.name} se ha subido correctamente.` });
            } catch (err) {
                toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
                if (localPreview) URL.revokeObjectURL(localPreview);
                setLocalPreview(null);
            } finally {
                setIsFileUploading(false);
            }
        };

        const renderBlockContent = () => {
            if (block.type === 'TEXT') return <RichTextEditor value={block.content || ''} onChange={value => onUpdate('content', value)} placeholder="Escribe aquí el contenido o pega un enlace externo..." className="rounded-xl overflow-hidden border-primary/5" disabled={isSaving} />;
            if (block.type === 'VIDEO') return (
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-50"><Video className="h-4 w-4" /></div>
                    <Input value={block.content} onChange={e => onUpdate('content', e.target.value)} placeholder="URL del video de YouTube" className="pl-10 h-10 rounded-xl bg-background/50 border-primary/10" disabled={isSaving} />
                </div>
            );
            if (block.type === 'FILE') {
                const displayUrl = localPreview || block.content;
                const isImage = displayUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || localPreview?.startsWith('blob:');

                if (displayUrl && !isFileUploading) {
                    const fileName = block.content?.split('/').pop()?.split('-').slice(2).join('-') || 'Archivo';
                    return (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/10 bg-background/50 group/file">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                {isImage ? (<div className="w-8 h-8 relative rounded overflow-hidden"><Image src={displayUrl} alt="Preview" fill className="object-cover" /></div>) : (<FileGenericIcon className="h-5 w-5 text-primary" />)}
                            </div>
                            <span className="text-sm font-semibold truncate flex-grow" title={fileName}>{fileName}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => { onUpdate('content', ''); setLocalPreview(null); }}><XCircle className="h-4 w-4" /></Button>
                        </div>
                    );
                }
                return (
                    <div className="space-y-2">
                        <UploadArea onFileSelect={handleFileSelect} disabled={isSaving || isFileUploading} className="rounded-xl py-8" />
                        {isFileUploading && <div className="space-y-1.5 px-2"><div className="flex justify-between text-[10px] font-bold text-primary"><span>Subiendo...</span><span>{fileUploadProgress}%</span></div><Progress value={fileUploadProgress} className="h-1.5 rounded-full" /></div>}
                    </div>
                );
            }
            if (block.type === 'QUIZ') return (
                <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-2">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-50"><Pencil className="h-4 w-4" /></div>
                        <Input value={block.quiz?.title || ''} onChange={e => onUpdate('quiz', { ...block.quiz, title: e.target.value })} placeholder="Título del Quiz" className="pl-10 h-11 font-bold rounded-xl border-primary/20 bg-primary/5" disabled={isSaving} />
                    </div>
                    <div className="p-1 border border-primary/10 rounded-2xl bg-background/30 backdrop-blur-sm overflow-hidden shadow-inner">
                        <QuizGameView form={{ ...block.quiz, fields: block.quiz.questions }} isEditorPreview={true} />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="self-start rounded-full px-6 font-bold border-primary/20 hover:bg-primary/10 hover:text-primary transition-all shadow-sm" onClick={onEditQuiz}>
                        <Pencil className="mr-2 h-4 w-4" /> Configurar Preguntas
                    </Button>
                </div>
            );
            return null;
        };

        return (
            <motion.div
                ref={ref}
                {...rest}
                className="flex items-start gap-2 bg-primary/5 p-2 rounded-2xl group/block border border-transparent hover:border-primary/10 transition-all hover:bg-primary/10"
                layout
            >
                <div {...dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing touch-none mt-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                    <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div className="flex-grow min-w-0 py-1">{renderBlockContent()}</div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover/block:opacity-100 hover:bg-destructive/10 rounded-full transition-all mt-2" onClick={onDelete} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
            </motion.div>
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

    const [quizToEdit, setQuizToEdit] = useState<{ quiz: AppQuiz; onSave: (updatedQuiz: AppQuiz) => void } | null>(null);


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
        (payload.modules || []).forEach((mod, mIdx) => {
            mod.order = mIdx;
            (mod.lessons || []).forEach((les, lIdx) => {
                les.order = lIdx;
                (les.contentBlocks || []).forEach((block, bIdx) => {
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

            return savedCourse;

        } catch (error: any) {
            console.error('Error al guardar el curso:', error);
            toast({ title: "Error al Guardar", description: error.message || "No se pudo guardar.", variant: "destructive" });
            return null;
        } finally {
            setIsSaving(false);
        }
    }, [course, courseId, router, toast]);

    const handleMandatorySwitchChange = async (checked: boolean) => {
        if (!course) return;

        updateCourseField('isMandatory', checked);

        if (checked) {
            const savedCourse = await handleSaveCourse();
            if (savedCourse) {
                setTimeout(() => setIsAssignmentModalOpen(true), 100);
            }
        }
    };

    useEffect(() => {
        if (course) {
            setPageTitle(`Editando: ${course.title}`);
            setShowBackButton(true);
        }
        return () => {
            setPageTitle('');
            setHeaderActions(null);
            setShowBackButton(false);
        }
    }, [course, setPageTitle, setHeaderActions, setShowBackButton]);


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

    const handleEditQuiz = (quizToEdit: AppQuiz) => {
        const handleSave = (updatedQuiz: AppQuiz) => {
            handleStateUpdate(prev => {
                for (const mod of (prev.modules || [])) {
                    for (const les of (mod.lessons || [])) {
                        const blockIndex = (les.contentBlocks || []).findIndex(b => b.quiz?.id === quizToEdit.id);
                        if (blockIndex !== -1) {
                            les.contentBlocks[blockIndex].quiz = updatedQuiz;
                            break;
                        }
                    }
                }
                return prev;
            });
            setQuizToEdit(null);
        };

        setQuizToEdit({ quiz: quizToEdit, onSave: handleSave });
    };

    const handleAddModule = () => {
        handleStateUpdate(prev => {
            const newModule: AppModule = {
                id: generateUniqueId('module'),
                title: 'Nuevo Módulo',
                order: (prev.modules || []).length,
                lessons: [],
            };
            if (!prev.modules) prev.modules = [];
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
                order: (prev.modules?.[moduleIndex]?.lessons || []).length,
                contentBlocks: newBlocks,
            };

            if (!prev.modules[moduleIndex].lessons) prev.modules[moduleIndex].lessons = [];
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
                    remedialContent: null,
                } : undefined
            };
            if (!prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks) {
                prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks = [];
            }
            prev.modules[moduleIndex].lessons[lessonIndex].contentBlocks.push(newBlock);
            return prev;
        });
    }, [handleStateUpdate]);

    const handleRemoveModule = (moduleIndex: number) => {
        setItemToDeleteDetails({
            name: course?.modules?.[moduleIndex]?.title,
            onDelete: () => handleStateUpdate(prev => {
                prev.modules.splice(moduleIndex, 1);
                return prev;
            })
        })
    };

    const handleRemoveLesson = (moduleIndex: number, lessonIndex: number) => {
        setItemToDeleteDetails({
            name: course?.modules?.[moduleIndex]?.lessons?.[lessonIndex]?.title,
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
                toast({ title: 'Imagen Subida', description: 'La imagen de portada se ha actualizado.' });
            } catch (err) {
                toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
                setLocalCoverImagePreview(null);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    useEffect(() => {
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
            toast({ title: 'Plantilla Guardada', description: `La plantilla "${templateName}" se ha guardado correctamente.` });
            const newTemplate = await res.json();
            setTemplates(prev => [...prev, newTemplate]);
            setLessonToSaveAsTemplate(null);
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };


    if (isLoading || isAuthLoading || !course) {
        return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (courseId !== 'new' && !isAuthLoading && user?.role !== 'ADMINISTRATOR' && user?.id !== course.instructorId) {
        return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-4"><ShieldAlert className="h-20 w-20 text-red-500 mb-4" /><h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2><p className="text-muted-foreground mb-4">No tienes permiso para editar este curso.</p><Link href="/manage-courses" className={buttonVariants({ variant: "outline" })}>Volver</Link></div>;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-8">
                <Tabs defaultValue="basics" className="w-full">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Navigation Sidebar */}
                        <aside className="w-full lg:w-72 sticky top-24 z-30">
                            <div className="bg-card/40 backdrop-blur-2xl p-4 rounded-3xl border border-primary/10 shadow-xl">
                                <TabsList className="flex flex-col items-stretch bg-transparent h-auto p-0 gap-1">
                                    <TabsTrigger value="basics" className="justify-start gap-3 px-4 py-3.5 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-sm">
                                        <Layout className="h-5 w-5" /> Información Básica
                                    </TabsTrigger>
                                    <TabsTrigger value="curriculum" className="justify-start gap-3 px-4 py-3.5 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-sm">
                                        <Layers3 className="h-5 w-5" /> Plan de Estudios
                                    </TabsTrigger>
                                    <TabsTrigger value="advanced" className="justify-start gap-3 px-4 py-3.5 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-sm">
                                        <Award className="h-5 w-5" /> Ajustes Avanzados
                                    </TabsTrigger>
                                    <TabsTrigger value="distribution" className="justify-start gap-3 px-4 py-3.5 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-sm">
                                        <Globe className="h-5 w-5" /> Distribución
                                    </TabsTrigger>
                                </TabsList>

                                <Separator className="my-4 opacity-50" />

                                <div className="space-y-4 px-2 pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Acciones Privadas</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Button asChild variant="ghost" className="justify-start hover:bg-primary/10 rounded-xl font-bold h-10 px-3" size="sm">
                                            <Link href={`/courses/${courseId}`} target="_blank">
                                                <Eye className="mr-2 h-4 w-4" /> Vista Previa
                                            </Link>
                                        </Button>
                                        <Button onClick={handleSaveCourse} disabled={isSaving || !isDirty} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 h-10 font-bold transition-all">
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 w-full min-w-0">
                            <AnimatePresence mode="wait">
                                {/* BASICS TAB */}
                                <TabsContent value="basics" className="mt-0 outline-none">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex flex-col gap-2 mb-2">
                                            <h2 className="text-3xl font-black tracking-tighter">Información del Curso</h2>
                                            <p className="text-muted-foreground font-medium">Define la identidad visual y descriptiva de tu programa.</p>
                                        </div>

                                        <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl overflow-hidden rounded-[2.5rem]">
                                            <div className="h-2 bg-primary" />
                                            <CardHeader className="pb-4 pt-8 px-8">
                                                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                                    <Layout className="h-7 w-7 text-primary" /> Cuerpo del Curso
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-10 p-8 pt-2">
                                                <div className="space-y-3">
                                                    <Label htmlFor="title" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Título de Impacto</Label>
                                                    <Input id="title" value={course.title} onChange={e => updateCourseField('title', e.target.value)} placeholder="Ej: Master en React 2024" className="text-xl font-black h-16 rounded-2xl border-primary/10 focus:ring-primary/20 bg-background/50 px-8" disabled={isSaving} />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label htmlFor="description" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Contenido y Objetivos</Label>
                                                    <div className="rounded-[2rem] border-2 border-primary/10 overflow-hidden bg-background/40 focus-within:border-primary/40 transition-all shadow-inner">
                                                        <RichTextEditor
                                                            value={course.description || ''}
                                                            onChange={v => updateCourseField('description', v)}
                                                            placeholder="Describe qué aprenderán los estudiantes..."
                                                            className="min-h-[250px] text-lg border-0"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden">
                                            <CardHeader className="pb-4 pt-8 px-8">
                                                <CardTitle className="text-xl font-bold flex items-center gap-3">
                                                    <ImagePlus className="h-6 w-6 text-primary" /> Identidad Visual
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-8 pt-2">
                                                <div className="w-full relative aspect-[21/9] rounded-[2rem] border-4 border-dashed border-primary/10 bg-muted/20 flex items-center justify-center overflow-hidden transition-all hover:bg-muted/30 group">
                                                    {isUploadingImage && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 z-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /><Progress value={uploadProgress} className="w-3/4 h-2 rounded-full" /></div>}
                                                    {(localCoverImagePreview || course.imageUrl) && !isUploadingImage ? (
                                                        <div className="relative w-full h-full">
                                                            <Image src={localCoverImagePreview || course.imageUrl!} alt="Imagen del Curso" fill className="object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                                <Button type="button" variant="secondary" size="lg" className="rounded-2xl font-bold" onClick={() => document.getElementById('cover-image-upload')?.click()} disabled={isSaving || isUploadingImage}><Replace className="mr-2 h-5 w-5" /> Cambiar Imagen</Button>
                                                                <Button type="button" variant="destructive" size="lg" className="rounded-2xl font-bold" onClick={() => { updateCourseField('imageUrl', null); setLocalCoverImagePreview(null); }} disabled={isSaving || isUploadingImage}><XCircle className="mr-2 h-5 w-5" /> Eliminar</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <UploadArea onFileSelect={(file) => { if (file) handleFileChange({ target: { files: [file] } } as any) }} inputId="cover-image-upload" disabled={isSaving || isUploadingImage} className="w-full h-full">
                                                            <div className="text-center text-muted-foreground p-4">
                                                                <div className="bg-primary/20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-primary/10">
                                                                    <ImagePlus className="h-8 w-8 text-primary" />
                                                                </div>
                                                                <p className="text-lg font-black tracking-tight">Suelta aquí tu portada</p>
                                                                <p className="text-sm font-medium opacity-60">Recomendado: 1920x1080 (16:9)</p>
                                                            </div>
                                                        </UploadArea>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </TabsContent>

                                {/* CURRICULUM TAB */}
                                <TabsContent value="curriculum" className="mt-0 outline-none">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                            <div>
                                                <h2 className="text-3xl font-black tracking-tighter">Plan de Estudios</h2>
                                                <p className="text-muted-foreground font-medium">Diseña la arquitectura del conocimiento de tu curso.</p>
                                            </div>
                                            <Button type="button" onClick={handleAddModule} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-6 font-bold text-base shadow-xl shadow-primary/20 transition-all hover:scale-105">
                                                <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Módulo
                                            </Button>
                                        </div>

                                        <div className="space-y-6 min-h-[500px]">
                                            <DragDropContext onDragEnd={onDragEnd}>
                                                <Droppable droppableId="course-modules" type="MODULES">
                                                    {(provided) => (
                                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
                                                            {course.modules.map((moduleItem, moduleIndex) => (
                                                                <Draggable key={moduleItem.id} draggableId={moduleItem.id} index={moduleIndex}>
                                                                    {(provided) => (
                                                                        <ModuleItem
                                                                            module={moduleItem} moduleIndex={moduleIndex}
                                                                            onDelete={() => handleRemoveModule(moduleIndex)}
                                                                            onUpdate={(field, value) => updateModuleField(moduleIndex, field, value)}
                                                                            onAddLesson={(type) => handleAddLessonAction(moduleIndex, type)}
                                                                            onLessonUpdate={(lessonIndex, field, value) => updateLessonField(moduleIndex, lessonIndex, field, value)}
                                                                            onLessonDelete={(lessonIndex) => handleRemoveLesson(moduleIndex, lessonIndex)}
                                                                            onSaveLessonAsTemplate={(lessonIndex) => setLessonToSaveAsTemplate(course.modules[moduleIndex].lessons[lessonIndex])}
                                                                            onAddBlock={(lessonIndex, type) => handleAddBlock(moduleIndex, lessonIndex, type)}
                                                                            onBlockUpdate={(lessonIndex, blockIndex, field, value) => updateBlockField(moduleIndex, lessonIndex, blockIndex, field, value)}
                                                                            onBlockDelete={(lessonIndex, blockIndex) => handleRemoveBlock(moduleIndex, lessonIndex, blockIndex)}
                                                                            onEditQuiz={handleEditQuiz}
                                                                            isSaving={isSaving} provided={provided} ref={provided.innerRef}
                                                                        />
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>
                                            {(course.modules || []).length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-32 text-center bg-card/20 rounded-[3rem] border-4 border-dashed border-primary/5">
                                                    <div className="bg-primary/10 p-8 rounded-full mb-6">
                                                        <Layers3 className="h-16 w-16 text-primary" />
                                                    </div>
                                                    <h3 className="text-2xl font-black mb-2">Construye tu curso</h3>
                                                    <p className="max-w-xs text-muted-foreground font-medium">Añade tu primer módulo para empezar a estructurar las lecciones.</p>
                                                    <Button type="button" onClick={handleAddModule} variant="outline" className="mt-8 rounded-2xl border-primary/20 font-bold px-8 h-12">Empezar Ahora</Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </TabsContent>

                                {/* ADVANCED SETTINGS TAB */}
                                <TabsContent value="advanced" className="mt-0 outline-none">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex flex-col gap-2 mb-2">
                                            <h2 className="text-3xl font-black tracking-tighter">Ajustes de Calidad</h2>
                                            <p className="text-muted-foreground font-medium">Certificaciones, rutas de aprendizaje y control de acceso.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden">
                                                <div className="h-2 bg-emerald-500" />
                                                <CardHeader className="p-8 pb-4">
                                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                                        <Award className="h-6 w-6 text-emerald-500" /> Reconocimiento
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-8 pt-2 space-y-6">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="certificateTemplate" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Certificado Nexus</Label>
                                                        <Select value={course.certificateTemplateId || 'none'} onValueChange={v => updateCourseField('certificateTemplateId', v === 'none' ? null : v)} disabled={isSaving}>
                                                            <SelectTrigger id="certificateTemplate" className="h-14 rounded-2xl border-primary/10 bg-background/50 text-base font-bold px-6 shadow-sm">
                                                                <SelectValue placeholder="Sin certificado" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-primary/10">
                                                                <SelectItem value="none" className="rounded-lg font-bold">No otorgar certificado</SelectItem>
                                                                <DropdownMenuSeparator className="my-1 bg-primary/5" />
                                                                {certificateTemplates.map(t => (<SelectItem key={t.id} value={t.id} className="rounded-lg font-bold">{t.name}</SelectItem>))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[11px] font-bold text-emerald-600 uppercase tracking-widest text-center">
                                                        Los certificados se emiten automáticamente tras completar el 100%
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden">
                                                <div className="h-2 bg-amber-500" />
                                                <CardHeader className="p-8 pb-4">
                                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                                        <Sliders className="h-6 w-6 text-amber-500" /> Control de Flujo
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-8 pt-2 space-y-8">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="prerequisite" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Curso Prerrequisito</Label>
                                                        <Select value={course.prerequisiteId || 'none'} onValueChange={v => updateCourseField('prerequisiteId', v === 'none' ? null : v)} disabled={isSaving}>
                                                            <SelectTrigger id="prerequisite" className="h-14 rounded-2xl border-primary/10 bg-background/50 text-base font-bold px-6 shadow-sm">
                                                                <SelectValue placeholder="Ninguno" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-primary/10 max-h-[300px]">
                                                                <SelectItem value="none" className="rounded-lg font-bold">Sin prerrequisito</SelectItem>
                                                                <DropdownMenuSeparator className="my-1 bg-primary/5" />
                                                                {allCoursesForPrereq.map(c => (<SelectItem key={c.id} value={c.id} className="rounded-lg font-bold">{c.title}</SelectItem>))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4 p-5 border-2 border-primary/10 rounded-[1.5rem] bg-primary/5 transition-all hover:bg-primary/10">
                                                        <div className="space-y-0.5">
                                                            <Label htmlFor="isMandatory" className="text-base font-black tracking-tight">Asignación Obligatoria</Label>
                                                            <p className="text-xs font-medium text-muted-foreground/80">Permite asignar este curso a grupos específicos.</p>
                                                        </div>
                                                        <Switch id="isMandatory" checked={course.isMandatory} onCheckedChange={handleMandatorySwitchChange} disabled={isSaving} className="data-[state=checked]:bg-primary scale-110" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </motion.div>
                                </TabsContent>

                                {/* DISTRIBUTION TAB */}
                                <TabsContent value="distribution" className="mt-0 outline-none">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex flex-col gap-2 mb-2">
                                            <h2 className="text-3xl font-black tracking-tighter">Publicación y Alcance</h2>
                                            <p className="text-muted-foreground font-medium">Controla cuándo y quiénes tienen acceso al curso.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <Card className="md:col-span-2 bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden">
                                                <div className="h-2 bg-primary" />
                                                <CardHeader className="p-8 pb-4">
                                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                                        <CalendarIcon className="h-6 w-6 text-primary" /> Período de Validez
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-8 pt-2">
                                                    <div className="bg-background/40 p-6 rounded-3xl border border-primary/5 shadow-inner">
                                                        <DateRangePicker
                                                            date={{ from: course.startDate ? new Date(course.startDate) : undefined, to: course.endDate ? new Date(course.endDate) : undefined }}
                                                            onDateChange={(range) => {
                                                                updateCourseField('startDate', range?.from?.toISOString());
                                                                updateCourseField('endDate', range?.to?.toISOString());
                                                            }}
                                                        />
                                                        <div className="mt-6 flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                            <p className="text-sm font-medium text-muted-foreground leading-relaxed">Si dejas el rango vacío, el curso estará disponible permanentemente una vez publicado.</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <div className="space-y-6">
                                                <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-[2rem] overflow-hidden">
                                                    <CardHeader className="p-6 pb-2">
                                                        <CardTitle className="text-base font-black uppercase tracking-widest text-muted-foreground/60">Estado Vital</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6 pt-2">
                                                        <Select value={course.status} onValueChange={v => updateCourseField('status', v as CourseStatus)} disabled={isSaving}>
                                                            <SelectTrigger id="status" className="h-14 rounded-2xl border-primary/10 bg-background/50 font-black text-lg shadow-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-primary/10">
                                                                <SelectItem value="DRAFT" className="rounded-lg font-bold">Borrador</SelectItem>
                                                                <SelectItem value="PUBLISHED" className="rounded-lg font-bold">Publicado</SelectItem>
                                                                <SelectItem value="ARCHIVED" className="rounded-lg font-bold">Archivado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </CardContent>
                                                </Card>

                                                <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-[2rem] overflow-hidden">
                                                    <CardHeader className="p-6 pb-2">
                                                        <CardTitle className="text-base font-black uppercase tracking-widest text-muted-foreground/60">Especialidad</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6 pt-2">
                                                        <Select value={course.category || ''} onValueChange={v => updateCourseField('category', v)} disabled={isSaving}>
                                                            <SelectTrigger id="category" className="h-14 rounded-2xl border-primary/10 bg-background/50 font-bold px-4">
                                                                <SelectValue placeholder="Selecciona..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-primary/10">
                                                                {(settings?.resourceCategories || []).sort().map(cat => (<SelectItem key={cat} value={cat} className="rounded-lg font-bold">{cat}</SelectItem>))}
                                                            </SelectContent>
                                                        </Select>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </motion.div>
                                </TabsContent>
                            </AnimatePresence>
                        </div>
                    </div>
                </Tabs>


                {/* Modales */}
                <AlertDialog open={!!itemToDeleteDetails} onOpenChange={(isOpen) => !isOpen && setItemToDeleteDetails(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                            <AlertDialogDescription>¿Estás seguro? Esta acción eliminará "{itemToDeleteDetails?.name}" y su contenido.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { itemToDeleteDetails.onDelete(); setItemToDeleteDetails(null) }} className={buttonVariants({ variant: "destructive" })}>Sí, eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <TemplateSelectorModal
                    isOpen={showTemplateModal}
                    templates={templates}
                    onClose={() => { setShowTemplateModal(false); setActiveModuleIndexForTemplate(null); }}
                    onSelect={(template) => {
                        if (activeModuleIndexForTemplate !== null) {
                            handleAddLesson(activeModuleIndexForTemplate, template);
                            setShowTemplateModal(false);
                            setActiveModuleIndexForTemplate(null);
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
                        onSave={quizToEdit.onSave}
                    />
                )}
            </div>
        </div>
    );
}

const BlockTypeSelector = ({ onSelect }) => (
    <div className="flex flex-wrap items-center gap-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/5 shadow-inner">
        <div className="flex flex-col mr-4">
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">Constructor</span>
            <span className="text-xs font-black text-primary/80">Insertar Bloque</span>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onSelect('TEXT')} className="rounded-2xl border-primary/10 bg-background/50 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all font-bold gap-2 px-5 h-11 shadow-sm">
                <FileText className="h-4 w-4" /> Texto
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSelect('VIDEO')} className="rounded-2xl border-primary/10 bg-background/50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-bold gap-2 px-5 h-11 shadow-sm">
                <Video className="h-4 w-4" /> Video
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSelect('FILE')} className="rounded-2xl border-primary/10 bg-background/50 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all font-bold gap-2 px-5 h-11 shadow-sm">
                <FileGenericIcon className="h-4 w-4" /> Archivo
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSelect('QUIZ')} className="rounded-2xl border-primary/10 bg-background/50 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all font-bold gap-2 px-5 h-11 shadow-sm">
                <Pencil className="h-4 w-4" /> Quiz / Examen
            </Button>
        </div>
    </div>
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
                                    {template.templateBlocks.map((b, i) => <Badge key={i} variant="secondary">{b.type}</Badge>)}
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
                            <Input id="template-name" value={name} onChange={e => setName(e.target.value)} required disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="template-description">Descripción</Label>
                            <Textarea id="template-description" value={description} onChange={e => setDescription(e.target.value)} disabled={isSaving} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving || !name.trim()}>
                            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <SaveIcon className="mr-2 h-4 w-4" />}
                            Guardar Plantilla
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
};
