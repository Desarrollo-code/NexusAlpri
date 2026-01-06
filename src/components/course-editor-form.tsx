'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, XCircle, Replace, Pencil, Eye, MoreVertical, Archive, Crop, Copy, FilePlus2, ChevronDown, BookOpenText, Video, FileText, Lightbulb, File as FileGenericIcon, BarChart3, Star, Layers3, SaveIcon, Sparkles, Award, Check, Calendar as CalendarIcon, Info, Users, BookOpen, Settings2, Layout, Sliders, Globe, Zap, Target, Filter, Shield, Clock, Palette, EyeOff, Globe as GlobeIcon, Tag, Hash, BarChart, Clock3, Lock, Unlock, CheckCircle, X, Sparkles as SparklesIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
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

const generateUniqueId = (prefix: string): string => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        return `${prefix}-${window.crypto.randomUUID()}`;
    }
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `${prefix}-${timestamp}-${randomPart}`;
};

// === COMPONENTES DE INTERFAZ MEJORADOS ===

const ModuleItem = React.forwardRef<HTMLDivElement, { 
    module: AppModule; 
    moduleIndex: number;
    onUpdate: (field: keyof AppModule, value: any) => void; 
    onAddLesson: (type: 'blank' | 'template') => void; 
    onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void; 
    onLessonDelete: (lessonIndex: number) => void; 
    onSaveLessonAsTemplate: (lessonIndex: number) => void; 
    onAddBlock: (lessonIndex: number, type: LessonType) => void; 
    onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void; 
    onBlockDelete: (lessonIndex: number, blockIndex: number) => void; 
    onEditQuiz: (quiz: AppQuiz) => void; 
    isSaving: boolean; 
    onDelete: () => void; 
    provided: any 
}>(
    ({ module, moduleIndex, onUpdate, onAddLesson, onLessonUpdate, onLessonDelete, onSaveLessonAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, provided }, ref) => {
        const [isExpanded, setIsExpanded] = useState(true);
        
        return (
            <motion.div
                ref={ref}
                {...provided.draggableProps}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative group"
            >
                <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl overflow-hidden">
                    <CardHeader className="pb-3 pt-5 px-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="flex flex-col items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-2 hover:bg-primary/10 rounded-lg transition-all text-gray-400 hover:text-primary">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <Badge 
                                        variant="outline" 
                                        className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20"
                                    >
                                        M{moduleIndex + 1}
                                    </Badge>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <Layers3 className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            MÓDULO
                                        </span>
                                    </div>
                                    
                                    <Input
                                        value={module.title}
                                        onChange={e => onUpdate('title', e.target.value)}
                                        className="text-base font-semibold bg-transparent border-0 focus-visible:ring-0 p-0 h-auto placeholder:text-gray-400"
                                        placeholder="Nombre del módulo..."
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={isSaving}
                                    />
                                    
                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {module.lessons.length} {module.lessons.length === 1 ? 'lección' : 'lecciones'}
                                        </Badge>
                                        <button
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="text-xs text-gray-500 hover:text-primary transition-colors"
                                        >
                                            {isExpanded ? 'Ocultar lecciones' : 'Mostrar lecciones'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10" 
                                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                                disabled={isSaving}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CardContent className="px-5 pb-5 pt-0">
                                    <Droppable droppableId={module.id} type="LESSONS">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 mt-4">
                                                {module.lessons.map((lesson, lessonIndex) => (
                                                    <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                                        {(provided) => (
                                                            <motion.div
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
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
                                                            </motion.div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Añadir lección
                                            </span>
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => onAddLesson('blank')} 
                                                    className="h-8 rounded-lg gap-1"
                                                >
                                                    <FilePlus2 className="h-3.5 w-3.5" />
                                                    Nueva
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => onAddLesson('template')} 
                                                    className="h-8 rounded-lg gap-1"
                                                >
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    Plantilla
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>
        )
    }
);
ModuleItem.displayName = 'ModuleItem';

const LessonItem = React.forwardRef<HTMLDivElement, { 
    lesson: AppLesson; 
    lessonIndex: number;
    onUpdate: (field: keyof AppLesson, value: any) => void; 
    onSaveAsTemplate: () => void; 
    onAddBlock: (type: LessonType) => void; 
    onBlockUpdate: (blockIndex: number, field: string, value: any) => void; 
    onBlockDelete: (blockIndex: number) => void; 
    onEditQuiz: (quiz: AppQuiz) => void; 
    isSaving: boolean; 
    onDelete: () => void; 
}>(
    ({ lesson, lessonIndex, onUpdate, onSaveAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, ...rest }, ref) => {
        const [isExpanded, setIsExpanded] = useState(false);
        
        return (
            <motion.div
                ref={ref}
                {...rest}
                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-all duration-200 group/lesson"
            >
                <div className="flex items-start gap-3">
                    <div className="pt-1">
                        <div {...rest.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing touch-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all">
                            <GripVertical className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="p-1.5 bg-blue-500/10 rounded">
                                    <BookOpenText className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                                            L{lessonIndex + 1}
                                        </Badge>
                                        <Input
                                            value={lesson.title}
                                            onChange={e => onUpdate('title', e.target.value)}
                                            placeholder="Título de la lección"
                                            className="bg-transparent border-0 font-medium focus-visible:ring-0 p-0 h-auto text-sm flex-1 min-w-0"
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-[10px]">
                                    {lesson.contentBlocks.length} bloques
                                </Badge>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? 
                                        <ChevronDown className="h-3.5 w-3.5 rotate-180" /> : 
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    }
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-gray-400 hover:text-destructive"
                                    onClick={onDelete}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <Droppable droppableId={lesson.id} type="BLOCKS">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mt-3">
                                                {lesson.contentBlocks.map((block, blockIndex) => (
                                                    <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                                                        {(provided) => (
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
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                    
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <BlockTypeSelector onSelect={onAddBlock} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        );
    }
);
LessonItem.displayName = 'LessonItem';

const ContentBlockItem = React.forwardRef<HTMLDivElement, { 
    block: ContentBlock; 
    blockIndex: number;
    onUpdate: (field: string, value: any) => void; 
    onEditQuiz: () => void; 
    isSaving: boolean; 
    onDelete: () => void; 
    dragHandleProps: any; 
}>(
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
            if (block.type === 'TEXT') return (
                <RichTextEditor 
                    value={block.content || ''} 
                    onChange={value => onUpdate('content', value)} 
                    placeholder="Escribe aquí el contenido de la lección..." 
                    className="min-h-[80px]" 
                    disabled={isSaving} 
                />
            );
            
            if (block.type === 'VIDEO') return (
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Video className="h-4 w-4" />
                    </div>
                    <Input 
                        value={block.content} 
                        onChange={e => onUpdate('content', e.target.value)} 
                        placeholder="URL del video (YouTube, Vimeo, etc.)" 
                        className="pl-10 h-9" 
                        disabled={isSaving} 
                    />
                </div>
            );
            
            if (block.type === 'FILE') {
                const displayUrl = localPreview || block.content;
                const isImage = displayUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || localPreview?.startsWith('blob:');

                if (displayUrl && !isFileUploading) {
                    const fileName = block.content?.split('/').pop()?.split('-').slice(2).join('-') || 'Archivo adjunto';
                    return (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="p-1.5 bg-amber-500/10 rounded">
                                {isImage ? (
                                    <div className="w-6 h-6 relative rounded overflow-hidden">
                                        <Image src={displayUrl} alt="Preview" fill className="object-cover" />
                                    </div>
                                ) : (
                                    <FileGenericIcon className="h-4 w-4 text-amber-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{fileName}</p>
                            </div>
                            <div className="flex gap-1">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => window.open(displayUrl, '_blank')}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => { onUpdate('content', ''); setLocalPreview(null); }}
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    );
                }
                
                return (
                    <div className="space-y-2">
                        <UploadArea 
                            onFileSelect={handleFileSelect} 
                            disabled={isSaving || isFileUploading} 
                            className="py-4"
                        />
                        {isFileUploading && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Subiendo...</span>
                                    <span>{fileUploadProgress}%</span>
                                </div>
                                <Progress value={fileUploadProgress} className="h-1" />
                            </div>
                        )}
                    </div>
                );
            }
            
            if (block.type === 'QUIZ') return (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-500/10 rounded">
                                <Pencil className="h-4 w-4 text-purple-500" />
                            </div>
                            <Input 
                                value={block.quiz?.title || ''} 
                                onChange={e => onUpdate('quiz', { ...block.quiz, title: e.target.value })} 
                                placeholder="Título del Quiz" 
                                className="border-0 font-medium bg-transparent px-0 w-auto focus-visible:ring-0" 
                                disabled={isSaving} 
                            />
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={onEditQuiz}
                            className="h-7 text-xs"
                        >
                            Configurar
                        </Button>
                    </div>
                </div>
            );
            
            return null;
        };

        const getBlockIcon = () => {
            switch(block.type) {
                case 'TEXT': return <FileText className="h-3.5 w-3.5" />;
                case 'VIDEO': return <Video className="h-3.5 w-3.5" />;
                case 'FILE': return <FileGenericIcon className="h-3.5 w-3.5" />;
                case 'QUIZ': return <Pencil className="h-3.5 w-3.5" />;
                default: return <FileText className="h-3.5 w-3.5" />;
            }
        };

        const getBlockColor = () => {
            switch(block.type) {
                case 'TEXT': return 'bg-blue-500/10 text-blue-600';
                case 'VIDEO': return 'bg-red-500/10 text-red-600';
                case 'FILE': return 'bg-amber-500/10 text-amber-600';
                case 'QUIZ': return 'bg-purple-500/10 text-purple-600';
                default: return 'bg-primary/10 text-primary';
            }
        };

        return (
            <motion.div
                ref={ref}
                {...rest}
                className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-200 dark:border-gray-700"
            >
                <div className="flex items-start gap-1.5">
                    <div {...dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing touch-none opacity-60 hover:opacity-100">
                        <GripVertical className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className={`p-1.5 rounded ${getBlockColor()}`}>
                        {getBlockIcon()}
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 capitalize">
                            {block.type.toLowerCase()}
                        </Badge>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={onDelete} 
                            disabled={isSaving}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                    {renderBlockContent()}
                </div>
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
    const [activeTab, setActiveTab] = useState('basics');

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
        const fetchAllData = async () => {
            if (!user) return;

            try {
                setIsLoading(true);

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
                    setPageTitle('Crear Nuevo Curso');
                    return;
                }

                const [courseRes, templatesRes, certificatesRes, coursesRes] = await Promise.all([
                    fetch(`/api/courses/${courseId}`),
                    fetch('/api/templates'),
                    fetch('/api/certificates/templates'),
                    fetch('/api/courses?simple=true')
                ]);

                if (!courseRes.ok) throw new Error("Curso no encontrado");

                const courseData: AppCourse = await courseRes.json();
                setCourse(courseData);

                if (templatesRes.ok) setTemplates(await templatesRes.json());
                if (certificatesRes.ok) setCertificateTemplates(await certificatesRes.json());
                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setAllCoursesForPrereq((data.courses || []).filter((c: AppCourse) => c.id !== courseId));
                }

            } catch (err) {
                toast({ 
                    title: "Error", 
                    description: "No se pudo cargar el curso para editar.", 
                    variant: "destructive" 
                });
                router.push('/manage-courses');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
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

            toast({ 
                title: "✅ Curso Guardado", 
                description: "La información del curso se ha guardado correctamente.",
                duration: 3000
            });

            setCourse(savedCourse);
            setIsDirty(false);

            if (courseId === 'new') {
                router.replace(`/manage-courses/${savedCourse.id}/edit`, { scroll: false });
            }

            return savedCourse;

        } catch (error: any) {
            console.error('Error al guardar el curso:', error);
            toast({ 
                title: "❌ Error al Guardar", 
                description: error.message || "No se pudo guardar. Intenta nuevamente.", 
                variant: "destructive",
                duration: 5000
            });
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
                setTimeout(() => setIsAssignmentModalOpen(true), 300);
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
                toast({ 
                    title: '✅ Imagen Subida', 
                    description: 'La imagen de portada se ha actualizado correctamente.',
                    duration: 3000
                });
            } catch (err) {
                toast({ 
                    title: '❌ Error de Subida', 
                    description: (err as Error).message, 
                    variant: "destructive",
                    duration: 5000
                });
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
                body: JSON.stringify({ 
                    name: templateName, 
                    description: templateDescription, 
                    lessonId: lessonToSaveAsTemplate.id 
                })
            });
            if (!res.ok) throw new Error('No se pudo guardar la plantilla');
            toast({ 
                title: '✅ Plantilla Guardada', 
                description: `La plantilla "${templateName}" se ha guardado correctamente.`,
                duration: 3000
            });
            const newTemplate = await res.json();
            setTemplates(prev => [...prev, newTemplate]);
            setLessonToSaveAsTemplate(null);
        } catch (err) {
            toast({ 
                title: "❌ Error", 
                description: (err as Error).message, 
                variant: "destructive",
                duration: 5000
            });
        }
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    // Calcular estadísticas del curso
    const courseStats = {
        totalModules: course?.modules?.length || 0,
        totalLessons: course?.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0,
        totalBlocks: course?.modules?.reduce((acc, mod) => 
            acc + (mod.lessons?.reduce((lessonAcc, lesson) => 
                lessonAcc + (lesson.contentBlocks?.length || 0), 0) || 0), 0) || 0,
        hasCertificate: !!course?.certificateTemplateId,
        isMandatory: course?.isMandatory || false,
        hasPrerequisite: !!course?.prerequisiteId,
    };

    if (isLoading || isAuthLoading || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
                </div>
                <p className="mt-4 text-lg font-medium text-muted-foreground animate-pulse">
                    Cargando editor de cursos...
                </p>
            </div>
        );
    }

    if (courseId !== 'new' && !isAuthLoading && user?.role !== 'ADMINISTRATOR' && user?.id !== course.instructorId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
                <div className="bg-destructive/10 p-6 rounded-full mb-6">
                    <ShieldAlert className="h-16 w-16 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                    No tienes los permisos necesarios para editar este curso.
                </p>
                <Link href="/manage-courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a mis cursos
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header Superior con Pestañas */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between h-16 px-6">
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/manage-courses" 
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-semibold">
                                    {courseId === 'new' ? 'Crear Nuevo Curso' : `Editando: ${course.title}`}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {courseId === 'new' ? 'Completa todos los pasos para crear tu curso' : 'Modifica y actualiza tu curso'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                                className="gap-2"
                            >
                                <Link href={`/courses/${courseId === 'new' ? 'preview' : courseId}`} target="_blank">
                                    <Eye className="h-4 w-4" />
                                    Vista previa
                                </Link>
                            </Button>
                            
                            <Button 
                                onClick={handleSaveCourse} 
                                disabled={isSaving || !isDirty}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                    
                    {/* Pestañas de Navegación */}
                    <div className="px-6">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="w-full justify-start h-12 bg-transparent p-0 border-b border-gray-200 dark:border-gray-800">
                                <TabsTrigger 
                                    value="basics" 
                                    className="rounded-none h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    <Layout className="h-4 w-4 mr-2" />
                                    Información Básica
                                </TabsTrigger>
                                
                                <TabsTrigger 
                                    value="curriculum" 
                                    className="rounded-none h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    <Layers3 className="h-4 w-4 mr-2" />
                                    Plan de Estudios
                                </TabsTrigger>
                                
                                <TabsTrigger 
                                    value="advanced" 
                                    className="rounded-none h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    <Settings2 className="h-4 w-4 mr-2" />
                                    Configuración
                                </TabsTrigger>
                                
                                <TabsTrigger 
                                    value="distribution" 
                                    className="rounded-none h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    <GlobeIcon className="h-4 w-4 mr-2" />
                                    Publicación
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {/* PESTAÑA: INFORMACIÓN BÁSICA */}
                    {activeTab === 'basics' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Resumen del Curso */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <Layout className="h-5 w-5 text-primary" />
                                            Detalles del Curso
                                        </CardTitle>
                                        <CardDescription>
                                            Define la información básica que identificará tu curso
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="title" className="text-sm font-medium">
                                                Título del Curso *
                                            </Label>
                                            <Input
                                                id="title"
                                                value={course.title}
                                                onChange={e => updateCourseField('title', e.target.value)}
                                                placeholder="Ej: Master en Desarrollo Web con React 2024"
                                                className="h-12"
                                                disabled={isSaving}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="description" className="text-sm font-medium">
                                                Descripción Completa
                                            </Label>
                                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                <RichTextEditor
                                                    value={course.description || ''}
                                                    onChange={v => updateCourseField('description', v)}
                                                    placeholder="Describe qué aprenderán los estudiantes, los objetivos del curso, los requisitos previos..."
                                                    className="min-h-[200px]"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Panel de Estadísticas */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">
                                            Resumen
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Estado</span>
                                                <Badge 
                                                    variant="outline"
                                                    className={
                                                        course.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                        course.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                                        'bg-gray-500/10 text-gray-600 border-gray-500/20'
                                                    }
                                                >
                                                    {course.status === 'PUBLISHED' ? 'Publicado' :
                                                     course.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Módulos</span>
                                                <span className="font-semibold">{courseStats.totalModules}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Lecciones</span>
                                                <span className="font-semibold">{courseStats.totalLessons}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Contenido</span>
                                                <span className="font-semibold">{courseStats.totalBlocks} bloques</span>
                                            </div>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                {course.isMandatory ? 
                                                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                                    <X className="h-4 w-4 text-gray-400" />
                                                }
                                                <span className="text-sm">Asignación obligatoria</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {course.certificateTemplateId ? 
                                                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                                    <X className="h-4 w-4 text-gray-400" />
                                                }
                                                <span className="text-sm">Certificado incluido</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {course.prerequisiteId ? 
                                                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                                    <X className="h-4 w-4 text-gray-400" />
                                                }
                                                <span className="text-sm">Tiene prerrequisito</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Imagen de Portada */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <ImagePlus className="h-5 w-5 text-primary" />
                                        Imagen de Portada
                                    </CardTitle>
                                    <CardDescription>
                                        Añade una imagen atractiva para tu curso
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative aspect-[21/9] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden group">
                                        {isUploadingImage && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-20">
                                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                                <div className="w-3/4 max-w-xs">
                                                    <div className="flex justify-between text-sm font-medium text-white mb-1">
                                                        <span>Subiendo imagen...</span>
                                                        <span>{uploadProgress}%</span>
                                                    </div>
                                                    <Progress value={uploadProgress} className="h-2" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(localCoverImagePreview || course.imageUrl) && !isUploadingImage ? (
                                            <div className="relative w-full h-full">
                                                <Image 
                                                    src={localCoverImagePreview || course.imageUrl!} 
                                                    alt="Imagen del Curso" 
                                                    fill 
                                                    className="object-cover" 
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                                    <p className="text-white font-medium text-center">
                                                        Haz clic para cambiar la imagen de portada
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            type="button" 
                                                            variant="secondary" 
                                                            size="sm"
                                                            onClick={() => document.getElementById('cover-image-upload')?.click()}
                                                            disabled={isSaving || isUploadingImage}
                                                            className="gap-2"
                                                        >
                                                            <Replace className="h-4 w-4" />
                                                            Cambiar
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="destructive" 
                                                            size="sm"
                                                            onClick={() => { 
                                                                updateCourseField('imageUrl', null); 
                                                                setLocalCoverImagePreview(null); 
                                                            }}
                                                            disabled={isSaving || isUploadingImage}
                                                            className="gap-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Eliminar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <UploadArea 
                                                onFileSelect={(file) => { 
                                                    if (file) handleFileChange({ target: { files: [file] } } as any) 
                                                }} 
                                                inputId="cover-image-upload"
                                                disabled={isSaving || isUploadingImage}
                                                className="w-full h-full cursor-pointer"
                                            >
                                                <div className="text-center p-8">
                                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full border-2 border-dashed border-primary/20 mb-4">
                                                        <ImagePlus className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <p className="text-lg font-semibold mb-2">
                                                        Arrastra una imagen aquí
                                                    </p>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        o haz clic para seleccionar un archivo
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Recomendado: 1920×1080px (relación 16:9)
                                                    </p>
                                                </div>
                                            </UploadArea>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* PESTAÑA: PLAN DE ESTUDIOS */}
                    {activeTab === 'curriculum' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Header del Plan de Estudios */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Plan de Estudios</h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Organiza los módulos y lecciones que formarán tu curso
                                    </p>
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button 
                                        type="button" 
                                        onClick={() => setShowTemplateModal(true)}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <SparklesIcon className="h-4 w-4" />
                                        Usar Plantilla
                                    </Button>
                                    
                                    <Button 
                                        type="button" 
                                        onClick={handleAddModule} 
                                        disabled={isSaving}
                                        className="gap-2"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Nuevo Módulo
                                    </Button>
                                </div>
                            </div>

                            {/* Estadísticas del Currículo */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Layers3 className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Módulos</p>
                                                <p className="text-2xl font-bold">{courseStats.totalModules}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500/10 rounded-lg">
                                                <BookOpenText className="h-5 w-5 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Lecciones</p>
                                                <p className="text-2xl font-bold">{courseStats.totalLessons}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                                <FileText className="h-5 w-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Bloques</p>
                                                <p className="text-2xl font-bold">{courseStats.totalBlocks}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                                <Clock3 className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Duración</p>
                                                <p className="text-2xl font-bold">--:--</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Área de Módulos */}
                            <div className="relative">
                                {course.modules.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                                            <Layers3 className="h-12 w-12 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">
                                            Comienza a construir tu curso
                                        </h3>
                                        <p className="text-gray-500 max-w-md mb-6">
                                            Añade tu primer módulo para organizar el contenido en secciones lógicas
                                        </p>
                                        <div className="flex gap-3">
                                            <Button 
                                                type="button" 
                                                onClick={handleAddModule} 
                                                variant="outline"
                                                className="gap-2"
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Crear Módulo
                                            </Button>
                                            <Button 
                                                type="button" 
                                                onClick={() => setShowTemplateModal(true)}
                                                variant="default"
                                                className="gap-2"
                                            >
                                                <SparklesIcon className="h-4 w-4" />
                                                Usar Plantilla
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="course-modules" type="MODULES">
                                            {(provided) => (
                                                <div 
                                                    {...provided.droppableProps} 
                                                    ref={provided.innerRef} 
                                                    className="space-y-6"
                                                >
                                                    <AnimatePresence>
                                                        {course.modules.map((moduleItem, moduleIndex) => (
                                                            <Draggable 
                                                                key={moduleItem.id} 
                                                                draggableId={moduleItem.id} 
                                                                index={moduleIndex}
                                                            >
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
                                                                        onEditQuiz={handleEditQuiz}
                                                                        isSaving={isSaving} 
                                                                        provided={provided} 
                                                                        ref={provided.innerRef}
                                                                    />
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                    </AnimatePresence>
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* PESTAÑA: CONFIGURACIÓN */}
                    {activeTab === 'advanced' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Configuración Avanzada</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Configura certificados, prerrequisitos y otros ajustes importantes
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Certificado */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <Award className="h-5 w-5 text-primary" />
                                            Certificado del Curso
                                        </CardTitle>
                                        <CardDescription>
                                            Selecciona una plantilla de certificado para otorgar al completar el curso
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <Label htmlFor="certificateTemplate" className="text-sm font-medium">
                                                Plantilla de Certificado
                                            </Label>
                                            <Select 
                                                value={course.certificateTemplateId || 'none'} 
                                                onValueChange={v => updateCourseField('certificateTemplateId', v === 'none' ? null : v)} 
                                                disabled={isSaving}
                                            >
                                                <SelectTrigger id="certificateTemplate">
                                                    <SelectValue placeholder="Sin certificado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No otorgar certificado</SelectItem>
                                                    {certificateTemplates.length > 0 && (
                                                        <>
                                                            <Separator className="my-2" />
                                                            {certificateTemplates.map(template => (
                                                                <SelectItem key={template.id} value={template.id}>
                                                                    {template.name}
                                                                </SelectItem>
                                                            ))}
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <p className="text-sm text-gray-600">
                                                    Los certificados se generan automáticamente cuando un estudiante completa el 100% del curso
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Prerrequisitos */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <Target className="h-5 w-5 text-primary" />
                                            Prerrequisitos
                                        </CardTitle>
                                        <CardDescription>
                                            Establece cursos que los estudiantes deben completar antes de acceder a este
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <Label htmlFor="prerequisite" className="text-sm font-medium">
                                                Curso Prerrequisito
                                            </Label>
                                            <Select 
                                                value={course.prerequisiteId || 'none'} 
                                                onValueChange={v => updateCourseField('prerequisiteId', v === 'none' ? null : v)} 
                                                disabled={isSaving}
                                            >
                                                <SelectTrigger id="prerequisite">
                                                    <SelectValue placeholder="Sin prerrequisito" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin prerrequisito</SelectItem>
                                                    {allCoursesForPrereq.length > 0 && (
                                                        <>
                                                            <Separator className="my-2" />
                                                            {allCoursesForPrereq.map(course => (
                                                                <SelectItem key={course.id} value={course.id}>
                                                                    {course.title}
                                                                </SelectItem>
                                                            ))}
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Asignación Obligatoria */}
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-primary" />
                                            Control de Acceso
                                        </CardTitle>
                                        <CardDescription>
                                            Configura cómo y quién puede acceder a este curso
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                            <div className="space-y-1">
                                                <Label htmlFor="isMandatory" className="text-base font-semibold">
                                                    Asignación Obligatoria
                                                </Label>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Activa esta opción para poder asignar este curso a grupos específicos de estudiantes
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Switch 
                                                    id="isMandatory" 
                                                    checked={course.isMandatory} 
                                                    onCheckedChange={handleMandatorySwitchChange} 
                                                    disabled={isSaving} 
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                                <span className="text-sm font-medium">
                                                    {course.isMandatory ? 'Activado' : 'Desactivado'}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* PESTAÑA: PUBLICACIÓN */}
                    {activeTab === 'distribution' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Publicación y Disponibilidad</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Controla cuándo y cómo estará disponible tu curso para los estudiantes
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Fechas de Disponibilidad */}
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5 text-primary" />
                                            Período de Disponibilidad
                                        </CardTitle>
                                        <CardDescription>
                                            Define las fechas en las que el curso estará disponible para los estudiantes
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
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
                                        </div>
                                        
                                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <div className="text-sm text-gray-600">
                                                    <p className="font-medium mb-1">Información importante:</p>
                                                    <ul className="space-y-1 list-disc list-inside">
                                                        <li>Si no defines fechas, el curso estará disponible permanentemente</li>
                                                        <li>Los estudiantes no podrán acceder fuera del período definido</li>
                                                        <li>Puedes modificar estas fechas en cualquier momento</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Estado y Categoría */}
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg font-semibold">
                                                Estado del Curso
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Select 
                                                value={course.status} 
                                                onValueChange={v => updateCourseField('status', v as CourseStatus)} 
                                                disabled={isSaving}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                            <span>Borrador</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="PUBLISHED">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span>Publicado</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="ARCHIVED">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                            <span>Archivado</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg font-semibold">
                                                Categoría
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Select 
                                                value={course.category || ''} 
                                                onValueChange={v => updateCourseField('category', v)} 
                                                disabled={isSaving}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una categoría" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(settings?.resourceCategories || []).sort().map(category => (
                                                        <SelectItem key={category} value={category}>
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Barra de Acción Flotante */}
            {isDirty && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                >
                    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <span>Tienes cambios sin guardar</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.reload()}
                                        className="rounded-lg"
                                    >
                                        Descartar
                                    </Button>
                                    <Button
                                        onClick={handleSaveCourse}
                                        disabled={isSaving}
                                        className="rounded-lg gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Modales */}
            <AlertDialog open={!!itemToDeleteDetails} onOpenChange={(isOpen) => !isOpen && setItemToDeleteDetails(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-base">
                            ¿Estás seguro de que quieres eliminar "
                            <span className="font-semibold">{itemToDeleteDetails?.name}</span>"?
                            <br />
                            <span className="text-sm text-gray-500 mt-2 block">
                                Esta acción no se puede deshacer y eliminará todo el contenido asociado.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => { 
                                itemToDeleteDetails.onDelete(); 
                                setItemToDeleteDetails(null);
                                toast({
                                    title: "✅ Elemento eliminado",
                                    description: "El elemento se ha eliminado correctamente.",
                                    duration: 3000
                                });
                            }} 
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            Sí, eliminar
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
    );
}

// Selector de tipos de bloque
const BlockTypeSelector = ({ onSelect }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <p className="text-sm font-medium mb-2">Añadir nuevo bloque</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
                variant="outline"
                onClick={() => onSelect('TEXT')}
                className="flex-col h-auto py-2 rounded-md gap-1"
            >
                <div className="p-1.5 bg-blue-500/10 rounded">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <span className="text-xs">Texto</span>
            </Button>
            
            <Button
                variant="outline"
                onClick={() => onSelect('VIDEO')}
                className="flex-col h-auto py-2 rounded-md gap-1"
            >
                <div className="p-1.5 bg-red-500/10 rounded">
                    <Video className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="text-xs">Video</span>
            </Button>
            
            <Button
                variant="outline"
                onClick={() => onSelect('FILE')}
                className="flex-col h-auto py-2 rounded-md gap-1"
            >
                <div className="p-1.5 bg-amber-500/10 rounded">
                    <FileGenericIcon className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <span className="text-xs">Archivo</span>
            </Button>
            
            <Button
                variant="outline"
                onClick={() => onSelect('QUIZ')}
                className="flex-col h-auto py-2 rounded-md gap-1"
            >
                <div className="p-1.5 bg-purple-500/10 rounded">
                    <Pencil className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <span className="text-xs">Quiz</span>
            </Button>
        </div>
    </div>
);

// Modal para seleccionar plantilla
const TemplateSelectorModal = ({ isOpen, onClose, templates, onSelect }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-primary" />
                        Seleccionar Plantilla de Lección
                    </DialogTitle>
                    <DialogDescription>
                        Elige una plantilla predefinida para crear rápidamente una lección con estructura optimizada
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4">
                    <div className="p-1">
                        {templates.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="p-4 bg-primary/10 rounded-full inline-flex mb-4">
                                    <SparklesIcon className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-lg font-semibold mb-2">No hay plantillas disponibles</p>
                                <p className="text-gray-500">
                                    Crea tu primera plantilla guardando una lección existente como plantilla
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {templates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => onSelect(template)}
                                        className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-semibold">
                                                    {template.name}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {template.description || 'Sin descripción'}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {template.templateBlocks.length} bloques
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {template.templateBlocks.slice(0, 3).map((block, i) => (
                                                <Badge 
                                                    key={i} 
                                                    variant="secondary" 
                                                    className="text-xs capitalize"
                                                >
                                                    {block.type.toLowerCase()}
                                                </Badge>
                                            ))}
                                            {template.templateBlocks.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{template.templateBlocks.length - 3} más
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Modal para guardar plantilla
const SaveTemplateModal = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        setIsSaving(true);
        await onSave(name, description);
        setIsSaving(false);
        setName('');
        setDescription('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={handleFormSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <SaveIcon className="h-5 w-5 text-primary" />
                            Guardar como Plantilla
                        </DialogTitle>
                        <DialogDescription>
                            Guarda esta lección como plantilla para reutilizarla en otros cursos
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="template-name" className="text-sm font-medium">
                                Nombre de la plantilla *
                            </Label>
                            <Input
                                id="template-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ej: Lección introductoria de programación"
                                required
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="template-description" className="text-sm font-medium">
                                Descripción
                            </Label>
                            <Textarea
                                id="template-description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe el propósito y contenido de esta plantilla..."
                                disabled={isSaving}
                                className="min-h-[100px]"
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
                            className="gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <SaveIcon className="h-4 w-4" />
                            )}
                            {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
