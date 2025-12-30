'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, ShieldAlert, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Target, Trophy, TrendingUp, Award, Sparkles } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MultipleChoiceTemplate } from './quizz-it/templates/multiple-choice-template';
import { AnimatePresence, motion } from 'framer-motion';
import type { Quiz as AppQuiz } from '@/types';

interface QuizViewerProps {
  quiz: AppQuiz | null | undefined;
  lessonId: string;
  courseId?: string;
  isEnrolled?: boolean | null;
  isCreatorPreview?: boolean;
  onQuizCompleted?: (lessonId: string, score: number) => void;
}

// ============================================================================
// UTILIDADES
// ============================================================================
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

// ============================================================================
// COMPONENTE: SUMMARY VIEW
// ============================================================================
const SummaryView = ({ 
  questions, 
  answers, 
  onNavigate, 
  onSubmit, 
  isSubmitting 
}: any) => {
  const allAnswered = questions.every((q: any) => answers[q.id]?.answerId);
  const answeredCount = questions.filter((q: any) => answers[q.id]?.answerId).length;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="text-center space-y-2 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
        <h3 className="text-xl md:text-2xl font-bold">📋 Resumen de Respuestas</h3>
        <p className="text-sm opacity-90">
          {answeredCount} de {questions.length} preguntas respondidas
        </p>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden max-w-xs mx-auto">
          <div 
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
        {questions.map((q: any, idx: number) => {
          const answer = answers[q.id];
          const selected = q.options.find((o: any) => o.id === answer?.answerId);
          const isAnswered = !!selected;

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`overflow-hidden transition-all hover:shadow-md ${!isAnswered ? 'border-2 border-rose-300 bg-rose-50/30' : 'border-emerald-200 bg-emerald-50/20'}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="inline-block text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full mb-2">
                        Pregunta {idx + 1}
                      </span>
                      <p className="text-sm text-slate-700 font-medium">
                        {stripHtml(q.text)}
                      </p>
                    </div>
                    {isAnswered ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 animate-pulse" />
                    )}
                  </div>

                  {isAnswered ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs text-emerald-800">
                        <strong>✓ Respuesta:</strong> {stripHtml(selected.text)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <p className="text-xs text-rose-800 font-medium">
                        ⚠️ Sin responder
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${!isAnswered ? 'bg-rose-100 border-rose-300 hover:bg-rose-200 text-rose-700 font-bold' : 'border-purple-200 hover:bg-purple-50'}`}
                    onClick={() => onNavigate(idx)}
                  >
                    {isAnswered ? '✏️ Editar respuesta' : '👉 ¡Responder ahora!'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Botón submit */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !allAnswered}
        className={`w-full h-12 text-base font-bold rounded-xl shadow-lg transition-all ${
          allAnswered
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-xl hover:scale-105 text-white'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Calculando resultado...
          </>
        ) : !allAnswered ? (
          <>
            <AlertTriangle className="mr-2 h-5 w-5" />
            Completa todas las preguntas
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Enviar Quiz
          </>
        )}
      </Button>
    </div>
  );
};

// ============================================================================
// COMPONENTE: RESULT SCREEN
// ============================================================================
const ResultScreen = ({
  score,
  totalQuestions,
  formTitle,
  onRestart
}: any) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  let emoji = '🎉';
  let message = '¡Excelente trabajo!';
  let gradient = 'from-emerald-500 to-teal-500';
  
  if (percentage < 50) {
    emoji = '💪';
    message = '¡Sigue practicando!';
    gradient = 'from-rose-500 to-pink-500';
  } else if (percentage < 80) {
    emoji = '👏';
    message = '¡Buen esfuerzo!';
    gradient = 'from-amber-500 to-orange-500';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center space-y-6 p-6 md:p-8"
    >
      {/* Trofeo animado */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className={`w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}
      >
        <Trophy className="h-12 w-12 md:h-16 md:w-16 text-white" strokeWidth={2} />
      </motion.div>

      {/* Título */}
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800">
          {emoji} {message}
        </h2>
        {formTitle && (
          <p className="text-sm text-slate-500 font-medium">{formTitle}</p>
        )}
      </div>

      {/* Puntuación */}
      <div className={`p-6 md:p-8 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-2xl`}>
        <div className="text-6xl md:text-7xl font-black mb-2">
          {score}/{totalQuestions}
        </div>
        <div className="text-xl md:text-2xl font-bold opacity-90">
          {percentage}% correctas
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
          <Target className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-emerald-700">{score}</div>
          <div className="text-xs text-emerald-600">Correctas</div>
        </div>
        <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl">
          <TrendingUp className="h-6 w-6 text-rose-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-rose-700">{totalQuestions - score}</div>
          <div className="text-xs text-rose-600">Incorrectas</div>
        </div>
      </div>

      {/* Botón reintentar */}
      <Button
        onClick={onRestart}
        className="w-full max-w-xs h-12 text-base font-bold rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl hover:scale-105 transition-all text-white"
      >
        <Award className="mr-2 h-5 w-5" />
        Intentar de nuevo
      </Button>
    </motion.div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: QUIZ VIEWER
// ============================================================================
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
  
  const [state, setState] = useState<'intro' | 'playing' | 'summary' | 'finished'>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = quiz?.questions[index];

  const handleAnswerSubmit = useCallback((isCorrect: boolean, data: any) => {
    if (!question) return;
    setAnswers(prev => ({
      ...prev,
      [question.id]: { ...data, isCorrect, answerId: data.answer }
    }));
  }, [question]);

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      let correct = 0;
      quiz?.questions.forEach((q: any) => {
        if (answers[q.id]?.isCorrect) correct++;
      });
      const percentage = (correct / (quiz?.questions.length || 1)) * 100;
      setScore(correct);

      if (user && courseId && !isCreatorPreview) {
        await fetch(`/api/progress/${user.id}/${courseId}/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, quizId: quiz?.id, score: percentage })
        });
      }
      
      onQuizCompleted?.(lessonId, percentage);
      setState('finished');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setScore(0);
    setIndex(0);
    setState('intro');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-sm p-2 md:p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Intro Screen */}
          {state === 'intro' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
              >
                <PlayCircle className="h-10 w-10 md:h-12 md:w-12 text-white" />
              </motion.div>

              <div className="space-y-3">
                <h2 className="text-2xl md:text-4xl font-black text-slate-800">
                  {quiz?.title}
                </h2>
                <p className="text-sm md:text-base text-slate-600 max-w-md">
                  {quiz?.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Target className="h-4 w-4" />
                  <span>{quiz?.questions.length} preguntas</span>
                </div>
              </div>

              {!isEnrolled && !isCreatorPreview && (
                <Alert variant="destructive" className="max-w-md">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Acceso Restringido</AlertTitle>
                  <AlertDescription>
                    Debes inscribirte al curso para realizar este quiz
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => setState('playing')}
                className="w-full max-w-xs h-12 text-base font-bold rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl hover:scale-105 transition-all text-white"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Comenzar Quiz
              </Button>
            </div>
          )}

          {/* Playing Screen */}
          {state === 'playing' && question && (
            <>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
                <MultipleChoiceTemplate
                  question={question}
                  onSubmit={handleAnswerSubmit}
                  onTimeUp={() => handleAnswerSubmit(false, { answer: '', timedOut: true })}
                  questionNumber={index + 1}
                  totalQuestions={quiz?.questions.length || 0}
                  selectedOptionId={answers[question.id]?.answerId}
                />
              </div>

              {/* Footer de navegación */}
              <div className="border-t bg-slate-50 p-4 flex justify-between items-center gap-3">
                <Button
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => setIndex(i => i - 1)}
                  className="h-10 px-4 rounded-lg border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>

                {index < (quiz?.questions.length || 0) - 1 ? (
                  <Button
                    onClick={() => setIndex(i => i + 1)}
                    className="h-10 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg text-white font-bold"
                  >
                    Siguiente
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setState('summary')}
                    className="h-10 px-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg text-white font-bold"
                  >
                    Finalizar
                    <CheckCircle2 className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Summary Screen */}
          {state === 'summary' && (
            <SummaryView
              questions={quiz?.questions || []}
              answers={answers}
              onNavigate={(i: number) => {
                setIndex(i);
                setState('playing');
              }}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Result Screen */}
          {state === 'finished' && (
            <ResultScreen
              score={score}
              totalQuestions={quiz?.questions.length || 0}
              formTitle={quiz?.title}
              onRestart={handleRestart}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}