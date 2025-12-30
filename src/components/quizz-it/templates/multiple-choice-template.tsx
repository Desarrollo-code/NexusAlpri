'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Circle, Square, Triangle, Diamond } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================================
// TIPOS
// ============================================================================
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

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const shapes = [Circle, Square, Triangle, Diamond];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function MultipleChoiceTemplate({
  question,
  onSubmit,
  onTimeUp,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  showFeedback = false 
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [time, setTime] = useState(30);

  // Reset de estado cuando cambia la pregunta
  useEffect(() => {
    setSelected(selectedOptionId ?? null);
    setAnswered(!!selectedOptionId);
    setTime(30);
  }, [question.id, selectedOptionId]);

  const handleTimeUp = useCallback(() => {
    if (!answered) {
      setAnswered(true);
      onTimeUp();
    }
  }, [answered, onTimeUp]);

  useEffect(() => {
    if (answered || time <= 0) {
      if (time <= 0) handleTimeUp();
      return;
    }
    const timer = setInterval(() => setTime(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [time, answered, handleTimeUp]);

  const handleSelect = (opt: Option) => {
    if (answered) return;
    setSelected(opt.id);
    setAnswered(true);
    onSubmit(opt.isCorrect, { answer: opt.id });
  };

  const progress = (time / 30) * 100;
  const timeColor = time > 20 
    ? 'from-emerald-500 to-teal-500' 
    : time > 10 
    ? 'from-amber-500 to-orange-500' 
    : 'from-rose-500 to-pink-500';

  return (
    /* SOLUCIÓN RESPONSIVA: 
       - overflow-x-hidden evita fugas de scroll.
       - px-4 asegura que el contenido no toque los bordes del móvil.
    */
    <div className="space-y-4 md:space-y-6 w-full max-w-4xl mx-auto overflow-x-hidden px-4 md:px-0">
      
      {/* HEADER CON PROGRESO Y TIMER */}
      <div className="space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center">
            <span className="text-[10px] md:text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap">
              Pregunta {questionNumber} de {totalQuestions}
            </span>
          </div>
          
          <motion.div 
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold bg-gradient-to-r ${timeColor} text-white shadow-md`}
            animate={{ scale: time <= 5 && !answered ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: time <= 5 && !answered ? Infinity : 0, duration: 0.5 }}
          >
            <Timer size={16} className="md:w-[18px]" />
            <span>{time}s</span>
          </motion.div>
        </div>

        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full bg-gradient-to-r ${timeColor}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* TARJETA DE PREGUNTA */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 md:p-8 bg-white rounded-2xl border-2 border-slate-100 shadow-sm"
      >
        <div className="text-slate-800 text-base md:text-xl font-bold text-center leading-snug break-words">
          <div 
            className="max-w-full overflow-hidden" 
            dangerouslySetInnerHTML={{ __html: question.text || "Nueva Pregunta" }} 
          />
        </div>
      </motion.div>

      {/* GRID DE OPCIONES */}
      <div className="grid gap-3 w-full">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;

          let cardStyles = "bg-white border-slate-200 hover:border-purple-300";
          let iconBg = "bg-slate-100 text-slate-500";
          
          if (isSelected) {
            cardStyles = "bg-purple-50 border-purple-500 ring-2 ring-purple-100";
            iconBg = "bg-purple-500 text-white";
          }

          if (answered && showFeedback) {
            if (opt.isCorrect) {
              cardStyles = "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-100";
              iconBg = "bg-emerald-500 text-white";
            } else if (isSelected) {
              cardStyles = "bg-rose-50 border-rose-400 ring-2 ring-rose-100";
              iconBg = "bg-rose-500 text-white";
            }
          }

          return (
            <motion.button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              /* flex-row y gap-3 para que en móvil los elementos no se amontonen */
              className={`group flex items-center gap-3 p-3 md:p-5 rounded-xl border-2 transition-all w-full text-left ${cardStyles} ${!answered && 'cursor-pointer'}`}
            >
              {/* Icono geométrico - Tamaño reducido en móvil */}
              <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
                <ShapeIcon size={18} className="md:w-[20px]" fill="currentColor" />
              </div>

              {/* Contenedor de texto - min-w-0 es vital para break-words en Flexbox */}
              <div className="flex-1 min-w-0">
                <div 
                  className="text-slate-700 font-semibold text-xs md:text-base leading-tight whitespace-normal break-words"
                  dangerouslySetInnerHTML={{ __html: opt.text }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}