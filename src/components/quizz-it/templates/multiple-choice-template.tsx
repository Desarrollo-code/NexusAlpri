'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Timer, Circle, Square, Triangle, Diamond } from 'lucide-react';
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
const gradients = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500'
];

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
  showFeedback = true
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [time, setTime] = useState(30);

  // Resetear estado cuando cambia la pregunta
  useEffect(() => {
    setSelected(selectedOptionId ?? null);
    setAnswered(!!selectedOptionId);
    setTime(30);
  }, [question.id, selectedOptionId]);

  // Manejar tiempo agotado
  const handleTimeUp = useCallback(() => {
    if (!answered) {
      setAnswered(true);
      onTimeUp();
    }
  }, [answered, onTimeUp]);

  // Timer countdown
  useEffect(() => {
    if (answered || time <= 0) {
      if (time <= 0) handleTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time, answered, handleTimeUp]);

  // Manejar selección de opción
  const handleSelect = (opt: Option) => {
    if (answered) return;
    setSelected(opt.id);
    setAnswered(true);
    onSubmit(opt.isCorrect, { answer: opt.id });
  };

  // Calcular progreso y color del timer
  const progress = (time / 30) * 100;
  const timeColor = time > 20 
    ? 'from-emerald-500 to-teal-500' 
    : time > 10 
    ? 'from-amber-500 to-orange-500' 
    : 'from-rose-500 to-pink-500';

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      {/* ====================================================================
          HEADER CON PROGRESO Y TIMER
          ==================================================================== */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Indicador de pregunta actual */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-full">
              Pregunta {questionNumber} de {totalQuestions}
            </span>
            <div className="h-2 w-20 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Timer animado */}
          <motion.div 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${timeColor} text-white shadow-lg`}
            animate={{ scale: time <= 5 && !answered ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: time <= 5 && !answered ? Infinity : 0, duration: 0.5 }}
          >
            <Timer size={18} />
            <span>{time}s</span>
          </motion.div>
        </div>

        {/* Barra de tiempo visual */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full bg-gradient-to-r ${timeColor}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* ====================================================================
          TARJETA DE PREGUNTA
          ==================================================================== */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-8 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl border-2 border-purple-100 shadow-xl"
      >
        <div className="text-slate-800 text-base md:text-xl font-bold text-center leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: question.text }} />
        </div>
      </motion.div>

      {/* ====================================================================
          GRID DE OPCIONES
          ==================================================================== */}
      <div className="grid gap-3 md:gap-4">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const gradient = gradients[i % gradients.length];
          const isSelected = selected === opt.id;
          const isCorrect = opt.isCorrect;

          // Determinar estilos según el estado
          let cardStyles = "bg-white border-slate-200 hover:border-purple-300 hover:shadow-lg hover:scale-[1.02]";
          let iconBg = "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600";
          
          if (answered) {
            if (isCorrect) {
              cardStyles = "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 ring-2 ring-emerald-200 shadow-emerald-200/50";
              iconBg = "bg-gradient-to-br from-emerald-500 to-teal-500 text-white";
            } else if (isSelected) {
              cardStyles = "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-400 ring-2 ring-rose-200 shadow-rose-200/50";
              iconBg = "bg-gradient-to-br from-rose-500 to-pink-500 text-white";
            } else {
              cardStyles = "bg-slate-50 border-slate-200 opacity-50";
            }
          }

          return (
            <motion.button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={!answered ? { scale: 1.02 } : {}}
              whileTap={!answered ? { scale: 0.98 } : {}}
              className={`group relative flex items-center gap-4 p-4 md:p-5 rounded-xl border-2 transition-all duration-300 ${cardStyles} ${!answered && 'cursor-pointer active:translate-y-0.5'}`}
            >
              {/* Icono con forma geométrica */}
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-300 ${iconBg}`}>
                <ShapeIcon size={24} fill="currentColor" className="drop-shadow-sm" />
              </div>

              {/* Texto de la opción */}
              <div className="flex-1 text-left">
                <div 
                  className="text-slate-800 font-semibold text-sm md:text-base leading-snug break-words"
                  dangerouslySetInnerHTML={{ __html: opt.text }}
                />
              </div>

              {/* Feedback visual (correcto/incorrecto) */}
              {answered && showFeedback && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  {isCorrect && (
                    <div className="bg-emerald-500 p-1.5 rounded-full shadow-lg">
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                  {isSelected && !isCorrect && (
                    <div className="bg-rose-500 p-1.5 rounded-full shadow-lg">
                      <X className="h-4 w-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}