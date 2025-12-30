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
  showFeedback = false // Cambiado a FALSE para no "soplar" la respuesta durante el quiz
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [time, setTime] = useState(30);

  // 1. SOLUCIÓN AL ESTADO FANTASMA:
  // Forzamos el reset completo cada vez que el ID de la pregunta cambia.
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
    <div className="space-y-4 md:space-y-6 w-full max-w-4xl mx-auto">
      {/* HEADER CON PROGRESO Y TIMER */}
      <div className="space-y-3">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Pregunta {questionNumber} de {totalQuestions}
            </span>
          </div>
          
          <motion.div 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${timeColor} text-white shadow-md`}
            animate={{ scale: time <= 5 && !answered ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: time <= 5 && !answered ? Infinity : 0, duration: 0.5 }}
          >
            <Timer size={18} />
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
        className="p-6 md:p-8 bg-white rounded-2xl border-2 border-slate-100 shadow-sm"
      >
        <div className="text-slate-800 text-lg md:text-xl font-bold text-center leading-snug break-words">
          <div dangerouslySetInnerHTML={{ __html: question.text || "Nueva Pregunta" }} />
        </div>
      </motion.div>

      {/* GRID DE OPCIONES (CORREGIDO) */}
      <div className="grid gap-3">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;

          // 2. LÓGICA DE ESTILOS: Solo Morado para selección, no Verde/Rojo.
          let cardStyles = "bg-white border-slate-200 hover:border-purple-300";
          let iconBg = "bg-slate-100 text-slate-500";
          
          if (isSelected) {
            cardStyles = "bg-purple-50 border-purple-500 ring-2 ring-purple-100";
            iconBg = "bg-purple-500 text-white";
          }

          // Solo aplica feedback de colores si showFeedback es true explícitamente (ej: en el resumen)
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
              className={`group flex items-center gap-4 p-4 md:p-5 rounded-xl border-2 transition-all w-full text-left ${cardStyles} ${!answered && 'cursor-pointer'}`}
            >
              {/* Icono geométrico */}
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
                <ShapeIcon size={20} fill="currentColor" />
              </div>

              {/* 3. SOLUCIÓN AL SCROLL: flex-1 y break-words. */}
              <div className="flex-1 min-w-0">
                <div 
                  className="text-slate-700 font-semibold text-sm md:text-base leading-tight whitespace-normal break-words"
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