
// src/components/quizz-it/quiz-editor-modal.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { PlusCircle, Trash2, Pencil, Check, X, Image as ImageIcon, UploadCloud, Timer, LayoutTemplate, FlipVertical, CheckSquare, ImagePlay, BrainCircuit, Info, Eye } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AppQuiz, AppQuestion, FormFieldOption } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { UploadArea } from '../ui/upload-area';
import Image from 'next/image';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { QuizGameView } from './quiz-game-view';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription } from '../ui/alert';

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
];


export function QuizEditorModal({ isOpen, onClose, quiz, onSave }: { isOpen: boolean, onClose: () => void, quiz: AppQuiz, onSave: (updatedQuiz: AppQuiz) => void }) {
    const { toast } = useToast();
    const [localQuiz, setLocalQuiz] = useState<AppQuiz>(quiz);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    // States for image option uploads
    const [isOptionUploading, setIsOptionUploading] = useState<Record<string, boolean>>({});
    const [optionUploadProgress, setOptionUploadProgress] = useState<Record<string, number>>({});


    useEffect(() => {
        setLocalQuiz(JSON.parse(JSON.stringify(quiz)));
        setActiveQuestionIndex(0);
    }, [quiz, isOpen]);

    const handleQuizMetaChange = (field: keyof AppQuiz, value: any) => {
        setLocalQuiz(prev => ({...prev, [field]: value}));
    };
    
    const handleTemplateChange = (value: string) => {
        handleQuizMetaChange('template', value);
        if (value === 'true_false') {
            const newQuestions = [...localQuiz.questions];
            const currentQuestion = newQuestions[activeQuestionIndex];
            currentQuestion.options = [
                { id: generateUniqueId('opt'), text: 'Verdadero', imageUrl: null, isCorrect: true, points: 10 },
                { id: generateUniqueId('opt'), text: 'Falso', imageUrl: null, isCorrect: false, points: 0 }
            ];
            setLocalQuiz(prev => ({...prev, questions: newQuestions}));
        }
    }

    const handleQuestionChange = (field: 'text' | 'imageUrl', value: string | null) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex][field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (oIndex: number, field: 'text' | 'imageUrl', value: string) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex].options[oIndex] as any)[field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSetCorrect = (optionId: string) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex].options = newQuestions[activeQuestionIndex].options.map(opt => ({
            ...opt,
            isCorrect: opt.id === optionId
        }));
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };
    
    const addQuestion = () => {
        const newQuestion: AppQuestion = {
            id: generateUniqueId('question'),
            text: 'Nueva Pregunta',
            order: localQuiz.questions.length,
            type: 'SINGLE_CHOICE',
            imageUrl: null,
            options: [
                { id: generateUniqueId('option'), text: '', imageUrl: null, isCorrect: true, points: 10 },
                { id: generateUniqueId('option'), text: '', imageUrl: null, isCorrect: false, points: 0 }
            ]
        };
        setLocalQuiz(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
        setActiveQuestionIndex(localQuiz.questions.length);
    };
    
    const addOption = () => {
        const newQuestions = [...localQuiz.questions];
        const currentOptions = newQuestions[activeQuestionIndex].options;
        if (currentOptions.length < 4) {
            currentOptions.push({ id: generateUniqueId('option'), text: '', imageUrl: null, isCorrect: false, points: 0 });
            setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
        }
    };
    
    const deleteOption = (optionIndex: number) => {
        const newQuestions = [...localQuiz.questions];
        const currentOptions = newQuestions[activeQuestionIndex].options;
        if (currentOptions.length > 1) {
            currentOptions.splice(optionIndex, 1);
            if (!currentOptions.some(opt => opt.isCorrect) && currentOptions.length > 0) {
                currentOptions[0].isCorrect = true;
            }
            setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
        }
    };

    const deleteQuestion = (indexToDelete: number) => {
         if (localQuiz.questions.length <= 1) return;
         setLocalQuiz(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== indexToDelete) }));
         setActiveQuestionIndex(prev => Math.max(0, prev - 1));
    };

    const handleImageUpload = async (file: File | null, type: 'question' | 'option', optionIndex?: number) => {
        if (!file) return;

        if (type === 'question') {
            setIsUploading(true);
            setUploadProgress(0);
        } else if (optionIndex !== undefined) {
             setIsOptionUploading(prev => ({ ...prev, [optionIndex]: true }));
             setOptionUploadProgress(prev => ({ ...prev, [optionIndex]: 0 }));
        }
        
        try {
            const result = await uploadWithProgress('/api/upload/lesson-file', file, (progress) => {
                if (type === 'question') setUploadProgress(progress);
                else if (optionIndex !== undefined) setOptionUploadProgress(prev => ({ ...prev, [optionIndex]: progress }));
            });
            
            if (type === 'question') handleQuestionChange('imageUrl', result.url);
            else if (optionIndex !== undefined) handleOptionChange(optionIndex, 'imageUrl', result.url);
            
            toast({ title: 'Imagen subida' });
        } catch (err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            if (type === 'question') setIsUploading(false);
            else if (optionIndex !== undefined) setIsOptionUploading(prev => ({ ...prev, [optionIndex]: false }));
        }
    };

    const handleSaveChanges = () => { onSave(localQuiz); };

    if (!localQuiz || !localQuiz.questions) return null;
    const activeQuestion = localQuiz.questions[activeQuestionIndex];

    const quizPreviewForm = { ...localQuiz, fields: localQuiz.questions.map(q => ({ ...q, label: q.text })) };
    
    const isImageOptionsTemplate = localQuiz.template === 'image_options';

    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary"/>Editor de Quiz Interactivo</DialogTitle>
                </DialogHeader>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0">
                    <div className="md:col-span-1 border-r flex flex-col">
                         <div className="p-2 space-y-2">
                             <Button onClick={addQuestion} className="w-full" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Pregunta</Button>
                         </div>
                         <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                            {localQuiz.questions.map((q, index) => (
                                <button key={q.id} onClick={() => setActiveQuestionIndex(index)} className={cn("w-full text-left p-2 rounded-md border flex gap-2", activeQuestionIndex === index ? "bg-primary/10 border-primary" : "hover:bg-muted")}>
                                    <span className="font-bold text-primary">{index + 1}.</span>
                                    <span className="truncate flex-grow">{q.text || "Pregunta sin título"}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={(e) => {e.stopPropagation(); deleteQuestion(index)}}><Trash2 className="h-4 w-4"/></Button>
                                </button>
                            ))}
                            </div>
                         </ScrollArea>
                    </div>
                    <div className="md:col-span-2 flex flex-col">
                        {activeQuestion ? (
                            <ScrollArea className="flex-grow">
                            <div className="p-4 space-y-4">
                                <Textarea value={activeQuestion.text} onChange={(e) => handleQuestionChange('text', e.target.value)} placeholder="Escribe tu pregunta aquí..." className="text-xl text-center font-bold h-auto resize-none bg-background flex-shrink-0" rows={2}/>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <LayoutTemplate className="h-4 w-4" /> Plantilla de Pregunta
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Select value={localQuiz.template || 'default'} onValueChange={handleTemplateChange}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {templateOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <div className="flex items-center gap-2">
                                                           <opt.icon className="h-4 w-4"/>
                                                           <span>{opt.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-2">{templateOptions.find(o => o.value === (localQuiz.template || 'default'))?.description}</p>
                                    </CardContent>
                                </Card>

                                {localQuiz.template === 'image' && (
                                     <div className="w-full">
                                        {isUploading ? (
                                            <div className="w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary"/><p className="text-sm text-muted-foreground">Subiendo...</p><Progress value={uploadProgress} className="w-full h-1.5"/>
                                            </div>
                                        ) : activeQuestion.imageUrl ? (
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border p-1 bg-background">
                                                <Image src={activeQuestion.imageUrl} alt="preview" fill className="object-contain" />
                                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleQuestionChange('imageUrl', null)}><X className="h-4 w-4"/></Button>
                                            </div>
                                        ) : (
                                            <UploadArea onFileSelect={(file) => handleImageUpload(file, 'question')} inputId={`img-upload-${activeQuestion.id}`} />
                                        )}
                                    </div>
                                )}
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Opciones de Respuesta</CardTitle>
                                    </CardHeader>
                                     <CardContent className={cn("grid gap-2", isImageOptionsTemplate ? "grid-cols-2" : "grid-cols-1")}>
                                        {activeQuestion.options.slice(0, 4).map((opt, index) => {
                                            const optionIsUploading = isOptionUploading[index];
                                            const optionProgress = optionUploadProgress[index] || 0;
                                            return (
                                                <div key={opt.id} className={cn("flex items-center gap-2 p-2 rounded-md shadow-sm border", opt.isCorrect ? 'ring-2 ring-offset-2 ring-offset-background ring-green-500' : '')}>
                                                    {isImageOptionsTemplate ? (
                                                        <div className="flex-grow space-y-2">
                                                            <div className="relative">
                                                                <div className={cn("absolute inset-0 flex items-center justify-center z-10", isOptionUploading ? 'flex' : 'hidden')}>
                                                                    <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                                                                </div>
                                                                 {opt.imageUrl && (
                                                                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 z-20" onClick={() => handleOptionChange(index, 'imageUrl', '')}><X className="h-4 w-4"/></Button>
                                                                )}
                                                                <UploadArea
                                                                    onFileSelect={(file) => handleImageUpload(file, 'option', index)}
                                                                    inputId={`opt-img-upload-${opt.id}`}
                                                                    className={cn("h-24 w-full", opt.imageUrl && 'bg-cover bg-center')}
                                                                    style={{backgroundImage: opt.imageUrl ? `url(${opt.imageUrl})` : 'none'}}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-center">
                                                               <Button variant="ghost" size="sm" onClick={() => handleSetCorrect(opt.id)}>
                                                                    <Check className={cn("h-5 w-5", opt.isCorrect ? 'text-green-500' : 'text-muted-foreground')}/> <span className="ml-1 text-xs">Correcta</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Input value={opt.text} onChange={(e) => handleOptionChange(index, 'text', e.target.value)} placeholder={`Opción ${index + 1}`} />
                                                    )}
                                                     {!isImageOptionsTemplate && <Button variant="ghost" size="icon" onClick={() => handleSetCorrect(opt.id)}><Check className={cn("h-6 w-6", opt.isCorrect ? 'text-green-500' : 'text-muted-foreground')}/></Button>}
                                                     {localQuiz.questions[activeQuestionIndex].options.length > 1 && <Button variant="ghost" size="icon" onClick={() => deleteOption(index)} className="text-destructive/70 hover:text-destructive"><X className="h-4 w-4"/></Button>}
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                    <CardFooter>
                                         {localQuiz.questions[activeQuestionIndex].options.length < 4 && !isImageOptionsTemplate && (
                                            <Button variant="outline" size="sm" onClick={addOption} className="mt-2 self-start">+ Añadir opción</Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            </div>
                            </ScrollArea>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground"><p>Selecciona una pregunta para editarla.</p></div>
                        )}
                    </div>
                </div>
                <DialogFooter className="p-4 border-t">
                     <Button variant="outline" onClick={() => setIsPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />Previsualizar</Button>
                    <div className="flex-grow"/>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Guardar Cambios del Quiz</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl p-0">
                <div className="bg-gradient-to-br from-background via-muted to-background p-8 rounded-lg">
                    <QuizGameView form={quizPreviewForm} isEditorPreview={true} activeQuestionIndex={activeQuestionIndex}/>
                </div>
            </DialogContent>
        </Dialog>
      </>
    );
}
