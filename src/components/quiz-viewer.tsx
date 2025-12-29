'use client';

import React, { useState, useCallback } from 'react';
import type { Quiz as AppQuiz } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  PlayCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MultipleChoiceTemplate } from './quizz-it/templates/multiple-choice-template';
import { ResultScreenTemplate } from './quizz-it/templates/result-screen-template';
import { AnimatePresence, motion } from 'framer-motion';

interface QuizViewerProps {
  quiz: AppQuiz | null | undefined;
  lessonId: string;
  courseId?: string;
  isEnrolled?: boolean | null;
  isCreatorPreview?: boolean;
  onQuizCompleted?: (lessonId: string, score: number) => void;
}

/* ===================== SUMMARY ===================== */
const SummaryView = ({
  questions,
  answers,
  onNavigate,
  onSubmit,
  isSubmitting
}: any) => {
  const stripHtml = (html: string) =>
    html.replace(/<[^>]+>/g, '');

  return (
    <div className="space-y-6">
      <header className="text-center space-y-2">
        <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">
          Resumen de respuestas
        </h3>
        <p className="text-sm text-slate-500">
          Revisa antes de enviar el quiz.
        </p>
      </header>

      <div className="grid gap-3 max-h-[55vh] overflow-y-auto pr-2">
        {questions.map((q: any, idx: number) => {
          const answer = answers[q.id];
          const selected = q.options.find(
            (o: any) => o.id === answer?.answerId
          );

          return (
            <Card key={q.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <span className="text-xs font-bold text-primary">
                    Pregunta {idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {stripHtml(q.text)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Respuesta:{' '}
                    <span className="font-medium text-slate-700">
                      {selected
                        ? stripHtml(selected.text)
                        : 'Sin responder'}
                    </span>
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate(idx)}
                >
                  Editar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-11 font-bold rounded-xl"
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2" />
        )}
        {isSubmitting ? 'Calculando…' : 'Enviar quiz'}
      </Button>
    </div>
  );
};

/* ===================== VIEWER ===================== */
export function QuizViewer({
  quiz,
  lessonId,
  courseId,
  isEnrolled,
  isCreatorPreview = false,
  onQuizCompleted
}: QuizViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [state, setState] =
    useState<'intro' | 'playing' | 'summary' | 'finished'>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = quiz?.questions[index];

  const handleAnswerSubmit = useCallback(
    (isCorrect: boolean, data: any) => {
      if (!question) return;
      setAnswers(prev => ({
        ...prev,
        [question.id]: {
          ...data,
          isCorrect,
          answerId: data.answer
        }
      }));
    },
    [question]
  );

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      let correct = 0;
      quiz?.questions.forEach(q => {
        if (answers[q.id]?.isCorrect) correct++;
      });

      const percentage =
        (correct / (quiz?.questions.length || 1)) * 100;

      setScore(correct);

      if (user && courseId && !isCreatorPreview) {
        await fetch(`/api/progress/${user.id}/${courseId}/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            quizId: quiz?.id,
            score: percentage
          })
        });

        onQuizCompleted?.(lessonId, percentage);
      }

      setState('finished');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={state + index}
          className="w-full max-w-3xl bg-white rounded-3xl shadow-xl flex flex-col max-h-[95vh]"
        >
          <div className="flex-1 overflow-y-auto p-5 md:p-8">
            {state === 'intro' && (
              <div className="text-center space-y-4">
                <PlayCircle className="mx-auto h-10 w-10 text-primary" />
                <h2 className="text-2xl font-black">
                  {quiz?.title}
                </h2>

                {!isEnrolled && !isCreatorPreview ? (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>No estás inscrito</AlertTitle>
                  </Alert>
                ) : (
                  <Button
                    size="lg"
                    className="w-full max-w-xs mx-auto"
                    onClick={() => setState('playing')}
                  >
                    Comenzar quiz
                  </Button>
                )}
              </div>
            )}

            {state === 'playing' && question && (
              <MultipleChoiceTemplate
                question={question}
                onSubmit={handleAnswerSubmit}
                onTimeUp={() =>
                  handleAnswerSubmit(false, { timedOut: true })
                }
                questionNumber={index + 1}
                totalQuestions={quiz?.questions.length || 0}
                selectedOptionId={answers[question.id]?.answerId}
              />
            )}

            {state === 'summary' && (
              <SummaryView
                questions={quiz?.questions}
                answers={answers}
                onNavigate={(i: number) => {
                  setIndex(i);
                  setState('playing');
                }}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            {state === 'finished' && (
              <ResultScreenTemplate
                score={score}
                totalQuestions={quiz?.questions.length || 0}
                formTitle={quiz?.title || ''}
                onRestart={() => setState('intro')}
              />
            )}
          </div>

          {state === 'playing' && (
            <footer className="border-t p-4 flex justify-between items-center">
              <Button
                variant="ghost"
                disabled={index === 0}
                onClick={() => setIndex(i => i - 1)}
              >
                <ChevronLeft className="mr-1" />
                Anterior
              </Button>

              {index < (quiz?.questions.length || 0) - 1 ? (
                <Button onClick={() => setIndex(i => i + 1)}>
                  Siguiente
                  <ChevronRight className="ml-1" />
                </Button>
              ) : (
                <Button onClick={() => setState('summary')}>
                  Finalizar
                </Button>
              )}
            </footer>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
