'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Timer, Circle, Square, Triangle, Diamond } from 'lucide-react';

const shapes = [Circle, Square, Triangle, Diamond];
const gradients = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600'
];

export function MultipleChoiceTemplate({
  question,
  onSubmit,
  onTimeUp,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  showFeedback = true
}: any) {
  const [selected, setSelected] = useState<string | null>(
    selectedOptionId ?? null
  );
  const [answered, setAnswered] = useState(!!selectedOptionId);
  const [time, setTime] = useState(20);

  const correct = question.options.find(
    (o: any) => o.isCorrect
  );

  useEffect(() => {
    if (answered) return;
    if (time === 0) {
      onTimeUp();
      return;
    }
    const timer = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [time, answered, onTimeUp]);

  return (
    <div className="space-y-5">
      <header className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-500">
          Pregunta {questionNumber} / {totalQuestions}
        </span>

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold
          ${
            time <= 5
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Timer size={16} />
          {time}s
        </div>
      </header>

      {/* QUESTION (HTML RENDER) */}
      <div className="p-4 bg-slate-50 rounded-xl border prose prose-sm max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: question.text }}
        />
      </div>

      {/* OPTIONS */}
      <div className="grid gap-3 md:grid-cols-2">
        {question.options.map((opt: any, i: number) => {
          const Shape = shapes[i % shapes.length];
          const gradient = gradients[i % gradients.length];
          const isSelected = selected === opt.id;
          const isCorrect = correct?.id === opt.id;

          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => {
                setSelected(opt.id);
                setAnswered(true);
                onSubmit(opt.isCorrect, { answer: opt.id });
              }}
              className={`
                w-full flex items-start gap-4 p-4 rounded-xl border-2 transition
                min-h-[64px] h-auto
                ${
                  !answered
                    ? 'bg-white border-slate-200 hover:bg-slate-50'
                    : ''
                }
                ${
                  answered && isCorrect
                    ? 'border-emerald-500 bg-emerald-50'
                    : ''
                }
                ${
                  answered && isSelected && !isCorrect
                    ? 'border-rose-500 bg-rose-50'
                    : ''
                }
                ${
                  isSelected && !answered
                    ? 'border-primary bg-primary/5'
                    : ''
                }
              `}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${gradient}`}
              >
                <Shape size={18} />
              </div>

              <div className="flex-1 prose prose-sm max-w-none text-slate-700">
                <div
                  dangerouslySetInnerHTML={{ __html: opt.text }}
                />
              </div>

              {answered && showFeedback && (
                <div className="shrink-0 pt-1">
                  {isCorrect && (
                    <Check className="h-5 w-5 text-emerald-600" />
                  )}
                  {isSelected && !isCorrect && (
                    <X className="h-5 w-5 text-rose-600" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
