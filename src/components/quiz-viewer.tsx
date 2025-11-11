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

export function QuizViewer({ quiz, lessonId, courseId, isEnrolled, isCreatorPreview = false, onQuizCompleted }: QuizViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

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
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setAnswers(prev => [...prev, { questionId: currentQuestion?.id, ...answerData, isCorrect }]);

    setTimeout(() => {
      if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Quiz finished, save results
        const finalScore = isCorrect ? score + 1 : score;
        const totalQuestions = quiz?.questions.length || 1;
        const percentage = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;

        if (user && courseId && !isCreatorPreview) {
            fetch(`/api/progress/${user.id}/${courseId}/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, quizId: quiz?.id, score: percentage, answers: {...answerData, questionId: currentQuestion?.id} }),
            })
            .then(res => {
                if (!res.ok) throw new Error("No se pudo guardar el resultado del quiz.");
                if (onQuizCompleted) onQuizCompleted(lessonId, percentage);
            })
            .catch(err => toast({ title: "Error", description: (err as Error).message, variant: "destructive" }));
        }
        setGameState('finished');
      }
    }, 2000);
  }, [currentQuestionIndex, quiz?.questions.length, quiz?.id, score, lessonId, courseId, user, isCreatorPreview, onQuizCompleted, toast, currentQuestion?.id]);

  const handleTimeUp = useCallback(() => {
    handleAnswerSubmit(false, { answer: null, timedOut: true });
    toast({ title: "¡Tiempo!", description: "Se acabó el tiempo para esta pregunta.", variant: "destructive" });
  }, [handleAnswerSubmit, toast]);

  const resetQuiz = () => {
    if (!canRetry && !isCreatorPreview) return;
    setGameState('intro');
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
  };

  const renderContent = () => {
    if (gameState === 'intro') {
      return (
        <div className="w-full text-center">
            <h3 className="text-xl font-bold font-headline mt-2">{quiz?.title}</h3>
            <p className="max-w-prose mx-auto text-sm text-muted-foreground mt-2">{quiz?.description || "Prepárate para probar tus conocimientos."}</p>
            <p className="text-xs text-muted-foreground mt-4">Este quiz contiene {quiz?.questions.length} pregunta{quiz?.questions.length !== 1 ? 's' : ''}.</p>
            {!isCreatorPreview && maxAttempts !== null && <p className="text-xs text-muted-foreground mt-1">Te quedan {maxAttempts - userAttempts} de {maxAttempts} intentos.</p>}
            <div className="mt-6">
                 {!canRetry && !isCreatorPreview ? (
                     <Alert variant="destructive" className="w-full text-left"><ShieldAlert className="h-4 w-4" /><AlertTitle>Límite de Intentos Alcanzado</AlertTitle><AlertDescription>Ya no puedes volver a realizar este quiz.</AlertDescription></Alert>
                 ) : (
                    <Button className="w-full max-w-sm" onClick={() => setGameState('playing')} disabled={(!isEnrolled && !isCreatorPreview) || isCheckingAttempts}>
                        {isCheckingAttempts ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlayCircle className="mr-2 h-4 w-4"/>}
                        {isCheckingAttempts ? 'Verificando...' : (isCreatorPreview ? 'Comenzar (Vista Previa)' : 'Comenzar Quiz')}
                    </Button>
                 )}
            </div>
        </div>
      );
    }

    if (gameState === 'playing' && currentQuestion) {
      // Aquí se debería elegir la plantilla adecuada según el tipo de pregunta
      return (
        <MultipleChoiceTemplate
          key={currentQuestion.id}
          question={currentQuestion}
          onSubmit={handleAnswerSubmit}
          onTimeUp={handleTimeUp}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={quiz?.questions.length || 0}
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
            <ShieldAlert className="h-4 w-4"/>
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
