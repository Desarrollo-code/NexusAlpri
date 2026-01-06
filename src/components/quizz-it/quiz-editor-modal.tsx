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
    Tablet
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
    loading: () => <div className="h-[100px] w-full bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 animate-pulse rounded-2xl" />
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
// AI ASSISTANT COMPONENT
// ============================================================================

interface AIAssistantProps {
    onGenerateQuestion: () => void;
    onImproveQuestion: (questionId: string) => void;
    onSuggestOptions: (questionId: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
    onGenerateQuestion, 
    onImproveQuestion, 
    onSuggestOptions 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const aiFeatures = [
        {
            icon: Sparkles,
            title: "Generar pregunta",
            description: "Crea una pregunta basada en el tema",
            action: onGenerateQuestion,
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: Lightbulb,
            title: "Mejorar pregunta",
            description: "Optimiza la redacción y claridad",
            action: () => {},
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Target,
            title: "Sugerir opciones",
            description: "Genera opciones de respuesta relevantes",
            action: () => {},
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: TrendingUp,
            title: "Analizar dificultad",
            description: "Ajusta el nivel de dificultad",
            action: () => {},
            color: "from-orange-500 to-red-500"
        },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            <Card className={cn(
                "border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 backdrop-blur-xl overflow-hidden transition-all duration-300",
                isExpanded ? "rounded-2xl" : "rounded-full"
            )}>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Asistente IA</h3>
                                <p className="text-xs text-muted-foreground">
                                    Mejora tu quiz con inteligencia artificial
                                </p>
                            </div>
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="rounded-xl"
                        >
                            <ChevronRight className={cn(
                                "h-4 w-4 transition-transform duration-300",
                                isExpanded && "rotate-90"
                            )} />
                        </Button>
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <Separator className="my-4" />
                                <div className="grid grid-cols-2 gap-3">
                                    {aiFeatures.map((feature, index) => (
                                        <motion.div
                                            key={feature.title}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className="border-2 border-border/30 bg-card/50 hover:bg-card/80 transition-all duration-300 cursor-pointer group"
                                                  onClick={() => !isGenerating && feature.action()}>
                                                <CardContent className="p-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl bg-gradient-to-br mb-3 flex items-center justify-center shadow-sm",
                                                        feature.color
                                                    )}>
                                                        <feature.icon className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-sm mb-1">{feature.title}</h4>
                                                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl">
                                    <p className="text-xs font-medium text-center text-muted-foreground">
                                        ✨ Usa IA para crear contenido de alta calidad automáticamente
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </motion.div>
    );
};

// ============================================================================
// IMAGE UPLOAD WIDGET (Mejorado)
// ============================================================================

interface ImageUploadWidgetProps {
    imageUrl: string | null;
    onUpload: (url: string) => void;
    onRemove: () => void;
    disabled: boolean;
    inputId: string;
    isCorrect?: boolean;
    label?: string;
    aspectRatio?: string;
}

const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({ 
    imageUrl, 
    onUpload, 
    onRemove, 
    disabled, 
    inputId, 
    isCorrect,
    label = "Subir imagen",
    aspectRatio = "aspect-video"
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

    return (
        <div 
            className={cn(
                "relative w-full rounded-xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden group",
                aspectRatio,
                isCorrect 
                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20" 
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
                <div className="relative w-full h-full">
                    <Image 
                        src={imageUrl} 
                        alt="preview" 
                        fill 
                        className="object-cover rounded-lg" 
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-end p-4">
                        <div className="flex gap-2">
                            <Button 
                                type="button" 
                                variant="secondary"
                                size="sm"
                                className="bg-white/90 hover:bg-white text-black rounded-lg shadow-lg h-9 px-3"
                                onClick={(e) => { 
                                    e.stopPropagation();
                                    // TODO: Implementar reemplazar imagen
                                }} 
                                disabled={disabled}
                            >
                                <Upload className="h-3.5 w-3.5 mr-1.5" />
                                <span className="text-xs">Reemplazar</span>
                            </Button>
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                className="bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow-lg h-9 px-3" 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onRemove(); 
                                }} 
                                disabled={disabled}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
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
                    <div className="text-center space-y-4 p-6">
                        <div className={cn(
                            "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all",
                            isDragging 
                                ? "bg-primary/20 scale-110" 
                                : "bg-primary/10 group-hover:bg-primary/20"
                        )}>
                            <ImageIcon className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground/90">
                                {label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Arrastra una imagen o haz clic para seleccionar
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 mt-1">
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
// OPTION CARD COMPONENT (Mejorado)
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
                <div className="w-full h-40">
                    <ImageUploadWidget 
                        inputId={`opt-img-${option.id}`} 
                        imageUrl={option.imageUrl} 
                        onUpload={onImageChange} 
                        onRemove={() => onImageChange(null)} 
                        disabled={false} 
                        isCorrect={isCorrect} 
                        label={`Opción ${index + 1}`}
                        aspectRatio="aspect-[4/3]"
                    />
                </div>
            );
        }
        
        if (template === 'true_false') {
            return (
                <Button 
                    type="button" 
                    className={cn(
                        "w-full h-24 text-lg font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:scale-[1.02]",
                        isCorrect 
                            ? "bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-emerald-500/40" 
                            : "bg-gradient-to-br from-muted via-muted/80 to-muted hover:from-muted/90 hover:via-muted/70 hover:to-muted/90 text-foreground/80 shadow-lg"
                    )}
                    onClick={onSetCorrect}
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">{option.text}</span>
                        {isCorrect && (
                            <Badge className="bg-white/20 text-white/90 border-0 px-2 py-0.5">
                                ✓ Correcta
                            </Badge>
                        )}
                    </div>
                </Button>
            );
        }
        
        return (
            <div className="bg-gradient-to-br from-background/80 via-background/60 to-background/80 rounded-xl overflow-hidden border-2 border-border/50 shadow-inner">
                <ReactQuill
                    theme="snow"
                    value={option.text}
                    onChange={onTextChange}
                    modules={{ toolbar: [['bold', 'italic', 'underline', 'strike']] }}
                    className="quill-editor-option min-h-[80px]"
                    placeholder="Escribe el texto de la opción..."
                />
            </div>
        );
    };

    return (
        <motion.div 
            layout 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="group"
        >
            <Card className={cn(
                "border-2 transition-all duration-300 overflow-hidden hover:shadow-xl",
                isCorrect 
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/5 shadow-lg shadow-emerald-500/20" 
                    : "border-border/40 bg-card/60 hover:border-primary/40 hover:shadow-lg"
            )}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge 
                                variant={isCorrect ? "default" : "outline"}
                                className={cn(
                                    "font-bold text-xs tracking-wider px-3 py-1 rounded-lg",
                                    isCorrect && "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isCorrect ? "bg-white" : "bg-muted-foreground"
                                    )} />
                                    Opción {index + 1}
                                </div>
                            </Badge>
                            
                            {isCorrect && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0">
                                    <Check className="h-3 w-3 mr-1" /> Correcta
                                </Badge>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={onSetCorrect}
                                            className={cn(
                                                "h-8 w-8 rounded-lg transition-all duration-300",
                                                isCorrect 
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md" 
                                                    : "hover:bg-emerald-500/10 hover:text-emerald-600"
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
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
                                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Settings2 className="h-4 w-4" />
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
                                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
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
                
                <CardContent>
                    {renderContent()}
                    
                    <AnimatePresence>
                        {(isExpanded || showAdvanced) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <Separator className="my-4" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Puntos</Label>
                                        <div className="flex items-center gap-2">
                                            <Slider 
                                                value={[option.points || 0]} 
                                                onValueChange={([value]) => onPointsChange(value)}
                                                min={0}
                                                max={50}
                                                step={5}
                                                className="flex-1"
                                            />
                                            <span className="text-sm font-bold min-w-[40px]">
                                                {option.points || 0} pts
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Dificultad</Label>
                                        <Select 
                                            value={option.difficulty || 'medium'}
                                            onValueChange={onDifficultyChange}
                                        >
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DIFFICULTY_LEVELS.map(level => (
                                                    <SelectItem key={level.value} value={level.value} className="text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${level.color}`} />
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
// QUESTION STATS COMPONENT
// ============================================================================

interface QuestionStatsProps {
    question: AppQuestion;
}

const QuestionStats: React.FC<QuestionStatsProps> = ({ question }) => {
    const totalOptions = question.options?.length || 0;
    const correctOptions = question.options?.filter(opt => opt.isCorrect).length || 0;
    const avgDifficulty = DIFFICULTY_LEVELS.find(l => l.value === question.difficulty)?.label || 'Media';
    const totalPoints = question.options?.reduce((sum, opt) => sum + (opt.points || 0), 0) || 0;

    const stats = [
        {
            label: "Opciones",
            value: totalOptions,
            icon: CheckSquare,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            label: "Correctas",
            value: correctOptions,
            icon: Check,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10"
        },
        {
            label: "Dificultad",
            value: avgDifficulty,
            icon: BrainCircuit,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10"
        },
        {
            label: "Puntos",
            value: `${totalPoints} pts`,
            icon: Zap,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        }
    ];

    return (
        <Card className="border-2 border-border/50 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
            <CardContent className="p-4">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Estadísticas
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={cn(
                                "p-3 rounded-xl border border-border/30",
                                stat.bgColor
                            )}>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={cn("p-1.5 rounded-lg", stat.bgColor)}>
                                        <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {stat.label}
                                    </span>
                                </div>
                                <p className="text-lg font-bold">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// ============================================================================
// QUESTION EDITOR COMPONENT (Rediseñado)
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
            <Card className="border-2 border-border/50 bg-gradient-to-r from-card via-card/95 to-card mb-6 rounded-2xl">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                                currentTemplate?.gradient
                            )}>
                                {currentTemplate && <currentTemplate.icon className="h-6 w-6 text-white" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-base">{currentTemplate?.label}</h3>
                                <p className="text-sm text-muted-foreground">{currentTemplate?.description}</p>
                            </div>
                        </div>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="rounded-xl gap-2">
                                    <Palette className="h-4 w-4" />
                                    Cambiar plantilla
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Buscar plantilla..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron plantillas</CommandEmpty>
                                        <CommandGroup>
                                            {TEMPLATE_OPTIONS.map((template) => (
                                                <CommandItem
                                                    key={template.value}
                                                    value={template.value}
                                                    onSelect={() => onQuestionChange('template', template.value)}
                                                    className="py-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                                            template.gradient
                                                        )}>
                                                            <template.icon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{template.label}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {template.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Contenido
                    </TabsTrigger>
                    <TabsTrigger value="options" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Opciones
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Configuración
                    </TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="space-y-6 flex-1">
                        {/* Question Statement */}
                        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <HelpCircle className="h-4 w-4 text-primary" />
                                    </div>
                                    Enunciado de la Pregunta
                                </CardTitle>
                                <CardDescription>
                                    Escribe la pregunta principal que verán los estudiantes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gradient-to-br from-background/80 via-background/60 to-background/80 rounded-xl overflow-hidden border-2 border-border/50 shadow-inner">
                                    <ReactQuill
                                        theme="snow"
                                        value={question.text || ''}
                                        onChange={(v) => onQuestionChange('text', v)}
                                        modules={QUILL_MODULES}
                                        placeholder="¿Cuál es tu pregunta?..."
                                        className="quill-editor-custom min-h-[120px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Question Image */}
                        {question.template === 'image' && (
                            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-bold flex items-center gap-2.5">
                                        <ImageIcon className="h-4 w-4 text-primary" />
                                        Imagen de Apoyo
                                    </CardTitle>
                                    <CardDescription>
                                        Añade una imagen relacionada con la pregunta
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="max-w-lg">
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
                        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2.5">
                                    <Lightbulb className="h-4 w-4 text-primary" />
                                    Explicación Detallada
                                </CardTitle>
                                <CardDescription>
                                    Proporciona una explicación que se mostrará después de responder
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={question.explanation || ''}
                                    onChange={e => onQuestionChange('explanation', e.target.value)}
                                    rows={4}
                                    className="min-h-[100px] rounded-xl border-2 border-border/50 bg-background/60 p-4"
                                    placeholder="Explica por qué esta respuesta es correcta y proporciona información adicional..."
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Options Tab */}
                <TabsContent value="options" className="flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="space-y-6 flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Opciones de Respuesta</h3>
                                <p className="text-sm text-muted-foreground">
                                    {question.options.length} {question.options.length === 1 ? 'opción' : 'opciones'} configuradas
                                </p>
                            </div>
                            
                            {canAddOption && (
                                <Button 
                                    type="button" 
                                    size="lg"
                                    onClick={onOptionAdd} 
                                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
                                >
                                    <PlusCircle className="h-5 w-5" /> 
                                    Añadir Opción
                                </Button>
                            )}
                        </div>

                        <div className={cn(
                            "grid gap-4", 
                            isImageOptionsTemplate 
                                ? "grid-cols-2 lg:grid-cols-4" 
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
                    </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Question Settings */}
                            <Card className="border-2 border-border/50 bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2.5">
                                        <Settings2 className="h-4 w-4 text-primary" />
                                        Configuración de la Pregunta
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold">Dificultad</Label>
                                            <Select 
                                                value={question.difficulty || 'medium'}
                                                onValueChange={(v) => onQuestionChange('difficulty', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DIFFICULTY_LEVELS.map(level => (
                                                        <SelectItem key={level.value} value={level.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${level.color}`} />
                                                                {level.label} ({level.points} pts)
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold">Límite de tiempo</Label>
                                            <Select 
                                                value={question.timeLimit || 'none'}
                                                onValueChange={(v) => onQuestionChange('timeLimit', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIME_LIMIT_OPTIONS.map(option => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4" />
                                                                {option.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">Puntos base</Label>
                                            <span className="text-lg font-bold text-primary">
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
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold">Pista/Retroalimentación</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Mostrar una pista si la respuesta es incorrecta
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={question.showHint || false}
                                                onCheckedChange={(checked) => onQuestionChange('showHint', checked)}
                                            />
                                        </div>
                                        
                                        {question.showHint && (
                                            <Textarea
                                                value={question.hint || ''}
                                                onChange={e => onQuestionChange('hint', e.target.value)}
                                                placeholder="Proporciona una pista útil..."
                                                className="min-h-[80px]"
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Tags */}
                            <Card className="border-2 border-border/50 bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2.5">
                                        <Tag className="h-4 w-4 text-primary" />
                                        Etiquetas y Categorías
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {question.tags?.map((tag: string, index: number) => (
                                            <Badge key={index} variant="secondary" className="gap-1 pl-3">
                                                {tag}
                                                <button
                                                    onClick={() => {
                                                        const newTags = [...(question.tags || [])];
                                                        newTags.splice(index, 1);
                                                        onQuestionChange('tags', newTags);
                                                    }}
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        <Input
                                            placeholder="Añadir etiqueta..."
                                            className="w-auto flex-1"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                    const newTags = [...(question.tags || []), e.currentTarget.value.trim()];
                                                    onQuestionChange('tags', newTags);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="space-y-6">
                            <QuestionStats question={question} />
                            
                            <Card className="border-2 border-border/50 bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2.5">
                                        <Eye className="h-4 w-4 text-primary" />
                                        Vista Previa Rápida
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center">
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Eye className="h-6 w-6 text-primary" />
                                            </div>
                                            <p className="text-sm font-semibold">Vista previa</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Activa la vista previa completa
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// ============================================================================
// QUESTION LIST SIDEBAR (Rediseñado)
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
        <div className="w-96 border-r-2 border-border/50 flex flex-col bg-gradient-to-b from-background via-background to-muted/5">
            {/* Header */}
            <div className="p-6 border-b-2 border-border/50 bg-gradient-to-r from-card/90 via-card/80 to-card/70">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                            <List className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Preguntas</h3>
                            <p className="text-sm text-muted-foreground">
                                {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'} en total
                            </p>
                        </div>
                    </div>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl"
                                    onClick={() => {
                                        // TODO: Implementar búsqueda
                                    }}
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Buscar pregunta</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                        onClick={onAdd} 
                        className="h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" /> 
                        Nueva
                    </Button>
                    
                    <Button 
                        variant="outline"
                        className="h-12 rounded-xl border-2 border-border/50"
                        onClick={() => {
                            // TODO: Importar preguntas
                        }}
                    >
                        <Upload className="mr-2 h-5 w-5" /> 
                        Importar
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{questions.length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-500">
                            {questions.filter(q => q.difficulty === 'easy').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Fáciles</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">
                            {questions.filter(q => q.difficulty === 'hard' || q.difficulty === 'expert').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Difíciles</p>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                    <AnimatePresence>
                        {questions.map((q, index) => {
                            const isActive = activeIndex === index;
                            const TemplateIcon = getTemplateIcon(q.template || 'default');
                            const templateColor = getTemplateColor(q.template || 'default');
                            
                            return (
                                <motion.div
                                    key={q.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
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
                                            "relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer",
                                            "bg-gradient-to-r from-card/80 via-card/70 to-card/80 backdrop-blur-sm",
                                            isActive
                                                ? "border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                                                : "border-border/40 hover:border-primary/40 hover:shadow-lg"
                                        )}
                                    >
                                        {/* Drag Handle */}
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        
                                        <div className="ml-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm",
                                                        templateColor
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <TemplateIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <p className="text-sm font-semibold truncate">
                                                                {stripHtml(q.text) || "Pregunta sin título"}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[10px] h-5">
                                                                {q.difficulty || 'medium'}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {q.options?.length || 0} opc
                                                            </span>
                                                            <span className="text-xs font-bold text-primary">
                                                                {q.basePoints || 10} pts
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Quick Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-lg"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDuplicate(index);
                                                                    }}
                                                                >
                                                                    <Copy className="h-3.5 w-3.5" />
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
                                                                        className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDelete(index);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                                <HelpCircle className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">No hay preguntas</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Comienza creando tu primera pregunta
                            </p>
                            <Button 
                                onClick={onAdd} 
                                className="bg-gradient-to-r from-primary to-primary/80"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear primera pregunta
                            </Button>
                        </motion.div>
                    )}
                </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="p-4 border-t border-border/30 bg-card/50">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Puntos totales: <span className="font-bold text-primary">
                            {questions.reduce((sum, q) => sum + (q.basePoints || 0), 0)}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Tiempo estimado: <span className="font-bold text-primary">
                            {Math.ceil(questions.length * 1.5)} min
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// SETTINGS TAB (Rediseñado)
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
        { id: 'analytics', label: 'Analíticas', icon: BarChart3 },
        { id: 'integrations', label: 'Integraciones', icon: Link },
    ];

    return (
        <div className="h-full flex">
            {/* Settings Sidebar */}
            <div className="w-64 border-r-2 border-border/50 bg-gradient-to-b from-card/50 to-card/30 p-4">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    Configuración
                </h3>
                <div className="space-y-1">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl transition-all duration-300 flex items-center gap-3",
                                    activeSection === section.id
                                        ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="font-semibold">{section.label}</span>
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                    <h4 className="font-bold text-sm mb-2">Estado del Quiz</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Visibilidad</span>
                            <Switch 
                                checked={quiz.published || false}
                                onCheckedChange={(checked) => onUpdate({ published: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Modo evaluación</span>
                            <Switch 
                                checked={quiz.isExam || false}
                                onCheckedChange={(checked) => onUpdate({ isExam: checked })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Content */}
            <ScrollArea className="flex-1 p-8">
                <AnimatePresence mode="wait">
                    {activeSection === 'general' && (
                        <motion.div
                            key="general"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 max-w-3xl"
                        >
                            {/* Quiz Details */}
                            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Información General
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="quiz-title" className="text-sm font-semibold">
                                            Título del Quiz
                                        </Label>
                                        <Input
                                            id="quiz-title"
                                            value={quiz.title}
                                            onChange={e => onUpdate({ title: e.target.value })}
                                            className="text-base h-12 rounded-xl border-2 border-border/50 focus:border-primary bg-background/60"
                                            placeholder="Ej: Examen Final - Módulo 3"
                                        />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <Label htmlFor="quiz-description" className="text-sm font-semibold">
                                            Descripción
                                        </Label>
                                        <Textarea
                                            id="quiz-description"
                                            value={quiz.description || ''}
                                            onChange={e => onUpdate({ description: e.target.value })}
                                            rows={4}
                                            className="rounded-xl border-2 border-border/50 focus:border-primary bg-background/60 resize-none"
                                            placeholder="Describe el propósito y contenido de este quiz..."
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label htmlFor="quiz-category" className="text-sm font-semibold">
                                                Categoría
                                            </Label>
                                            <Select 
                                                value={quiz.category || 'general'}
                                                onValueChange={(v) => onUpdate({ category: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar categoría" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">General</SelectItem>
                                                    <SelectItem value="mathematics">Matemáticas</SelectItem>
                                                    <SelectItem value="science">Ciencias</SelectItem>
                                                    <SelectItem value="history">Historia</SelectItem>
                                                    <SelectItem value="language">Idiomas</SelectItem>
                                                    <SelectItem value="technology">Tecnología</SelectItem>
                                                    <SelectItem value="business">Negocios</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <Label htmlFor="quiz-language" className="text-sm font-semibold">
                                                Idioma
                                            </Label>
                                            <Select 
                                                value={quiz.language || 'es'}
                                                onValueChange={(v) => onUpdate({ language: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar idioma" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="es">Español</SelectItem>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="fr">Français</SelectItem>
                                                    <SelectItem value="de">Deutsch</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Game Settings */}
                            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Configuración del Juego
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="quiz-max-attempts" className="text-sm font-semibold">
                                                Intentos máximos
                                            </Label>
                                            <Select 
                                                value={quiz.maxAttempts?.toString() || 'unlimited'}
                                                onValueChange={(v) => onUpdate({ 
                                                    maxAttempts: v === 'unlimited' ? null : parseInt(v)
                                                })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unlimited">Ilimitados</SelectItem>
                                                    <SelectItem value="1">1 intento</SelectItem>
                                                    <SelectItem value="2">2 intentos</SelectItem>
                                                    <SelectItem value="3">3 intentos</SelectItem>
                                                    <SelectItem value="5">5 intentos</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <Label htmlFor="quiz-passing-grade" className="text-sm font-semibold">
                                                Nota de aprobación
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <Slider 
                                                    value={[quiz.passingGrade || 70]} 
                                                    onValueChange={([value]) => onUpdate({ passingGrade: value })}
                                                    min={0}
                                                    max={100}
                                                    step={5}
                                                    className="flex-1"
                                                />
                                                <span className="text-lg font-bold min-w-[50px]">
                                                    {quiz.passingGrade || 70}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-sm">Orden de preguntas</h4>
                                        <RadioGroup 
                                            value={quiz.questionOrder || 'sequential'}
                                            onValueChange={(v) => onUpdate({ questionOrder: v })}
                                            className="grid grid-cols-2 gap-3"
                                        >
                                            <div>
                                                <RadioGroupItem value="sequential" id="order-sequential" className="peer sr-only" />
                                                <Label
                                                    htmlFor="order-sequential"
                                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <List className="mb-2 h-6 w-6" />
                                                    <span className="font-semibold">Secuencial</span>
                                                    <span className="text-xs text-muted-foreground text-center">
                                                        Preguntas en orden fijo
                                                    </span>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="random" id="order-random" className="peer sr-only" />
                                                <Label
                                                    htmlFor="order-random"
                                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <Shuffle className="mb-2 h-6 w-6" />
                                                    <span className="font-semibold">Aleatorio</span>
                                                    <span className="text-xs text-muted-foreground text-center">
                                                        Preguntas mezcladas
                                                    </span>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-semibold">Mostrar respuestas</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Mostrar respuestas correctas al finalizar
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={quiz.showAnswers || true}
                                                onCheckedChange={(checked) => onUpdate({ showAnswers: checked })}
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-semibold">Mostrar puntaje</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Mostrar puntuación final inmediatamente
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={quiz.showScore || true}
                                                onCheckedChange={(checked) => onUpdate({ showScore: checked })}
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-semibold">Permitir retroceso</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Permitir volver a preguntas anteriores
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={quiz.allowBack || true}
                                                onCheckedChange={(checked) => onUpdate({ allowBack: checked })}
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
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 max-w-3xl"
                        >
                            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                        <Palette className="h-5 w-5 text-primary" />
                                        Personalización
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Theme Colors */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">Tema de colores</Label>
                                        <div className="grid grid-cols-5 gap-3">
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
                                                    className="flex flex-col items-center gap-2"
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                                        color.bg,
                                                        quiz.theme === color.value && "ring-2 ring-offset-2 ring-primary"
                                                    )}>
                                                        {quiz.theme === color.value && (
                                                            <Check className="h-6 w-6 text-white" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium">{color.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Timer Style */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">Estilo del temporizador</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'circular', label: 'Circular', icon: Timer },
                                                { id: 'bar', label: 'Barra', icon: BarChart3 },
                                                { id: 'pill', label: 'Píldora', icon: Zap },
                                            ].map((style) => {
                                                const Icon = style.icon;
                                                return (
                                                    <button
                                                        key={style.id}
                                                        onClick={() => onUpdate({ timerStyle: style.id })}
                                                        className={cn(
                                                            "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                                            quiz.timerStyle === style.id
                                                                ? "border-primary bg-primary/10"
                                                                : "border-border hover:border-primary/40"
                                                        )}
                                                    >
                                                        <Icon className="h-6 w-6" />
                                                        <span className="text-sm font-medium">{style.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    {/* Layout */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">Diseño del quiz</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <RadioGroupItem value="modern" id="layout-modern" className="peer sr-only" />
                                                <Label
                                                    htmlFor="layout-modern"
                                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <Monitor className="mb-2 h-6 w-6" />
                                                    <span className="font-semibold">Moderno</span>
                                                    <span className="text-xs text-muted-foreground text-center">
                                                        Diseño limpio y espaciado
                                                    </span>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="compact" id="layout-compact" className="peer sr-only" />
                                                <Label
                                                    htmlFor="layout-compact"
                                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <Smartphone className="mb-2 h-6 w-6" />
                                                    <span className="font-semibold">Compacto</span>
                                                    <span className="text-xs text-muted-foreground text-center">
                                                        Optimizado para móviles
                                                    </span>
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Cover Image */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">Imagen de portada</Label>
                                        <ImageUploadWidget 
                                            inputId="quiz-cover" 
                                            imageUrl={quiz.coverImage || null} 
                                            onUpload={(url) => onUpdate({ coverImage: url })} 
                                            onRemove={() => onUpdate({ coverImage: null })} 
                                            disabled={false} 
                                            label="Portada del quiz"
                                            aspectRatio="aspect-[21/9]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeSection === 'access' && (
                        <motion.div
                            key="access"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 max-w-3xl"
                        >
                            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Control de Acceso
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Access Control */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-sm">Visibilidad</h4>
                                        <RadioGroup 
                                            value={quiz.access || 'public'}
                                            onValueChange={(v) => onUpdate({ access: v })}
                                            className="space-y-3"
                                        >
                                            <div className="flex items-center space-x-3 space-y-0">
                                                <RadioGroupItem value="public" id="access-public" />
                                                <Label htmlFor="access-public" className="font-normal">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4" />
                                                        <div>
                                                            <p className="font-semibold">Público</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Cualquiera con el enlace puede acceder
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 space-y-0">
                                                <RadioGroupItem value="private" id="access-private" />
                                                <Label htmlFor="access-private" className="font-normal">
                                                    <div className="flex items-center gap-2">
                                                        <Lock className="h-4 w-4" />
                                                        <div>
                                                            <p className="font-semibold">Privado</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Solo usuarios invitados pueden acceder
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 space-y-0">
                                                <RadioGroupItem value="password" id="access-password" />
                                                <Label htmlFor="access-password" className="font-normal">
                                                    <div className="flex items-center gap-2">
                                                        <Key className="h-4 w-4" />
                                                        <div>
                                                            <p className="font-semibold">Con contraseña</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Requiere contraseña para acceder
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                        
                                        {quiz.access === 'password' && (
                                            <div className="ml-7 space-y-3">
                                                <Label htmlFor="quiz-password" className="text-sm font-semibold">
                                                    Contraseña
                                                </Label>
                                                <Input
                                                    id="quiz-password"
                                                    type="password"
                                                    value={quiz.password || ''}
                                                    onChange={e => onUpdate({ password: e.target.value })}
                                                    className="max-w-xs"
                                                    placeholder="Ingresa la contraseña"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Schedule */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-sm">Programación</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Label htmlFor="start-date" className="text-sm font-semibold">
                                                    Fecha de inicio
                                                </Label>
                                                <Input
                                                    id="start-date"
                                                    type="datetime-local"
                                                    value={quiz.startDate || ''}
                                                    onChange={e => onUpdate({ startDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="end-date" className="text-sm font-semibold">
                                                    Fecha de fin
                                                </Label>
                                                <Input
                                                    id="end-date"
                                                    type="datetime-local"
                                                    value={quiz.endDate || ''}
                                                    onChange={e => onUpdate({ endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Sharing */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-sm">Compartir</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button variant="outline" className="h-12 justify-start">
                                                <Link className="mr-2 h-4 w-4" />
                                                <div className="text-left">
                                                    <p className="text-xs">Enlace público</p>
                                                    <p className="text-sm font-semibold truncate">
                                                        quiz.com/{quiz.id}
                                                    </p>
                                                </div>
                                            </Button>
                                            <Button variant="outline" className="h-12 justify-start">
                                                <QrCode className="mr-2 h-4 w-4" />
                                                <div className="text-left">
                                                    <p className="text-xs">Código QR</p>
                                                    <p className="text-sm font-semibold">Generar</p>
                                                </div>
                                            </Button>
                                        </div>
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
// ANALYTICS DASHBOARD
// ============================================================================

interface AnalyticsDashboardProps {
    quiz: AppQuiz;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ quiz }) => {
    const stats = [
        { label: "Vistas totales", value: "1,234", change: "+12%", icon: Eye, color: "text-blue-500" },
        { label: "Completados", value: "892", change: "+8%", icon: Check, color: "text-emerald-500" },
        { label: "Tasa de aprobación", value: "76%", change: "+5%", icon: TrendingUp, color: "text-green-500" },
        { label: "Tiempo promedio", value: "4:32", change: "-2%", icon: Clock, color: "text-orange-500" },
    ];

    return (
        <div className="p-8 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label} className="border-2 border-border/50 bg-card/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-2 rounded-lg bg-opacity-10", stat.color.replace('text-', 'bg-'))}>
                                        <Icon className={cn("h-5 w-5", stat.color)} />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-1 rounded",
                                        stat.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                    )}>
                                        {stat.change}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2 border-border/50 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Rendimiento por pregunta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl">
                            <div className="text-center">
                                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="text-muted-foreground">Gráfico de rendimiento</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-border/50 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Distribución de puntajes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl">
                            <div className="text-center">
                                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="text-muted-foreground">Gráfico de distribución</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN MODAL COMPONENT (Rediseñado)
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
    const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'analytics'>('questions');
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
                <DialogContent className="w-[98vw] max-w-[1800px] h-[95vh] p-0 gap-0 rounded-3xl overflow-hidden border-2 border-border/50 bg-gradient-to-br from-background via-background to-muted/20 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="shrink-0 border-b-2 border-border/50 bg-gradient-to-r from-card/90 via-card/80 to-card/90 backdrop-blur-xl">
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
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30">
                                            <CheckSquare className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                                    {localQuiz.title || 'Editor de Quiz'}
                                                </h2>
                                                <Badge variant={localQuiz.published ? "default" : "outline"} className="rounded-lg">
                                                    {localQuiz.published ? "Publicado" : "Borrador"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-sm font-semibold text-muted-foreground">
                                                    {localQuiz.questions.length} preguntas · {localQuiz.category || 'General'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="rounded-lg">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {localQuiz.access === 'public' ? 'Público' : 'Privado'}
                                                    </Badge>
                                                    <Badge variant="secondary" className="rounded-lg">
                                                        <Zap className="h-3 w-3 mr-1" />
                                                        {localQuiz.questions.reduce((sum, q) => sum + (q.basePoints || 10), 0)} pts
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* AI Assistant */}
                                    <AIAssistant
                                        onGenerateQuestion={handleAddQuestion}
                                        onImproveQuestion={() => {}}
                                        onSuggestOptions={() => {}}
                                    />

                                    <Separator orientation="vertical" className="h-8" />

                                    {/* Main Tabs */}
                                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
                                        <TabsList className="bg-muted/60 p-1.5 rounded-xl border-2 border-border/50 shadow-lg">
                                            <TabsTrigger 
                                                value="questions" 
                                                className="rounded-lg px-6 py-2.5 transition-all font-bold text-sm gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-md"
                                            >
                                                <HelpCircle className="h-4 w-4" /> 
                                                Preguntas
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="settings" 
                                                className="rounded-lg px-6 py-2.5 transition-all font-bold text-sm gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-md"
                                            >
                                                <Settings2 className="h-4 w-4" /> 
                                                Ajustes
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="analytics" 
                                                className="rounded-lg px-6 py-2.5 transition-all font-bold text-sm gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-md"
                                            >
                                                <BarChart3 className="h-4 w-4" /> 
                                                Analíticas
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <Separator orientation="vertical" className="h-8" />

                                    <div className="flex items-center gap-3">
                                        <Button 
                                            variant="outline" 
                                            size="lg" 
                                            className="rounded-xl px-5 font-bold border-2 border-border/50 hover:bg-muted/80 shadow-sm gap-2" 
                                            onClick={() => setIsPreviewOpen(true)}
                                        >
                                            <Eye className="h-4 w-4" /> 
                                            Vista Previa
                                        </Button>

                                        <Button 
                                            variant="outline" 
                                            size="lg" 
                                            className="rounded-xl px-5 font-bold border-2 border-border/50 hover:bg-muted/80 shadow-sm gap-2" 
                                            onClick={handleExportQuiz}
                                        >
                                            <Download className="h-4 w-4" /> 
                                            Exportar
                                        </Button>

                                        <Button 
                                            size="lg" 
                                            onClick={handleSaveChanges} 
                                            disabled={isSaving}
                                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl px-8 font-bold shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 gap-2"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <ColorfulLoader className="h-4 w-4" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" /> 
                                                    Guardar Cambios
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
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
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
                                                <div className="p-8 max-w-[1200px] mx-auto min-h-full">
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
                                                        <div className="flex flex-col items-center justify-center h-[60vh]">
                                                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center mb-6">
                                                                <HelpCircle className="h-12 w-12 text-muted-foreground/50" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold mb-2">Selecciona una pregunta</h3>
                                                            <p className="text-muted-foreground mb-8 max-w-md text-center">
                                                                Elige una pregunta de la lista para comenzar a editar, o crea una nueva pregunta.
                                                            </p>
                                                            <Button 
                                                                onClick={handleAddQuestion} 
                                                                size="lg"
                                                                className="bg-gradient-to-r from-primary to-primary/80"
                                                            >
                                                                <PlusCircle className="mr-2 h-5 w-5" />
                                                                Crear primera pregunta
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </motion.div>
                                ) : activeTab === 'settings' ? (
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
                                ) : (
                                    <motion.div
                                        key="analytics"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full"
                                    >
                                        <AnalyticsDashboard quiz={localQuiz} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status Bar */}
                        <div className="shrink-0 border-t-2 border-border/50 bg-card/80 px-6 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            localQuiz.published ? "bg-emerald-500" : "bg-yellow-500"
                                        )} />
                                        <span className="text-xs font-medium">
                                            {localQuiz.published ? "Publicado" : "Borrador"}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Última edición: hace 5 minutos
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-bold text-primary">{localQuiz.questions.length}</span> preguntas
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-bold text-primary">
                                            {localQuiz.questions.reduce((sum, q) => sum + (q.basePoints || 10), 0)}
                                        </span> puntos totales
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden rounded-3xl border-2 border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                    <div className="h-full flex flex-col">
                        <div className="shrink-0 border-b-2 border-border/50 bg-gradient-to-r from-card/90 to-card/80 px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                                        <Eye className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl">Vista Previa del Quiz</h3>
                                        <p className="text-sm text-muted-foreground">Así verán el quiz tus estudiantes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="gap-1">
                                            <Smartphone className="h-3 w-3" />
                                            Móvil
                                        </Badge>
                                        <Badge variant="outline" className="gap-1">
                                            <Tablet className="h-3 w-3" />
                                            Tablet
                                        </Badge>
                                        <Badge variant="outline" className="gap-1">
                                            <Monitor className="h-3 w-3" />
                                            Escritorio
                                        </Badge>
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
                        </div>
                        <div className="flex-1 overflow-auto p-8">
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