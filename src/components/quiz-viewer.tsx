'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, ShieldAlert, ChevronLeft, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export function QuizViewer({ quiz, lessonId, courseId, isEnrolled, isCreatorPreview = false, onQuizCompleted }: QuizViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<'intro' | 'playing' | 'summary' | 'finished'>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSubmit = useCallback((isCorrect: boolean, data: any) => {
    setAnswers(prev => ({ ...prev, [quiz!.questions[index].id]: { ...data, isCorrect, answerId: data.answer } }));
  }, [index, quiz]);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      let correct = quiz?.questions.reduce((acc, q) => (answers[q.id]?.isCorrect ? acc + 1 : acc), 0) || 0;
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
    } catch (e) {
      toast({ title: "Error", description: "Ocurrió un error al guardar", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 md:p-4">
      <motion.div 
        layout
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <PlayCircle className="text-indigo-500 h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{quiz?.title}</h2>
              <p className="text-zinc-500 text-sm mb-8">{quiz?.description}</p>
              
              {!isEnrolled && !isCreatorPreview ? (
                <Alert className="bg-rose-500/5 border-rose-500/20 text-rose-500 mb-6 py-2 px-4 rounded-xl">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription className="text-xs">Inscríbete para acceder al quiz</AlertDescription>
                </Alert>
              ) : (
                <Button onClick={() => setState('playing')} className="w-full h-14 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/10">
                  Comenzar Evaluación
                </Button>
              )}
            </motion.div>
          )}

          {state === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 p-5 md:p-8 overflow-y-auto custom-scrollbar">
                <MultipleChoiceTemplate 
                  question={quiz!.questions[index]} 
                  onSubmit={handleAnswerSubmit} 
                  onTimeUp={() => handleAnswerSubmit(false, { answer: '', timedOut: true })} 
                  questionNumber={index + 1} 
                  totalQuestions={quiz?.questions.length || 0} 
                  selectedOptionId={answers[quiz!.questions[index].id]?.answerId} 
                />
              </div>
              <div className="p-4 bg-zinc-900/30 flex justify-between items-center border-t border-zinc-900/80 px-6 h-18">
                <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(i => i - 1)} className="text-zinc-500 hover:text-white">
                  Atrás
                </Button>
                <div className="flex gap-2">
                  {index < (quiz?.questions.length || 0) - 1 ? (
                    <Button onClick={() => setIndex(i => i + 1)} className="bg-zinc-100 text-black hover:bg-white rounded-xl px-6 font-bold">Siguiente</Button>
                  ) : (
                    <Button onClick={() => setState('summary')} className="bg-indigo-600 text-white rounded-xl px-6 font-bold shadow-lg shadow-indigo-500/20">Finalizar</Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {state === 'summary' && (
            <motion.div key="summary" className="p-6 flex flex-col h-full overflow-hidden">
              <h3 className="text-lg font-bold text-white text-center mb-4">Confirmar envío</h3>
              <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
                {quiz?.questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Pregunta {idx+1}</span>
                    {answers[q.id]?.answerId ? <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">LISTA</span> : <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-bold">VACÍA</span>}
                  </div>
                ))}
              </div>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Enviar todo"}
              </Button>
            </motion.div>
          )}

          {state === 'finished' && (
            <motion.div key="finished" className="p-10 text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-emerald-500 h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">{score}/{quiz?.questions.length}</h2>
              <p className="text-zinc-500 text-sm mb-8">Has completado la evaluación con éxito.</p>
              <Button onClick={() => { setIndex(0); setAnswers({}); setState('intro'); }} className="w-full h-12 bg-zinc-100 text-black hover:bg-white rounded-xl font-bold">Cerrar</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}