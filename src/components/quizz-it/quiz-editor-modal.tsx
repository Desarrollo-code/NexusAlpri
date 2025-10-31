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
import { PlusCircle, Trash2, Pencil, Check, X, Image as ImageIcon, UploadCloud, Timer, LayoutTemplate } from 'lucide-react';
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


const generateUniqueId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const optionShapes = [
    (props: any) => <path d="M12 2L2 22h20L12 2z" {...props} />,
    (props: any) => <rect x="3" y="3" width="18" height="18" rx="3" {...props} />,
    (props: any) => <circle cx="12" cy="12" r="10" {...props} />,
    (props: any) => <path d="M12 2.5l2.5 7.5h8l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h8l2.5-7.5z" {...props} />,
];
export const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary"/>Editor de Quiz Interactivo</DialogTitle>
                </DialogHeader>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 min-h-0">
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
                            <h4 className="font-semibold text-sm">Ajustes del Quiz</h4>
                             <div className="space-y-1">
                                <Label htmlFor="quiz-template" className="text-xs flex items-center gap-1"><LayoutTemplate className="h-3 w-3"/>Plantilla</Label>
                                <Select value={localQuiz.template || 'default'} onValueChange={(v) => handleQuizMetaChange('template', v)}>
                                    <SelectTrigger id="quiz-template" className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Múltiple Elección</SelectItem>
                                        <SelectItem value="image">Imagen de Pregunta</SelectItem>
                                        <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                                        <SelectItem value="flip_card">Tarjeta Giratoria</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                              <div className="space-y-1">
                                <Label htmlFor="quiz-timer" className="text-xs flex items-center gap-1"><Timer className="h-3 w-3"/>Contador</Label>
                                 <Select value={localQuiz.timerStyle || 'circular'} onValueChange={(v) => handleQuizMetaChange('timerStyle', v)}>
                                    <SelectTrigger id="quiz-timer" className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="circular">Circular</SelectItem>
                                        <SelectItem value="bar">Barra</SelectItem>
                                        <SelectItem value="pill">Píldora</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                         </div>
                    </div>
                     <div className="md:col-span-3 flex flex-col bg-muted/30">
                        {activeQuestion && (
                            <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                                <Textarea value={activeQuestion.text} onChange={(e) => handleQuestionChange('text', e.target.value)} placeholder="Escribe tu pregunta aquí..." className="text-xl text-center font-bold h-32 resize-none"/>
                                
                                <div className="flex-grow w-full max-w-lg mx-auto bg-card flex items-center justify-center rounded-lg shadow-inner overflow-hidden relative">
                                    {activeQuestion.imageUrl ? (
                                        <div className="relative w-full h-full">
                                            <Image src={activeQuestion.imageUrl} alt={activeQuestion.text} fill className="object-cover" />
                                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => handleQuestionChange('imageUrl', null)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <UploadArea onFileSelect={handleImageUpload} disabled={isUploading} className="w-full h-full">
                                            {isUploading ? (
                                                <div className="text-center">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto"/>
                                                    <Progress value={uploadProgress} className="w-32 mt-2 h-1"/>
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted-foreground">
                                                    <ImageIcon className="h-10 w-10 mx-auto mb-2"/>
                                                    <p className="font-semibold">Añadir Imagen (Opcional)</p>
                                                    <p className="text-xs">Arrastra o haz clic para subir</p>
                                                </div>
                                            )}
                                        </UploadArea>
                                    )}
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
