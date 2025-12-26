// src/components/quizz-it/templates/multiple-choice-template.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { FormFieldOption, AppQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X, Timer } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { optionShapes, optionColors } from '../quiz-editor-modal';
import { renderHtml, stripHtml } from '../../../lib/html-utils';
import Image from 'next/image';

interface MultipleChoiceTemplateProps {
    question: any;
    onSubmit: (isCorrect: boolean, answerData: any) => void;
    onTimeUp: () => void;
    questionNumber: number;
    totalQuestions: number;
    template?: string | null;
    timerStyle?: string | null;
    selectedOptionId?: string | null;
    showFeedback?: boolean;
}

const SegmentedProgress = ({ current, total }: { current: number; total: number }) => {
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-grow grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
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


export function MultipleChoiceTemplate({ question, onSubmit, onTimeUp, questionNumber, totalQuestions, template, timerStyle, selectedOptionId: initialSelectedOptionId, showFeedback = true }: MultipleChoiceTemplateProps) {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialSelectedOptionId || null);
    const [isAnswered, setIsAnswered] = useState(!!initialSelectedOptionId);
    const [timeLeft, setTimeLeft] = useState(20);

    const correctOption = question.options.find((opt: any) => opt.isCorrect);

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
        if (showFeedback) {
            if (optionId === correctOption?.id) return 'correct';
            if (optionId === selectedOptionId && optionId !== correctOption?.id) return 'incorrect';
            return 'disabled';
        }
        return optionId === selectedOptionId ? 'selected' : 'default';
    };

    const TimerDisplay = () => {
        const progress = (timeLeft / 20) * 100;
        switch (timerStyle) {
            case 'bar':
                return <div className="w-full h-2.5 bg-muted rounded-full"><div className="h-full bg-primary rounded-full transition-all duration-1000 linear" style={{ width: `${progress}%` }}></div></div>
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
                <div className="flex justify-between items-center mb-4 gap-4">
                    <div className="w-full">
                        <SegmentedProgress current={questionNumber} total={totalQuestions} />
                    </div>
                    <div className="flex items-center gap-2 font-bold text-lg text-primary flex-shrink-0">
                        <Timer className="h-5 w-5" />
                        <TimerDisplay />
                    </div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-headline" {...renderHtml(question.text)}></h2>
            </Card>

            {question.imageUrl && (
                <div className="w-full max-w-md max-h-64 aspect-video relative rounded-lg overflow-hidden shadow-lg bg-card">
                    <Image src={question.imageUrl} alt={stripHtml(question.text)} fill className="object-contain" />
                </div>
            )}

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((opt: FormFieldOption, index: number) => {
                    const shape = React.createElement(optionShapes[index % optionShapes.length]);
                    const color = optionColors[index % optionColors.length];
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = correctOption?.id === opt.id;
                    const showResult = isAnswered && showFeedback;

                    return (
                        <motion.div
                            key={opt.id}
                            whileHover={{ scale: 1.01, x: 2 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-auto py-5 px-6 flex items-center gap-4 text-left transition-all border-2",
                                    "rounded-2xl shadow-sm hover:shadow-md",
                                    isSelected
                                        ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                                        : "bg-background border-border hover:border-primary/50",
                                    isAnswered && !isSelected && 'opacity-50' // Dim non-selected options after answering
                                )}
                                onClick={() => handleOptionClick(opt)}
                                disabled={isAnswered}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2",
                                    isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"
                                )}>
                                    {shape}
                                </div>

                                <div className="flex-grow font-medium text-lg leading-snug" {...renderHtml(opt.text)} />

                                {showResult && (
                                    <div className="shrink-0">
                                        {isCorrect ? (
                                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                <Check className="h-5 w-5" />
                                            </div>
                                        ) : isSelected ? (
                                            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                                                <X className="h-5 w-5" />
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </Button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
