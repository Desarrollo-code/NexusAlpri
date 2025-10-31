
// src/components/quizz-it/quiz-editor-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
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
import { PlusCircle, Trash2, Pencil, Check, X, Image as ImageIcon, UploadCloud, Timer, LayoutTemplate, FlipVertical, CheckSquare, ImagePlay, BrainCircuit } from 'lucide-react';
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

const generateUniqueId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const optionShapes = [
    (props: any) => <path d="M12 2L2 22h20L12 2z" {...props} />,
    (props: any) => <rect x="3" y="3" width="18" height="18" rx="3" {...props} />,
    (props: any) => <circle cx="12" cy="12" r="10" {...props} />,
    (props: any) => <path d="M12 2.5l2.5 7.5h8l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h8l2.5-7.5z" {...props} />,
];
export const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

const templateOptions = [
    { value: 'default', label: 'Múltiple Elección', icon: CheckSquare, description: 'Clásico, con 4 opciones.' },
    { value: 'image', label: 'Pregunta con Imagen', icon: ImagePlay, description: 'Una imagen como foco principal.' },
    { value: 'true_false', label: 'Verdadero / Falso', icon: BrainCircuit, description: 'Respuesta rápida de dos opciones.' },
    { value: 'flip_card', label: 'Tarjeta Giratoria', icon: FlipVertical, description: 'Ideal para memorización y conceptos.' },
];

export function QuizEditorModal({ isOpen, onClose, quiz, onSave }: { isOpen: boolean, onClose: () => void, quiz: AppQuiz, onSave: (updatedQuiz: AppQuiz) => void }) {
    const { toast } = useToast();
    const [localQuiz, setLocalQuiz] = useState<AppQuiz>(quiz);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        setLocalQuiz(JSON.parse(JSON.stringify(quiz)));
        setActiveQuestionIndex(0);
    }, [quiz, isOpen]);

    const handleQuizMetaChange = (field: keyof AppQuiz, value: any) => {
        setLocalQuiz(prev => ({...prev, [field]: value}));
    };

    const handleQuestionChange = (field: 'text' | 'imageUrl', value: string | null) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex][field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (oIndex: number, text: string) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex].options[oIndex].text = text;
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
                { id: generateUniqueId('option'), text: '', isCorrect: true, points: 10 },
                { id: generateUniqueId('option'), text: '', isCorrect: false, points: 0 }
            ]
        };
        setLocalQuiz(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
        setActiveQuestionIndex(localQuiz.questions.length);
    };
    
    const addOption = () => {
        const newQuestions = [...localQuiz.questions];
        const currentOptions = newQuestions[activeQuestionIndex].options;
        if (currentOptions.length < 4) {
            currentOptions.push({ id: generateUniqueId('option'), text: '', isCorrect: false, points: 0 });
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

    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadWithProgress('/api/upload/lesson-file', file, setUploadProgress);
            handleQuestionChange('imageUrl', result.url);
            toast({ title: 'Imagen subida' });
        } catch (err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveChanges = () => {
        onSave(localQuiz);
    };

    if (!localQuiz || !localQuiz.questions) return null;
    const activeQuestion = localQuiz.questions[activeQuestionIndex];

    const quizPreviewForm = {
        ...localQuiz,
        fields: localQuiz.questions.map(q => ({
            ...q,
            label: q.text
        }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
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
                          <div className="p-4 border-t space-y-3 bg-muted/30">
                            <Card>
                                <CardHeader className="p-3"><CardTitle className="text-sm flex items-center gap-1.5"><LayoutTemplate className="h-4 w-4"/>Plantilla de Pregunta</CardTitle></CardHeader>
                                <CardContent className="p-3 pt-0">
                                     <RadioGroup value={localQuiz.template || 'default'} onValueChange={(v) => handleQuizMetaChange('template', v)} className="space-y-2">
                                        {templateOptions.map(opt => (
                                            <Label key={opt.value} htmlFor={`template-${opt.value}`} className={cn("flex flex-col p-2.5 rounded-lg border cursor-pointer transition-colors", localQuiz.template === opt.value ? 'border-primary ring-2 ring-primary/50' : 'hover:bg-accent/50')}>
                                                <div className="flex items-center gap-2">
                                                     <RadioGroupItem value={opt.value} id={`template-${opt.value}`}/>
                                                     <div className="flex items-center gap-2">
                                                         <opt.icon className="h-4 w-4"/>
                                                         <span className="font-semibold">{opt.label}</span>
                                                     </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 ml-6">{opt.description}</p>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="p-3"><CardTitle className="text-sm flex items-center gap-1.5"><Timer className="h-4 w-4"/>Estilo del Contador</CardTitle></CardHeader>
                                <CardContent className="p-3 pt-0">
                                     <Select value={localQuiz.timerStyle || 'circular'} onValueChange={(v) => handleQuizMetaChange('timerStyle', v)}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="circular">Circular</SelectItem>
                                            <SelectItem value="bar">Barra</SelectItem>
                                            <SelectItem value="pill">Píldora</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                         </div>
                    </div>
                     <div className="md:col-span-2 flex flex-col bg-muted/30">
                        {activeQuestion ? (
                            <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                                <Textarea value={activeQuestion.text} onChange={(e) => handleQuestionChange('text', e.target.value)} placeholder="Escribe tu pregunta aquí..." className="text-xl text-center font-bold h-24 resize-none"/>
                                
                                <div className="flex-grow w-full max-w-lg mx-auto flex items-center justify-center rounded-lg overflow-hidden relative">
                                    <div className="absolute inset-0 bg-card shadow-inner" />
                                    <div className="relative z-10 w-full p-4">
                                      <QuizGameView form={quizPreviewForm} isEditorPreview={true} />
                                    </div>
                                </div>


                                 <div className="grid grid-cols-2 gap-2">
                                    {activeQuestion.options.map((opt, index) => (
                                        <div key={opt.id} className={cn("flex items-center p-2 rounded-md shadow-lg text-white", optionColors[index])}>
                                            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">{React.createElement(optionShapes[index])}</svg>
                                            </div>
                                            <Input value={opt.text} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Opción ${index + 1}`} className="bg-transparent border-0 border-b-2 rounded-none text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:border-white"/>
                                            <Button variant="ghost" size="icon" onClick={() => handleSetCorrect(opt.id)} className="text-white hover:bg-white/20 hover:text-white">
                                                <Check className={cn("h-6 w-6", opt.isCorrect ? "opacity-100" : "opacity-40")}/>
                                            </Button>
                                             {localQuiz.questions[activeQuestionIndex].options.length > 1 &&
                                               <Button variant="ghost" size="icon" onClick={() => deleteOption(index)} className="text-white hover:bg-white/20 hover:text-white">
                                                  <X className="h-4 w-4"/>
                                               </Button>
                                             }
                                        </div>
                                    ))}
                                </div>
                                 {localQuiz.questions[activeQuestionIndex].options.length < 4 && (
                                     <Button variant="outline" size="sm" onClick={addOption} className="mt-2 self-start">
                                         + Añadir opción
                                     </Button>
                                 )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Selecciona una pregunta para editarla.</p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Guardar Cambios del Quiz</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
