'use client';
import React, { useState, useEffect } from 'react';
import { Check, X, Timer, Circle, Square, Triangle, Diamond } from 'lucide-react';

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
    selectedOptionId?: string | null;
    showFeedback?: boolean;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const optionShapes = [
    () => <Circle className="w-3.5 h-3.5" />,
    () => <Square className="w-3.5 h-3.5" />,
    () => <Triangle className="w-3.5 h-3.5" />,
    () => <Diamond className="w-3.5 h-3.5" />
];

const optionColors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600'
];

export function MultipleChoiceTemplate({ 
    question, 
    onSubmit, 
    onTimeUp, 
    questionNumber, 
    totalQuestions, 
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
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isAnswered, onTimeUp]);

    const handleOptionClick = (option: FormFieldOption) => {
        if (isAnswered) return;
        setIsAnswered(true);
        setSelectedOptionId(option.id);
        onSubmit(option.isCorrect, { answer: option.id });
    };

    const stripHtml = (html: string) => {
        if (typeof window === 'undefined') return html;
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    return (
        <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Mini */}
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Pregunta {questionNumber} / {totalQuestions}
                </span>
                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all",
                    timeLeft <= 5 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-50 text-slate-500 border-slate-200"
                )}>
                    <Timer className="h-3 w-3" />
                    <span className="tabular-nums">{timeLeft}s</span>
                </div>
            </div>

            {/* Pregunta Compacta */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 shadow-sm">
                <h2 className="text-sm md:text-base font-bold text-slate-800 text-center leading-snug">
                    {stripHtml(question.text)}
                </h2>
            </div>

            {/* Grid de Opciones: h-auto para evitar cortes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {question.options.map((opt: FormFieldOption, index: number) => {
                    const ShapeIcon = optionShapes[index % optionShapes.length];
                    const colorGradient = optionColors[index % optionColors.length];
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = correctOption?.id === opt.id;
                    const showResult = isAnswered && showFeedback;

                    return (
                        <button
                            key={opt.id}
                            disabled={isAnswered}
                            onClick={() => handleOptionClick(opt)}
                            className={cn(
                                "group relative flex items-center gap-3 p-3 text-left transition-all rounded-lg border-2",
                                "min-h-[56px] h-auto w-full", 
                                !isAnswered && "bg-white border-slate-100 hover:border-blue-300 hover:bg-slate-50",
                                isSelected && !showResult && "bg-blue-50 border-blue-500",
                                showResult && isCorrect && "bg-emerald-50 border-emerald-500",
                                showResult && isSelected && !isCorrect && "bg-rose-50 border-rose-500",
                                showResult && !isSelected && !isCorrect && "bg-white opacity-60"
                            )}
                        >
                            <div className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0 shadow-sm transition-transform",
                                `bg-gradient-to-br ${colorGradient}`,
                                !isAnswered && "group-hover:scale-105"
                            )}>
                                <ShapeIcon />
                            </div>

                            <div className="flex-grow font-semibold text-[11px] md:text-xs text-slate-700 leading-tight break-words py-0.5">
                                {stripHtml(opt.text)}
                            </div>

                            <div className="shrink-0 w-4 flex justify-center">
                                {showResult && (
                                    isCorrect ? 
                                    <Check className="text-emerald-600 h-4 w-4 stroke-[3px]" /> : 
                                    (isSelected && <X className="text-rose-600 h-4 w-4 stroke-[3px]" />)
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}