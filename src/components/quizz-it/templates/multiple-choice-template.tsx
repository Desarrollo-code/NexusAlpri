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
    <div className="space-y-4 w-full max-w-2xl mx-auto overflow-x-hidden px-3">
      {/* HEADER COMPACTO CON PROGRESO Y TIMER */}
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-bold text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full border border-purple-200 shadow-sm whitespace-nowrap">
            {questionNumber}/{totalQuestions}
          </span>

          <motion.div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${timeColor} text-white shadow-lg`}
            animate={{ scale: time <= 5 && !answered ? [1, 1.08, 1] : 1 }}
            transition={{ repeat: time <= 5 && !answered ? Infinity : 0, duration: 0.4 }}
          >
            <Timer size={14} />
            <span>{time}s</span>
          </motion.div>
        </div>

        <div className="h-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className={`h-full bg-gradient-to-r ${timeColor} shadow-sm`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* TARJETA DE PREGUNTA COMPACTA Y COLORIDA */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl shadow-xl text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        <div className="relative text-white text-base md:text-xl font-bold leading-snug break-words">
          <div
            className="max-w-full"
            dangerouslySetInnerHTML={{ __html: question.text || 'Nueva Pregunta' }}
          />
        </div>
      </motion.div>

      {/* GRID DE OPCIONES COMPACTO: 2 COLUMNAS */}
      <div className="grid grid-cols-2 gap-2.5">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;

          // Paleta de colores vibrantes para cada opción
          const colors = [
            { base: 'from-blue-500 to-cyan-500', hover: 'from-blue-600 to-cyan-600', ring: 'ring-blue-200' },
            { base: 'from-rose-500 to-pink-500', hover: 'from-rose-600 to-pink-600', ring: 'ring-rose-200' },
            { base: 'from-amber-500 to-orange-500', hover: 'from-amber-600 to-orange-600', ring: 'ring-amber-200' },
            { base: 'from-emerald-500 to-teal-500', hover: 'from-emerald-600 to-teal-600', ring: 'ring-emerald-200' }
          ];
          const color = colors[i % colors.length];

          let cardBase = 'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 h-full min-h-[100px] shadow-md';
          let cardStyles = `bg-gradient-to-br ${color.base} border-transparent text-white hover:shadow-lg hover:scale-[1.02]`;

          if (isSelected && !showFeedback) {
            cardStyles = `bg-gradient-to-br ${color.hover} border-white ring-4 ${color.ring} shadow-xl scale-[1.05]`;
          }

          if (answered && showFeedback) {
            if (opt.isCorrect) {
              cardStyles = 'bg-gradient-to-br from-emerald-500 to-green-500 border-white ring-4 ring-emerald-300 shadow-xl scale-[1.05]';
            } else if (isSelected) {
              cardStyles = 'bg-gradient-to-br from-rose-600 to-red-600 border-white ring-4 ring-rose-300 opacity-90';
            } else {
              cardStyles = `bg-gradient-to-br ${color.base} border-transparent text-white/70 opacity-60`;
            }
          }

          return (
            <motion.button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
              className={`${cardBase} ${cardStyles} ${!answered && 'cursor-pointer active:scale-95'}`}
            >
              {/* Icono geométrico compacto */}
              <div className="w-10 h-10 mb-2 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center transition-transform duration-300">
                <ShapeIcon size={20} fill="currentColor" className="opacity-90" />
              </div>

              {/* Texto de la opción */}
              <div className="w-full">
                <div
                  className="text-white font-bold text-xs md:text-sm leading-tight text-center break-words drop-shadow-sm"
                  dangerouslySetInnerHTML={{ __html: opt.text }}
                />
              </div>

              {/* Checkmark para respuesta correcta */}
              {answered && showFeedback && opt.isCorrect && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <span className="text-emerald-600 text-lg font-black">✓</span>
                </motion.div>
              )}

              {/* X para respuesta incorrecta */}
              {answered && showFeedback && !opt.isCorrect && isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <span className="text-rose-600 text-lg font-black">✕</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}