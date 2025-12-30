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
    <div className="space-y-6 md:space-y-8 w-full max-w-4xl mx-auto overflow-x-hidden px-4 md:px-0">
      
      {/* HEADER CON PROGRESO Y TIMER */}
      <div className="space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center">
            <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
              Pregunta {questionNumber} de {totalQuestions}
            </span>
          </div>
          
          <motion.div 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${timeColor} text-white shadow-lg shadow-opacity-20`}
            animate={{ scale: time <= 5 && !answered ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: time <= 5 && !answered ? Infinity : 0, duration: 0.5 }}
          >
            <Timer size={18} />
            <span>{time}s</span>
          </motion.div>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className={`h-full bg-gradient-to-r ${timeColor}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* TARJETA DE PREGUNTA */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 md:p-10 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 text-center"
      >
        <div className="text-slate-800 text-lg md:text-2xl font-bold leading-snug break-words">
          <div 
            className="max-w-full"
            dangerouslySetInnerHTML={{ __html: question.text || "Nueva Pregunta" }} 
          />
        </div>
      </motion.div>

      {/* GRID DE OPCIONES: AHORA 2 COLUMNAS (sm:grid-cols-2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
        {question.options.map((opt, i) => {
          const ShapeIcon = shapes[i % shapes.length];
          const isSelected = selected === opt.id;

          // Lógica de estilos mejorada para tarjetas
          let cardBase = "relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all duration-200 h-full min-h-[120px] md:min-h-[160px] shadow-sm hover:shadow-md";
          let cardStyles = "bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/30";
          let iconBg = "bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600";
          
          if (isSelected) {
            cardStyles = "bg-purple-600 border-purple-600 ring-4 ring-purple-100 shadow-lg scale-[1.02]";
            iconBg = "bg-white/20 text-white";
          }

          if (answered && showFeedback) {
            if (opt.isCorrect) {
              cardStyles = "bg-emerald-50 border-emerald-400 ring-4 ring-emerald-100 shadow-lg";
              iconBg = "bg-emerald-500 text-white";
            } else if (isSelected) {
              cardStyles = "bg-rose-50 border-rose-400 ring-4 ring-rose-100 opacity-90";
              iconBg = "bg-rose-500 text-white";
            }
          }

          return (
            <motion.button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${cardBase} ${cardStyles} ${!answered && 'cursor-pointer active:scale-[0.98]'}`}
            >
              {/* Icono geométrico grande y centrado */}
              <div className={`w-12 h-12 md:w-16 md:h-16 mb-3 rounded-full flex items-center justify-center transition-colors duration-300 ${iconBg}`}>
                <ShapeIcon size={24} md:size={32} fill="currentColor" className="opacity-90" />
              </div>

              {/* Texto de la opción */}
              <div className="w-full">
                <div 
                  className="text-slate-700 font-bold text-sm md:text-lg leading-tight text-center break-words"
                  dangerouslySetInnerHTML={{ __html: opt.text }}
                />
              </div>
              
              {/* Indicador visual de selección/check (opcional, sutil) */}
              {isSelected && !showFeedback && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-sm"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}