'use client';
import React, { useState, useEffect } from 'react';
import type { FormFieldOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
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
            <div className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                {current}/{total}
            </div>
        </div>
    );
};

export function MultipleChoiceTemplate({ 
    question, 
    onSubmit, 
    onTimeUp, 
    questionNumber, 
    totalQuestions, 
    timerStyle, 
    selectedOptionId: initialSelectedOptionId, 
    showFeedback = true 
}: MultipleChoiceTemplateProps) {
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

    const TimerDisplay = () => {
        const progress = (timeLeft / 20) * 100;
        switch (timerStyle) {
            case 'bar':
                return <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-1000 linear" style={{ width: `${progress}%` }}></div></div>
            case 'pill':
                return <div className="px-3 py-1 bg-muted text-foreground font-bold rounded-full text-lg">{timeLeft}</div>
            default:
                return <CircularProgress value={progress} size={40} strokeWidth={4} />
        }
    }

    return (
        <div className="w-full flex flex-col items-center gap-4 md:gap-6">
            {/* 1. CORRECCIÓN: Card de pregunta con control de ancho y saltos de línea */}
            <Card className="w-full bg-background/80 backdrop-blur-sm p-4 md:p-6 text-center shadow-lg border-2">
                <div className="flex justify-between items-center mb-6 gap-4">
                    <div className="flex-grow">
                        <SegmentedProgress current={questionNumber} total={totalQuestions} />
                    </div>
                    <div className="flex items-center gap-2 font-bold text-lg text-primary shrink-0">
                        <Timer className="h-5 w-5" />
                        <TimerDisplay />
                    </div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-headline leading-tight break-words max-w-full" {...renderHtml(question.text)}></h2>
            </Card>

            {/* 2. CORRECCIÓN: Altura máxima reducida para evitar colapso en móviles */}
            {question.imageUrl && (
                <div className="w-full max-w-md max-h-48 md:max-h-64 aspect-video relative rounded-xl overflow-hidden shadow-lg bg-card border">
                    <Image src={question.imageUrl} alt={stripHtml(question.text)} fill className="object-contain p-2" />
                </div>
            )}

            {/* 3. CORRECCIÓN: Grid de opciones más robusto */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {question.options.map((opt: FormFieldOption, index: number) => {
                    const shape = React.createElement(optionShapes[index % optionShapes.length]);
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = correctOption?.id === opt.id;
                    const showResult = isAnswered && showFeedback;

                    return (
                        <motion.div
                            key={opt.id}
                            whileHover={!isAnswered ? { scale: 1.01, y: -2 } : {}}
                            whileTap={!isAnswered ? { scale: 0.98 } : {}}
                            className="w-full"
                        >
                            <Button
                                variant="outline"
                                className={cn(
                                    /* CAMBIO CLAVE:
                                       - Se cambia 'flex' por 'grid'. 
                                       - 'grid-cols-[auto_1fr_auto]' define 3 zonas fijas:
                                          1. Auto: El icono de la figura.
                                          2. 1fr: El texto (toma todo el espacio restante).
                                          3. Auto: El icono de Check/X.
                                    */
                                    "w-full h-auto min-h-[72px] py-4 px-5 grid grid-cols-[auto_1fr_auto] items-center gap-4 text-left transition-all border-2",
                                    "rounded-2xl shadow-sm overflow-hidden whitespace-normal", // whitespace-normal permite saltos de línea
                                    isSelected
                                        ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-md"
                                        : "bg-background border-border hover:border-primary/40",
                                    isAnswered && !isSelected && !isCorrect && 'opacity-60'
                                )}
                                onClick={() => handleOptionClick(opt)}
                                disabled={isAnswered}
                            >
                                {/* Zona 1: Figura geométrica */}
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors",
                                    isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"
                                )}>
                                    {shape}
                                </div>

                                {/* Zona 2: El texto de la opción (Corregido para no desbordar) */}
                                <div className="font-medium text-base md:text-lg leading-snug break-words overflow-hidden" {...renderHtml(opt.text)} />

                                {/* Zona 3: Check o X (Solo aparece al responder) */}
                                <div className="flex justify-end min-w-[28px]">
                                    {showResult && (
                                        <div className="shrink-0">
                                            {isCorrect ? (
                                                <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                                                    <Check className="h-4 w-4 stroke-[3px]" />
                                                </div>
                                            ) : isSelected ? (
                                                <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm">
                                                    <X className="h-4 w-4 stroke-[3px]" />
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </Button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}