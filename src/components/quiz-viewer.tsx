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
  const stripHtml = (html: string) => 
    html.replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
  
  return (
    <div className="space-y-4 p-4 md:p-6 max-w-full">
      <header className="text-center space-y-2 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl shadow-sm">
        <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Resumen de respuestas</h3>
        <p className="text-sm text-slate-500">Revisa antes de enviar.</p>
      </header>
      
      <div className="max-h-48 md:max-h-64 lg:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {questions.map((q: any, idx: number) => {
          const answer = answers[q.id];
          const selected = q.options.find((o: any) => o.id === answer?.answerId);
          return (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full mb-2 inline-block">
                    P{idx + 1}
                  </span>
                  <p className="text-sm md:text-base text-slate-800 leading-relaxed break-words overflow-wrap-anywhere max-w-full line-clamp-3">
                    {stripHtml(q.text)}
                  </p>
                </div>
                
                <div className="flex items-start gap-2 min-w-0 flex-1 lg:flex-none lg:w-48">
                  <span className="text-xs md:text-sm text-slate-700 bg-slate-100 px-3 py-2 rounded-xl flex-1 min-h-[36px] flex items-center break-words overflow-hidden max-w-full line-clamp-2">
                    {selected ? stripHtml(selected.text) : 'Sin responder'}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 text-xs whitespace-normal flex-shrink-0 min-w-[60px]"
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
        className="w-full h-12 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Calculando...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 md:p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh]"
        >
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {state === 'intro' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <PlayCircle className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight break-words px-4">
                  {quiz?.title}
                </h2>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-sm break-words">
                  {quiz?.description}
                </p>
                {!isEnrolled && !isCreatorPreview && (
                  <Alert variant="destructive" className="max-w-sm w-full">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle className="text-sm">No estás inscrito en este curso</AlertTitle>
                  </Alert>
                )}
                <Button 
                  className="w-full max-w-sm h-12 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:shadow-xl transition-all"
                  onClick={() => setState('playing')}
                >
                  Comenzar quiz
                </Button>
              </div>
            )}

            {state === 'playing' && question && (
              <>
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-4 md:p-6 lg:p-8">
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 pr-1 -mr-1">
                    <MultipleChoiceTemplate
                      question={question}
                      onSubmit={handleAnswerSubmit}
                      onTimeUp={() => handleAnswerSubmit(false, { answer: '', timedOut: true })}
                      questionNumber={index + 1}
                      totalQuestions={quiz?.questions.length || 0}
                      selectedOptionId={answers[question.id]?.answerId}
                    />
                  </div>
                </div>
                
                <footer className="border-t bg-slate-50/50 p-4 md:px-6 border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      className="h-11 px-4 text-sm flex-1 sm:flex-none sm:w-auto whitespace-nowrap"
                      onClick={() => setIndex(i => i - 1)}
                    >
                      <ChevronLeft className="mr-1.5 h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-1 sm:justify-end">
                      {index < (quiz?.questions.length || 0) - 1 ? (
                        <Button 
                          className="h-11 px-6 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:shadow-md flex-1 sm:flex-none whitespace-nowrap" 
                          onClick={() => setIndex(i => i + 1)}
                        >
                          Siguiente <ChevronRight className="ml-1.5 h-4 w-4 inline" />
                        </Button>
                      ) : (
                        <Button 
                          className="h-11 px-8 font-bold bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl shadow-lg hover:shadow-xl flex-1 sm:flex-none" 
                          onClick={() => setState('summary')}
                        >
                          Finalizar Quiz
                        </Button>
                      )}
                    </div>
                  </div>
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
              <div className="flex-1 flex flex-col p-6 md:p-8 lg:p-10 justify-center">
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
