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

// Utility function
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Formas para las opciones
const optionShapes = [
    () => <Circle className="w-5 h-5" />,
    () => <Square className="w-5 h-5" />,
    () => <Triangle className="w-5 h-5" />,
    () => <Diamond className="w-5 h-5" />
];

// Colores vibrantes para las opciones
const optionColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600'
];

// Componente de progreso circular
const CircularProgress = ({ value, size = 48, strokeWidth = 4, className = '' }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-200"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn("transition-all duration-300", value <= 25 ? "text-red-500" : "text-blue-500")}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-sm font-bold text-gray-800">{Math.round(value / 5)}</span>
        </div>
    );
};

const SegmentedProgress = ({ current, total }: { current: number; total: number }) => {
    return (
        <div className="flex items-center gap-3 w-full">
            <div className="flex-grow grid gap-2" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
                {Array.from({ length: total }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-3 rounded-full transition-all duration-500",
                            index < current 
                                ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg" 
                                : "bg-gray-200"
                        )}
                    />
                ))}
            </div>
            <div className="text-base font-bold text-gray-700 whitespace-nowrap tabular-nums">
                {current}<span className="text-gray-400">/</span>{total}
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
                    <div className="w-full max-w-[200px] h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                        <div 
                            className={cn(
                                "h-full transition-all duration-1000 linear rounded-full",
                                isLowTime 
                                    ? "bg-gradient-to-r from-red-500 to-orange-500" 
                                    : "bg-gradient-to-r from-blue-500 to-purple-600"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                );
            case 'pill':
                return (
                    <div 
                        className={cn(
                            "px-4 py-1.5 font-bold rounded-full text-base tabular-nums border-2 transition-colors",
                            isLowTime 
                                ? "bg-red-100 text-red-600 border-red-400" 
                                : "bg-blue-100 text-blue-600 border-blue-400"
                        )}
                    >
                        {timeLeft}s
                    </div>
                );
            default:
                return (
                    <CircularProgress 
                        value={progress} 
                        size={48} 
                        strokeWidth={5}
                    />
                );
        }
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 md:gap-8 px-4 py-6">
            {/* Card de Pregunta - Más espacioso */}
            <div className="w-full bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50 pointer-events-none" />
                
                <div className="relative z-10 space-y-6">
                    {/* Header con progreso y timer */}
                    <div className="flex justify-between items-center gap-6 flex-wrap">
                        <div className="flex-grow min-w-[250px]">
                            <SegmentedProgress current={questionNumber} total={totalQuestions} />
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Timer className={cn(
                                "h-6 w-6 transition-colors",
                                isLowTime ? "text-red-500" : "text-blue-600"
                            )} />
                            <TimerDisplay />
                        </div>
                    </div>

                    {/* Pregunta - Mejor tamaño y espaciado */}
                    <h2 className="text-lg md:text-2xl font-bold leading-relaxed break-words text-center text-gray-800 px-4">
                        {stripHtml(question.text)}
                    </h2>
                </div>
            </div>

            {/* Imagen de la pregunta */}
            {question.imageUrl && (
                <div className="w-full max-w-3xl">
                    <div className="overflow-hidden rounded-xl shadow-lg border-2 border-gray-200 bg-white">
                        <div className="w-full aspect-video relative bg-gray-100">
                            <img 
                                src={question.imageUrl} 
                                alt={stripHtml(question.text)} 
                                className="w-full h-full object-contain p-4 md:p-6"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Grid de Opciones - REFACTORIZADO CON GRID INTERNO */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {question.options.map((opt: FormFieldOption, index: number) => {
                    const ShapeIcon = optionShapes[index % optionShapes.length];
                    const colorGradient = optionColors[index % optionColors.length];
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = correctOption?.id === opt.id;
                    const showResult = isAnswered && showFeedback;
                    const isWrong = isSelected && !isCorrect;

                    return (
                        <div key={opt.id} className="w-full">
                            <button
                                className={cn(
                                    // ESTRUCTURA GRID DE 3 COLUMNAS: [icono] [texto] [feedback]
                                    "w-full h-auto min-h-[90px] p-4 md:p-5",
                                    "grid grid-cols-[auto_1fr_auto] items-center gap-4",
                                    "text-left transition-all duration-300",
                                    "rounded-xl shadow-md hover:shadow-xl overflow-hidden",
                                    "border-2 relative group",
                                    // Estados normales - FONDO CLARO SIEMPRE
                                    !isAnswered && "bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400",
                                    // Estado seleccionado sin feedback
                                    isSelected && !showResult && "bg-blue-50 border-blue-500 ring-4 ring-blue-200 shadow-xl",
                                    // Estados con feedback
                                    showResult && isCorrect && "bg-green-50 border-green-500 ring-4 ring-green-200",
                                    showResult && isWrong && "bg-red-50 border-red-500 ring-4 ring-red-200",
                                    // Opciones NO seleccionadas mantienen visibilidad - NO SE OSCURECEN
                                    showResult && !isSelected && !isCorrect && "bg-white opacity-70",
                                    isAnswered && "cursor-default",
                                    !isAnswered && "hover:scale-[1.01] active:scale-[0.99]"
                                )}
                                onClick={() => handleOptionClick(opt)}
                                disabled={isAnswered}
                            >
                                {/* COLUMNA 1: Icono de forma con color */}
                                <div 
                                    className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all duration-300",
                                        isSelected && !showResult && `bg-gradient-to-br ${colorGradient} text-white border-transparent shadow-lg scale-110`,
                                        !isSelected && !showResult && `bg-gradient-to-br ${colorGradient} text-white border-transparent opacity-90 group-hover:opacity-100`,
                                        showResult && isCorrect && "bg-gradient-to-br from-green-500 to-green-600 text-white border-transparent scale-110",
                                        showResult && isWrong && "bg-gradient-to-br from-red-500 to-red-600 text-white border-transparent scale-110"
                                    )}
                                >
                                    <ShapeIcon />
                                </div>

                                {/* COLUMNA 2: Texto de la opción - SIN TRUNCAR, PERMITE MÚLTIPLES LÍNEAS */}
                                <div className="font-semibold text-sm md:text-lg leading-relaxed whitespace-normal break-words text-gray-800">
                                    {stripHtml(opt.text)}
                                </div>

                                {/* COLUMNA 3: Indicador de resultado */}
                                <div className="flex justify-end items-center min-w-[36px]">
                                    {showResult && (
                                        <div className="shrink-0">
                                            {isCorrect ? (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-lg ring-2 ring-green-300">
                                                    <Check className="h-5 w-5 stroke-[3px]" />
                                                </div>
                                            ) : isSelected ? (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center shadow-lg ring-2 ring-red-300">
                                                    <X className="h-5 w-5 stroke-[3px]" />
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Indicador de tiempo crítico */}
            {isLowTime && !isAnswered && (
                <div className="flex items-center gap-2 text-red-600 font-semibold bg-red-50 px-5 py-3 rounded-full border-2 border-red-300 shadow-lg">
                    <Zap className="h-5 w-5 animate-pulse" />
                    <span className="text-sm md:text-base">¡Tiempo casi agotado!</span>
                </div>
            )}
        </div>
    );
}