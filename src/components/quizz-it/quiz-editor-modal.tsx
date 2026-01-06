// src/components/quizz-it/quiz-editor-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { 
    PlusCircle, 
    Trash2, 
    Pencil, 
    Check, 
    X, 
    Image as ImageIcon, 
    Timer, 
    LayoutTemplate, 
    CheckSquare, 
    ImagePlay, 
    BrainCircuit, 
    Info, 
    Eye, 
    Save, 
    XCircle, 
    ListVideo, 
    Settings2, 
    HelpCircle,
    GripVertical
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { stripHtml } from '@/lib/html-utils';
import type { Quiz as AppQuiz, Question as AppQuestion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { UploadArea } from '@/components/ui/upload-area';
import Image from 'next/image';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { QuizGameView } from './quiz-game-view';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { ColorfulLoader } from '../ui/colorful-loader';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-[100px] w-full bg-muted animate-pulse rounded-md" />
});

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const QUILL_MODULES = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ],
};

const TEMPLATE_OPTIONS = [
    { 
        value: 'default', 
        label: 'Múltiple Elección', 
        icon: CheckSquare, 
        description: 'Clásico, con hasta 4 opciones de texto.' 
    },
    { 
        value: 'image', 
        label: 'Pregunta con Imagen', 
        icon: ImagePlay, 
        description: 'Una imagen como foco principal y opciones de texto.' 
    },
    { 
        value: 'true_false', 
        label: 'Verdadero / Falso', 
        icon: BrainCircuit, 
        description: 'Respuesta rápida de dos opciones predefinidas.' 
    },
    { 
        value: 'image_options', 
        label: 'Respuestas con Imágenes', 
        icon: LayoutTemplate, 
        description: 'Usa imágenes como opciones de respuesta.' 
    },
    { 
        value: 'matching', 
        label: 'Emparejamiento', 
        icon: ListVideo, 
        description: 'Arrastra y ordena elementos para que coincidan.' 
    },
    { 
        value: 'fill_blanks', 
        label: 'Rellenar espacios', 
        icon: Pencil, 
        description: 'Escribe las palabras faltantes en el texto.' 
    },
];

