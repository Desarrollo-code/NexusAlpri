// src/components/resources/quiz-question-form.tsx
'use client';
import React from 'react';
import type { AppQuestion, FormFieldOption } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Check, PlusCircle, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';

interface QuizQuestionFormProps {
    question: AppQuestion;
    onQuestionChange: (updatedQuestion: AppQuestion) => void;
}

const generateUniqueOptionId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;


export const QuizQuestionForm: React.FC<QuizQuestionFormProps> = ({ question, onQuestionChange }) => {

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onQuestionChange({ ...question, text: e.target.value });
    };
    
    const handleOptionTextChange = (optionIndex: number, text: string) => {
        const newOptions = [...question.options];
        newOptions[optionIndex].text = text;
        onQuestionChange({ ...question, options: newOptions });
    };
    
    const handleSetCorrect = (optionId: string) => {
         onQuestionChange({
            ...question,
            options: question.options.map(opt => ({
                ...opt,
                isCorrect: opt.id === optionId
            }))
        });
    }

    const addOption = () => {
        const newOption: FormFieldOption = { id: generateUniqueOptionId('opt'), text: 'Nueva opción', isCorrect: false, points: 0 };
        onQuestionChange({ ...question, options: [...question.options, newOption] });
    };

    const deleteOption = (optionIndex: number) => {
        const newOptions = question.options.filter((_, i) => i !== optionIndex);
        if (newOptions.length > 0 && !newOptions.some(opt => opt.isCorrect)) {
            newOptions[0].isCorrect = true;
        }
        onQuestionChange({ ...question, options: newOptions });
    };


    return (
        <Card>
            <CardHeader><CardTitle>Editor de Pregunta</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="question-text">Texto de la Pregunta</Label>
                    <Textarea id="question-text" value={question.text} onChange={handleTextChange} rows={3}/>
                </div>
                 <div>
                    <Label>Opciones de Respuesta</Label>
                    <div className="space-y-2 mt-2">
                        <RadioGroup value={question.options.find(o => o.isCorrect)?.id} onValueChange={handleSetCorrect}>
                        {question.options.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-2">
                                <RadioGroupItem value={option.id} id={`opt-${option.id}`} />
                                <Input value={option.text} onChange={(e) => handleOptionTextChange(index, e.target.value)} />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70" onClick={() => deleteOption(index)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                        </RadioGroup>
                    </div>
                    {question.options.length < 4 && (
                        <Button variant="outline" size="sm" onClick={addOption} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Opción
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
};
