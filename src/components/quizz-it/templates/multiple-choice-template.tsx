// src/components/quizz-it/templates/multiple-choice-template.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { FormField, FormFieldOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X, Timer } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { FlipCard } from '../flip-card';
import Image from 'next/image';

interface MultipleChoiceTemplateProps {
  question: FormField;
  onSubmit: (isCorrect: boolean, answerData: any) => void;
  onTimeUp: () => void;
  questionNumber: number;
  totalQuestions: number;
  template?: string | null;
  timerStyle?: string | null;
}

const optionShapes = [
    (props: any) => <path d="M12 2L2 22h20L12 2z" {...props} />, // Triangle
    (props: any) => <rect x="3" y="3" width="18" height="18" rx="3" {...props} />, // Square
    (props: any) => <circle cx="12" cy="12" r="10" {...props} />, // Circle
    (props: any) => <path d="M12 2.5l2.5 7.5h8l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h8l2.5-7.5z" {...props} />, // Star
];
const optionColors = [
  'bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'
];

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
        <Card className="w-full bg-background/80 backdrop-blur-sm p-6 text-center shadow-lg">
             <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-muted-foreground">{questionNumber}/{totalQuestions}</p>
                 <div className="flex items-center gap-2 font-bold text-lg text-primary">
                    <Timer className="h-5 w-5"/>
                    <TimerDisplay />
                 </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-headline">{question.text}</h2>
        </Card>
        
        {question.imageUrl && (
            <div className="w-full max-w-lg aspect-video relative rounded-lg overflow-hidden shadow-lg bg-card">
                 <Image src={question.imageUrl} alt={question.text} fill className="object-cover" />
            </div>
        )}

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {(question.options as FormFieldOption[]).map((option, index) => (
               <FlipCard 
                    key={option.id}
                    isFlipped={isAnswered && selectedOptionId === option.id}
               >
                   {/* Front of the Card */}
                   <Button
                        onClick={() => handleOptionClick(option)}
                        disabled={isAnswered}
                        className={cn(
                            "w-full h-24 md:h-32 text-lg md:text-xl font-bold text-white shadow-lg transition-all duration-300 transform-gpu hover:scale-105",
                            optionColors[index % optionColors.length],
                            isAnswered && 'opacity-50'
                        )}
                    >
                         <div className="flex items-center gap-4">
                            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">{React.createElement(optionShapes[index % optionShapes.length])}</svg>
                            <span>{option.text}</span>
                        </div>
                   </Button>

                   {/* Back of the Card */}
                   <div className={cn(
                       "w-full h-24 md:h-32 rounded-lg flex flex-col items-center justify-center p-4 text-white shadow-lg",
                       getOptionState(option.id) === 'correct' ? 'bg-green-500' : 'bg-red-500'
                   )}>
                        {getOptionState(option.id) === 'correct' ? (
                            <>
                                <Check className="h-8 w-8 mb-2"/>
                                <p className="font-bold text-xl">¡Correcto!</p>
                            </>
                        ) : (
                            <>
                                <X className="h-8 w-8 mb-2"/>
                                <p className="font-bold text-xl">Incorrecto</p>
                            </>
                        )}
                        {option.feedback && <p className="text-xs mt-1">{option.feedback}</p>}
                   </div>
               </FlipCard>
            ))}
        </div>
    </div>
  );
}
