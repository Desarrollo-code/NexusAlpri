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
  onSubmit: (answerData: { questionId: string; answer: string; isCorrect: boolean }) => void;
  onTimeUp: () => void;
  questionNumber: number;
  totalQuestions: number;
  initialAnswer?: any;
  timerStyle?: string | null;
}

const SegmentedProgress = ({ current, total }: { current: number; total: number }) => {
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-grow grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, 1fr)`}}>
                {Array.from({ length: total }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-2 rounded-full transition-colors duration-300",
                            index < current ? "bg-primary" : "bg-muted"
                        )}
                    />
                ))}
            </div>
            <div className="text-sm font-semibold text-muted-foreground">
                {current}/{total}
            </div>
        </div>
    );
};


export function MultipleChoiceTemplate({ question, onSubmit, onTimeUp, questionNumber, totalQuestions, initialAnswer, timerStyle }: MultipleChoiceTemplateProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialAnswer?.answer || null);
  
  const correctOption = question.options.find(opt => opt.isCorrect);

  const handleOptionClick = (option: FormFieldOption) => {
    setSelectedOptionId(option.id);
    onSubmit({
        questionId: question.id,
        answer: option.id,
        isCorrect: option.isCorrect
    });
  };
  
  const TimerDisplay = () => {
    // Timer logic is disabled for manual navigation
    return <CircularProgress value={100} size={40} strokeWidth={4} />;
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
        <Card className="w-full bg-background/80 backdrop-blur-sm p-4 text-center shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold font-headline">{question.text}</h2>
        </Card>
        
        {question.imageUrl && (
            <div className="w-full max-w-md max-h-64 aspect-video relative rounded-lg overflow-hidden shadow-lg bg-card">
                 <Image src={question.imageUrl} alt={question.text} fill className="object-contain" />
            </div>
        )}

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
            {(question.options as FormFieldOption[]).map((option, index) => (
                <div key={option.id} className="relative">
                    <Button
                        onClick={() => handleOptionClick(option)}
                        className={cn(
                            "w-full h-auto min-h-[4rem] py-3 px-4 text-base md:text-lg font-bold text-white shadow-lg transition-all duration-300 transform-gpu hover:scale-105",
                            optionColors[index % optionColors.length],
                            selectedOptionId === option.id && 'ring-4 ring-offset-2 ring-offset-background ring-yellow-400'
                        )}
                    >
                         <div className="flex items-center justify-start w-full gap-4">
                            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current shrink-0">{React.createElement(optionShapes[index % optionShapes.length])}</svg>
                            <span className="flex-grow text-left whitespace-normal break-words">{option.text}</span>
                        </div>
                    </Button>
                </div>
            ))}
        </div>
    </div>
  );
}
