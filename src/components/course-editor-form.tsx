// @ts-nocheck
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, XCircle, Replace, Pencil, Eye, MoreVertical, Archive, Crop, Copy, FilePlus2, ChevronDown, BookOpenText, Video, FileText, Lightbulb, File as FileGenericIcon, BarChart3, Star, Layers3, SaveIcon, Sparkles, Award, Check, Calendar as CalendarIcon, Info, Users, BookOpen, Package, Layout, Settings, Zap, TrendingUp } from 'lucide-react';
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


const ModuleItem = React.forwardRef<HTMLDivElement, { module: AppModule; onUpdate: (field: keyof AppModule, value: any) => void; onAddLesson: (type: 'blank' | 'template') => void; onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void; onLessonDelete: (lessonIndex: number) => void; onSaveLessonAsTemplate: (lessonIndex: number) => void; onAddBlock: (lessonIndex: number, type: LessonType) => void; onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void; onBlockDelete: (lessonIndex: number, blockIndex: number) => void; onEditQuiz: (quiz: AppQuiz) => void; isSaving: boolean; onDelete: () => void; moduleIndex: number, provided: DraggableProvided }>(
    ({ module, moduleIndex, onUpdate, onAddLesson, onLessonUpdate, onLessonDelete, onSaveLessonAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, provided }, ref) => {
        const lessonCount = module.lessons?.length || 0;
        const blockCount = module.lessons?.reduce((acc, l) => acc + (l.contentBlocks?.length || 0), 0) || 0;
        
        return (
            <div ref={ref} {...provided.draggableProps}>
                <div className="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <Accordion type="single" collapsible className="w-full" defaultValue={`item-${module.id}`}>
                        <AccordionItem value={`item-${module.id}`} className="border-0">
                            <div className="relative flex items-center gap-3 px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
                                <div {...provided.dragHandleProps} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-grab active:cursor-grabbing hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <GripVertical className="h-5 w-5 text-slate-400" />
                                </div>
                                
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm shadow-md">
                                        {moduleIndex + 1}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <Input 
                                            value={module.title} 
                                            onChange={e => onUpdate('title', e.target.value)} 
                                            className="text-lg font-bold border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
                                            placeholder="Nombre del módulo..."
                                            disabled={isSaving} 
                                        />
                                        <div className="flex items-center gap-3 mt-1">
                                            <Badge variant="secondary" className="text-xs font-medium">
                                                <BookOpen className="w-3 h-3 mr-1" />
                                                {lessonCount} {lessonCount === 1 ? 'lección' : 'lecciones'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                <Layers3 className="w-3 h-3 mr-1" />
                                                {blockCount} contenidos
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <AccordionTrigger className="hover:no-underline p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors [&[data-state=open]>svg]:rotate-180">
                                        <ChevronDown className="h-5 w-5 text-slate-500 transition-transform duration-200" />
                                    </AccordionTrigger>
                                    
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" 
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                                        disabled={isSaving}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <AccordionContent className="px-6 py-4">
                                <Droppable droppableId={module.id} type="LESSONS">
                                    {(provided, snapshot) => (
                                        <div 
                                            {...provided.droppableProps} 
                                            ref={provided.innerRef} 
                                            className={cn(
                                                "space-y-3 min-h-[60px] rounded-lg transition-colors duration-200",
                                                snapshot.isDraggingOver && "bg-blue-50/50 dark:bg-blue-950/20"
                                            )}
                                        >
                                            {module.lessons.map((lesson, lessonIndex) => (
                                                <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                                    {(provided, snapshot) => (
                                                        <div className={cn(snapshot.isDragging && "shadow-2xl ring-2 ring-blue-400")}>
                                                            <LessonItem
                                                                lesson={lesson}
                                                                lessonIndex={lessonIndex}
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
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            
                                            {module.lessons.length === 0 && (
                                                <div className="text-center py-8 text-slate-400">
                                                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                    <p className="text-sm font-medium">No hay lecciones aún</p>
                                                    <p className="text-xs mt-1">Añade tu primera lección abajo</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                                
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                size="sm" 
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                                disabled={isSaving}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Añadir Lección
                                                <ChevronDown className="ml-2 h-4 w-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-56">
                                            <DropdownMenuItem onSelect={() => onAddLesson('blank')} className="cursor-pointer">
                                                <FilePlus2 className="mr-2 h-4 w-4 text-blue-500"/>
                                                <div>
                                                    <p className="font-medium">Lección en Blanco</p>
                                                    <p className="text-xs text-slate-500">Comienza desde cero</p>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onAddLesson('template')} className="cursor-pointer">
                                                <Sparkles className="mr-2 h-4 w-4 text-purple-500"/>
                                                <div>
                                                    <p className="font-medium">Usar Plantilla</p>
                                                    <p className="text-xs text-slate-500">Estructura predefinida</p>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        )
    }
);
ModuleItem.displayName = 'ModuleItem';


const LessonItem = React.forwardRef<HTMLDivElement, { lesson: AppLesson; lessonIndex: number; onUpdate: (field: keyof AppLesson, value: any) => void; onSaveAsTemplate: () => void; onAddBlock: (type: LessonType) => void; onBlockUpdate: (blockIndex: number, field: string, value: any) => void; onBlockDelete: (blockIndex: number) => void; onEditQuiz: (quiz: AppQuiz) => void; isSaving: boolean; onDelete: () => void; }>(
    ({ lesson, lessonIndex, onUpdate, onSaveAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, ...rest }, ref) => {
        const blockCount = lesson.contentBlocks?.length || 0;
        
        return (
            <div ref={ref} {...rest} className="group relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-1.5 cursor-grab active:cursor-grabbing rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                    </div>
                    
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs">
                        {lessonIndex + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <Input 
                            value={lesson.title} 
                            onChange={e => onUpdate('title', e.target.value)} 
                            placeholder="Título de la lección..." 
                            className="font-semibold border-0 bg-transparent px-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                            disabled={isSaving} 
                        />
                    </div>
                    
                    <Badge variant="outline" className="text-xs shrink-0">
                        <Package className="w-3 h-3 mr-1" />
                        {blockCount}
                    </Badge>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={onSaveAsTemplate} className="cursor-pointer">
                                <SaveIcon className="mr-2 h-4 w-4 text-blue-500"/>
                                Guardar como Plantilla
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onSelect={onDelete} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Eliminar Lección
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <div className="relative p-4">
                    <Droppable droppableId={lesson.id} type="BLOCKS">
                        {(provided, snapshot) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef} 
                                className={cn(
                                    "space-y-2 min-h-[40px] rounded-md transition-colors duration-200",
                                    snapshot.isDraggingOver && "bg-emerald-50/50 dark:bg-emerald-950/20"
                                )}
                            >
                                {lesson.contentBlocks.map((block, blockIndex) => (
                                    <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                                        {(provided, snapshot) => (
                                            <div className={cn(snapshot.isDragging && "shadow-xl ring-2 ring-emerald-400")}>
                                                <ContentBlockItem
                                                    block={block} 
                                                    blockIndex={blockIndex}
                                                    onUpdate={(field, value) => onBlockUpdate(blockIndex, field, value)} 
                                                    onDelete={() => onBlockDelete(blockIndex)} 
                                                    onEditQuiz={() => onEditQuiz(block.quiz!)}
                                                    isSaving={isSaving}
                                                    dragHandleProps={provided.dragHandleProps}
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                
                                {lesson.contentBlocks.length === 0 && (
                                    <div className="text-center py-6 text-slate-400">
                                        <Layout className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Sin contenido aún</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Droppable>
                    
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <BlockTypeSelector onSelect={onAddBlock} />
                    </div>
                </div>
            </div>
        );
    }
);
LessonItem.displayName = 'LessonItem';


const ContentBlockItem = React.forwardRef<HTMLDivElement, { block: ContentBlock; blockIndex: number; onUpdate: (field: string, value: any) => void; onEditQuiz: () => void; isSaving: boolean; onDelete: () => void; dragHandleProps: any; }>(
    ({ block, blockIndex, onUpdate, onEditQuiz, isSaving, onDelete, dragHandleProps, ...rest }, ref) => {
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

        const getBlockIcon = () => {
            switch(block.type) {
                case 'TEXT': return <FileText className="w-4 h-4" />;
                case 'VIDEO': return <Video className="w-4 h-4" />;
                case 'FILE': return <FileGenericIcon className="w-4 h-4" />;
                case 'QUIZ': return <Pencil className="w-4 h-4" />;
                default: return <Layout className="w-4 h-4" />;
            }
        };

        const getBlockColor = () => {
            switch(block.type) {
                case 'TEXT': return 'from-blue-500 to-cyan-500';
                case 'VIDEO': return 'from-red-500 to-pink-500';
                case 'FILE': return 'from-purple-500 to-indigo-500';
                case 'QUIZ': return 'from-amber-500 to-orange-500';
                default: return 'from-slate-500 to-slate-600';
            }
        };

        const renderBlockContent = () => {
            if (block.type === 'TEXT') return (
                <RichTextEditor 
                    value={block.content || ''} 
                    onChange={value => onUpdate('content', value)} 
                    placeholder="Escribe aquí el contenido o pega un enlace externo..." 
                    disabled={isSaving} 
                />
            );
            
            if (block.type === 'VIDEO') return (
                <div className="space-y-2">
                    <Input 
                        value={block.content} 
                        onChange={e => onUpdate('content', e.target.value)} 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        disabled={isSaving}
                        className="bg-white dark:bg-slate-900"
                    />
                    {block.content && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3" />
                            Video vinculado correctamente
                        </div>
                    )}
                </div>
            );
            
            if (block.type === 'FILE') {
                const displayUrl = localPreview || block.content;
                const isImage = displayUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || localPreview?.startsWith('blob:');

                if (displayUrl && !isFileUploading) {
                    const fileName = block.content?.split('/').pop()?.split('-').slice(2).join('-') || 'Archivo';
                    return (
                        <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            {isImage ? (
                                <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                                    <Image src={displayUrl} alt="Preview" fill className="object-cover" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <FileGenericIcon className="h-6 w-6 text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={fileName}>
                                    {fileName}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">Archivo cargado</p>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full shrink-0" 
                                onClick={() => { onUpdate('content', ''); setLocalPreview(null); }}
                            >
                                <XCircle className="h-4 w-4"/>
                            </Button>
                        </div>
                    );
                }
                return (
                    <div className="space-y-2">
                        <UploadArea onFileSelect={handleFileSelect} disabled={isSaving || isFileUploading} />
                        {isFileUploading && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                    <span>Subiendo archivo...</span>
                                    <span className="font-semibold">{fileUploadProgress}%</span>
                                </div>
                                <Progress value={fileUploadProgress} className="h-2" />
                            </div>
                        )}
                    </div>
                );
            }
            
            if (block.type === 'QUIZ') return (
                <div className="space-y-3">
                    <Input 
                        value={block.quiz?.title || ''} 
                        onChange={e => onUpdate('quiz', { ...block.quiz, title: e.target.value })} 
                        placeholder="Título del Quiz" 
                        disabled={isSaving}
                        className="font-semibold bg-white dark:bg-slate-900"
                    />
                    <div className="p-4 border-2 border-amber-200 dark:border-amber-800 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                        <QuizGameView form={{...block.quiz, fields: block.quiz.questions}} isEditorPreview={true} />
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="w-full bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        onClick={onEditQuiz}
                    >
                        <Pencil className="mr-2 h-4 w-4" /> 
                        Editar Preguntas del Quiz
                    </Button>
                </div>
            );
            
            return null;
        };

        return (
            <div ref={ref} {...rest} className="group relative flex items-start gap-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <div className="flex items-start gap-2 shrink-0">
                    <div {...dragHandleProps} className="p-1.5 cursor-grab active:cursor-grabbing rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-1">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                    </div>
                    
                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br text-white shadow-sm mt-1", getBlockColor())}>
                        {getBlockIcon()}
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">{renderBlockContent()}</div>
                
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                    onClick={onDelete} 
                    disabled={isSaving}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
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
        const EditorActions = () => (
             <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="text-primary-foreground hover:bg-black/20" size="sm">
                    <Link href={`/courses/${courseId}`} target="_blank">
                        <Eye className="mr-2 h-4 w-4" /> Vista Previa
                    </Link>
                </Button>
                <Button onClick={handleSaveCourse} disabled={isSaving || !isDirty} size="sm" className="bg-white/90 text-primary hover:bg-white">
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
            setPageTitle('');
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

    const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const totalBlocks = course?.modules?.reduce((acc, m) => 
        acc + (m.lessons?.reduce((lacc, l) => lacc + (l.contentBlocks?.length || 0), 0) || 0), 0) || 0;

    if (isLoading || isAuthLoading || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] gap-4">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full bg-blue-500/20 animate-ping" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Cargando editor...</p>
            </div>
        );
    }

    if (courseId !== 'new' && !isAuthLoading && user?.role !== 'ADMINISTRATOR' && user?.id !== course.instructorId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-4">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                    <ShieldAlert className="relative h-24 w-24 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Acceso Denegado
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                    No tienes los permisos necesarios para editar este curso.
                </p>
                <Link href="/manage-courses" className={buttonVariants({ variant: "default" })}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Cursos
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="max-w-[1600px] mx-auto p-6">
                {/* Header Stats */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Módulos</p>
                                    <p className="text-3xl font-bold mt-1">{course.modules?.length || 0}</p>
                                </div>
                                <Package className="h-10 w-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">Lecciones</p>
                                    <p className="text-3xl font-bold mt-1">{totalLessons}</p>
                                </div>
                                <BookOpen className="h-10 w-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Contenidos</p>
                                    <p className="text-3xl font-bold mt-1">{totalBlocks}</p>
                                </div>
                                <Layout className="h-10 w-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-amber-100 text-sm font-medium">Estado</p>
                                    <p className="text-xl font-bold mt-1">
                                        {course.status === 'PUBLISHED' ? 'Publicado' : course.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                                    </p>
                                </div>
                                <TrendingUp className="h-10 w-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar Izquierdo */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-2 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    Información Básica
                                </h3>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Título del Curso
                                    </Label>
                                    <Input 
                                        id="title" 
                                        value={course.title} 
                                        onChange={e => updateCourseField('title', e.target.value)} 
                                        placeholder="Ej: Introducción a React" 
                                        disabled={isSaving}
                                        className="font-semibold"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Descripción
                                    </Label>
                                    <Textarea 
                                        id="description" 
                                        value={course.description} 
                                        onChange={e => updateCourseField('description', e.target.value)} 
                                        placeholder="Describe los objetivos y contenido del curso..." 
                                        rows={4} 
                                        disabled={isSaving}
                                        className="resize-none"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Categoría
                                    </Label>
                                    <Select 
                                        value={course.category || ''} 
                                        onValueChange={v => updateCourseField('category', v)} 
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(settings?.resourceCategories || []).sort().map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-2 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <ImagePlus className="h-5 w-5" />
                                    Imagen de Portada
                                </h3>
                            </div>
                            <CardContent className="p-4">
                                <div className="relative aspect-video rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 overflow-hidden group">
                                    {isUploadingImage && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 dark:bg-slate-900/95 z-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-purple-500"/>
                                            <div className="w-3/4">
                                                <Progress value={uploadProgress} className="h-2" />
                                                <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
                                                    {uploadProgress}% completado
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {(localCoverImagePreview || course.imageUrl) && !isUploadingImage ? (
                                        <>
                                            <Image 
                                                src={localCoverImagePreview || course.imageUrl!} 
                                                alt="Imagen del Curso" 
                                                fill 
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                                                <Button 
                                                    type="button" 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-10 w-10 shadow-lg" 
                                                    onClick={() => document.getElementById('cover-image-upload')?.click()} 
                                                    disabled={isSaving || isUploadingImage}
                                                >
                                                    <Replace className="h-5 w-5"/>
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    className="h-10 w-10 shadow-lg" 
                                                    onClick={() => { updateCourseField('imageUrl', null); setLocalCoverImagePreview(null); }} 
                                                    disabled={isSaving || isUploadingImage}
                                                >
                                                    <XCircle className="h-5 w-5"/>
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <UploadArea 
                                            onFileSelect={(file) => { if(file) handleFileChange({ target: { files: [file] } } as any) }} 
                                            inputId="cover-image-upload" 
                                            disabled={isSaving || isUploadingImage}
                                        >
                                            <div className="text-center text-slate-500 dark:text-slate-400">
                                                <ImagePlus className="mx-auto h-12 w-12 mb-3 opacity-50" />
                                                <p className="text-sm font-semibold">Subir imagen de portada</p>
                                                <p className="text-xs mt-1">Recomendado: 16:9 (1920x1080)</p>
                                            </div>
                                        </UploadArea>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Columna Central - Contenido */}
                    <div className="lg:col-span-6 space-y-6">
                        <Card className="border-2 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <Layers3 className="h-5 w-5" />
                                        Estructura del Curso
                                    </h3>
                                    {isDirty && (
                                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse" />
                                            Cambios sin guardar
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="course-modules" type="MODULES">
                                        {(provided, snapshot) => (
                                            <div 
                                                {...provided.droppableProps} 
                                                ref={provided.innerRef} 
                                                className={cn(
                                                    "space-y-4 min-h-[200px] rounded-xl p-4 transition-colors duration-200",
                                                    snapshot.isDraggingOver && "bg-blue-100/50 dark:bg-blue-950/30"
                                                )}
                                            >
                                                {course.modules.map((moduleItem, moduleIndex) => (
                                                    <Draggable key={moduleItem.id} draggableId={moduleItem.id} index={moduleIndex}>
                                                        {(provided, snapshot) => (
                                                            <div className={cn(snapshot.isDragging && "shadow-2xl ring-4 ring-blue-400/50")}>
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
                                                                    onEditQuiz={handleEditQuiz}
                                                                    isSaving={isSaving} 
                                                                    provided={provided} 
                                                                    ref={provided.innerRef}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                                
                                                {(course.modules || []).length === 0 && (
                                                    <div className="text-center py-16">
                                                        <div className="relative inline-block mb-4">
                                                            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 blur-2xl opacity-50 rounded-full" />
                                                            <Package className="relative w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                                            No hay módulos todavía
                                                        </h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                                                            Comienza creando tu primer módulo para estructurar el curso
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                                
                                <Button 
                                    type="button" 
                                    onClick={handleAddModule} 
                                    disabled={isSaving} 
                                    className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                    size="lg"
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" /> 
                                    Añadir Nuevo Módulo
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Sidebar Derecho - Configuración */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-2 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Configuración
                                </h3>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Estado del Curso
                                    </Label>
                                    <Select 
                                        value={course.status} 
                                        onValueChange={v => updateCourseField('status', v as CourseStatus)} 
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger id="status" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DRAFT">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                    Borrador
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="PUBLISHED">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    Publicado
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="ARCHIVED">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                                                    Archivado
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        Vigencia del Curso
                                    </Label>
                                    <DateRangePicker
                                        date={{ 
                                            from: course.startDate ? new Date(course.startDate) : undefined, 
                                            to: course.endDate ? new Date(course.endDate) : undefined 
                                        }}
                                        onDateChange={(range) => {
                                            updateCourseField('startDate', range?.from?.toISOString());
                                            updateCourseField('endDate', range?.to?.toISOString());
                                        }}
                                    />
                                    <p className="text-xs text-slate-500">Define el período de disponibilidad</p>
                                </div>
                                
                                <Separator/>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="prerequisite" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Curso Prerrequisito
                                    </Label>
                                    <Select 
                                        value={course.prerequisiteId || 'none'} 
                                        onValueChange={v => updateCourseField('prerequisiteId', v === 'none' ? null : v)} 
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger id="prerequisite">
                                            <SelectValue placeholder="Sin prerrequisito"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                <span className="text-slate-500">Sin prerrequisito</span>
                                            </SelectItem>
                                            <Separator className="my-1"/>
                                            {allCoursesForPrereq.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="certificateTemplate" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        Certificado de Finalización
                                    </Label>
                                    <Select 
                                        value={course.certificateTemplateId || 'none'} 
                                        onValueChange={v => updateCourseField('certificateTemplateId', v === 'none' ? null : v)} 
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger id="certificateTemplate">
                                            <SelectValue placeholder="Sin certificado"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                <span className="text-slate-500">Sin certificado</span>
                                            </SelectItem>
                                            <Separator className="my-1"/>
                                            {certificateTemplates.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <Separator/>
                                
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800">
                                    <div className="flex-1">
                                        <Label htmlFor="isMandatory" className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
                                            Curso Obligatorio
                                        </Label>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                            Permite asignar este curso a usuarios específicos
                                        </p>
                                    </div>
                                    <Switch 
                                        id="isMandatory" 
                                        checked={course.isMandatory} 
                                        onCheckedChange={handleMandatorySwitchChange} 
                                        disabled={isSaving}
                                        className="ml-3"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Quick Actions */}
                        <Card className="border-2 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Acciones Rápidas
                                </h3>
                            </div>
                            <CardContent className="p-4 space-y-2">
                                <Button 
                                    asChild 
                                    variant="outline" 
                                    className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                >
                                    <Link href={`/courses/${courseId}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" /> 
                                        Vista Previa del Curso
                                    </Link>
                                </Button>
                                
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-950/30"
                                    onClick={() => setShowTemplateModal(true)}
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Explorar Plantillas
                                </Button>
                                
                                {course.isMandatory && (
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                        onClick={() => setIsAssignmentModalOpen(true)}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Asignar a Usuarios
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            
            {/* Modales */}
            <AlertDialog open={!!itemToDeleteDetails} onOpenChange={(isOpen) => !isOpen && setItemToDeleteDetails(null)}>
                <AlertDialogContent className="border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            Confirmar Eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-2">
                            ¿Estás seguro de que deseas eliminar <span className="font-semibold text-slate-900 dark:text-slate-100">"{itemToDeleteDetails?.name}"</span>? 
                            Esta acción no se puede deshacer y se eliminará todo el contenido relacionado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => { 
                                itemToDeleteDetails.onDelete(); 
                                setItemToDeleteDetails(null) 
                            }} 
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            Sí, Eliminar
                        </AlertDialogAction>
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
    );
}

const BlockTypeSelector = ({ onSelect }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed border-2 hover:border-solid hover:bg-slate-50 dark:hover:bg-slate-800"
            >
                <PlusCircle className="mr-2 h-4 w-4"/>
                Añadir Bloque de Contenido
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem onSelect={() => onSelect('TEXT')} className="cursor-pointer p-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-white"/>
                    </div>
                    <div>
                        <p className="font-semibold">Texto / Enlace</p>
                        <p className="text-xs text-slate-500">Contenido de texto enriquecido o URLs</p>
                    </div>
                </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onSelect={() => onSelect('VIDEO')} className="cursor-pointer p-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <Video className="h-4 w-4 text-white"/>
                    </div>
                    <div>
                        <p className="font-semibold">Video de YouTube</p>
                        <p className="text-xs text-slate-500">Integra videos desde YouTube</p>
                    </div>
                </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onSelect={() => onSelect('FILE')} className="cursor-pointer p-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <FileGenericIcon className="h-4 w-4 text-white"/>
                    </div>
                    <div>
                        <p className="font-semibold">Archivo</p>
                        <p className="text-xs text-slate-500">PDFs, imágenes y documentos</p>
                    </div>
                </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onSelect={() => onSelect('QUIZ')} className="cursor-pointer p-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Pencil className="h-4 w-4 text-white"/>
                    </div>
                    <div>
                        <p className="font-semibold">Quiz Interactivo</p>
                        <p className="text-xs text-slate-500">Evaluación con preguntas</p>
                    </div>
                </div>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const TemplateSelectorModal = ({ isOpen, onClose, templates, onSelect }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                        Plantillas de Lección
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona una plantilla predefinida para crear rápidamente tu lección con una estructura profesional.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[500px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                        {templates.map(template => (
                            <button 
                                key={template.id} 
                                onClick={() => onSelect(template)} 
                                className="group relative text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                
                                <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100 pr-8">
                                    {template.name}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    {template.description}
                                </p>
                                
                                <div className="flex flex-wrap gap-2">
                                    {template.templateBlocks.map((b, i) => {
                                        const blockColors = {
                                            TEXT: 'from-blue-500 to-cyan-600',
                                            VIDEO: 'from-red-500 to-pink-600',
                                            FILE: 'from-purple-500 to-indigo-600',
                                            QUIZ: 'from-amber-500 to-orange-600'
                                        };
                                        return (
                                            <Badge 
                                                key={i} 
                                                variant="secondary" 
                                                className={cn("text-xs font-medium bg-gradient-to-r text-white border-0", blockColors[b.type])}
                                            >
                                                {b.type}
                                            </Badge>
                                        );
                                    })}
                                </div>
                                
                                {template.creator?.name && (
                                    <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        Creado por {template.creator.name}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                    
                    {templates.length === 0 && (
                        <div className="text-center py-12">
                            <Sparkles className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                No hay plantillas disponibles
                            </h4>
                            <p className="text-sm text-slate-500">
                                Crea tu primera plantilla guardando una lección existente
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

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
            <DialogContent className="max-w-md">
                <form onSubmit={handleFormSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <SaveIcon className="h-6 w-6 text-blue-500" />
                            Guardar como Plantilla
                        </DialogTitle>
                        <DialogDescription>
                            Crea una plantilla reutilizable con la estructura de esta lección.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name" className="text-sm font-semibold">
                                Nombre de la Plantilla *
                            </Label>
                            <Input 
                                id="template-name" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="Ej: Lección Práctica con Quiz"
                                required 
                                disabled={isSaving}
                                className="font-medium"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="template-description" className="text-sm font-semibold">
                                Descripción
                            </Label>
                            <Textarea 
                                id="template-description" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                placeholder="Describe cuándo usar esta plantilla..."
                                rows={3}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose} 
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSaving || !name.trim()}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4"/>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="mr-2 h-4 w-4"/>
                                    Guardar Plantilla
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};