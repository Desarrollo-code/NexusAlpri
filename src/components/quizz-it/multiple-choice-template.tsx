// src/components/quizz-it/templates/multiple-choice-template.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { FormField, FormFieldOption, AppQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X, Timer } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { optionShapes, optionColors } from '../quiz-editor-modal';
import Image from 'next/image';

interface MultipleChoiceTemplateProps {
  question: AppQuestion;
  onSubmit: (isCorrect: boolean, answerData: any) => void;
  onTimeUp: () => void;
  questionNumber: number;
  totalQuestions: number;
  template?: string | null;
  timerStyle?: string | null;
}

export function MultipleChoiceTemplate({ question, onSubmit, onTimeUp, questionNumber, totalQuestions, template, timerStyle }: MultipleChoiceTemplateProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  
  const correctOption = question.options.find(opt => opt.isCorrect);

  useEffect(() => {
    if (isAnswered) return;
    if (timeLeft === 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, onTimeUp]);

  const handleOptionClick = (option: FormFieldOption) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOptionId(option.id);
    onSubmit(option.isCorrect, { answer: option.id });
  };
  
  const getOptionState = (optionId: string) => {
    if (!isAnswered) return 'default';
    if (optionId === correctOption?.id) return 'correct';
    if (optionId === selectedOptionId && optionId !== correctOption?.id) return 'incorrect';
    return 'disabled';
  };
  
  const TimerDisplay = () => {
       const progress = (timeLeft / 20) * 100;
       switch (timerStyle) {
           case 'bar':
               return <div className="w-full h-2.5 bg-muted rounded-full"><div className="h-full bg-primary rounded-full transition-all duration-1000 linear" style={{width: `${progress}%`}}></div></div>
           case 'pill':
                return <div className="px-3 py-1 bg-muted text-foreground font-bold rounded-full text-lg">{timeLeft}</div>
           case 'circular':
           default:
                return <CircularProgress value={progress} size={40} strokeWidth={4} />
       }
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
        <Card className="w-full bg-background/80 backdrop-blur-sm p-4 text-center shadow-lg">
             <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-muted-foreground">{questionNumber}/{totalQuestions}</p>
                 <div className="flex items-center gap-2 font-bold text-lg text-primary">
                    <Timer className="h-5 w-5"/>
                    <TimerDisplay />
                 </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-headline">{question.text}</h2>
        </Card>
        
        {question.imageUrl && (
            <div className="w-full max-w-md md:max-h-64 aspect-video relative rounded-lg overflow-hidden shadow-lg bg-card">
                 <Image src={question.imageUrl} alt={question.text} fill className="object-contain" />
            </div>
        )}

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
            {(question.options as FormFieldOption[]).map((option, index) => {
                const state = getOptionState(option.id);
                const showResult = isAnswered && (state === 'correct' || state === 'incorrect');

                return (
                   <div key={option.id} className="relative">
                        <AnimatePresence>
                            {showResult && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                                >
                                    {state === 'correct' && <Check className="h-8 w-8 text-white bg-green-500 rounded-full p-1" />}
                                    {state === 'incorrect' && <X className="h-8 w-8 text-white bg-red-500 rounded-full p-1" />}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button
                            onClick={() => handleOptionClick(option)}
                            disabled={isAnswered}
                            className={cn(
                                "w-full h-16 text-lg font-bold text-white shadow-lg transition-all duration-300 transform-gpu hover:scale-105",
                                optionColors[index % optionColors.length],
                                isAnswered && state !== 'correct' && state !== 'incorrect' && 'opacity-30'
                            )}
                        >
                             <div className="flex items-center gap-4">
                                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">{React.createElement(optionShapes[index % optionShapes.length])}</svg>
                                <span>{option.text}</span>
                            </div>
                        </Button>
                   </div>
                )
            })}
        </div>
    </div>
  );
}
