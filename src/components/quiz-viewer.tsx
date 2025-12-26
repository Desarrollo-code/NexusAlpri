// src/components/quiz-viewer.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Quiz as AppQuiz } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MultipleChoiceTemplate } from './quizz-it/templates/multiple-choice-template';
import { ResultScreenTemplate } from './quizz-it/templates/result-screen-template';
import { AnimatePresence, motion } from 'framer-motion';

interface QuizViewerProps {
  quiz: AppQuiz | undefined | null;
  lessonId: string;
  courseId?: string;
  isEnrolled?: boolean | null;
  isCreatorPreview?: boolean;
  onQuizCompleted?: (lessonId: string, score: number) => void;
}

const SummaryView = ({ questions, answers, onNavigate, onSubmit, isSubmitting }: {
  questions: any[],
  answers: Record<string, any>,
  onNavigate: (index: number) => void,
  onSubmit: () => void,
  isSubmitting: boolean
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold font-headline">Resumen de tus Respuestas</h3>
        <p className="text-muted-foreground">Revisa tus selecciones antes de enviar el quiz.</p>
      </div>

      <div className="grid gap-4">
        {questions.map((q, idx) => {
          const answer = answers[q.id];
          const selectedOption = q.options.find((o: any) => o.id === answer?.answerId);

          return (
            <Card key={q.id} className="overflow-hidden border-l-4 border-l-primary/50">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pregunta {idx + 1}</span>
                    {answer ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Respondida</span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Sin responder</span>
                    )}
                  </div>
                  <p className="font-semibold truncate" dangerouslySetInnerHTML={{ __html: q.text }}></p>
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    Seleccionado: {selectedOption ? <span dangerouslySetInnerHTML={{ __html: selectedOption.text }}></span> : "Ninguna opción seleccionada"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate(idx)} className="shrink-0">
                  Modificar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-6">
        <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className="w-full max-w-sm font-bold text-lg h-14 shadow-xl">
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Enviar Quiz'}
        </Button>
      </div>
    </div>
  );
};

export function QuizViewer({ quiz, lessonId, courseId, isEnrolled, isCreatorPreview = false, onQuizCompleted }: QuizViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'summary' | 'finished'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userAttempts, setUserAttempts] = useState(0);
  const [isCheckingAttempts, setIsCheckingAttempts] = useState(true);

  const maxAttempts = quiz?.maxAttempts;
  const canRetry = maxAttempts === null || userAttempts < maxAttempts;
  const currentQuestion = quiz?.questions[currentQuestionIndex];

  useEffect(() => {
    if (quiz && user && !isCreatorPreview) {
      setIsCheckingAttempts(true);
      fetch(`/api/quizzes/${quiz.id}/attempts?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setUserAttempts(data.count || 0))
        .catch(() => setUserAttempts(0))
        .finally(() => setIsCheckingAttempts(false));
    } else {
      setIsCheckingAttempts(false);
    }
  }, [quiz, user, isCreatorPreview]);

  const handleAnswerSubmit = useCallback((isCorrect: boolean, answerData: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion?.id]: { ...answerData, isCorrect, answerId: answerData.answer }
    }));
  }, [currentQuestion?.id]);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalScore = 0;
      const totalQuestions = quiz?.questions.length || 0;

      quiz?.questions.forEach(q => {
        if (answers[q.id]?.isCorrect) {
          finalScore += 1;
        }
      });

      const percentage = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;
      setScore(finalScore);

      if (user && courseId && !isCreatorPreview) {
        const res = await fetch(`/api/progress/${user.id}/${courseId}/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            quizId: quiz?.id,
            score: percentage,
            answers: Object.values(answers)
          }),
        });
        if (!res.ok) throw new Error("No se pudo guardar el resultado del quiz.");
        if (onQuizCompleted) onQuizCompleted(lessonId, percentage);
      }

      setGameState('finished');
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    handleAnswerSubmit(false, { answer: null, timedOut: true });
    toast({ title: "¡Tiempo!", description: "Se acabó el tiempo para esta pregunta.", variant: "destructive" });
  }, [handleAnswerSubmit, toast]);

  const resetQuiz = () => {
    if (quiz?.maxAttempts !== undefined && quiz?.maxAttempts !== null && !canRetry && !isCreatorPreview) return;
    setGameState('intro');
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers({});
  };

  const renderContent = () => {
    if (gameState === 'intro') {
      return (
        <div className="w-full text-center">
          <h3 className="text-xl font-bold font-headline mt-2">{quiz?.title}</h3>
          <p className="max-w-prose mx-auto text-sm text-muted-foreground mt-2">{quiz?.description || "Prepárate para probar tus conocimientos."}</p>
          <p className="text-xs text-muted-foreground mt-4">Este quiz contiene {quiz?.questions.length} pregunta{quiz?.questions.length !== 1 ? 's' : ''}.</p>
          {!isCreatorPreview && quiz?.maxAttempts !== null && quiz?.maxAttempts !== undefined && userAttempts !== undefined && <p className="text-xs text-muted-foreground mt-1">Te quedan {Math.max(0, quiz.maxAttempts - userAttempts)} de {quiz.maxAttempts} intentos.</p>}
          <div className="mt-6">
            {!canRetry && !isCreatorPreview ? (
              <Alert variant="destructive" className="w-full text-left"><ShieldAlert className="h-4 w-4" /><AlertTitle>Límite de Intentos Alcanzado</AlertTitle><AlertDescription>Ya no puedes volver a realizar este quiz.</AlertDescription></Alert>
            ) : (
              <Button className="w-full max-w-sm" onClick={() => setGameState('playing')} disabled={(!isEnrolled && !isCreatorPreview) || isCheckingAttempts}>
                {isCheckingAttempts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                {isCheckingAttempts ? 'Verificando...' : (isCreatorPreview ? 'Comenzar (Vista Previa)' : 'Comenzar Quiz')}
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (gameState === 'playing' && currentQuestion) {
      return (
        <div className="space-y-6">
          <MultipleChoiceTemplate
            key={currentQuestion.id}
            question={currentQuestion}
            onSubmit={handleAnswerSubmit}
            onTimeUp={handleTimeUp}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={quiz?.questions.length || 0}
            selectedOptionId={currentQuestion?.id ? answers[currentQuestion.id]?.answerId : undefined}
            showFeedback={false}
          />
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Anterior
            </Button>
            {currentQuestionIndex < (quiz?.questions.length || 0) - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 font-bold"
                onClick={() => setGameState('summary')}
              >
                Revisar Respuestas
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (gameState === 'summary') {
      return (
        <SummaryView
          questions={quiz?.questions || []}
          answers={answers}
          onNavigate={(idx) => {
            setCurrentQuestionIndex(idx);
            setGameState('playing');
          }}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (gameState === 'finished') {
      return (
        <ResultScreenTemplate
          score={score}
          totalQuestions={quiz?.questions.length || 0}
          formTitle={quiz?.title || ''}
          onRestart={resetQuiz}
        />
      );
    }

    return null;
  };

  if (!isEnrolled && !isCreatorPreview) {
    return (
      <Alert variant="default" className="mt-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Inscripción Requerida</AlertTitle>
        <AlertDescription>Debes estar inscrito en el curso para poder realizar este quiz.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[300px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState === 'playing' ? currentQuestionIndex : gameState}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
