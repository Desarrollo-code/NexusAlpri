// src/components/quizz-it/quiz-editor-modal.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { PlusCircle, Trash2, Pencil, Check, X, Image as ImageIcon, UploadCloud, Timer, LayoutTemplate, FlipVertical, CheckSquare, ImagePlay, BrainCircuit, Info, Eye, Save, Replace, XCircle, ListVideo } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Quiz as AppQuiz, Question as AppQuestion, AnswerOption as FormFieldOption } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { UploadArea } from '@/components/ui/upload-area';
import Image from 'next/image';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { QuizGameView } from './quiz-game-view';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { ColorfulLoader } from '../ui/colorful-loader';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-[100px] w-full bg-muted animate-pulse rounded-md" />
});

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ],
};

const generateUniqueId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const optionShapes = [
    (props: any) => <path d="M12 2L2 22h20L12 2z" {...props} />,
    (props: any) => <rect x="3" y="3" width="18" height="18" rx="3" {...props} />,
    (props: any) => <circle cx="12" cy="12" r="10" {...props} />,
    (props: any) => <path d="M12 2.5l2.5 7.5h8l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h8l2.5-7.5z" {...props} />,
];
export const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

const templateOptions = [
    { value: 'default', label: 'Múltiple Elección', icon: CheckSquare, description: 'Clásico, con hasta 4 opciones de texto.' },
    { value: 'image', label: 'Pregunta con Imagen', icon: ImagePlay, description: 'Una imagen como foco principal y opciones de texto.' },
    { value: 'true_false', label: 'Verdadero / Falso', icon: BrainCircuit, description: 'Respuesta rápida de dos opciones predefinidas.' },
    { value: 'image_options', label: 'Respuestas con Imágenes', icon: LayoutTemplate, description: 'Usa imágenes como opciones de respuesta.' },
    { value: 'matching', label: 'Emparejamiento', icon: ListVideo, description: 'Arrastra y ordena elementos para que coincidan.' },
    { value: 'fill_blanks', label: 'Rellenar espacios', icon: Pencil, description: 'Escribe las palabras faltantes en el texto.' },
];

const ImageUploadWidget = ({ imageUrl, onUpload, onRemove, disabled, inputId, isCorrect }: { imageUrl: string | null, onUpload: (url: string) => void, onRemove: () => void, disabled: boolean, inputId: string, isCorrect?: boolean }) => {
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
            toast({ title: "Error de subida", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn(
            "relative w-full aspect-square rounded-lg border-2 bg-muted/50 transition-all flex items-center justify-center",
            isCorrect ? "border-primary ring-2 ring-primary/50" : "border-dashed hover:border-primary/50"
        )}>
            {isUploading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                    <ColorfulLoader className="h-5 w-5" />
                    <Progress value={uploadProgress} className="w-full h-1" />
                </div>
            ) : imageUrl ? (
                <div className="relative w-full h-full group">
                    <Image src={imageUrl} alt="preview" fill className="object-contain p-1" />
                    <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button type="button" variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); onRemove(); }} disabled={disabled}>
                            <XCircle className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ) : (
                <UploadArea onFileSelect={handleFileSelect} disabled={disabled} inputId={inputId} className="h-full border-0 bg-transparent p-0">
                    <div className="text-center text-muted-foreground">
                        <ImageIcon className="mx-auto h-5 w-5" />
                    </div>
                </UploadArea>
            )}
        </div>
    );
};

