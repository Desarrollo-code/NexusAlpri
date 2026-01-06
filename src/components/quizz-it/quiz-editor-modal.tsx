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
    Check, 
    X, 
    Image as ImageIcon, 
    Timer, 
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
    LayoutGrid,
    FileText,
    Zap,
    ArrowLeft,
    GripVertical,
    Sparkles
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
import { Badge } from '../ui/badge';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '../ui/separator';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-[100px] w-full bg-muted/30 animate-pulse rounded-xl" />
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
        description: 'Pregunta clásica con 2-4 opciones',
        color: 'from-blue-500 to-cyan-500'
    },
    { 
        value: 'image', 
        label: 'Con Imagen', 
        icon: ImagePlay, 
        description: 'Pregunta visual con imagen de apoyo',
        color: 'from-purple-500 to-pink-500'
    },
    { 
        value: 'true_false', 
        label: 'Verdadero/Falso', 
        icon: BrainCircuit, 
        description: 'Respuesta rápida binaria',
        color: 'from-green-500 to-emerald-500'
    },
    { 
        value: 'image_options', 
        label: 'Opciones Visuales', 
        icon: LayoutGrid, 
        description: 'Respuestas con imágenes',
        color: 'from-orange-500 to-red-500'
    },
];

const generateUniqueId = (prefix: string): string => 
    `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// ============================================================================
// IMAGE UPLOAD WIDGET
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
            toast({ title: "✓ Imagen subida", description: "La imagen se cargó correctamente" });
        } catch (err) {
            toast({ 
                title: "Error al subir imagen", 
                description: (err as Error).message, 
                variant: "destructive" 
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn(
            "relative w-full aspect-square rounded-xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden group",
            isCorrect 
                ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20" 
                : imageUrl
                ? "border-border/50 bg-muted/20 hover:border-primary/40"
                : "border-dashed border-muted-foreground/25 bg-muted/10 hover:border-primary/50 hover:bg-primary/5"
        )}>
            {isUploading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <ColorfulLoader className="h-8 w-8" />
                    <div className="w-full space-y-1.5">
                        <Progress value={uploadProgress} className="w-full h-1.5" />
                        <p className="text-xs font-medium text-muted-foreground text-center">
                            {uploadProgress}%
                        </p>
                    </div>
                </div>
            ) : imageUrl ? (
                <div className="relative w-full h-full">
                    <Image 
                        src={imageUrl} 
                        alt="preview" 
                        fill 
                        className="object-cover rounded-lg" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 rounded-full shadow-xl" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onRemove(); 
                            }} 
                            disabled={disabled}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
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
                    <div className="text-center space-y-2 p-6">
                        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                            <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground/80">
                                Subir imagen
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Click o arrastra aquí
                            </p>
                        </div>
                    </div>
                </UploadArea>
            )}
        </div>
    );
};

// ============================================================================
// OPTION CARD COMPONENT
// ============================================================================

interface OptionCardProps {
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

const OptionCard: React.FC<OptionCardProps> = ({
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
                <div className="w-full h-full" onClick={onSetCorrect}>
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
                    className={cn(
                        "w-full h-20 text-lg font-bold rounded-xl transition-all duration-300 shadow-sm",
                        isCorrect 
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-500/30" 
                            : "bg-muted hover:bg-muted/80 text-foreground/70"
                    )}
                    onClick={onSetCorrect}
                >
                    {option.text}
                </Button>
            );
        }
        
        return (
            <div className="bg-background/60 rounded-xl overflow-hidden border border-border/50">
                <ReactQuill
                    theme="snow"
                    value={option.text}
                    onChange={onTextChange}
                    modules={{ toolbar: [['bold', 'italic', 'underline']] }}
                    className="quill-editor-option"
                    placeholder="Escribe la opción..."
                />
            </div>
        );
    };

    return (
        <motion.div 
            layout 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="group"
        >
            <div className={cn(
                "relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                isCorrect 
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-green-500/5 shadow-lg shadow-emerald-500/10" 
                    : "border-border/40 bg-card/50 hover:border-primary/30 hover:shadow-md"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Badge 
                        variant={isCorrect ? "default" : "outline"}
                        className={cn(
                            "font-bold text-[10px] tracking-wider",
                            isCorrect && "bg-emerald-500 hover:bg-emerald-600"
                        )}
                    >
                        Opción {index + 1}
                    </Badge>
                    
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={onSetCorrect}
                            className={cn(
                                "h-7 w-7 rounded-lg transition-all duration-300",
                                isCorrect 
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md" 
                                    : "hover:bg-emerald-500/10 hover:text-emerald-600"
                            )}
                        >
                            <Check className="h-3.5 w-3.5" />
                        </Button>
                        
                        {canDelete && (
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={onDelete}
                                className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow">
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

    const currentTemplate = TEMPLATE_OPTIONS.find(t => t.value === (question.template || 'default'));

    return (
        <div className="space-y-6">
            {/* Template Selector */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                                currentTemplate?.color || 'from-primary to-primary/80'
                            )}>
                                {currentTemplate && <currentTemplate.icon className="h-5 w-5 text-white" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground/90">Tipo de Pregunta</h3>
                                <p className="text-xs text-muted-foreground">{currentTemplate?.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {TEMPLATE_OPTIONS.map((template) => {
                            const isActive = question.template === template.value || (!question.template && template.value === 'default');
                            return (
                                <button
                                    key={template.value}
                                    type="button"
                                    onClick={() => onQuestionChange('template', template.value)}
                                    className={cn(
                                        "relative p-4 rounded-xl border-2 transition-all duration-300 text-left group",
                                        isActive
                                            ? "border-primary bg-primary/10 shadow-md"
                                            : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-primary/5"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg bg-gradient-to-br mb-3 flex items-center justify-center shadow-sm",
                                        template.color
                                    )}>
                                        <template.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="font-bold text-xs leading-tight">{template.label}</p>
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Question Statement */}
            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        Enunciado de la Pregunta
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="bg-background/60 rounded-xl overflow-hidden border-2 border-border/50 shadow-inner">
                        <ReactQuill
                            theme="snow"
                            value={question.text || ''}
                            onChange={(v) => onQuestionChange('text', v)}
                            modules={QUILL_MODULES}
                            placeholder="Escribe tu pregunta aquí..."
                            className="quill-editor-custom"
                        />
                    </div>

                    {question.template === 'image' && (
                        <div className="space-y-3 pt-4 border-t border-border/50">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                Imagen de Apoyo
                            </Label>
                            <div className="max-w-xs">
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
            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CheckSquare className="h-4 w-4 text-primary" />
                            </div>
                            Opciones de Respuesta
                        </CardTitle>
                        {canAddOption && (
                            <Button 
                                type="button" 
                                size="sm"
                                onClick={onOptionAdd} 
                                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 rounded-xl font-bold shadow-sm"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> 
                                Añadir Opción
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className={cn(
                    "p-6 grid gap-4", 
                    isImageOptionsTemplate 
                        ? "grid-cols-2 lg:grid-cols-4" 
                        : "grid-cols-1 lg:grid-cols-2"
                )}>
                    <AnimatePresence mode="popLayout">
                        {(question.options || []).slice(0, 4).map((opt: any, index: number) => (
                            <OptionCard
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
        <div className="w-80 border-r-2 border-border/50 flex flex-col bg-gradient-to-b from-muted/20 to-muted/5 backdrop-blur-sm">
            {/* Header */}
            <div className="p-5 border-b-2 border-border/50 bg-card/40">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                        <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Preguntas</h3>
                        <p className="text-xs text-muted-foreground">
                            {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={onAdd} 
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> 
                    Nueva Pregunta
                </Button>
            </div>

            {/* Questions List */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-2.5">
                    {questions.map((q, index) => {
                        const isActive = activeIndex === index;
                        return (
                            <motion.div 
                                key={q.id} 
                                layout
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <button
                                    onClick={() => onSelect(index)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex gap-3 items-center group relative",
                                        isActive
                                            ? "bg-gradient-to-r from-primary to-primary/80 border-primary shadow-lg shadow-primary/30 text-white"
                                            : "bg-card/60 border-border/40 hover:border-primary/40 hover:bg-card hover:shadow-md"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs shrink-0 shadow-sm",
                                        isActive 
                                            ? "bg-white/20 text-white backdrop-blur-sm" 
                                            : "bg-primary/10 text-primary"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="truncate font-semibold text-sm leading-tight">
                                            {stripHtml(q.text) || "Sin título"}
                                        </p>
                                        <p className={cn(
                                            "text-xs mt-1",
                                            isActive ? "text-white/70" : "text-muted-foreground"
                                        )}>
                                            {q.options?.length || 0} opciones
                                        </p>
                                    </div>
                                    {questions.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-all",
                                                isActive 
                                                    ? "hover:bg-white/20 text-white" 
                                                    : "hover:bg-destructive/10 text-destructive"
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
                        );
                    })}
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
        <ScrollArea className="h-full w-full">
            <div className="p-10 max-w-4xl mx-auto space-y-6">
                {/* Quiz Details */}
                <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20 pb-5">
                        <CardTitle className="text-lg font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                <Info className="h-5 w-5 text-white" />
                            </div>
                            Información del Quiz
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="quiz-title" className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Título del Quiz
                            </Label>
                            <Input
                                id="quiz-title"
                                value={quiz.title}
                                onChange={e => onUpdate({ title: e.target.value })}
                                className="text-base font-semibold h-12 rounded-xl border-2 border-border/50 focus:border-primary bg-background/60 px-5 shadow-sm"
                                placeholder="Ej: Examen Final - Módulo 3"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="quiz-description" className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Descripción e Instrucciones
                            </Label>
                            <Textarea
                                id="quiz-description"
                                value={quiz.description || ''}
                                onChange={e => onUpdate({ description: e.target.value })}
                                rows={5}
                                className="text-sm font-medium rounded-xl border-2 border-border/50 focus:border-primary bg-background/60 p-5 resize-none shadow-sm"
                                placeholder="Escribe las instrucciones para tus estudiantes..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Game Settings */}
                <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20 pb-5">
                        <CardTitle className="text-lg font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <Settings2 className="h-5 w-5 text-white" />
                            </div>
                            Configuración del Juego
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="quiz-max-attempts" className="text-sm font-semibold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Límite de Intentos
                            </Label>
                            <Input
                                id="quiz-max-attempts"
                                type="number"
                                min="1"
                                value={quiz.maxAttempts || ''}
                                onChange={e => onUpdate({ 
                                    maxAttempts: e.target.value ? parseInt(e.target.value) : null 
                                })}
                                className="text-base font-semibold h-12 rounded-xl border-2 border-border/50 focus:border-primary bg-background/60 px-5 shadow-sm"
                                placeholder="Ilimitado"
                            />
                            <p className="text-xs text-muted-foreground flex items-start gap-2 mt-2 pl-1">
                                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                Deja este campo vacío para permitir intentos ilimitados
                            </p>
                        </div>

                        <Separator className="my-6" />

                        <div className="space-y-3">
                            <Label htmlFor="quiz-timer-style" className="text-sm font-semibold flex items-center gap-2">
                                <Timer className="h-4 w-4 text-primary" />
                                Estilo del Temporizador
                            </Label>
                            <Select 
                                value={quiz.timerStyle || 'circular'} 
                                onValueChange={(v) => onUpdate({ timerStyle: v })}
                            >
                                <SelectTrigger 
                                    id="quiz-timer-style" 
                                    className="h-12 rounded-xl border-2 border-border/50 bg-background/60 text-sm font-semibold px-5 shadow-sm"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-border/50 overflow-hidden shadow-xl">
                                    <SelectItem value="circular" className="rounded-lg py-3 font-semibold">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Timer className="h-4 w-4 text-primary" />
                                            </div>
                                            Reloj Circular
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="bar" className="rounded-lg py-3 font-semibold">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <div className="w-4 h-1 bg-primary rounded-full" />
                                            </div>
                                            Barra de Progreso
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="pill" className="rounded-lg py-3 font-semibold">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <div className="w-5 h-2 bg-primary rounded-full" />
                                            </div>
                                            Píldora Flotante
                                        </div>
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
    const [activeTab, setActiveTab] = useState<'questions' | 'settings'>('questions');

    useEffect(() => {
        if (quiz) {
            setLocalQuiz(JSON.parse(JSON.stringify(quiz)));
            setActiveQuestionIndex(0);
        }
    }, [quiz, isOpen]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleQuestionChange = (
        field: 'text' | 'imageUrl' | 'template', 
        value: string | null
    ) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex] as any)[field] = value;

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

    if (!localQuiz || !localQuiz.questions) return null;

    const activeQuestion = localQuiz.questions[activeQuestionIndex];
    const quizPreviewForm = { 
        ...localQuiz, 
        fields: localQuiz.questions.map(q => ({ ...q, label: q.text })) 
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[98vw] max-w-[1600px] h-[95vh] p-0 gap-0 rounded-3xl overflow-hidden border-2 border-border/50 bg-gradient-to-br from-background via-background to-muted/20 shadow-2xl">
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="shrink-0 border-b-2 border-border/50 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl">
                            <div className="flex items-center justify-between px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="rounded-xl hover:bg-muted/80"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Separator orientation="vertical" className="h-8" />
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                                            <CheckSquare className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold tracking-tight">
                                                {localQuiz.title || 'Editor de Quiz'}
                                            </h2>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                {localQuiz.questions.length} preguntas · {activeTab === 'questions' ? 'Editando' : 'Configuración'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
                                        <TabsList className="bg-muted/60 p-1.5 rounded-xl border-2 border-border/50 shadow-sm">
                                            <TabsTrigger 
                                                value="questions" 
                                                className="rounded-lg px-5 py-2.5 transition-all font-bold text-sm gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                                            >
                                                <HelpCircle className="h-4 w-4" /> 
                                                Preguntas
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="settings" 
                                                className="rounded-lg px-5 py-2.5 transition-all font-bold text-sm gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                                            >
                                                <Settings2 className="h-4 w-4" /> 
                                                Ajustes
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <Separator orientation="vertical" className="h-8" />

                                    <Button 
                                        variant="outline" 
                                        size="lg" 
                                        className="rounded-xl px-6 font-bold border-2 border-border/50 hover:bg-muted/80 shadow-sm gap-2" 
                                        onClick={() => setIsPreviewOpen(true)}
                                    >
                                        <Eye className="h-4 w-4" /> 
                                        Vista Previa
                                    </Button>

                                    <Button 
                                        size="lg" 
                                        onClick={handleSaveChanges} 
                                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl px-8 font-bold shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 gap-2"
                                    >
                                        <Save className="h-4 w-4" /> 
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 overflow-hidden">
                            <AnimatePresence mode="wait">
                                {activeTab === 'questions' ? (
                                    <motion.div
                                        key="questions"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex h-full"
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
                                        <div className="flex-1 overflow-hidden">
                                            <ScrollArea className="h-full">
                                                <div className="p-8 max-w-[1200px] mx-auto">
                                                    {activeQuestion ? (
                                                        <QuestionEditor
                                                            question={activeQuestion}
                                                            onQuestionChange={handleQuestionChange}
                                                            onOptionChange={handleOptionChange}
                                                            onSetCorrect={handleSetCorrect}
                                                            onOptionAdd={handleAddOption}
                                                            onOptionDelete={handleDeleteOption}
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-[60vh]">
                                                            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                                                                <HelpCircle className="h-10 w-10 text-muted-foreground/50" />
                                                            </div>
                                                            <p className="font-bold text-lg text-muted-foreground">
                                                                Selecciona una pregunta para editar
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="settings"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full"
                                    >
                                        <SettingsTab 
                                            quiz={localQuiz} 
                                            onUpdate={handleQuizUpdate} 
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden rounded-3xl border-2 border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                    <div className="h-full flex flex-col">
                        <div className="shrink-0 border-b-2 border-border/50 bg-card/50 px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Eye className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Vista Previa</h3>
                                        <p className="text-xs text-muted-foreground">Cómo verán el quiz tus estudiantes</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="rounded-xl"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-10">
                            <QuizGameView 
                                form={quizPreviewForm as any} 
                                isEditorPreview={true} 
                                activeQuestionIndex={activeQuestionIndex} 
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}