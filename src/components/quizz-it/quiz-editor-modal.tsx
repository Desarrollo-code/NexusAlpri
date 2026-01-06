// src/components/quizz-it/quiz-editor-modal.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
    Sparkles,
    Copy,
    MoveVertical,
    Palette,
    Globe,
    BarChart3,
    Shield,
    Users,
    Clock,
    ChevronRight,
    ChevronLeft,
    Search,
    Filter,
    SortAsc,
    Grid3x3,
    List,
    Upload,
    Download,
    Link,
    QrCode,
    EyeOff,
    Lock,
    Unlock,
    Lightbulb,
    Target,
    TrendingUp,
    Smartphone,
    Monitor,
    Tablet,
    Shuffle,
    Tag,
    Key,

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
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { ColorfulLoader } from '../ui/colorful-loader';
import { Badge } from '../ui/badge';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-[100px] w-full bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 animate-pulse rounded-lg" />
});

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const QUILL_MODULES = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video', 'formula'],
        ['clean']
    ],
};

const TEMPLATE_OPTIONS = [
    { 
        value: 'default', 
        label: 'Múltiple Elección', 
        icon: CheckSquare, 
        description: 'Pregunta clásica con 2-4 opciones',
        color: 'from-blue-500 to-cyan-500',
        gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        badgeColor: 'bg-blue-500'
    },
    { 
        value: 'image', 
        label: 'Con Imagen', 
        icon: ImagePlay, 
        description: 'Pregunta visual con imagen de apoyo',
        color: 'from-purple-500 to-pink-500',
        gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
        badgeColor: 'bg-purple-500'
    },
    { 
        value: 'true_false', 
        label: 'Verdadero/Falso', 
        icon: BrainCircuit, 
        description: 'Respuesta rápida binaria',
        color: 'from-green-500 to-emerald-500',
        gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
        badgeColor: 'bg-green-500'
    },
    { 
        value: 'image_options', 
        label: 'Opciones Visuales', 
        icon: LayoutGrid, 
        description: 'Respuestas con imágenes',
        color: 'from-orange-500 to-red-500',
        gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
        badgeColor: 'bg-orange-500'
    },
    { 
        value: 'matching', 
        label: 'Emparejamiento', 
        icon: Link, 
        description: 'Relacionar columnas',
        color: 'from-indigo-500 to-violet-500',
        gradient: 'bg-gradient-to-br from-indigo-500 to-violet-500',
        badgeColor: 'bg-indigo-500'
    },
    { 
        value: 'open_ended', 
        label: 'Respuesta Abierta', 
        icon: FileText, 
        description: 'Texto libre para respuestas',
        color: 'from-rose-500 to-pink-500',
        gradient: 'bg-gradient-to-br from-rose-500 to-pink-500',
        badgeColor: 'bg-rose-500'
    },
];

const DIFFICULTY_LEVELS = [
    { value: 'easy', label: 'Fácil', color: 'bg-green-500', points: 5 },
    { value: 'medium', label: 'Medio', color: 'bg-yellow-500', points: 10 },
    { value: 'hard', label: 'Difícil', color: 'bg-red-500', points: 15 },
    { value: 'expert', label: 'Experto', color: 'bg-purple-500', points: 20 },
];

const TIME_LIMIT_OPTIONS = [
    { value: 'none', label: 'Sin límite', time: null },
    { value: '30s', label: '30 segundos', time: 30 },
    { value: '1m', label: '1 minuto', time: 60 },
    { value: '2m', label: '2 minutos', time: 120 },
    { value: '5m', label: '5 minutos', time: 300 },
    { value: '10m', label: '10 minutos', time: 600 },
];

