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
import { PlusCircle, Trash2, Pencil, Check, X, Image as ImageIcon, UploadCloud, Timer, LayoutTemplate, FlipVertical, CheckSquare, ImagePlay, BrainCircuit, Info, Eye, Save, Replace, XCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AppQuiz, AppQuestion, FormFieldOption } from '@/types';
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

const ImageUploadWidget = ({ imageUrl, onUpload, onRemove, disabled, inputId }: { imageUrl: string | null, onUpload: (url: string) => void, onRemove: () => void, disabled: boolean, inputId: string }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();

    const handleFileSelect = async (file: File | null) => {
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
    
    if (isUploading) {
        return <div className="w-full p-4 h-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2"><ColorfulLoader className="h-8 w-8"/><p className="text-sm text-muted-foreground">Subiendo...</p><Progress value={uploadProgress} className="w-full h-1.5" /></div>;
    }
    if (imageUrl) {
        return <div className="relative w-full h-full aspect-square rounded-lg border overflow-hidden group"><Image src={imageUrl} alt="preview" fill className="object-contain p-1" /><div className="absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"><Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={onRemove}><XCircle className="h-4 w-4"/></Button></div></div>
    }
    return <UploadArea onFileSelect={handleFileSelect} disabled={disabled} inputId={inputId} />;
};


export function QuizEditorModal({ isOpen, onClose, quiz, onSave }: { isOpen: boolean, onClose: () => void, quiz: AppQuiz, onSave: (updatedQuiz: AppQuiz) => void }) {
    const { toast } = useToast();
    const [localQuiz, setLocalQuiz] = useState<AppQuiz>(quiz);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        setLocalQuiz(JSON.parse(JSON.stringify(quiz)));
        setActiveQuestionIndex(0);
    }, [quiz, isOpen]);

    const handleQuizMetaChange = (field: keyof AppQuiz, value: any) => {
        setLocalQuiz(prev => ({...prev, [field]: value}));
    };

    const handleTemplateChange = (value: string) => {
        const newQuestions = [...localQuiz.questions];
        const currentQuestion = newQuestions[activeQuestionIndex];
        currentQuestion.template = value;

        if (value === 'true_false') {
            currentQuestion.options = [
                { id: generateUniqueId('opt'), text: 'Verdadero', imageUrl: null, isCorrect: true, points: 10 },
                { id: generateUniqueId('opt'), text: 'Falso', imageUrl: null, isCorrect: false, points: 0 }
            ];
        } else if(value === 'image_options') {
            const neededOptions = 4 - currentQuestion.options.length;
            for(let i=0; i<neededOptions; i++) {
                currentQuestion.options.push({ id: generateUniqueId('opt'), text: '', imageUrl: null, isCorrect: false, points: 0 });
            }
            currentQuestion.options = currentQuestion.options.slice(0, 4);
        }
        setLocalQuiz(prev => ({...prev, questions: newQuestions}));
    };

    const handleQuestionChange = (field: 'text' | 'imageUrl', value: string | null) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex][field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (oIndex: number, field: 'text' | 'imageUrl', value: string | null) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex].options[oIndex] as any)[field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSetCorrect = (optionId: string) => {
        const newQuestions = [...localQuiz.questions];
        const question = newQuestions[activeQuestionIndex];
        question.options = question.options.map(opt => {
            if (question.template === 'true_false' || question.type === 'SINGLE_CHOICE') {
                return { ...opt, isCorrect: opt.id === optionId };
            }
            if (opt.id === optionId) {
                return { ...opt, isCorrect: !opt.isCorrect };
            }
            return opt;
        });
        
        if (question.template === 'true_false' && !question.options.some(o => o.isCorrect)) {
            const clickedOption = question.options.find(o => o.id === optionId);
            if (clickedOption) clickedOption.isCorrect = true;
        }

        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const addQuestion = () => {
        const newQuestion: AppQuestion = {
            id: generateUniqueId('question'),
            text: 'Nueva Pregunta', order: localQuiz.questions.length, type: 'SINGLE_CHOICE', imageUrl: null, template: 'default',
            options: [{ id: generateUniqueId('option'), text: 'Opción Correcta', imageUrl: null, isCorrect: true, points: 10 }, { id: generateUniqueId('option'), text: 'Opción Incorrecta', imageUrl: null, isCorrect: false, points: 0 }]
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
        if (currentOptions.length > (activeQuestion.template === 'true_false' ? 2 : 1)) {
            currentOptions.splice(optionIndex, 1);
            if (!currentOptions.some(opt => opt.isCorrect) && currentOptions.length > 0) {
                currentOptions[0].isCorrect = true;
            }
            setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
        }
    };

    const deleteQuestion = (indexToDelete: number) => {
         if (localQuiz.questions.length <= 1) {
            toast({ title: 'Acción no permitida', description: 'Un quiz debe tener al menos una pregunta.', variant: 'destructive'});
            return;
         };
         setLocalQuiz(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== indexToDelete) }));
         setActiveQuestionIndex(prev => Math.max(0, prev - 1));
    };

    const handleSaveChanges = () => { onSave(localQuiz); };
    
    if (!localQuiz || !localQuiz.questions) return null;
    const activeQuestion = localQuiz.questions[activeQuestionIndex];

    const quizPreviewForm = { ...localQuiz, fields: localQuiz.questions.map(q => ({ ...q, label: q.text })) };
    
    const isImageOptionsTemplate = activeQuestion?.template === 'image_options';

    const renderOptionEditor = (opt: FormFieldOption, index: number) => {
        if (isImageOptionsTemplate) {
            return <ImageUploadWidget inputId={`opt-img-${opt.id}`} imageUrl={opt.imageUrl} onUpload={(url) => handleOptionChange(index, 'imageUrl', url)} onRemove={() => handleOptionChange(index, 'imageUrl', null)} disabled={false}/>
        }
        if (activeQuestion.template === 'true_false') {
             return <Button className="w-full h-16 justify-start text-lg" variant={opt.isCorrect ? 'default' : 'outline'} onClick={() => handleSetCorrect(opt.id)}>{opt.text}</Button>
        }
        return <Input value={opt.text} onChange={e => handleOptionChange(index, 'text', e.target.value)} placeholder={`Opción ${index + 1}`}/>
    };

    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="w-[95vw] sm:max-w-7xl p-0 gap-0 rounded-2xl">
            <div className="flex flex-col h-full max-h-[90vh]">
                    <DialogHeader className="p-4 border-b flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary"/>Editor de Quiz Interactivo</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0">
                        <div className="md:col-span-1 border-r flex flex-col">
                            <div className="p-2 space-y-2 flex-shrink-0">
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
                           <ScrollArea className="flex-grow">
                            {activeQuestion ? (
                                    <div className="p-4 space-y-4">
                                        <Card>
                                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Plantilla y Contenido</CardTitle></CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                    <div className="space-y-2">
                                                        <Label>Plantilla de Pregunta</Label>
                                                        <Select value={activeQuestion.template || 'default'} onValueChange={handleTemplateChange}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                {templateOptions.map((opt) => (
                                                                    <SelectItem key={opt.value} value={opt.value}>
                                                                        <div className="flex items-center gap-2"><opt.icon className="h-4 w-4"/>{opt.label}</div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {activeQuestion.template === 'image' && <ImageUploadWidget inputId={`q-img-${activeQuestion.id}`} imageUrl={activeQuestion.imageUrl} onUpload={(url) => handleQuestionChange('imageUrl', url)} onRemove={() => handleQuestionChange('imageUrl', null)} disabled={false} />}
                                                </div>
                                                <Separator/>
                                                <Textarea value={activeQuestion.text} onChange={(e) => handleQuestionChange('text', e.target.value)} placeholder="Escribe tu pregunta aquí..." className="text-lg font-semibold h-auto resize-none" rows={3}/>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader><CardTitle className="text-base">Opciones de Respuesta</CardTitle></CardHeader>
                                            <CardContent className={cn("grid gap-3", isImageOptionsTemplate ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2")}>
                                                {activeQuestion.options.slice(0, 4).map((opt, index) => (
                                                    <div key={opt.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card shadow-sm">
                                                        <div className="flex-grow">{renderOptionEditor(opt, index)}</div>
                                                        <div className="flex flex-col gap-1">
                                                            <Button variant={opt.isCorrect ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => handleSetCorrect(opt.id)}>
                                                                <Check className="h-4 w-4"/>
                                                            </Button>
                                                            {(activeQuestion.options.length > (activeQuestion.template === 'true_false' ? 2 : 1)) && (<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => deleteOption(index)}><X className="h-4 w-4"/></Button>)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                            <CardFooter>
                                                {activeQuestion.options.length < 4 && !isImageOptionsTemplate && activeQuestion.template !== 'true_false' && (<Button variant="outline" size="sm" onClick={addOption}>+ Añadir opción</Button>)}
                                            </CardFooter>
                                        </Card>
                                    </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground"><p>Selecciona una pregunta para editarla.</p></div>
                            )}
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t flex-shrink-0">
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />Previsualizar</Button>
                        <div className="flex-grow"/>
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Guardar Cambios del Quiz</Button>
                    </DialogFooter>
                </div>
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
