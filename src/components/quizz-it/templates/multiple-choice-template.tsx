'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X, Timer, Zap } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { optionShapes, optionColors } from '../quiz-editor-modal';
import { renderHtml, stripHtml } from '../../../lib/html-utils';
import Image from 'next/image';

interface FormFieldOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

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
        <div className="flex items-center gap-3 w-full">
            <div className="flex-grow grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
                {Array.from({ length: total }).map((_, index) => (
                    <motion.div
                        key={index}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: index < current ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn(
                            "h-2.5 rounded-full origin-left",
                            index < current 
                                ? "bg-gradient-to-r from-primary to-primary/80" 
                                : "bg-muted/50"
                        )}
                    />
                ))}
            </div>
            <div className="text-sm font-bold text-foreground/80 whitespace-nowrap tabular-nums">
                {current}<span className="text-muted-foreground">/</span>{total}
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
    timerStyle = 'circular', 
    selectedOptionId: initialSelectedOptionId, 
    showFeedback = true 
}: MultipleChoiceTemplateProps) {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialSelectedOptionId || null);
    const [isAnswered, setIsAnswered] = useState(!!initialSelectedOptionId);
    const [timeLeft, setTimeLeft] = useState(20);
    const [isLowTime, setIsLowTime] = useState(false);

    const correctOption = question.options.find((opt: any) => opt.isCorrect);

    useEffect(() => {
        setIsLowTime(timeLeft <= 5 && timeLeft > 0);
    }, [timeLeft]);

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
                return (
                    <div className="w-full max-w-[200px] h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                        <motion.div 
                            className={cn(
                                "h-full transition-all duration-1000 linear rounded-full",
                                isLowTime 
                                    ? "bg-gradient-to-r from-red-500 to-orange-500" 
                                    : "bg-gradient-to-r from-primary to-primary/70"
                            )}
                            style={{ width: `${progress}%` }}
                            animate={isLowTime ? { opacity: [1, 0.7, 1] } : {}}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                    </div>
                );
            case 'pill':
                return (
                    <motion.div 
                        className={cn(
                            "px-4 py-1.5 font-bold rounded-full text-lg tabular-nums border-2 transition-colors",
                            isLowTime 
                                ? "bg-red-500/10 text-red-600 border-red-500/50" 
                                : "bg-primary/10 text-primary border-primary/30"
                        )}
                        animate={isLowTime ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        {timeLeft}s
                    </motion.div>
                );
            default:
                return (
                    <div className={cn(
                        "transition-all",
                        isLowTime && "animate-pulse"
                    )}>
                        <CircularProgress 
                            value={progress} 
                            size={48} 
                            strokeWidth={5}
                            className={isLowTime ? "text-red-500" : ""}
                        />
                    </div>
                );
        }
    };

    return (
        <motion.div 
            className="w-full max-w-4xl mx-auto flex flex-col items-center gap-5 md:gap-7 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Card de Pregunta */}
            <Card className="w-full bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-md p-5 md:p-7 shadow-xl border-2 border-border/50 relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                
                <div className="relative z-10 space-y-5">
                    {/* Header con progreso y timer */}
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                        <div className="flex-grow min-w-[200px]">
                            <SegmentedProgress current={questionNumber} total={totalQuestions} />
                        </div>
                        <motion.div 
                            className="flex items-center gap-2.5 shrink-0"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Timer className={cn(
                                "h-5 w-5 transition-colors",
                                isLowTime ? "text-red-500" : "text-primary"
                            )} />
                            <TimerDisplay />
                        </motion.div>
                    </div>

                    {/* Pregunta */}
                    <motion.h2 
                        className="text-xl md:text-3xl font-bold font-headline leading-tight break-words text-center bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        {...renderHtml(question.text)}
                    />
                </div>
            </Card>

            {/* Imagen de la pregunta */}
            <AnimatePresence>
                {question.imageUrl && (
                    <motion.div 
                        className="w-full max-w-2xl"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="overflow-hidden shadow-lg border-2 border-border/50 bg-card">
                            <div className="w-full aspect-video relative">
                                <Image 
                                    src={question.imageUrl} 
                                    alt={stripHtml(question.text)} 
                                    fill 
                                    className="object-contain p-3 md:p-4"
                                    priority
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid de Opciones */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {question.options.map((opt: FormFieldOption, index: number) => {
                    const shape = React.createElement(optionShapes[index % optionShapes.length]);
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = correctOption?.id === opt.id;
                    const showResult = isAnswered && showFeedback;
                    const isWrong = isSelected && !isCorrect;

                    return (
                        <motion.div
                            key={opt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * index, duration: 0.3 }}
                            whileHover={!isAnswered ? { scale: 1.02, y: -3 } : {}}
                            whileTap={!isAnswered ? { scale: 0.98 } : {}}
                            className="w-full"
                        >
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-auto min-h-[80px] p-4 md:p-5",
                                    "grid grid-cols-[auto_1fr_auto] items-center gap-4",
                                    "text-left transition-all duration-300",
                                    "rounded-2xl shadow-md hover:shadow-lg overflow-hidden",
                                    "border-2 relative group",
                                    // Estados normales
                                    !isAnswered && "bg-card hover:bg-accent/50 border-border hover:border-primary/50",
                                    // Estado seleccionado sin feedback
                                    isSelected && !showResult && "bg-primary/15 border-primary ring-4 ring-primary/20 shadow-lg",
                                    // Estados con feedback
                                    showResult && isCorrect && "bg-green-50 dark:bg-green-950/20 border-green-500 ring-4 ring-green-500/20",
                                    showResult && isWrong && "bg-red-50 dark:bg-red-950/20 border-red-500 ring-4 ring-red-500/20",
                                    showResult && !isSelected && !isCorrect && "opacity-50",
                                    isAnswered && "cursor-default"
                                )}
                                onClick={() => handleOptionClick(opt)}
                                disabled={isAnswered}
                            >
                                {/* Efecto de brillo en hover */}
                                {!isAnswered && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />
                                )}

                                {/* Icono de forma */}
                                <motion.div 
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-300 relative z-10",
                                        isSelected && !showResult && "bg-primary text-primary-foreground border-primary shadow-md scale-110",
                                        !isSelected && !showResult && "bg-muted/50 text-muted-foreground border-transparent group-hover:bg-primary/10 group-hover:border-primary/30",
                                        showResult && isCorrect && "bg-green-500 text-white border-green-600 scale-110",
                                        showResult && isWrong && "bg-red-500 text-white border-red-600 scale-110"
                                    )}
                                    animate={isSelected && !showResult ? { rotate: [0, -5, 5, 0] } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    {shape}
                                </motion.div>

                                {/* Texto de la opción */}
                                <div 
                                    className="font-semibold text-base md:text-lg leading-relaxed break-words overflow-hidden relative z-10"
                                    {...renderHtml(opt.text)} 
                                />

                                {/* Indicador de resultado */}
                                <div className="flex justify-end min-w-[32px] relative z-10">
                                    <AnimatePresence>
                                        {showResult && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0, rotate: 180 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                                className="shrink-0"
                                            >
                                                {isCorrect ? (
                                                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg ring-2 ring-green-300">
                                                        <Check className="h-5 w-5 stroke-[3px]" />
                                                    </div>
                                                ) : isSelected ? (
                                                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg ring-2 ring-red-300">
                                                        <X className="h-5 w-5 stroke-[3px]" />
                                                    </div>
                                                ) : null}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Button>
                        </motion.div>
                    );
                })}
            </div>

            {/* Indicador de tiempo crítico */}
            <AnimatePresence>
                {isLowTime && !isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold"
                    >
                        <Zap className="h-5 w-5 animate-pulse" />
                        <span className="text-sm md:text-base">¡Tiempo casi agotado!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}