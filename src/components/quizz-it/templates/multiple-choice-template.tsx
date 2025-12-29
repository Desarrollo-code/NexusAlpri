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
  const [selected, setSelected] = useState(selectedOptionId ?? null);
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

  const cleanText = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      {/* HEADER MEJORADO */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl">
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider bg-white px-4 py-2 rounded-xl shadow-sm">
          Pregunta {questionNumber} de {totalQuestions}
        </span>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl text-lg font-mono font-bold transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 w-fit">
          <Timer size={24} />
          <span>{time}s</span>
        </div>
      </header>

      {/* QUESTION CARD MEJORADA */}
      <div className="p-8 md:p-10 bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-3xl border-2 border-slate-100 shadow-xl mb-8">
        <div className="text-slate-800 text-xl md:text-2xl lg:text-3xl font-semibold text-center leading-[1.4] md:leading-[1.3] tracking-tight break-words hyphens-auto max-w-full overflow-wrap-anywhere">
          <div dangerouslySetInnerHTML={{ __html: question.text }} />
        </div>
      </div>

      {/* OPTIONS GRID RESPONSIVE */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const gradient = gradients[i % gradients.length];
          const isSelected = selected === opt.id;
          const isCorrect = opt.isCorrect;

          // Lógica de colores post-respuesta
          let cardStyles = "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl";
          if (answered) {
            if (isCorrect) {
              cardStyles = "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 ring-2 ring-emerald-200 shadow-emerald-200/50";
            } else if (isSelected) {
              cardStyles = "border-rose-500 bg-gradient-to-br from-rose-50 to-rose-100 ring-2 ring-rose-200 shadow-rose-200/50";
            } else {
              cardStyles = "opacity-60 border-slate-100 shadow-sm";
            }
          }

          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`
                group relative flex flex-col lg:flex-row lg:items-center gap-6 p-8 rounded-3xl border-4 border-slate-200
                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] active:border-b-0 active:translate-y-[2px]
                min-h-[120px] md:min-h-[140px] text-left break-inside-avoid overflow-hidden max-w-full
                hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary/20
                ${cardStyles}
              `}
            >
              {/* ÍCONO DE FORMA */}
              <div className="w-20 h-20 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center text-white shrink-0 flex-shrink-0 bg-gradient-to-br shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                <ShapeIcon size={28} fill="currentColor" />
              </div>

              {/* CONTENIDO DE TEXTO MEJORADO */}
              <div className="flex-1 min-w-0 max-w-full prose prose-slate">
                <div className="text-slate-800 font-semibold text-lg md:text-xl leading-relaxed md:leading-snug hyphens-auto overflow-wrap-anywhere break-words max-w-full">
                  <div dangerouslySetInnerHTML={{ __html: opt.text }} />
                </div>
              </div>

              {/* FEEDBACK VISUAL */}
              {answered && showFeedback && (
                <div className="absolute top-6 right-6 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {isCorrect && (
                    <div className="bg-emerald-100 border-2 border-emerald-300 p-2 rounded-2xl shadow-lg">
                      <Check className="h-6 w-6 text-emerald-600" />
                    </div>
                  )}
                  {isSelected && !isCorrect && (
                    <div className="bg-rose-100 border-2 border-rose-300 p-2 rounded-2xl shadow-lg">
                      <X className="h-6 w-6 text-rose-600" />
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
