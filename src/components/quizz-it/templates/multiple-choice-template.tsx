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

// Iconos más pequeños para ahorrar espacio
const optionShapes = [
    () => <Circle className="w-4 h-4" />,
    () => <Square className="w-4 h-4" />,
    () => <Triangle className="w-4 h-4" />,
    () => <Diamond className="w-4 h-4" />
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
        <div className="w-full flex flex-col gap-4">
            {/* Header compacto: Tiempo y Progreso */}
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Pregunta {questionNumber} de {totalQuestions}
                </span>
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold transition-all",
                    timeLeft <= 5 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-blue-50 text-blue-600 border-blue-200"
                )}>
                    <Timer className="h-3.5 w-3.5" />
                    <span className="tabular-nums">{timeLeft}s</span>
                </div>
            </div>

            {/* Caja de Pregunta: Reducida en padding y tamaño de fuente */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 text-center leading-snug">
                    {stripHtml(question.text)}
                </h2>
            </div>

            {/* Grid de Opciones: h-auto y sin truncate para que el texto fluya */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                "group relative flex items-center gap-3 p-3.5 text-left transition-all rounded-xl border-2 shadow-sm",
                                "min-h-[70px] h-auto w-full", // h-auto permite que crezca si el texto es largo
                                !isAnswered && "bg-white border-slate-200 hover:border-primary/40 hover:bg-slate-50",
                                isSelected && !showResult && "bg-blue-50 border-blue-500 ring-2 ring-blue-100",
                                showResult && isCorrect && "bg-green-50 border-green-500 ring-2 ring-green-100",
                                showResult && isSelected && !isCorrect && "bg-red-50 border-red-500 ring-2 ring-red-100",
                                showResult && !isSelected && "bg-white opacity-60"
                            )}
                        >
                            {/* Icono de Opción pequeño */}
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm",
                                `bg-gradient-to-br ${colorGradient}`
                            )}>
                                <ShapeIcon />
                            </div>

                            {/* Texto de Opción: Sin truncate, con break-words */}
                            <div className="flex-grow font-semibold text-sm text-slate-700 leading-snug break-words">
                                {stripHtml(opt.text)}
                            </div>

                            {/* Indicador Check/X */}
                            <div className="shrink-0 w-5 flex justify-center">
                                {showResult && (
                                    isCorrect ? 
                                    <Check className="text-green-600 h-5 w-5 stroke-[3px]" /> : 
                                    (isSelected && <X className="text-red-600 h-5 w-5 stroke-[3px]" />)
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}