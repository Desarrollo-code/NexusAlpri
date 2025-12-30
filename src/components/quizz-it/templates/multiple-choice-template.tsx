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
    <div className="space-y-4 w-full max-w-3xl mx-auto overflow-x-hidden px-3 py-4">
      {/* HEADER COMPACTO CON PROGRESO Y TIMER */}
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-bold text-purple-400 bg-purple-950/50 px-3 py-1 rounded-full border border-purple-800 shadow-sm whitespace-nowrap">
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

        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className={`h-full bg-gradient-to-r ${timeColor} shadow-sm`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* TARJETA DE PREGUNTA CON FONDO NEGRO */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 md:p-6 bg-black rounded-2xl shadow-xl border border-zinc-700 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10 pointer-events-none" />
        <div className="relative text-white text-base md:text-xl font-bold leading-snug break-words">
          <div
            className="max-w-full"
            dangerouslySetInnerHTML={{ __html: question.text || 'Nueva Pregunta' }}
          />
        </div>
      </motion.div>

      {/* OPCIONES - DISEÑO RESPONSIVO: 1 columna en móvil, 2 en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;

          // Paleta de colores para iconos
          const colors = [
            { icon: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-950/30', selected: 'border-blue-400 bg-blue-950/50', correct: 'border-emerald-400 bg-emerald-950/50', wrong: 'border-rose-400 bg-rose-950/50' },
            { icon: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-950/30', selected: 'border-rose-400 bg-rose-950/50', correct: 'border-emerald-400 bg-emerald-950/50', wrong: 'border-rose-400 bg-rose-950/50' },
            { icon: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/30', selected: 'border-amber-400 bg-amber-950/50', correct: 'border-emerald-400 bg-emerald-950/50', wrong: 'border-rose-400 bg-rose-950/50' },
            { icon: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/30', selected: 'border-emerald-400 bg-emerald-950/50', correct: 'border-emerald-400 bg-emerald-950/50', wrong: 'border-rose-400 bg-rose-950/50' }
          ];
          const color = colors[i % colors.length];

          let cardBase = 'relative flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 transition-all duration-200 bg-zinc-900';
          let cardStyles = `${color.border} ${color.bg} hover:${color.selected} hover:shadow-lg`;
          let iconColor = color.icon;
          let textColor = 'text-white';

          if (isSelected && !showFeedback) {
            cardStyles = `${color.selected} shadow-lg ring-2 ring-purple-500/50`;
          }

          if (answered && showFeedback) {
            if (opt.isCorrect) {
              cardStyles = `${color.correct} shadow-lg ring-2 ring-emerald-500/50`;
              iconColor = 'text-emerald-400';
            } else if (isSelected) {
              cardStyles = `${color.wrong} opacity-80 ring-2 ring-rose-500/50`;
              iconColor = 'text-rose-400';
            } else {
              cardStyles = `${color.border} ${color.bg} opacity-50`;
              textColor = 'text-white/50';
            }
          }

          return (
            <motion.button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
              className={`${cardBase} ${cardStyles} ${!answered && 'cursor-pointer active:scale-[0.98]'} text-left`}
            >
              {/* Icono geométrico a la izquierda */}
              <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-zinc-800/50 flex items-center justify-center ${iconColor} transition-colors duration-300`}>
                <ShapeIcon size={24} fill="currentColor" className="opacity-90" />
              </div>

              {/* Texto de la opción */}
              <div className="flex-1 min-w-0">
                <div
                  className={`${textColor} font-semibold text-sm md:text-base leading-snug break-words`}
                  dangerouslySetInnerHTML={{ __html: opt.text }}
                />
              </div>

              {/* Checkmark para respuesta correcta */}
              {answered && showFeedback && opt.isCorrect && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center"
                >
                  <span className="text-white text-sm font-black">✓</span>
                </motion.div>
              )}

              {/* X para respuesta incorrecta */}
              {answered && showFeedback && !opt.isCorrect && isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="flex-shrink-0 w-6 h-6 bg-rose-500 rounded-full shadow-lg flex items-center justify-center"
                >
                  <span className="text-white text-sm font-black">✕</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}