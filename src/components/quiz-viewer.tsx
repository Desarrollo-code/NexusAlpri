'use client';

import React, { useState, useCallback } from 'react';
import type { Quiz as AppQuiz } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, ShieldAlert, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
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

/* ===================== SUMMARY VIEW CORREGIDO ===================== */
const SummaryView = ({ questions, answers, onNavigate, onSubmit, isSubmitting }: any) => {
  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  
  return (
    <div className="space-y-6">
      <header className="text-center space-y-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Resumen de respuestas
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Revisa antes de enviar el quiz.
        </p>
      </header>
      
      <div className="max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {questions.map((q: any, idx: number) => {
          const answer = answers[q.id];
          const selected = q.options.find((o: any) => o.id === answer?.answerId);
          return (
            <Card key={q.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 flex flex-col lg:flex-row gap-6 break-words">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary inline-block bg-primary/10 px-2 py-1 rounded-full mb-3">
                    Pregunta {idx + 1}
                  </span>
                  <p className="text-base md:text-lg font-semibold text-slate-800 leading-relaxed overflow-wrap-anywhere hyphens-auto max-w-full mb-2">
                    {stripHtml(q.text)}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center min-w-0 flex-1 lg:flex-none">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 text-sm sm:text-base whitespace-normal break-words block bg-slate-50 p-3 rounded-xl min-h-[48px] flex items-center">
                      Respuesta: {selected ? stripHtml(selected.text) : 'Sin responder'}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="whitespace-nowrap flex-shrink-0 px-4 h-11 border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => onNavigate(idx)}
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting}
        className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl border-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/90 text-white hover:shadow-2xl transition-all duration-200"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isSubmitting ? 'Calculando...' : 'Enviar quiz'}
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Enviar quiz
          </>
        )}
      </Button>
    </div>
  );
};

/* ===================== QUIZ VIEWER PRINCIPAL ===================== */
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
    }), question);
  }, [question]);

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      let correct = 0;
      quiz?.questions.forEach((q: any) => {
        if (answers[q.id]?.isCorrect) correct++;
      });
      const percentage = correct / (quiz?.questions.length || 1) * 100;
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
      }
      
      onQuizCompleted?.(lessonId, percentage);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] min-h-[70vh]"
        >
          {/* CONTENIDO PRINCIPAL CON SCROLL MEJORADO */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {state === 'intro' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6">
                <PlayCircle className="mx-auto h-16 w-16 text-primary animate-bounce" />
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-primary to-slate-900 bg-clip-text text-transparent leading-tight">
                  {quiz?.title}
                </h2>
                <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                  {quiz?.description}
                </p>
                
                {!isEnrolled && !isCreatorPreview ? (
                  <Alert variant="destructive" className="max-w-md mx-auto">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>No estás inscrito</AlertTitle>
                  </Alert>
                ) : null}
                
                <Button 
                  size="lg" 
                  className="w-full max-w-xs mx-auto h-14 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/90 shadow-xl hover:shadow-2xl px-8 font-bold rounded-2xl"
                  onClick={() => setState('playing')}
                >
                  Comenzar quiz
                </Button>
              </div>
            )}

            {state === 'playing' && question && (
              <>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  <MultipleChoiceTemplate
                    question={question}
                    onSubmit={handleAnswerSubmit}
                    onTimeUp={() => handleAnswerSubmit(false, { answer: '', timedOut: true })}
                    questionNumber={index + 1}
                    totalQuestions={quiz?.questions.length || 0}
                    selectedOptionId={answers[question.id]?.answerId}
                  />
                </div>
                
                {/* FOOTER DE NAVEGACIÓN */}
                <footer className="border-t bg-slate-50/50 p-6 flex justify-between items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    className="h-12 px-6 border-2 hover:border-slate-300"
                    onClick={() => setIndex(i => i - 1)}
                  >
                    <ChevronLeft className="mr-1 h-5 w-5" />
                    Anterior
                  </Button>
                  
                  {index < (quiz?.questions.length || 0) - 1 ? (
                    <Button
                      className="h-12 px-8 font-semibold border-2 bg-primary/90 hover:bg-primary text-white rounded-xl"
                      onClick={() => setIndex(i => i + 1)}
                    >
                      Siguiente
                      <ChevronRight className="ml-1 h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      className="h-12 px-8 font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/90 text-white shadow-lg rounded-xl"
                      onClick={() => setState('summary')}
                    >
                      Finalizar
                    </Button>
                  )}
                </footer>
              </>
            )}

            {state === 'summary' && (
              <div className="flex-1 overflow-hidden flex flex-col p-0">
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
              </div>
            )}

            {state === 'finished' && (
              <div className="flex-1 flex flex-col p-8 md:p-12">
                <ResultScreenTemplate
                  score={score}
                  totalQuestions={quiz?.questions.length || 0}
                  formTitle={quiz?.title}
                  onRestart={() => setState('intro')}
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
