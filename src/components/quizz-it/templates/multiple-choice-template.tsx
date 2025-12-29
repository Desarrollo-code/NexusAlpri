'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Timer, Circle, Square, Triangle, Diamond } from 'lucide-react';

// Tipado para mejor mantenimiento
interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface MultipleChoiceProps {
  question: Question;
  onSubmit: (isCorrect: boolean, data: { answer: string }) => void;
  onTimeUp: () => void;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId?: string;
  showFeedback?: boolean;
}

const shapes = [Circle, Square, Triangle, Diamond];
const gradients = [
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
  selectedOptionId,
  showFeedback = true
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(selectedOptionId ?? null);
  const [answered, setAnswered] = useState(!!selectedOptionId);
  const [time, setTime] = useState(20);

  const correctOption = question.options.find(o => o.isCorrect);

  // Memorizamos onTimeUp para evitar re-ejecuciones innecesarias del efecto
  const handleTimeUp = useCallback(() => {
    onTimeUp();
  }, [onTimeUp]);

  useEffect(() => {
    if (answered) return;
    
    if (time <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time, answered, handleTimeUp]);

  const handleSelect = (opt: Option) => {
    if (answered) return;
    setSelected(opt.id);
    setAnswered(true);
    onSubmit(opt.isCorrect, { answer: opt.id });
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto p-4">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Pregunta {questionNumber} de {totalQuestions}
        </span>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-lg font-mono font-bold transition-colors
          ${time <= 5 ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-100 text-slate-700'}`}
        >
          <Timer size={20} />
          {time}s
        </div>
      </header>

      {/* QUESTION CARD */}
      <div className="p-8 bg-white rounded-2xl border-2 border-slate-100 shadow-sm mb-8">
        <div
          className="text-slate-800 text-xl md:text-2xl font-medium text-center leading-snug"
          dangerouslySetInnerHTML={{ __html: question.text }}
        />
      </div>

      {/* OPTIONS GRID */}
      <div className="grid gap-4 md:grid-cols-2">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const gradient = gradients[i % gradients.length];
          const isSelected = selected === opt.id;
          const isCorrect = opt.isCorrect;

          // Lógica de colores post-respuesta
          let cardStyles = "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md";
          if (answered) {
            if (isCorrect) cardStyles = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500";
            else if (isSelected) cardStyles = "border-rose-500 bg-rose-50";
            else cardStyles = "opacity-50 border-slate-100";
          }

          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`
                group relative flex items-center gap-4 p-5 rounded-2xl border-b-4 transition-all duration-200
                active:border-b-0 active:translate-y-[2px] min-h-[80px] text-left
                ${cardStyles}
              `}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br shadow-lg ${gradient}`}>
                <ShapeIcon size={24} fill="currentColor" />
              </div>

              <div
                className="flex-1 text-slate-700 font-semibold text-lg"
                dangerouslySetInnerHTML={{ __html: opt.text }}
              />

              {answered && showFeedback && (
                <div className="absolute top-2 right-2">
                  {isCorrect && <Check className="h-6 w-6 text-emerald-600 bg-emerald-100 rounded-full p-1" />}
                  {isSelected && !isCorrect && <X className="h-6 w-6 text-rose-600 bg-rose-100 rounded-full p-1" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}