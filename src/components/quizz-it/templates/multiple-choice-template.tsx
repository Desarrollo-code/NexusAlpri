'use client';
import React, { useState, useEffect } from 'react';
import { Check, X, Timer, Circle, Square, Triangle, Diamond } from 'lucide-react';

const shapes = [Circle, Square, Triangle, Diamond];
const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500'
];

export function MultipleChoiceTemplate({
    question,
    onSubmit,
    onTimeUp,
    questionNumber,
    totalQuestions,
    selectedOptionId,
    showFeedback = true
}: any) {
    const [selected, setSelected] = useState(selectedOptionId ?? null);
    const [answered, setAnswered] = useState(!!selectedOptionId);
    const [time, setTime] = useState(20);

    const correct = question.options.find((o: any) => o.isCorrect);

    useEffect(() => {
        if (answered) return;
        if (time === 0) return onTimeUp();
        const t = setTimeout(() => setTime(time - 1), 1000);
        return () => clearTimeout(t);
    }, [time, answered, onTimeUp]);

    return (
        <div className="space-y-5">
            <header className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">
                    Pregunta {questionNumber} / {totalQuestions}
                </span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold
                    ${time <= 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Timer size={16} /> {time}s
                </div>
            </header>

            <div className="p-4 bg-slate-50 rounded-xl border">
                <h2 className="text-base md:text-lg font-bold text-center text-slate-800">
                    {question.text.replace(/<[^>]+>/g, '')}
                </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {question.options.map((opt: any, i: number) => {
                    const Shape = shapes[i % shapes.length];
                    const color = colors[i % colors.length];
                    const isSelected = selected === opt.id;
                    const isCorrect = correct?.id === opt.id;

                    return (
                        <button
                            key={opt.id}
                            disabled={answered}
                            onClick={() => {
                                setSelected(opt.id);
                                setAnswered(true);
                                onSubmit(opt.isCorrect, { answer: opt.id });
                            }}
                            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition
                                ${!answered && 'hover:bg-slate-50'}
                                ${isSelected && 'border-primary bg-primary/5'}
                                ${answered && isCorrect && 'border-emerald-500 bg-emerald-50'}
                                ${answered && isSelected && !isCorrect && 'border-rose-500 bg-rose-50'}`}
                        >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${color}`}>
                                <Shape size={18} />
                            </div>

                            <span className="flex-grow text-sm md:text-base font-medium text-slate-700">
                                {opt.text.replace(/<[^>]+>/g, '')}
                            </span>

                            {answered && (
                                isCorrect
                                    ? <Check className="text-emerald-600" />
                                    : isSelected && <X className="text-rose-600" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
