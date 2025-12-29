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

const SummaryView = ({ questions, answers, onNavigate, onSubmit, isSubmitting }: any) => {
  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  
  return (
    <div className="space-y-4 p-3 md:p-4">
      <header className="text-center space-y-1 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg">
        <h3 className="text-lg md:text-xl font-bold text-slate-900">Resumen de respuestas</h3>
        <p className="text-xs text-slate-500">Revisa antes de enviar.</p>
      </header>
      
      <div className="max-h-40 md:max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
        {questions.map((q: any, idx: number) => {
          const answer = answers[q.id];
          const selected = q.options.find((o: any) => o.id === answer?.answerId);
          return (
            <Card key={q.id} className="hover:shadow-sm">
              <CardContent className="p-3 flex flex-col lg:flex-row gap-2 break-words">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-1 py-0.5 rounded mb-1 inline-block">
                    P{idx + 1}
                  </span>
                  <p className="text-xs md:text-sm text-slate-800 leading-tight break-words max-w-full">
                    {stripHtml(q.text)}
                  </p>
                </div>
                
                <div className="flex items-start gap-2 min-w-0 flex-1 lg:flex-none">
                  <span className="text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded-lg flex-1 break-words min-h-[28px] flex items-center">
                    {selected ? stripHtml(selected.text) : 'Sin responder'}
                  </span>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    className="h-8 px-2 text-xs whitespace-nowrap flex-shrink-0"
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
        className="w-full h-10 text-xs font-bold rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-md"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Calculando...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Enviar quiz
          </>
        )}
      </Button>
    </div>
  );
};

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur p-1 md:p-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        >
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {state === 'intro' && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-3">
                <PlayCircle className="h-10 w-10 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                  {quiz?.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-600 max-w-xs">
                  {quiz?.description}
                </p>
                {!isEnrolled && !isCreatorPreview && (
                  <Alert variant="destructive" className="max-w-xs">
                    <ShieldAlert className="h-3 w-3" />
                    <AlertTitle>No estás inscrito</AlertTitle>
                  </Alert>
                )}
                <Button 
                  className="w-full max-w-xs h-10 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90"
                  onClick={() => setState('playing')}
                >
                  Comenzar quiz
                </Button>
              </div>
            )}

            {state === 'playing' && question && (
              <>
                <div className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-thin scrollbar-thumb-slate-300">
                  <MultipleChoiceTemplate
                    question={question}
                    onSubmit={handleAnswerSubmit}
                    onTimeUp={() => handleAnswerSubmit(false, { answer: '', timedOut: true })}
                    questionNumber={index + 1}
                    totalQuestions={quiz?.questions.length || 0}
                    selectedOptionId={answers[question.id]?.answerId}
                  />
                </div>
                
                <footer className="border-t p-3 flex justify-between items-center gap-1 bg-slate-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    className="h-8 px-3 text-xs"
                    onClick={() => setIndex(i => i - 1)}
                  >
                    <ChevronLeft className="mr-0.5 h-3 w-3" />
                    Anterior
                  </Button>
                  
                  {index < (quiz?.questions.length || 0) - 1 ? (
                    <Button className="h-8 px-4 text-xs font-medium bg-primary text-white rounded-lg" onClick={() => setIndex(i => i + 1)}>
                      Siguiente <ChevronRight className="ml-0.5 h-3 w-3" />
                    </Button>
                  ) : (
                    <Button className="h-8 px-4 font-bold bg-primary text-white rounded-lg" onClick={() => setState('summary')}>
                      Finalizar
                    </Button>
                  )}
                </footer>
              </>
            )}

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

            {state === 'finished' && (
              <div className="flex-1 flex flex-col p-4 md:p-6">
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