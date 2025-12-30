'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  PlayCircle, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Trophy, 
  Sparkles,
  Target
} from 'lucide-react';
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

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

// --- Sub-componente: Resumen de respuestas ---
const SummaryView = ({ questions, answers, onNavigate, onSubmit, isSubmitting }: any) => {
  const allAnswered = questions.every((q: any) => answers[q.id]?.answerId);
  const answeredCount = questions.filter((q: any) => answers[q.id]?.answerId).length;

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 text-center border-b border-zinc-800">
        <h3 className="text-xl font-bold text-white mb-2">Revisión Final</h3>
        <div className="flex items-center justify-center gap-4 text-sm text-zinc-400">
          <span>{answeredCount} de {questions.length} respondidas</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {questions.map((q: any, idx: number) => {
          const isAnswered = !!answers[q.id]?.answerId;
          return (
            <div 
              key={q.id} 
              onClick={() => onNavigate(idx)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                ${isAnswered ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600' : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Pregunta {idx + 1}</p>
                <p className="text-sm text-zinc-300 truncate">{stripHtml(q.text)}</p>
              </div>
              {isAnswered ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-3" />
              ) : (
                <span className="text-[10px] font-bold text-rose-500 ml-3">PENDIENTE</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-950">
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting || !allAnswered} 
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:bg-zinc-800"
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Finalizar Quiz
        </Button>
      </div>
    </div>
  );
};

// --- Sub-componente: Pantalla de Resultados ---
const ResultScreen = ({ score, totalQuestions, onRestart }: any) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  return (
    <div className="flex flex-col items-center p-8 text-center">
      <motion.div 
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20"
      >
        <Trophy className="text-white h-12 w-12" />
      </motion.div>
      
      <h2 className="text-3xl font-black text-white mb-2">¡Completado!</h2>
      <p className="text-zinc-400 mb-8 font-medium">Has finalizado la evaluación con éxito.</p>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm mb-8 shadow-inner">
        <div className="text-6xl font-black text-indigo-400 mb-2">{percentage}%</div>
        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold">
          {score} de {totalQuestions} Correctas
        </div>
      </div>

      <Button onClick={onRestart} variant="outline" className="w-full max-w-xs h-12 border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl font-bold transition-all">
        Reintentar Evaluación
      </Button>
    </div>
  );
};

export function QuizViewer({ quiz, lessonId, courseId, isEnrolled, isCreatorPreview = false, onQuizCompleted }: QuizViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<'intro' | 'playing' | 'summary' | 'finished'>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSubmit = useCallback((isCorrect: boolean, data: any) => {
    if (!quiz?.questions[index]) return;
    setAnswers(prev => ({ 
      ...prev, 
      [quiz.questions[index].id]: { ...data, isCorrect, answerId: data.answer } 
    }));
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
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el progreso", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6">
                <PlayCircle className="text-indigo-500 h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">{quiz?.title}</h2>
              <p className="text-zinc-400 text-sm max-w-sm mb-8 leading-relaxed">{quiz?.description}</p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                  <Target className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
                  <span className="block text-xl font-bold text-white">{quiz?.questions.length}</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Preguntas</span>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                  <Target className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                  <span className="block text-xl font-bold text-white">80%</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Para aprobar</span>
                </div>
              </div>

              {!isEnrolled && !isCreatorPreview ? (
                <Alert className="bg-rose-500/10 border-rose-500/20 text-rose-500 mb-6">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>Inscríbete para realizar este quiz</AlertDescription>
                </Alert>
              ) : (
                <Button onClick={() => setState('playing')} className="w-full h-14 bg-white text-zinc-950 hover:bg-zinc-200 rounded-2xl font-black text-lg transition-transform active:scale-95">
                  Comenzar Evaluación
                </Button>
              )}
            </motion.div>
          )}

          {state === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <div className="flex-1 p-6 overflow-y-auto">
                <MultipleChoiceTemplate
                  question={quiz!.questions[index]}
                  onSubmit={handleAnswerSubmit}
                  onTimeUp={() => handleAnswerSubmit(false, { answer: '', timedOut: true })}
                  questionNumber={index + 1}
                  totalQuestions={quiz?.questions.length || 0}
                  selectedOptionId={answers[quiz!.questions[index].id]?.answerId}
                />
              </div>
              <div className="p-4 bg-zinc-900/50 flex justify-between items-center gap-3 border-t border-zinc-800 px-8 h-20">
                <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(i => i - 1)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                  <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <div className="flex gap-2">
                  {index < (quiz?.questions.length || 0) - 1 ? (
                    <Button onClick={() => setIndex(i => i + 1)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl font-bold">
                      Siguiente
                    </Button>
                  ) : (
                    <Button onClick={() => setState('summary')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-xl font-bold">
                      Finalizar
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {state === 'summary' && <SummaryView key="summary" questions={quiz?.questions} answers={answers} onNavigate={(i:number) => { setIndex(i); setState('playing'); }} onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} />}
          {state === 'finished' && <ResultScreen key="finished" score={score} totalQuestions={quiz?.questions.length} onRestart={() => { setIndex(0); setAnswers({}); setState('intro'); }} />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}