const generateUniqueId = (prefix: string): string => 
    `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// ============================================================================
// COMPACT IMAGE UPLOAD WIDGET
// ============================================================================

interface ImageUploadWidgetProps {
    imageUrl: string | null;
    onUpload: (url: string) => void;
    onRemove: () => void;
    disabled: boolean;
    inputId: string;
    isCorrect?: boolean;
    label?: string;
    compact?: boolean;
}

const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({ 
    imageUrl, 
    onUpload, 
    onRemove, 
    disabled, 
    inputId, 
    isCorrect,
    label = "Subir imagen",
    compact = false
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            const result = await uploadWithProgress('/api/upload/lesson-file', file, setUploadProgress);
            onUpload(result.url);
            toast({ 
                title: "✅ Imagen subida", 
                description: "La imagen se cargó correctamente",
                className: "border-green-500"
            });
        } catch (err) {
            toast({ 
                title: "❌ Error al subir imagen", 
                description: (err as Error).message, 
                variant: "destructive" 
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    if (compact) {
        return (
            <div 
                className={cn(
                    "relative w-24 h-24 rounded-lg border transition-all duration-300 flex items-center justify-center overflow-hidden group",
                    isCorrect 
                        ? "border-emerald-500 bg-emerald-500/10" 
                        : imageUrl
                        ? "border-border/50 bg-muted/20 hover:border-primary/40"
                        : "border-dashed border-muted-foreground/25 bg-muted/10 hover:border-primary/50 hover:bg-primary/5",
                    isDragging && "border-primary bg-primary/10 scale-[1.02]"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center justify-center p-2">
                        <ColorfulLoader className="h-4 w-4" />
                        <span className="text-[10px] mt-1">{uploadProgress}%</span>
                    </div>
                ) : imageUrl ? (
                    <div className="relative w-full h-full group">
                        <Image 
                            src={imageUrl} 
                            alt="preview" 
                            fill 
                            className="object-cover" 
                            sizes="100px"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <Button 
                                type="button" 
                                size="icon"
                                variant="destructive" 
                                className="h-6 w-6 rounded-md"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onRemove(); 
                                }} 
                                disabled={disabled}
                            >
                                <Trash2 className="h-3 w-3" />
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
                        <div className="text-center p-2">
                            <ImageIcon className="h-4 w-4 mx-auto text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mt-1 block">Subir</span>
                        </div>
                    </UploadArea>
                )}
            </div>
        );
    }

    return (
        <div 
            className={cn(
                "relative w-full rounded-lg border transition-all duration-300 flex items-center justify-center overflow-hidden group",
                isCorrect 
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/20" 
                    : imageUrl
                    ? "border-border/50 bg-muted/20 hover:border-primary/40"
                    : "border-dashed border-muted-foreground/25 bg-muted/10 hover:border-primary/50 hover:bg-primary/5",
                isDragging && "border-primary bg-primary/10 scale-[1.02]"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isUploading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <ColorfulLoader className="h-8 w-8" />
                    <div className="w-full max-w-xs space-y-2">
                        <Progress value={uploadProgress} className="w-full h-2 rounded-full" />
                        <div className="flex justify-between text-xs">
                            <span className="font-medium text-muted-foreground">Subiendo...</span>
                            <span className="font-bold">{uploadProgress}%</span>
                        </div>
                    </div>
                </div>
            ) : imageUrl ? (
                <div className="relative w-full h-48">
                    <div className="relative w-full h-full">
                        <Image 
                            src={imageUrl} 
                            alt="preview" 
                            fill 
                            className="object-contain" 
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-end p-4">
                        <div className="flex gap-2">
                            <Button 
                                type="button" 
                                variant="secondary"
                                size="sm"
                                className="bg-white/90 hover:bg-white text-black rounded-md shadow h-8 px-2"
                                onClick={(e) => { 
                                    e.stopPropagation();
                                    // TODO: Implementar reemplazar imagen
                                }} 
                                disabled={disabled}
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                <span className="text-xs">Reemplazar</span>
                            </Button>
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                className="bg-red-500/90 hover:bg-red-600 text-white rounded-md shadow h-8 px-2" 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onRemove(); 
                                }} 
                                disabled={disabled}
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                <span className="text-xs">Eliminar</span>
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <UploadArea 
                    onFileSelect={handleFileSelect} 
                    disabled={disabled} 
                    inputId={inputId} 
                    className="h-full border-0 bg-transparent p-0"
                >
                    <div className="text-center space-y-3 p-4">
                        <div className={cn(
                            "w-12 h-12 mx-auto rounded-lg flex items-center justify-center transition-all",
                            isDragging 
                                ? "bg-primary/20 scale-110" 
                                : "bg-primary/10 group-hover:bg-primary/20"
                        )}>
                            <ImageIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground/90">
                                {label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Arrastra una imagen o haz clic para seleccionar
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                PNG, JPG, GIF hasta 5MB
                            </p>
                        </div>
                    </div>
                </UploadArea>
            )}
        </div>
    );
};

// ============================================================================
// OPTION CARD COMPONENT (Optimizado)
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
    onPointsChange: (points: number) => void;
    onDifficultyChange: (difficulty: string) => void;
    canDelete: boolean;
    showAdvanced?: boolean;
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
    onPointsChange,
    onDifficultyChange,
    canDelete,
    showAdvanced = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderContent = () => {
        if (template === 'image_options') {
            return (
                <div className="space-y-2">
                    <ImageUploadWidget 
                        inputId={`opt-img-${option.id}`} 
                        imageUrl={option.imageUrl} 
                        onUpload={onImageChange} 
                        onRemove={() => onImageChange(null)} 
                        disabled={false} 
                        isCorrect={isCorrect} 
                        label={`Opción ${index + 1}`}
                        compact={true}
                    />
                    <Input
                        value={option.text || ''}
                        onChange={e => onTextChange(e.target.value)}
                        placeholder="Descripción opcional"
                        className="text-xs h-8"
                    />
                </div>
            );
        }
        
        if (template === 'true_false') {
            return (
                <Button 
                    type="button" 
                    className={cn(
                        "w-full h-16 text-base font-bold rounded-lg transition-all duration-300 shadow",
                        isCorrect 
                            ? "bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-emerald-500/40" 
                            : "bg-gradient-to-br from-muted via-muted/80 to-muted hover:from-muted/90 hover:via-muted/70 hover:to-muted/90 text-foreground/80 shadow"
                    )}
                    onClick={onSetCorrect}
                >
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">{option.text}</span>
                        {isCorrect && (
                            <Badge className="bg-white/20 text-white/90 border-0 px-1.5 py-0 text-[10px]">
                                ✓ Correcta
                            </Badge>
                        )}
                    </div>
                </Button>
            );
        }
        
        return (
            <div className="space-y-1">
                <div className="bg-gradient-to-br from-background/80 via-background/60 to-background/80 rounded-lg overflow-hidden border border-border/50">
                    <ReactQuill
                        theme="snow"
                        value={option.text}
                        onChange={onTextChange}
                        modules={{ toolbar: [['bold', 'italic', 'underline', 'strike']] }}
                        className="quill-editor-option min-h-[60px] text-sm"
                        placeholder="Escribe el texto de la opción..."
                    />
                </div>
            </div>
        );
    };

    return (
        <motion.div 
            layout 
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="group"
        >
            <Card className={cn(
                "border transition-all duration-300 overflow-hidden hover:shadow-sm",
                isCorrect 
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/5 shadow shadow-emerald-500/20" 
                    : "border-border/40 bg-card/60 hover:border-primary/40"
            )}>
                <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Badge 
                                variant={isCorrect ? "default" : "outline"}
                                className={cn(
                                    "font-bold text-xs tracking-wider px-2 py-0.5 rounded",
                                    isCorrect && "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                                )}
                            >
                                <div className="flex items-center gap-1">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isCorrect ? "bg-white" : "bg-muted-foreground"
                                    )} />
                                    Op {index + 1}
                                </div>
                            </Badge>
                            
                            {isCorrect && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-[10px] px-1.5 py-0">
                                    <Check className="h-2.5 w-2.5 mr-0.5" /> Correcta
                                </Badge>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-0.5">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={onSetCorrect}
                                            className={cn(
                                                "h-6 w-6 rounded transition-all duration-300",
                                                isCorrect 
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow" 
                                                    : "hover:bg-emerald-500/10 hover:text-emerald-600"
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Marcar como correcta</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="h-6 w-6 rounded hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Settings2 className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Configuración avanzada</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            
                            {canDelete && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={onDelete}
                                                className="h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Eliminar opción</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                    {renderContent()}
                    
                    <AnimatePresence>
                        {(isExpanded || showAdvanced) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-2"
                            >
                                <Separator className="my-1.5" />
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-semibold">Puntos</Label>
                                        <div className="flex items-center gap-1.5">
                                            <Slider 
                                                value={[option.points || 0]} 
                                                onValueChange={([value]) => onPointsChange(value)}
                                                min={0}
                                                max={50}
                                                step={5}
                                                className="flex-1"
                                            />
                                            <span className="text-xs font-bold min-w-[30px]">
                                                {option.points || 0} pts
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-semibold">Dificultad</Label>
                                        <Select 
                                            value={option.difficulty || 'medium'}
                                            onValueChange={onDifficultyChange}
                                        >
                                            <SelectTrigger className="h-6 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DIFFICULTY_LEVELS.map(level => (
                                                    <SelectItem key={level.value} value={level.value} className="text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${level.color}`} />
                                                            {level.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// ============================================================================
// QUESTION EDITOR COMPONENT (Completamente Optimizado)
// ============================================================================

interface QuestionEditorProps {
    question: any;
    onQuestionChange: (field: string, value: any) => void;
    onOptionChange: (index: number, field: string, value: any) => void;
    onSetCorrect: (optionId: string) => void;
    onOptionAdd: () => void;
    onOptionDelete: (index: number) => void;
    onPointsChange: (index: number, points: number) => void;
    onDifficultyChange: (index: number, difficulty: string) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
    question, 
    onQuestionChange, 
    onOptionChange, 
    onSetCorrect, 
    onOptionAdd, 
    onOptionDelete,
    onPointsChange,
    onDifficultyChange
}) => {
    const isImageOptionsTemplate = question?.template === 'image_options';
    const isTrueFalse = question?.template === 'true_false';
    const canAddOption = question.options.length < 6 && !isImageOptionsTemplate && !isTrueFalse;
    const [activeTab, setActiveTab] = useState('content');

    const currentTemplate = TEMPLATE_OPTIONS.find(t => t.value === (question.template || 'default'));

    return (
        <div className="h-full flex flex-col">
            {/* Template Selector Ribbon */}
            <Card className="border border-border/50 bg-gradient-to-r from-card via-card/95 to-card mb-3 rounded-lg">
                <CardContent className="p-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded flex items-center justify-center shadow-sm",
                                currentTemplate?.gradient
                            )}>
                                {currentTemplate && <currentTemplate.icon className="h-4 w-4 text-white" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-xs">{currentTemplate?.label}</h3>
                                <p className="text-[10px] text-muted-foreground">{currentTemplate?.description}</p>
                            </div>
                        </div>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded gap-1 h-7 text-xs">
                                    <Palette className="h-3 w-3" />
                                    Cambiar
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="end">
                                <ScrollArea className="h-60">
                                    <Command>
                                        <CommandInput placeholder="Buscar plantilla..." className="h-8" />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron plantillas</CommandEmpty>
                                            <CommandGroup>
                                                {TEMPLATE_OPTIONS.map((template) => (
                                                    <CommandItem
                                                        key={template.value}
                                                        value={template.value}
                                                        onSelect={() => onQuestionChange('template', template.value)}
                                                        className="py-1.5"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn(
                                                                "w-6 h-6 rounded flex items-center justify-center",
                                                                template.gradient
                                                            )}>
                                                                <template.icon className="h-3 w-3 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-xs">{template.label}</p>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {template.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid grid-cols-3 mb-3 bg-muted/50 p-0.5 rounded">
                    <TabsTrigger value="content" className="rounded text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm h-7">
                        <FileText className="h-3 w-3 mr-1" />
                        Contenido
                    </TabsTrigger>
                    <TabsTrigger value="options" className="rounded text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm h-7">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        Opciones
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm h-7">
                        <Settings2 className="h-3 w-3 mr-1" />
                        Config
                    </TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                    <ScrollArea className="flex-1 pr-3">
                        <div className="space-y-3">
                            {/* Question Statement */}
                            <Card className="border border-border/50 bg-card/50">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                        <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                        Enunciado
                                    </CardTitle>
                                    <CardDescription className="text-[10px]">
                                        Escribe la pregunta principal
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gradient-to-br from-background/80 via-background/60 to-background/80 rounded overflow-hidden border border-border/50">
                                        <ReactQuill
                                            theme="snow"
                                            value={question.text || ''}
                                            onChange={(v) => onQuestionChange('text', v)}
                                            modules={QUILL_MODULES}
                                            placeholder="¿Cuál es tu pregunta?..."
                                            className="quill-editor-custom min-h-[80px] text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Question Image */}
                            {question.template === 'image' && (
                                <Card className="border border-border/50 bg-card/50">
                                    <CardHeader className="pb-1">
                                        <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                            <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                            Imagen
                                        </CardTitle>
                                        <CardDescription className="text-[10px]">
                                            Añade una imagen relacionada
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-w-sm">
                                            <ImageUploadWidget 
                                                inputId={`q-img-${question.id}`} 
                                                imageUrl={question.imageUrl} 
                                                onUpload={(url) => onQuestionChange('imageUrl', url)} 
                                                onRemove={() => onQuestionChange('imageUrl', null)} 
                                                disabled={false} 
                                                isCorrect={false} 
                                                label="Imagen de la pregunta"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Explanation */}
                            <Card className="border border-border/50 bg-card/50">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                        <Lightbulb className="h-3.5 w-3.5 text-primary" />
                                        Explicación
                                    </CardTitle>
                                    <CardDescription className="text-[10px]">
                                        Se mostrará después de responder
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={question.explanation || ''}
                                        onChange={e => onQuestionChange('explanation', e.target.value)}
                                        rows={2}
                                        className="min-h-[60px] rounded border border-border/50 bg-background/60 p-2 text-xs"
                                        placeholder="Explica por qué esta respuesta es correcta..."
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* Options Tab */}
                <TabsContent value="options" className="flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold">Opciones de Respuesta</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {question.options.length} {question.options.length === 1 ? 'opción' : 'opciones'}
                                </p>
                            </div>
                            
                            {canAddOption && (
                                <Button 
                                    type="button" 
                                    size="sm"
                                    onClick={onOptionAdd} 
                                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded font-bold shadow shadow-primary/20 gap-1 h-7 text-xs"
                                >
                                    <PlusCircle className="h-3 w-3" /> 
                                    Añadir
                                </Button>
                            )}
                        </div>

                        <ScrollArea className="h-[calc(100vh-350px)] pr-3">
                            <div className={cn(
                                "grid gap-2 pb-3", 
                                isImageOptionsTemplate 
                                    ? "grid-cols-2 lg:grid-cols-3" 
                                    : "grid-cols-1 lg:grid-cols-2"
                            )}>
                                <AnimatePresence mode="popLayout">
                                    {(question.options || []).slice(0, 6).map((opt: any, index: number) => (
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
                                            onPointsChange={(points) => onPointsChange(index, points)}
                                            onDifficultyChange={(difficulty) => onDifficultyChange(index, difficulty)}
                                            canDelete={question.options.length > (isTrueFalse ? 2 : 1)}
                                            showAdvanced={activeTab === 'options'}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                    <ScrollArea className="h-[calc(100vh-350px)] pr-3">
                        <div className="pb-3">
                            {/* Question Settings */}
                            <Card className="border border-border/50 bg-card/50">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                        <Settings2 className="h-3.5 w-3.5 text-primary" />
                                        Configuración
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Dificultad</Label>
                                            <Select 
                                                value={question.difficulty || 'medium'}
                                                onValueChange={(v) => onQuestionChange('difficulty', v)}
                                            >
                                                <SelectTrigger className="h-7 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DIFFICULTY_LEVELS.map(level => (
                                                        <SelectItem key={level.value} value={level.value} className="text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${level.color}`} />
                                                                {level.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Tiempo</Label>
                                            <Select 
                                                value={question.timeLimit || 'none'}
                                                onValueChange={(v) => onQuestionChange('timeLimit', v)}
                                            >
                                                <SelectTrigger className="h-7 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIME_LIMIT_OPTIONS.map(option => (
                                                        <SelectItem key={option.value} value={option.value} className="text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="h-3 w-3" />
                                                                {option.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">Puntos base</Label>
                                            <span className="text-xs font-bold text-primary">
                                                {question.basePoints || 10} pts
                                            </span>
                                        </div>
                                        <Slider 
                                            value={[question.basePoints || 10]} 
                                            onValueChange={([value]) => onQuestionChange('basePoints', value)}
                                            min={0}
                                            max={100}
                                            step={5}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// ============================================================================
// QUESTION LIST SIDEBAR (Completamente Optimizado)
// ============================================================================

interface QuestionListProps {
    questions: AppQuestion[];
    activeIndex: number;
    onSelect: (index: number) => void;
    onDelete: (index: number) => void;
    onAdd: () => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onDuplicate: (index: number) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    activeIndex,
    onSelect,
    onDelete,
    onAdd,
    onReorder,
    onDuplicate
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            onReorder(draggedIndex, dropIndex);
        }
        setDraggedIndex(null);
    };

    const getTemplateIcon = (template: string) => {
        const templateOpt = TEMPLATE_OPTIONS.find(t => t.value === template) || TEMPLATE_OPTIONS[0];
        return templateOpt.icon;
    };

    const getTemplateColor = (template: string) => {
        const templateOpt = TEMPLATE_OPTIONS.find(t => t.value === template) || TEMPLATE_OPTIONS[0];
        return templateOpt.badgeColor;
    };

    return (
        <div className="w-72 border-r border-border/50 flex flex-col bg-gradient-to-b from-background via-background to-muted/5">
            {/* Header */}
            <div className="p-3 border-b border-border/50 bg-gradient-to-r from-card/90 via-card/80 to-card/70">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow">
                            <List className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xs">Preguntas</h3>
                            <p className="text-[10px] text-muted-foreground">
                                {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}
                            </p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={onAdd} 
                        className="h-7 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded font-bold shadow shadow-primary/20 text-xs px-2"
                    >
                        <PlusCircle className="h-3 w-3 mr-1" /> 
                        Nueva
                    </Button>
                </div>
                
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                    <div className="text-center p-1.5 rounded bg-muted/30">
                        <p className="text-base font-bold text-primary">{questions.length}</p>
                        <p className="text-[9px] text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/30">
                        <p className="text-base font-bold text-emerald-500">
                            {questions.filter(q => q.difficulty === 'easy').length}
                        </p>
                        <p className="text-[9px] text-muted-foreground">Fáciles</p>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/30">
                        <p className="text-base font-bold text-red-500">
                            {questions.filter(q => q.difficulty === 'hard' || q.difficulty === 'expert').length}
                        </p>
                        <p className="text-[9px] text-muted-foreground">Difíciles</p>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1.5">
                    <AnimatePresence>
                        {questions.map((q, index) => {
                            const isActive = activeIndex === index;
                            const TemplateIcon = getTemplateIcon(q.template || 'default');
                            const templateColor = getTemplateColor(q.template || 'default');
                            
                            return (
                                <motion.div
                                    key={q.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.15 }}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={cn(
                                        "relative group",
                                        isActive && "z-10"
                                    )}
                                >
                                    <div
                                        onClick={() => onSelect(index)}
                                        className={cn(
                                            "relative p-2 rounded border transition-all duration-300 cursor-pointer",
                                            "bg-gradient-to-r from-card/80 via-card/70 to-card/80",
                                            isActive
                                                ? "border-primary shadow shadow-primary/20"
                                                : "border-border/40 hover:border-primary/40"
                                        )}
                                    >
                                        {/* Drag Handle */}
                                        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        
                                        <div className="ml-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[10px]",
                                                        templateColor
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 mb-0.5">
                                                            <TemplateIcon className="h-2.5 w-2.5 text-muted-foreground" />
                                                            <p className="text-xs font-semibold truncate max-w-[110px]">
                                                                {stripHtml(q.text) || "Pregunta sin título"}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                                                                {q.difficulty || 'medium'}
                                                            </Badge>
                                                            <span className="text-[9px] text-muted-foreground">
                                                                {q.options?.length || 0} opc
                                                            </span>
                                                            <span className="text-[9px] font-bold text-primary">
                                                                {q.basePoints || 10} pts
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Quick Actions */}
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 rounded"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDuplicate(index);
                                                                    }}
                                                                >
                                                                    <Copy className="h-2.5 w-2.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Duplicar pregunta</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    
                                                    {questions.length > 1 && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5 rounded hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDelete(index);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-2.5 w-2.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Eliminar pregunta</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    
                    {/* Empty State */}
                    {questions.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-6"
                        >
                            <div className="w-10 h-10 mx-auto mb-2 rounded bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                                <HelpCircle className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                            <h3 className="font-bold text-xs mb-1">No hay preguntas</h3>
                            <p className="text-[10px] text-muted-foreground mb-3">
                                Comienza creando tu primera pregunta
                            </p>
                            <Button 
                                onClick={onAdd} 
                                size="sm"
                                className="bg-gradient-to-r from-primary to-primary/80 text-xs h-7 px-2"
                            >
                                <PlusCircle className="h-3 w-3 mr-1" />
                                Crear primera
                            </Button>
                        </motion.div>
                    )}
                </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="p-2 border-t border-border/30 bg-card/50">
                <div className="flex items-center justify-between">
                    <div className="text-[9px] text-muted-foreground">
                        Puntos: <span className="font-bold text-primary">
                            {questions.reduce((sum, q) => sum + (q.basePoints || 0), 0)}
                        </span>
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                        Tiempo: <span className="font-bold text-primary">
                            {Math.ceil(questions.length * 1.5)} min
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// SETTINGS TAB (Completamente Optimizado)
// ============================================================================

interface SettingsTabProps {
    quiz: AppQuiz;
    onUpdate: (updates: Partial<AppQuiz>) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ quiz, onUpdate }) => {
    const [activeSection, setActiveSection] = useState('general');

    const sections = [
        { id: 'general', label: 'General', icon: Settings2 },
        { id: 'appearance', label: 'Apariencia', icon: Palette },
        { id: 'access', label: 'Acceso', icon: Shield },
    ];

    return (
        <div className="h-full flex">
            {/* Settings Sidebar */}
            <div className="w-48 border-r border-border/50 bg-gradient-to-b from-card/50 to-card/30 p-2">
                <h3 className="font-bold text-xs mb-3 flex items-center gap-1">
                    <Settings2 className="h-3.5 w-3.5 text-primary" />
                    Configuración
                </h3>
                <div className="space-y-0.5">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={cn(
                                    "w-full text-left p-1.5 rounded transition-all duration-300 flex items-center gap-1.5 text-xs",
                                    activeSection === section.id
                                        ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                <Icon className="h-3 w-3" />
                                <span className="font-semibold">{section.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Settings Content */}
            <ScrollArea className="flex-1 p-4">
                <AnimatePresence mode="wait">
                    {activeSection === 'general' && (
                        <motion.div
                            key="general"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-4 max-w-2xl"
                        >
                            {/* Quiz Details */}
                            <Card className="border border-border/50 bg-card/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        Información General
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="quiz-title" className="text-xs font-semibold">
                                            Título del Quiz
                                        </Label>
                                        <Input
                                            id="quiz-title"
                                            value={quiz.title}
                                            onChange={e => onUpdate({ title: e.target.value })}
                                            className="text-sm h-9 rounded border border-border/50 focus:border-primary bg-background/60"
                                            placeholder="Ej: Examen Final - Módulo 3"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <Label htmlFor="quiz-description" className="text-xs font-semibold">
                                            Descripción
                                        </Label>
                                        <Textarea
                                            id="quiz-description"
                                            value={quiz.description || ''}
                                            onChange={e => onUpdate({ description: e.target.value })}
                                            rows={2}
                                            className="rounded border border-border/50 focus:border-primary bg-background/60 resize-none text-xs"
                                            placeholder="Describe el propósito y contenido de este quiz..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Game Settings */}
                            <Card className="border border-border/50 bg-card/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                                        <Zap className="h-3.5 w-3.5 text-primary" />
                                        Configuración del Juego
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-xs font-semibold">Mostrar respuestas</Label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Mostrar respuestas correctas al finalizar
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={quiz.showAnswers || true}
                                                onCheckedChange={(checked) => onUpdate({ showAnswers: checked })}
                                                size="sm"
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-xs font-semibold">Mostrar puntaje</Label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Mostrar puntuación final inmediatamente
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={quiz.showScore || true}
                                                onCheckedChange={(checked) => onUpdate({ showScore: checked })}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeSection === 'appearance' && (
                        <motion.div
                            key="appearance"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-4 max-w-2xl"
                        >
                            <Card className="border border-border/50 bg-card/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                                        <Palette className="h-3.5 w-3.5 text-primary" />
                                        Personalización
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Theme Colors */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Tema de colores</Label>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {[
                                                { name: 'Azul', value: 'blue', bg: 'bg-blue-500' },
                                                { name: 'Verde', value: 'green', bg: 'bg-green-500' },
                                                { name: 'Púrpura', value: 'purple', bg: 'bg-purple-500' },
                                                { name: 'Rojo', value: 'red', bg: 'bg-red-500' },
                                                { name: 'Naranja', value: 'orange', bg: 'bg-orange-500' },
                                            ].map((color) => (
                                                <button
                                                    key={color.value}
                                                    onClick={() => onUpdate({ theme: color.value })}
                                                    className="flex flex-col items-center gap-0.5"
                                                >
                                                    <div className={cn(
                                                        "w-7 h-7 rounded flex items-center justify-center",
                                                        color.bg,
                                                        quiz.theme === color.value && "ring-1 ring-offset-1 ring-primary"
                                                    )}>
                                                        {quiz.theme === color.value && (
                                                            <Check className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-medium">{color.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Cover Image */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Imagen de portada</Label>
                                        <ImageUploadWidget 
                                            inputId="quiz-cover" 
                                            imageUrl={quiz.coverImage || null} 
                                            onUpload={(url) => onUpdate({ coverImage: url })} 
                                            onRemove={() => onUpdate({ coverImage: null })} 
                                            disabled={false} 
                                            label="Portada del quiz"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </ScrollArea>
        </div>
    );
};

// ============================================================================
// MAIN MODAL COMPONENT (Completamente Optimizado)
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
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

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
        field: string, 
        value: any
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
                        points: 10,
                        difficulty: 'medium'
                    },
                    { 
                        id: generateUniqueId('opt'), 
                        text: 'Falso', 
                        imageUrl: null, 
                        isCorrect: false, 
                        points: 0,
                        difficulty: 'medium'
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
                        points: 0,
                        difficulty: 'medium'
                    });
                }
                newQuestions[activeQuestionIndex].options = options.slice(0, 4);
            } else if (value === 'open_ended') {
                newQuestions[activeQuestionIndex].options = [
                    { 
                        id: generateUniqueId('opt'), 
                        text: 'Respuesta abierta', 
                        imageUrl: null, 
                        isCorrect: true, 
                        points: 10,
                        difficulty: 'medium'
                    }
                ];
            }
        }

        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (
        optionIndex: number, 
        field: string, 
        value: any
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
            difficulty: 'medium',
            basePoints: 10,
            options: [
                { 
                    id: generateUniqueId('option'), 
                    text: 'Opción Correcta', 
                    imageUrl: null, 
                    isCorrect: true, 
                    points: 10,
                    difficulty: 'medium'
                },
                { 
                    id: generateUniqueId('option'), 
                    text: 'Opción Incorrecta', 
                    imageUrl: null, 
                    isCorrect: false, 
                    points: 0,
                    difficulty: 'medium'
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
            text: 'Nueva opción', 
            imageUrl: null, 
            isCorrect: false, 
            points: 0,
            difficulty: 'medium'
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
        if (localQuiz.questions.length <= 1) {
            toast({
                title: "No se puede eliminar",
                description: "Debe haber al menos una pregunta en el quiz",
                variant: "destructive"
            });
            return;
        }
        
        setLocalQuiz(prev => ({ 
            ...prev, 
            questions: prev.questions.filter((_, i) => i !== indexToDelete) 
        }));
        setActiveQuestionIndex(prev => Math.max(0, prev - 1));
        
        toast({
            title: "Pregunta eliminada",
            description: "La pregunta ha sido eliminada del quiz",
        });
    };

    const handleDuplicateQuestion = (index: number) => {
        const questionToDuplicate = { ...localQuiz.questions[index] };
        const newQuestion = {
            ...questionToDuplicate,
            id: generateUniqueId('question'),
            text: `${questionToDuplicate.text} (Copia)`,
            order: localQuiz.questions.length
        };
        
        setLocalQuiz(prev => ({ 
            ...prev, 
            questions: [...prev.questions, newQuestion] 
        }));
        
        toast({
            title: "Pregunta duplicada",
            description: "Se ha creado una copia de la pregunta",
        });
    };

    const handleReorderQuestions = (fromIndex: number, toIndex: number) => {
        const newQuestions = [...localQuiz.questions];
        const [movedQuestion] = newQuestions.splice(fromIndex, 1);
        newQuestions.splice(toIndex, 0, movedQuestion);
        
        // Update order property
        newQuestions.forEach((q, idx) => {
            q.order = idx;
        });
        
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
        setActiveQuestionIndex(toIndex);
    };

    const handlePointsChange = (optionIndex: number, points: number) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex].options[optionIndex].points = points;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleDifficultyChange = (optionIndex: number, difficulty: string) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex].options[optionIndex].difficulty = difficulty;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleQuizUpdate = (updates: Partial<AppQuiz>) => {
        setLocalQuiz(prev => ({ ...prev, ...updates }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Validate quiz
            if (!localQuiz.title.trim()) {
                toast({
                    title: "Error de validación",
                    description: "El título del quiz es requerido",
                    variant: "destructive"
                });
                return;
            }

            if (localQuiz.questions.length === 0) {
                toast({
                    title: "Error de validación",
                    description: "Debe haber al menos una pregunta",
                    variant: "destructive"
                });
                return;
            }

            // Validate each question
            const invalidQuestions = localQuiz.questions.filter((q, index) => {
                const hasCorrectOption = q.options.some(opt => opt.isCorrect);
                const hasText = stripHtml(q.text).trim().length > 0;
                return !hasText || !hasCorrectOption;
            });

            if (invalidQuestions.length > 0) {
                toast({
                    title: "Error de validación",
                    description: `${invalidQuestions.length} preguntas no tienen texto o opción correcta`,
                    variant: "destructive"
                });
                return;
            }

            await onSave(localQuiz);
            
            toast({
                title: "✅ Quiz guardado",
                description: "Los cambios se han guardado exitosamente",
                className: "border-green-500"
            });
        } catch (error) {
            toast({
                title: "❌ Error al guardar",
                description: "Ha ocurrido un error al guardar el quiz",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportQuiz = () => {
        // TODO: Implement export functionality
        toast({
            title: "Exportando quiz",
            description: "El quiz se está exportando...",
        });
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
                <DialogContent className="w-[94vw] max-w-[1550px] h-[88vh] p-0 gap-0 rounded-lg overflow-hidden border border-border/50 bg-gradient-to-br from-background via-background to-muted/20 shadow-xl">
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="shrink-0 border-b border-border/50 bg-gradient-to-r from-card/90 via-card/80 to-card/90">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="rounded hover:bg-muted/80 h-8 w-8"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Separator orientation="vertical" className="h-5" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow">
                                            <CheckSquare className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h2 className="text-base font-bold truncate max-w-[200px]">
                                                    {localQuiz.title || 'Editor de Quiz'}
                                                </h2>
                                                <Badge variant={localQuiz.published ? "default" : "outline"} className="rounded text-[10px]">
                                                    {localQuiz.published ? "Publicado" : "Borrador"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-muted-foreground">
                                                    {localQuiz.questions.length} preguntas
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Main Tabs */}
                                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
                                        <TabsList className="bg-muted/60 p-0.5 rounded border border-border/50">
                                            <TabsTrigger 
                                                value="questions" 
                                                className="rounded px-3 py-1 transition-all font-bold text-xs gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow"
                                            >
                                                <HelpCircle className="h-3 w-3" /> 
                                                Preguntas
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="settings" 
                                                className="rounded px-3 py-1 transition-all font-bold text-xs gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow"
                                            >
                                                <Settings2 className="h-3 w-3" /> 
                                                Ajustes
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <Separator orientation="vertical" className="h-5" />

                                    <div className="flex items-center gap-1.5">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="rounded px-2.5 font-bold border border-border/50 hover:bg-muted/80 gap-1 h-8 text-xs" 
                                            onClick={() => setIsPreviewOpen(true)}
                                        >
                                            <Eye className="h-3 w-3" /> 
                                            Vista Previa
                                        </Button>

                                        <Button 
                                            size="sm" 
                                            onClick={handleSaveChanges} 
                                            disabled={isSaving}
                                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded px-4 font-bold shadow shadow-primary/20 transition-all gap-1 h-8 text-xs"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <ColorfulLoader className="h-3 w-3" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-3 w-3" /> 
                                                    Guardar
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 overflow-hidden">
                            <AnimatePresence mode="wait">
                                {activeTab === 'questions' ? (
                                    <motion.div
                                        key="questions"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex h-full"
                                    >
                                        {/* Sidebar - Question List */}
                                        <QuestionList
                                            questions={localQuiz.questions}
                                            activeIndex={activeQuestionIndex}
                                            onSelect={setActiveQuestionIndex}
                                            onDelete={handleDeleteQuestion}
                                            onAdd={handleAddQuestion}
                                            onReorder={handleReorderQuestions}
                                            onDuplicate={handleDuplicateQuestion}
                                        />

                                        {/* Editor Area */}
                                        <div className="flex-1 overflow-hidden">
                                            <ScrollArea className="h-full">
                                                <div className="p-4 max-w-[900px] mx-auto min-h-full">
                                                    {activeQuestion ? (
                                                        <QuestionEditor
                                                            question={activeQuestion}
                                                            onQuestionChange={handleQuestionChange}
                                                            onOptionChange={handleOptionChange}
                                                            onSetCorrect={handleSetCorrect}
                                                            onOptionAdd={handleAddOption}
                                                            onOptionDelete={handleDeleteOption}
                                                            onPointsChange={handlePointsChange}
                                                            onDifficultyChange={handleDifficultyChange}
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-[40vh]">
                                                            <div className="w-12 h-12 rounded bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center mb-3">
                                                                <HelpCircle className="h-6 w-6 text-muted-foreground/50" />
                                                            </div>
                                                            <h3 className="text-sm font-bold mb-1">Selecciona una pregunta</h3>
                                                            <p className="text-xs text-muted-foreground mb-4 max-w-xs text-center">
                                                                Elige una pregunta de la lista para comenzar a editar
                                                            </p>
                                                            <Button 
                                                                onClick={handleAddQuestion} 
                                                                size="sm"
                                                                className="bg-gradient-to-r from-primary to-primary/80 text-xs"
                                                            >
                                                                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                                                Crear primera pregunta
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="settings"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15 }}
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

                        {/* Status Bar */}
                        <div className="shrink-0 border-t border-border/50 bg-card/80 px-3 py-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            localQuiz.published ? "bg-emerald-500" : "bg-yellow-500"
                                        )} />
                                        <span className="text-xs font-medium">
                                            {localQuiz.published ? "Publicado" : "Borrador"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-bold text-primary">{localQuiz.questions.length}</span> preguntas
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-bold text-primary">
                                            {localQuiz.questions.reduce((sum, q) => sum + (q.basePoints || 10), 0)}
                                        </span> puntos
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl h-[75vh] p-0 overflow-hidden rounded-lg border border-border/50 bg-background/95 shadow-lg">
                    <div className="h-full flex flex-col">
                        <div className="shrink-0 border-b border-border/50 bg-gradient-to-r from-card/90 to-card/80 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow">
                                        <Eye className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">Vista Previa del Quiz</h3>
                                        <p className="text-xs text-muted-foreground">Así verán el quiz tus estudiantes</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="rounded h-7 w-7"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4">
                                <QuizGameView 
                                    form={quizPreviewForm as any} 
                                    isEditorPreview={true} 
                                    activeQuestionIndex={activeQuestionIndex} 
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}