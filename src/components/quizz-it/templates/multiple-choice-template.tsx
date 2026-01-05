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
  question, onSubmit, onTimeUp, questionNumber, totalQuestions, selectedOptionId, answeredExternally = false
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
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Header con Progreso */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter mb-1">Pregunta {questionNumber} / {totalQuestions}</p>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-500" 
              initial={{ width: 0 }}
              animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs shrink-0 ${time < 10 ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-zinc-400 border-zinc-800'}`}>
          <Timer size={14} className={time < 10 ? 'animate-pulse' : ''} />
          <span>{time}s</span>
        </div>
      </div>

      {/* Pregunta con renderizado HTML */}
      <div className="py-2">
        <div 
          className="text-lg md:text-xl font-bold text-white leading-snug break-words" 
          dangerouslySetInnerHTML={{ __html: question.text }} 
        />
      </div>

      {/* Grid de Opciones corregido */}
      <div className="grid grid-cols-1 gap-2.5">
        {question.options.map((opt: any, i: number) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;
          
          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`group w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all text-left overflow-hidden
                ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}
                ${answered && opt.isCorrect ? 'border-emerald-500 bg-emerald-500/10' : ''}
                ${answered && isSelected && !opt.isCorrect ? 'border-rose-500 bg-rose-500/10' : ''}
              `}
            >
              {/* Icono - Centrado arriba en textos largos */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors 
                ${isSelected ? 'bg-indigo-500 text-white' : shapeColors[i % shapeColors.length]}`}>
                <ShapeIcon size={16} fill="currentColor" />
              </div>
              
              {/* Texto de la opción - Con salto de línea forzado */}
              <div className="flex-1 min-w-0 py-1">
                <div 
                  className={`text-sm md:text-base font-semibold leading-relaxed break-words whitespace-normal
                    ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}
                    [&>p]:m-0 [&>p]:inline`} // Limpia márgenes de los <p> inyectados
                  dangerouslySetInnerHTML={{ __html: opt.text }} 
                />
              </div>
              
              {/* Checkmark final */}
              {answered && opt.isCorrect && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 self-center" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}