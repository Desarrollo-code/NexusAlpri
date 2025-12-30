'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Circle, Square, Triangle, Diamond, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const shapes = [Circle, Square, Triangle, Diamond];
const shapeColors = [
  'text-blue-400 bg-blue-400/10',
  'text-rose-400 bg-rose-400/10',
  'text-amber-400 bg-amber-400/10',
  'text-emerald-400 bg-emerald-400/10'
];

export function MultipleChoiceTemplate({
  question, onSubmit, onTimeUp, questionNumber, totalQuestions, selectedOptionId, showFeedback = false
}: any) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [time, setTime] = useState(30);

  useEffect(() => {
    setSelected(selectedOptionId ?? null);
    setAnswered(!!selectedOptionId);
    setTime(30);
  }, [question.id, selectedOptionId]);

  useEffect(() => {
    if (answered || time <= 0) {
      if (time <= 0 && !answered) { setAnswered(true); onTimeUp(); }
      return;
    }
    const timer = setInterval(() => setTime(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [time, answered, onTimeUp]);

  const handleSelect = (opt: any) => {
    if (answered) return;
    setSelected(opt.id);
    setAnswered(true);
    onSubmit(opt.isCorrect, { answer: opt.id });
  };

  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lección en curso</span>
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div key={i} className={`h-1 w-5 rounded-full ${i < questionNumber ? 'bg-indigo-500' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-mono font-bold text-xs ${time < 10 ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-zinc-500 border-zinc-800'}`}>
          <Timer size={12} className={time < 10 ? 'animate-pulse' : ''} />
          <span>0:{time.toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="py-1">
        <h3 className="text-lg md:text-xl font-bold text-white leading-snug" 
            dangerouslySetInnerHTML={{ __html: question.text }} 
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {question.options.map((opt: any, i: number) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;
          
          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`group w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left
                ${isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}
                ${answered && opt.isCorrect ? 'border-emerald-500 bg-emerald-500/10' : ''}
                ${answered && isSelected && !opt.isCorrect ? 'border-rose-500 bg-rose-500/10' : ''}
              `}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors 
                ${isSelected ? 'bg-indigo-500 text-white' : shapeColors[i % shapeColors.length]}`}>
                <ShapeIcon size={16} fill="currentColor" />
              </div>
              
              {/* CORRECCIÓN AQUÍ: Renderizado de HTML en la opción */}
              <div className={`flex-1 text-sm font-semibold leading-tight ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                   dangerouslySetInnerHTML={{ __html: opt.text }} 
              />
              
              {answered && opt.isCorrect && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}