const generateUniqueId = (prefix: string): string => 
    `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// ============================================================================
// IMAGE UPLOAD COMPONENT
// ============================================================================

interface ImageUploadWidgetProps {
    imageUrl: string | null;
    onUpload: (url: string) => void;
    onRemove: () => void;
    disabled: boolean;
    inputId: string;
    isCorrect?: boolean;
}

const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({ 
    imageUrl, 
    onUpload, 
    onRemove, 
    disabled, 
    inputId, 
    isCorrect 
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();

    const handleFileSelect = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            const result = await uploadWithProgress('/api/upload/lesson-file', file, setUploadProgress);
            onUpload(result.url);
        } catch (err) {
            toast({ 
                title: "Error de subida", 
                description: (err as Error).message, 
                variant: "destructive" 
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn(
            "relative w-full aspect-square rounded-lg border-2 bg-muted/50 transition-all flex items-center justify-center",
            isCorrect 
                ? "border-primary ring-2 ring-primary/50" 
                : "border-dashed hover:border-primary/50"
        )}>
            {isUploading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                    <ColorfulLoader className="h-5 w-5" />
                    <Progress value={uploadProgress} className="w-full h-1" />
                </div>
            ) : imageUrl ? (
                <div className="relative w-full h-full group">
                    <Image 
                        src={imageUrl} 
                        alt="preview" 
                        fill 
                        className="object-contain p-1" 
                    />
                    <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="h-6 w-6 rounded-full shadow-md" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onRemove(); 
                            }} 
                            disabled={disabled}
                        >
                            <XCircle className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ) : (
                <UploadArea 
                    onFileSelect={handleFileSelect} 
                    disabled={disabled} 
                    inputId={inputId} 
                    className="h-full border-0 bg-transparent p-0"
                >
                    <div className="text-center text-muted-foreground">
                        <ImageIcon className="mx-auto h-5 w-5" />
                    </div>
                </UploadArea>
            )}
        </div>
    );
};

// ============================================================================
// OPTION EDITOR COMPONENT
// ============================================================================

interface OptionEditorProps {
    option: any;
    index: number;
    template: string;
    isCorrect: boolean;
    onTextChange: (value: string) => void;
    onImageChange: (url: string | null) => void;
    onSetCorrect: () => void;
    onDelete: () => void;
    canDelete: boolean;
}

const OptionEditor: React.FC<OptionEditorProps> = ({
    option,
    index,
    template,
    isCorrect,
    onTextChange,
    onImageChange,
    onSetCorrect,
    onDelete,
    canDelete
}) => {
    const renderContent = () => {
        if (template === 'image_options') {
            return (
                <div className="w-full h-full cursor-pointer" onClick={onSetCorrect}>
                    <ImageUploadWidget 
                        inputId={`opt-img-${option.id}`} 
                        imageUrl={option.imageUrl} 
                        onUpload={onImageChange} 
                        onRemove={() => onImageChange(null)} 
                        disabled={false} 
                        isCorrect={isCorrect} 
                    />
                </div>
            );
        }
        
        if (template === 'true_false') {
            return (
                <Button 
                    type="button" 
                    className="w-full h-16 justify-start text-lg rounded-xl transition-all" 
                    variant={isCorrect ? 'default' : 'outline'} 
                    onClick={onSetCorrect}
                >
                    {option.text}
                </Button>
            );
        }
        
        return (
            <div className="bg-background rounded-md overflow-hidden border w-full">
                <ReactQuill
                    theme="snow"
                    value={option.text}
                    onChange={onTextChange}
                    modules={{ toolbar: [['bold', 'italic', 'underline']] }}
                    className="quill-editor-option"
                />
            </div>
        );
    };

    return (
        <motion.div 
            layout 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }} 
            className="group relative"
        >
            <div className={cn(
                "relative flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-300 group-hover:shadow-md",
                isCorrect 
                    ? "border-green-500 bg-green-500/5 shadow-lg shadow-green-500/5" 
                    : "border-primary/5 bg-background/40 hover:border-primary/20"
            )}>
                <div className="flex items-center justify-between mb-1">
                    <div className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                        isCorrect 
                            ? "bg-green-500 text-white" 
                            : "bg-primary/10 text-primary/70"
                    )}>
                        Opción {index + 1}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button 
                            type="button" 
                            onClick={onSetCorrect} 
                            className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300",
                                isCorrect 
                                    ? "bg-green-500 text-white shadow-md scale-110" 
                                    : "bg-background/50 text-muted-foreground hover:bg-green-500/20 hover:text-green-600 border border-primary/10"
                            )}
                        >
                            <Check className="h-3 w-3" />
                        </button>
                        {canDelete && (
                            <button 
                                type="button" 
                                onClick={onDelete} 
                                className="h-6 w-6 rounded-full flex items-center justify-center bg-destructive/10 text-destructive/70 hover:bg-destructive hover:text-white transition-all duration-300 border border-destructive/5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-grow rounded-xl overflow-hidden text-sm">
                    {renderContent()}
                </div>
            </div>
        </motion.div>
    );
};

// ============================================================================
// QUESTION EDITOR COMPONENT
// ============================================================================

interface QuestionEditorProps {
    question: any;
    onQuestionChange: (field: 'text' | 'imageUrl' | 'template', value: string | null) => void;
    onOptionChange: (index: number, field: 'text' | 'imageUrl', value: string | null) => void;
    onSetCorrect: (optionId: string) => void;
    onOptionAdd: () => void;
    onOptionDelete: (index: number) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
    question, 
    onQuestionChange, 
    onOptionChange, 
    onSetCorrect, 
    onOptionAdd, 
    onOptionDelete 
}) => {
    const isImageOptionsTemplate = question?.template === 'image_options';
    const isTrueFalse = question?.template === 'true_false';
    const canAddOption = question.options.length < 4 && !isImageOptionsTemplate && !isTrueFalse;

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl p-3 rounded-2xl border border-primary/10 shadow-sm shrink-0">
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Pencil className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">
                        Editando Pregunta
                    </span>
                </div>

                <div className="px-4 border-l border-primary/10 flex items-center gap-4">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider">
                        Tipo:
                    </Label>
                    <Select 
                        value={question.template || 'default'} 
                        onValueChange={(v) => onQuestionChange('template', v)}
                    >
                        <SelectTrigger className="h-10 w-48 rounded-xl border-primary/10 bg-background/50 font-bold text-sm">
                            <SelectValue placeholder="Tipo de Pregunta" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/10 overflow-hidden">
                            {TEMPLATE_OPTIONS.map((opt) => (
                                <SelectItem 
                                    key={opt.value} 
                                    value={opt.value} 
                                    className="font-bold py-2.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <opt.icon className="h-4 w-4 text-primary" />
                                        {opt.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden min-h-0 pt-2">
                <ScrollArea className="h-full scrollbar-thin">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="space-y-6 pb-8"
                    >
                        {/* Question Statement */}
                        <Card className="backdrop-blur-xl bg-card/40 border-primary/10 shadow-xl overflow-hidden rounded-3xl">
                            <CardHeader className="bg-primary/5 pb-3 pt-5 px-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Pencil className="h-4 w-4 text-primary" /> 
                                    Enunciado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="bg-background/40 rounded-2xl overflow-hidden border border-primary/10 transition-all shadow-inner">
                                    <ReactQuill
                                        theme="snow"
                                        value={question.text || ''}
                                        onChange={(v) => onQuestionChange('text', v)}
                                        modules={QUILL_MODULES}
                                        placeholder="Escribe el enunciado..."
                                        className="quill-editor-custom text-sm font-medium"
                                    />
                                </div>

                                {question.template === 'image' && (
                                    <div className="space-y-3 pt-3 border-t border-primary/5">
                                        <Label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest ml-1">
                                            Imagen de Apoyo
                                        </Label>
                                        <div className="max-w-[280px]">
                                            <ImageUploadWidget 
                                                inputId={`q-img-${question.id}`} 
                                                imageUrl={question.imageUrl} 
                                                onUpload={(url) => onQuestionChange('imageUrl', url)} 
                                                onRemove={() => onQuestionChange('imageUrl', null)} 
                                                disabled={false} 
                                                isCorrect={false} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Answer Options */}
                        <Card className="backdrop-blur-xl bg-card/40 border-primary/10 shadow-xl overflow-hidden rounded-3xl">
                            <CardHeader className="bg-primary/5 pb-4 pt-5 px-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <CheckSquare className="h-4 w-4 text-primary" /> 
                                    Opciones de Respuesta
                                </CardTitle>
                                {canAddOption && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={onOptionAdd} 
                                        className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded-xl font-bold px-4 h-9 transition-all hover:scale-105 active:scale-95 text-xs"
                                    >
                                        <PlusCircle className="mr-2 h-3.5 w-3.5" /> 
                                        Añadir
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className={cn(
                                "p-6 grid gap-4", 
                                isImageOptionsTemplate 
                                    ? "grid-cols-2 lg:grid-cols-4" 
                                    : "grid-cols-1 lg:grid-cols-2"
                            )}>
                                <AnimatePresence mode="popLayout">
                                    {(question.options || []).slice(0, 4).map((opt: any, index: number) => (
                                        <OptionEditor
                                            key={opt.id}
                                            option={opt}
                                            index={index}
                                            template={question.template}
                                            isCorrect={opt.isCorrect}
                                            onTextChange={(v) => onOptionChange(index, 'text', v)}
                                            onImageChange={(url) => onOptionChange(index, 'imageUrl', url)}
                                            onSetCorrect={() => onSetCorrect(opt.id)}
                                            onDelete={() => onOptionDelete(index)}
                                            canDelete={question.options.length > (isTrueFalse ? 2 : 1)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                </ScrollArea>
            </div>
        </div>
    );
};

// ============================================================================
// QUESTION LIST SIDEBAR
// ============================================================================

interface QuestionListProps {
    questions: AppQuestion[];
    activeIndex: number;
    onSelect: (index: number) => void;
    onDelete: (index: number) => void;
    onAdd: () => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    activeIndex,
    onSelect,
    onDelete,
    onAdd
}) => {
    return (
        <div className="md:col-span-3 border-r border-primary/10 flex flex-col bg-card/30 backdrop-blur-md h-full">
            <div className="p-6 border-b border-primary/5 shrink-0">
                <Button 
                    onClick={onAdd} 
                    className="w-full h-12 bg-primary/10 hover:bg-primary/20 text-primary border-0 rounded-2xl font-bold text-sm shadow-none transition-all hover:scale-[1.02]"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> 
                    Nueva Pregunta
                </Button>
            </div>
            <ScrollArea className="flex-1 px-4 py-6">
                <div className="space-y-3">
                    {questions.map((q, index) => (
                        <motion.div key={q.id} layout>
                            <button
                                onClick={() => onSelect(index)}
                                className={cn(
                                    "w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-3 items-center group relative overflow-hidden",
                                    activeIndex === index
                                        ? "bg-primary border-primary shadow-lg shadow-primary/20 text-primary-foreground"
                                        : "bg-background/40 border-primary/5 hover:border-primary/20 hover:bg-primary/5"
                                )}
                            >
                                <span className={cn(
                                    "h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0",
                                    activeIndex === index 
                                        ? "bg-white text-primary" 
                                        : "bg-primary/20 text-primary"
                                )}>
                                    {index + 1}
                                </span>
                                <span className="truncate flex-grow font-bold text-sm tracking-tight">
                                    {stripHtml(q.text) || "Sin título"}
                                </span>
                                {questions.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity",
                                            activeIndex === index 
                                                ? "hover:bg-white/20 text-white" 
                                                : "text-destructive hover:bg-destructive/10"
                                        )}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            onDelete(index);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

// ============================================================================
// SETTINGS TAB
// ============================================================================

interface SettingsTabProps {
    quiz: AppQuiz;
    onUpdate: (updates: Partial<AppQuiz>) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ quiz, onUpdate }) => {
    return (
        <ScrollArea className="h-full w-full scrollbar-visible">
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[1400px] mx-auto">
                {/* Quiz Details */}
                <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-4 pt-6 px-7">
                        <CardTitle className="text-base font-bold flex items-center gap-2.5">
                            <Info className="h-5 w-5 text-primary" /> 
                            Detalles del Quiz
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-7 space-y-6">
                        <div className="space-y-2.5">
                            <Label htmlFor="quiz-title" className="text-[14px] font-bold text-muted-foreground/80 ml-1">
                                Título del Quiz
                            </Label>
                            <Input
                                id="quiz-title"
                                value={quiz.title}
                                onChange={e => onUpdate({ title: e.target.value })}
                                className="text-base font-bold h-12 rounded-xl border-primary/10 focus:ring-primary/20 bg-background/50 px-5"
                                placeholder="Ej: Quiz Final de Módulo"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="quiz-description" className="text-[14px] font-bold text-muted-foreground/80 ml-1">
                                Instrucciones o Descripción
                            </Label>
                            <Textarea
                                id="quiz-description"
                                value={quiz.description || ''}
                                onChange={e => onUpdate({ description: e.target.value })}
                                rows={4}
                                className="text-sm font-semibold rounded-xl border-primary/10 focus:ring-primary/20 bg-background/50 p-5 resize-none"
                                placeholder="Instrucciones para tus alumnos..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Game Configuration */}
                <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-4 pt-6 px-7">
                        <CardTitle className="text-base font-bold flex items-center gap-2.5">
                            <Timer className="h-5 w-5 text-primary" /> 
                            Configuración de Juego
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-7 space-y-6">
                        <div className="space-y-2.5">
                            <Label htmlFor="quiz-max-attempts" className="text-[14px] font-bold text-muted-foreground/80 ml-1">
                                Límite de Intentos
                            </Label>
                            <Input
                                id="quiz-max-attempts"
                                type="number"
                                value={quiz.maxAttempts || ''}
                                onChange={e => onUpdate({ 
                                    maxAttempts: e.target.value ? parseInt(e.target.value) : null 
                                })}
                                className="text-base font-bold h-12 rounded-xl border-primary/10 focus:ring-primary/20 bg-background/50 px-5"
                                placeholder="Ilimitados"
                            />
                            <p className="text-[12px] font-bold text-muted-foreground/60 pl-1 italic">
                                Deja vacío para que no haya límite.
                            </p>
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="quiz-timer-style" className="text-[14px] font-bold text-muted-foreground/80 ml-1">
                                Estilo Visual del Tiempo
                            </Label>
                            <Select 
                                value={quiz.timerStyle || 'circular'} 
                                onValueChange={(v) => onUpdate({ timerStyle: v })}
                            >
                                <SelectTrigger 
                                    id="quiz-timer-style" 
                                    className="h-12 rounded-xl border-primary/10 bg-background/50 text-sm font-bold px-5"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-primary/10 overflow-hidden">
                                    <SelectItem value="circular" className="rounded-lg py-2 font-bold text-sm">
                                        Reloj Circular
                                    </SelectItem>
                                    <SelectItem value="bar" className="rounded-lg py-2 font-bold text-sm">
                                        Barra de Progreso
                                    </SelectItem>
                                    <SelectItem value="pill" className="rounded-lg py-2 font-bold text-sm">
                                        Píldora Flotante
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
};

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

interface QuizEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: AppQuiz;
    onSave: (updatedQuiz: AppQuiz) => void;
}

export function QuizEditorModal({ 
    isOpen, 
    onClose, 
    quiz, 
    onSave 
}: QuizEditorModalProps) {
    const [localQuiz, setLocalQuiz] = useState<AppQuiz>(quiz);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Sync with external quiz changes
    useEffect(() => {
        if (quiz) {
            setLocalQuiz(JSON.parse(JSON.stringify(quiz)));
            setActiveQuestionIndex(0);
        }
    }, [quiz, isOpen]);

    // ========================================================================
    // HANDLERS - Question Management
    // ========================================================================

    const handleQuestionChange = (
        field: 'text' | 'imageUrl' | 'template', 
        value: string | null
    ) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex] as any)[field] = value;

        // Handle template-specific logic
        if (field === 'template') {
            if (value === 'true_false') {
                newQuestions[activeQuestionIndex].options = [
                    { 
                        id: generateUniqueId('opt'), 
                        text: 'Verdadero', 
                        imageUrl: null, 
                        isCorrect: true, 
                        points: 10 
                    },
                    { 
                        id: generateUniqueId('opt'), 
                        text: 'Falso', 
                        imageUrl: null, 
                        isCorrect: false, 
                        points: 0 
                    }
                ];
            } else if (value === 'image_options') {
                let options = newQuestions[activeQuestionIndex].options;
                while (options.length < 4) {
                    options.push({ 
                        id: generateUniqueId('opt'), 
                        text: '', 
                        imageUrl: null, 
                        isCorrect: false, 
                        points: 0 
                    });
                }
                newQuestions[activeQuestionIndex].options = options.slice(0, 4);
            }
        }

        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (
        optionIndex: number, 
        field: 'text' | 'imageUrl', 
        value: string | null
    ) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex].options[optionIndex] as any)[field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSetCorrect = (optionId: string) => {
        const newQuestions = [...localQuiz.questions];
        const question = newQuestions[activeQuestionIndex];
        question.options = question.options.map(opt => ({
            ...opt,
            isCorrect: opt.id === optionId,
        }));
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleAddQuestion = () => {
        const newQuestion: AppQuestion = {
            id: generateUniqueId('question'),
            text: 'Nueva Pregunta',
            order: localQuiz.questions.length,
            type: 'SINGLE_CHOICE',
            imageUrl: null,
            template: 'default',
            options: [
                { 
                    id: generateUniqueId('option'), 
                    text: 'Opción Correcta', 
                    imageUrl: null, 
                    isCorrect: true, 
                    points: 10 
                },
                { 
                    id: generateUniqueId('option'), 
                    text: 'Opción Incorrecta', 
                    imageUrl: null, 
                    isCorrect: false, 
                    points: 0 
                }
            ]
        };
        setLocalQuiz(prev => ({ 
            ...prev, 
            questions: [...prev.questions, newQuestion] 
        }));
        setActiveQuestionIndex(localQuiz.questions.length);
    };

    const handleAddOption = () => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex].options.push({ 
            id: generateUniqueId('option'), 
            text: '', 
            imageUrl: null, 
            isCorrect: false, 
            points: 0 
        });
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleDeleteOption = (optionIndex: number) => {
        const newQuestions = [...localQuiz.questions];
        const currentOptions = newQuestions[activeQuestionIndex].options;
        currentOptions.splice(optionIndex, 1);
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleDeleteQuestion = (indexToDelete: number) => {
        if (localQuiz.questions.length <= 1) return;
        
        setLocalQuiz(prev => ({ 
            ...prev, 
            questions: prev.questions.filter((_, i) => i !== indexToDelete) 
        }));
        setActiveQuestionIndex(prev => Math.max(0, prev - 1));
    };

    const handleQuizUpdate = (updates: Partial<AppQuiz>) => {
        setLocalQuiz(prev => ({ ...prev, ...updates }));
    };

    const handleSaveChanges = () => {
        onSave(localQuiz);
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    if (!localQuiz || !localQuiz.questions) return null;

    const activeQuestion = localQuiz.questions[activeQuestionIndex];
    const quizPreviewForm = { 
        ...localQuiz, 
        fields: localQuiz.questions.map(q => ({ ...q, label: q.text })) 
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[95vw] max-w-7xl p-0 gap-0 rounded-3xl h-[90vh] overflow-hidden border-primary/20 bg-background/40 backdrop-blur-3xl shadow-2xl">
                    <Tabs defaultValue="questions" className="w-full h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-primary/10 bg-card/50 backdrop-blur-xl shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2.5 rounded-2xl">
                                    <CheckSquare className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight">
                                        {localQuiz.title || 'Editando Quiz'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1 opacity-80">
                                        Configuración del Examen
                                    </p>
                                </div>
                            </div>

                            <TabsList className="bg-muted/50 p-1 rounded-2xl border border-primary/5">
                                <TabsTrigger 
                                    value="questions" 
                                    className="rounded-xl px-6 py-2 transition-all font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    <HelpCircle className="h-4 w-4" /> 
                                    Preguntas
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="settings" 
                                    className="rounded-xl px-6 py-2 transition-all font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    <Settings2 className="h-4 w-4" /> 
                                    Ajustes
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    size="lg" 
                                    className="rounded-2xl px-6 font-bold border-primary/20 hover:bg-primary/5 hidden sm:flex" 
                                    onClick={() => setIsPreviewOpen(true)}
                                >
                                    <Eye className="mr-2 h-5 w-5" /> 
                                    Vista Previa
                                </Button>
                                <Button 
                                    size="lg" 
                                    onClick={handleSaveChanges} 
                                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 py-5 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Save className="mr-2 h-4 w-4" /> 
                                    Guardar
                                </Button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-grow overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {/* Questions Tab */}
                                <TabsContent 
                                    value="questions" 
                                    className="w-full h-full m-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="grid grid-cols-1 md:grid-cols-12 h-full"
                                    >
                                        {/* Sidebar */}
                                        <QuestionList
                                            questions={localQuiz.questions}
                                            activeIndex={activeQuestionIndex}
                                            onSelect={setActiveQuestionIndex}
                                            onDelete={handleDeleteQuestion}
                                            onAdd={handleAddQuestion}
                                        />

                                        {/* Editor Area */}
                                        <div className="md:col-span-9 flex flex-col h-full bg-background/5 overflow-hidden">
                                            <ScrollArea className="flex-grow scrollbar-visible h-full">
                                                <div className="p-8 w-full min-h-0">
                                                    {activeQuestion ? (
                                                        <div className="max-w-[1200px] mx-auto">
                                                            <QuestionEditor
                                                                question={activeQuestion}
                                                                onQuestionChange={handleQuestionChange}
                                                                onOptionChange={handleOptionChange}
                                                                onSetCorrect={handleSetCorrect}
                                                                onOptionAdd={handleAddOption}
                                                                onOptionDelete={handleDeleteOption}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground opacity-50">
                                                            <HelpCircle className="h-20 w-20 mb-6" />
                                                            <p className="font-bold text-xl uppercase tracking-widest">
                                                                Selecciona una pregunta
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </motion.div>
                                </TabsContent>

                                {/* Settings Tab */}
                                <TabsContent 
                                    value="settings" 
                                    className="w-full h-full m-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="h-full"
                                    >
                                        <SettingsTab 
                                            quiz={localQuiz} 
                                            onUpdate={handleQuizUpdate} 
                                        />
                                    </motion.div>
                                </TabsContent>
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-6xl p-0 overflow-hidden rounded-3xl border-primary/20 bg-background/40 backdrop-blur-3xl">
                    <div className="p-10">
                        <QuizGameView 
                            form={quizPreviewForm as any} 
                            isEditorPreview={true} 
                            activeQuestionIndex={activeQuestionIndex} 
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}