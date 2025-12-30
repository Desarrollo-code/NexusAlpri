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
    <div className="space-y-6 w-full">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Evaluación de Lección</span>
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div key={i} className={`h-1 w-6 rounded-full ${i < questionNumber ? 'bg-indigo-500' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${time < 10 ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-zinc-400 border-zinc-800'}`}>
          <Timer size={14} className={time < 10 ? 'animate-pulse' : ''} />
          <span>0:{time.toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Question Text */}
      <div className="py-2">
        <h3 className="text-xl md:text-2xl font-bold text-white leading-snug" 
            dangerouslySetInnerHTML={{ __html: question.text }} 
        />
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt: any, i: number) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;
          
          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`group w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
                ${isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'}
                ${answered && opt.isCorrect ? 'border-emerald-500 bg-emerald-500/5' : ''}
                ${answered && isSelected && !opt.isCorrect ? 'border-rose-500 bg-rose-500/5' : ''}
                active:scale-[0.98]
              `}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors 
                ${isSelected ? 'bg-indigo-500 text-white' : shapeColors[i % shapeColors.length]}`}>
                <ShapeIcon size={18} fill="currentColor" strokeWidth={3} />
              </div>
              
              <span className={`flex-1 text-sm md:text-base font-semibold leading-tight ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                {opt.text}
              </span>
              
              {isSelected && !answered && (
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
              
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