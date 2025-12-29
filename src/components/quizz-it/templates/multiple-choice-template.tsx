'use client';
import React, { useState, useEffect } from 'react';
import { Check, X, Timer, Zap, Circle, Square, Triangle, Diamond } from 'lucide-react';

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

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

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

const SegmentedProgress = ({ current, total }: { current: number; total: number }) => {
    return (
        <div className="flex items-center gap-3 w-full">
            <div className="flex-grow grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
                {Array.from({ length: total }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            index < current ? "bg-primary shadow-sm" : "bg-gray-200"
                        )}
                    />
                ))}
            </div>
            <div className="text-[10px] font-black text-gray-400 tabular-nums">
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
    timerStyle = 'pill', 
    selectedOptionId: initialSelectedOptionId, 
    showFeedback = true 
}: MultipleChoiceTemplateProps) {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialSelectedOptionId || null);
    const [isAnswered, setIsAnswered] = useState(!!initialSelectedOptionId);
    const [timeLeft, setTimeLeft] = useState(20);

    const isLowTime = timeLeft <= 5 && timeLeft > 0;
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
        <div className="w-full flex flex-col gap-6">
            {/* Header: Progreso y Tiempo */}
            <div className="flex justify-between items-center gap-4">
                <div className="flex-grow">
                    <SegmentedProgress current={questionNumber} total={totalQuestions} />
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full border font-bold text-sm transition-colors",
                    isLowTime ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-blue-50 text-blue-600 border-blue-200"
                )}>
                    <Timer className="h-4 w-4" />
                    <span className="tabular-nums">{timeLeft}s</span>
                </div>
            </div>

            {/* Pregunta: Reducida y Centrada */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center leading-snug">
                    {stripHtml(question.text)}
                </h2>
            </div>

            {/* Imagen: Controlada */}
            {question.imageUrl && (
                <div className="w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <img 
                        src={question.imageUrl} 
                        alt="Contexto" 
                        className="w-full h-auto max-h-[250px] object-contain"
                    />
                </div>
            )}

            {/* Grid de Opciones: Compacto y sin truncar */}
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
                                "group relative flex items-center gap-4 p-4 text-left transition-all rounded-xl border-2",
                                "min-h-[72px] h-full w-full",
                                !isAnswered && "bg-white border-slate-200 hover:border-primary/40 hover:bg-slate-50",
                                isSelected && !showResult && "bg-blue-50 border-blue-500 shadow-md",
                                showResult && isCorrect && "bg-green-50 border-green-500",
                                showResult && isSelected && !isCorrect && "bg-red-50 border-red-500",
                                showResult && !isSelected && "bg-white opacity-60"
                            )}
                        >
                            {/* Icono de Opción */}
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform",
                                `bg-gradient-to-br ${colorGradient}`,
                                !isAnswered && "group-hover:scale-110"
                            )}>
                                <ShapeIcon />
                            </div>

                            {/* Texto de Opción: Responsivo y multilínea */}
                            <div className="flex-grow font-semibold text-sm md:text-base text-slate-700 leading-tight py-1">
                                {stripHtml(opt.text)}
                            </div>

                            {/* Check/X Indicador */}
                            <div className="shrink-0 w-6 flex justify-center">
                                {showResult && (
                                    isCorrect ? 
                                    <Check className="text-green-500 h-6 w-6 stroke-[3px]" /> : 
                                    (isSelected && <X className="text-red-500 h-6 w-6 stroke-[3px]" />)
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}