const QuestionEditor = ({ question, isQuiz, onQuestionChange, onOptionChange, onSetCorrect, onOptionAdd, onOptionDelete }: {
    question: any, // Using any temporarily for flexibility with new templates
    isQuiz: boolean,
    onQuestionChange: (field: 'text' | 'imageUrl' | 'template', value: string | null) => void,
    onOptionChange: (oIndex: number, field: 'text' | 'imageUrl', value: string | null) => void,
    onSetCorrect: (optionId: string) => void,
    onOptionAdd: () => void,
    onOptionDelete: (optionIndex: number) => void
}) => {
    const isImageOptionsTemplate = question?.template === 'image_options';

    const renderOptionEditor = (opt: any, index: number) => {
        if (isImageOptionsTemplate) {
            return (
                <div className="w-full h-full cursor-pointer" onClick={() => onSetCorrect(opt.id)}>
                    <ImageUploadWidget inputId={`opt-img-${opt.id}`} imageUrl={opt.imageUrl} onUpload={(url) => onOptionChange(index, 'imageUrl', url)} onRemove={() => onOptionChange(index, 'imageUrl', null)} disabled={false} isCorrect={opt.isCorrect} />
                </div>
            )
        }
        if (question.template === 'true_false') {
            return <Button type="button" className="w-full h-16 justify-start text-lg rounded-xl transition-all" variant={opt.isCorrect ? 'default' : 'outline'} onClick={() => onSetCorrect(opt.id)}>{opt.text}</Button>
        }
        return (
            <div className="bg-background rounded-md overflow-hidden border w-full">
                <ReactQuill
                    theme="snow"
                    value={opt.text}
                    onChange={(v) => onOptionChange(index, 'text', v)}
                    modules={{ toolbar: [['bold', 'italic', 'underline']] }}
                    className="quill-editor-option"
                />
            </div>
        )
    };

    return (
        <div className="space-y-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="backdrop-blur-md bg-card/80 border-primary/20 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                        <CardTitle className="text-base flex items-center gap-2"><LayoutTemplate className="h-4 w-4 text-primary" /> Plantilla y Contenido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Selecciona el tipo de pregunta</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {templateOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onQuestionChange('template', opt.value)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center gap-2 group relative overflow-hidden",
                                                (question.template || 'default') === opt.value
                                                    ? "border-primary bg-primary/10 shadow-lg text-primary"
                                                    : "border-muted bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-full transition-colors",
                                                (question.template || 'default') === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                            )}>
                                                <opt.icon className="h-6 w-6" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{opt.label}</span>
                                            {(question.template || 'default') === opt.value && (
                                                <motion.div layoutId="activeTemplate" className="absolute inset-0 bg-primary/5 -z-10" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {question.template === 'image' && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Imagen de Referencia</Label>
                                    <div className="max-w-[200px]">
                                        <ImageUploadWidget inputId={`q-img-${question.id}`} imageUrl={question.imageUrl} onUpload={(url) => onQuestionChange('imageUrl', url)} onRemove={() => onQuestionChange('imageUrl', null)} disabled={false} isCorrect={false} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-primary/10" />

                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Enunciado de la Pregunta</Label>
                            <div className="bg-background/50 rounded-xl overflow-hidden border-2 border-primary/10 focus-within:border-primary/40 transition-colors shadow-inner">
                                <ReactQuill
                                    theme="snow"
                                    value={question.text || ''}
                                    onChange={(v) => onQuestionChange('text', v)}
                                    modules={quillModules}
                                    placeholder="Escribe el enunciado de tu pregunta aquí..."
                                    className="quill-editor-custom"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card className="backdrop-blur-md bg-card/80 border-primary/20 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4 text-primary" /> Opciones de Respuesta</CardTitle>
                        {question.options.length < 4 && !isImageOptionsTemplate && question.template !== 'true_false' && (
                            <Button type="button" variant="link" size="sm" onClick={onOptionAdd} className="text-primary font-bold">
                                + Añadir opción
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className={cn("grid gap-4 pt-6", isImageOptionsTemplate ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2")}>
                        <AnimatePresence mode="popLayout">
                            {(question.options || []).slice(0, 4).map((opt: any, index: number) => (
                                <motion.div
                                    key={opt.id}
                                    layout
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="group relative"
                                >
                                    <div className={cn(
                                        "relative flex flex-col gap-2 p-3 rounded-2xl border-2 transition-all",
                                        opt.isCorrect ? "border-green-500 bg-green-500/5 shadow-md flex-grow" : "border-muted bg-background/50"
                                    )}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className={cn(
                                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                opt.isCorrect ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                                            )}>
                                                Opción {index + 1}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onSetCorrect(opt.id)}
                                                    className={cn(
                                                        "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                                        opt.isCorrect ? "bg-green-500 text-white shadow-lg scale-110" : "bg-muted text-muted-foreground hover:bg-green-200"
                                                    )}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                                {(question.options.length > (question.template === 'true_false' ? 2 : 1)) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOptionDelete(index)}
                                                        className="h-6 w-6 rounded-full flex items-center justify-center bg-destructive/10 text-destructive/70 hover:bg-destructive hover:text-white transition-all"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-grow">{renderOptionEditor(opt, index)}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export function QuizEditorModal({ isOpen, onClose, quiz, onSave }: { isOpen: boolean, onClose: () => void, quiz: AppQuiz, onSave: (updatedQuiz: AppQuiz) => void }) {
    const [localQuiz, setLocalQuiz] = useState<AppQuiz>(quiz);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        if (quiz) {
            setLocalQuiz(JSON.parse(JSON.stringify(quiz)));
            setActiveQuestionIndex(0);
        }
    }, [quiz, isOpen]);

    const handleQuestionChange = (field: 'text' | 'imageUrl' | 'template', value: string | null) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex] as any)[field] = value;

        if (field === 'template') {
            if (value === 'true_false') {
                newQuestions[activeQuestionIndex].options = [
                    { id: generateUniqueId('opt'), text: 'Verdadero', imageUrl: null, isCorrect: true, points: 10 },
                    { id: generateUniqueId('opt'), text: 'Falso', imageUrl: null, isCorrect: false, points: 0 }
                ];
            } else if (value === 'image_options') {
                let options = newQuestions[activeQuestionIndex].options;
                while (options.length < 4) {
                    options.push({ id: generateUniqueId('opt'), text: '', imageUrl: null, isCorrect: false, points: 0 });
                }
                newQuestions[activeQuestionIndex].options = options.slice(0, 4);
            }
        }

        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (oIndex: number, field: 'text' | 'imageUrl', value: string | null) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex].options[oIndex] as any)[field] = value;
        setLocalQuiz((prev: AppQuiz) => ({ ...prev, questions: newQuestions }));
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

    const addQuestion = () => {
        const newQuestion: AppQuestion = {
            id: generateUniqueId('question'),
            text: 'Nueva Pregunta', order: localQuiz.questions.length, type: 'SINGLE_CHOICE', imageUrl: null, template: 'default',
            options: [{ id: generateUniqueId('option'), text: 'Opción Correcta', imageUrl: null, isCorrect: true, points: 10 }, { id: generateUniqueId('option'), text: 'Opción Incorrecta', imageUrl: null, isCorrect: false, points: 0 }]
        };
        setLocalQuiz((prev: AppQuiz) => ({ ...prev, questions: [...prev.questions, newQuestion] })); // Fixed implicit any
        setActiveQuestionIndex(localQuiz.questions.length);
    };

    const addOption = () => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex].options.push({ id: generateUniqueId('option'), text: '', imageUrl: null, isCorrect: false, points: 0 });
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const deleteOption = (optionIndex: number) => {
        const newQuestions = [...localQuiz.questions];
        const currentOptions = newQuestions[activeQuestionIndex].options;
        currentOptions.splice(optionIndex, 1);
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const deleteQuestion = (indexToDelete: number) => {
        if (localQuiz.questions.length <= 1) {
            return;
        }
        setLocalQuiz(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== indexToDelete) }));
        setActiveQuestionIndex(prev => Math.max(0, prev - 1));
    };

    const handleSaveChanges = () => { onSave(localQuiz); };

    if (!localQuiz || !localQuiz.questions) return null;
    const activeQuestion = localQuiz.questions[activeQuestionIndex];
    const quizPreviewForm = { ...localQuiz, fields: localQuiz.questions.map(q => ({ ...q, label: q.text })) };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[95vw] max-w-7xl p-0 gap-0 rounded-2xl h-[90vh]">
                    <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                        {/* Columna Izquierda: Lista de Preguntas */}
                        <div className="md:col-span-3 border-r flex flex-col bg-muted/50 h-full">
                            <div className="p-4 border-b flex-shrink-0">
                                <Button onClick={addQuestion} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Añadir Pregunta</Button>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    {localQuiz.questions.map((q, index) => (
                                        <button key={q.id} onClick={() => setActiveQuestionIndex(index)} className={cn("w-full text-left p-2 rounded-md border flex gap-2 items-start", activeQuestionIndex === index ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted")}>
                                            <span className="font-bold text-primary mt-0.5">{index + 1}.</span>
                                            <span className="truncate flex-grow">{q.text || "Pregunta sin título"}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); deleteQuestion(index) }}><Trash2 className="h-4 w-4" /></Button>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Columna Central: Editor de Pregunta */}
                        <div className="md:col-span-6 flex flex-col h-full">
                            <ScrollArea className="flex-grow">
                                <div className="p-4">
                                    {activeQuestion ? (
                                        <QuestionEditor
                                            question={activeQuestion}
                                            isQuiz={true}
                                            onQuestionChange={handleQuestionChange}
                                            onOptionChange={handleOptionChange}
                                            onSetCorrect={handleSetCorrect}
                                            onOptionAdd={addOption}
                                            onOptionDelete={deleteOption}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground"><p>Selecciona una pregunta para editarla.</p></div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Columna Derecha: Configuración del Quiz */}
                        <div className="md:col-span-3 border-l bg-muted/50 flex flex-col h-full">
                            <ScrollArea className="flex-grow p-4">
                                <div className="space-y-4">
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">Detalles del Quiz</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-1"><Label htmlFor="quiz-title">Título del Quiz</Label><Input id="quiz-title" name="quiz-title" value={localQuiz.title} onChange={e => setLocalQuiz(p => ({ ...p, title: e.target.value }))} /></div>
                                            <div className="space-y-1"><Label htmlFor="quiz-description">Descripción</Label><Textarea id="quiz-description" name="quiz-description" value={localQuiz.description || ''} onChange={e => setLocalQuiz(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">Configuración de Jugabilidad</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-1"><Label htmlFor="quiz-max-attempts">Límite de Intentos</Label><Input id="quiz-max-attempts" name="quiz-max-attempts" type="number" value={localQuiz.maxAttempts || ''} onChange={e => setLocalQuiz(p => ({ ...p, maxAttempts: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Ilimitados" /></div>
                                            <div className="space-y-1"><Label htmlFor="quiz-timer-style">Estilo del Temporizador</Label>
                                                <Select name="quiz-timer-style" value={localQuiz.timerStyle || 'circular'} onValueChange={(v) => setLocalQuiz(p => ({ ...p, timerStyle: v }))}>
                                                    <SelectTrigger id="quiz-timer-style"><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="circular">Circular</SelectItem><SelectItem value="bar">Barra</SelectItem><SelectItem value="pill">Píldora</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </ScrollArea>
                            <DialogFooter className="p-4 border-t flex-shrink-0 bg-background/80">
                                <Button variant="outline" onClick={() => setIsPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />Previsualizar</Button>
                                <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" />Guardar Quiz</Button>
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl p-0">
                    <div className="bg-gradient-to-br from-background via-muted to-background p-8 rounded-lg">
                        <QuizGameView form={quizPreviewForm as any} isEditorPreview={true} activeQuestionIndex={activeQuestionIndex} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
