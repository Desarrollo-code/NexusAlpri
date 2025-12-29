'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Timer, Circle, Square, Triangle, Diamond } from 'lucide-react';

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
  'from-violet-500 via-purple-600 to-indigo-700',
  'from-emerald-500 via-teal-600 to-cyan-700',
  'from-orange-500 via-amber-600 to-yellow-600',
  'from-rose-500 via-pink-600 to-fuchsia-700'
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

  const handleTimeUp = useCallback(() => {
    if (!answered) {
      setAnswered(true);
      onTimeUp();
    }
  }, [answered, onTimeUp]);

  useEffect(() => {
    if (answered || time <= 0) {
      if (time <= 0 && !answered) {
        handleTimeUp();
      }
      return;
    }

    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
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
    <div className="space-y-6 w-full">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 md:p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-100 rounded-xl shadow-sm border border-slate-200">
        <span className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide bg-white/80 px-4 py-2 rounded-lg shadow-sm border">
          Pregunta {questionNumber} de {totalQuestions}
        </span>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-base font-mono font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[80px] justify-center">
          <Timer size={20} />
          <span className="tabular-nums">{time}s</span>
        </div>
      </header>

      {/* PREGUNTA */}
      <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-br from-white via-slate-50/50 to-slate-100 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <div 
            className="text-slate-900 text-lg md:text-xl lg:text-2xl font-bold leading-[1.4] tracking-tight break-words overflow-wrap-anywhere hyphens-auto max-w-full px-2 prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: question.text.replace(/&nbsp;|&#160;/g, ' ') 
            }} 
          />
        </div>
      </div>

      {/* OPCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const gradient = gradients[i % gradients.length];
          const isSelected = selected === opt.id;
          const isCorrect = opt.isCorrect;

          let cardStyles = "group-hover:shadow-xl bg-white/80 border-2 border-slate-200 hover:border-slate-300 active:border-slate-400 transition-all duration-300";
          
          if (answered && showFeedback) {
            if (isCorrect) {
              cardStyles = "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 ring-2 ring-emerald-200/50 shadow-emerald-200/30";
            } else if (isSelected) {
              cardStyles = "border-rose-500 bg-gradient-to-br from-rose-50 to-rose-100 ring-2 ring-rose-200/50 shadow-rose-200/30";
            } else {
              cardStyles = "border-slate-200/50 bg-slate-50/50 shadow-sm opacity-70";
            }
          }

          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`relative flex flex-col items-stretch p-6 md:p-8 rounded-2xl ${cardStyles} hover:scale-[1.01] active:scale-[0.99] active:translate-y-0.5 min-h-[120px] md:min-h-[140px] max-w-full focus:outline-none focus:ring-4 focus:ring-primary/25 break-inside-avoid overflow-hidden`}
            >
              {/* ÍCONO CON GRADIENTE VIBRANTE */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 md:mb-0 md:mr-6 shrink-0 bg-gradient-to-br ${gradient}`}>
                <ShapeIcon size={24} fill="currentColor" className="drop-shadow-sm" />
              </div>

              {/* TEXTO */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div 
                  className="text-slate-800 font-semibold text-base md:text-lg leading-relaxed md:leading-snug break-words overflow-wrap-anywhere hyphens-auto max-w-full line-clamp-4 px-1 prose prose-sm md:prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: opt.text.replace(/&nbsp;|&#160;/g, ' ') 
                  }}
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    hyphens: 'auto'
                  }}
                />
              </div>

              {/* FEEDBACK */}
              {answered && showFeedback && (
                <div className="absolute -top-2 -right-2 p-2 bg-white/90 rounded-2xl shadow-lg border">
                  {isCorrect ? (
                    <Check className="h-6 w-6 text-emerald-600" />
                  ) : isSelected ? (
                    <X className="h-6 w-6 text-rose-600" />
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}