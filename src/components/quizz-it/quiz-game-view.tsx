// src/components/quizz-it/quiz-game-view.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { AppForm, AppQuestion } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { MultipleChoiceTemplate } from './templates/multiple-choice-template';
import { ResultScreenTemplate } from './templates/result-screen-template';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface QuizGameViewProps {
  form: AppForm;
  isEditorPreview?: boolean;
}

export function QuizGameView({ form, isEditorPreview = false }: QuizGameViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

  const questions: AppQuestion[] = (form.fields || []).filter(f => f.type === 'SINGLE_CHOICE' || f.type === 'MULTIPLE_CHOICE').map(f => ({
      ...f,
      text: f.label,
  })) as AppQuestion[];

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSubmit = useCallback((isCorrect: boolean, answerData: any) => {
    if (isEditorPreview) {
        // En modo preview, solo mostramos el feedback y no avanzamos.
         setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
            } else {
              setGameState('finished');
            }
         }, 2000);
         return;
    }
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, ...answerData, isCorrect }]);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setGameState('finished');
      }
    }, 2000);
  }, [currentQuestionIndex, questions.length, currentQuestion?.id, isEditorPreview]);
  
  const handleTimeUp = useCallback(() => {
    handleAnswerSubmit(false, { answer: null, timedOut: true });
    if (!isEditorPreview) {
       toast({ title: "¡Tiempo!", description: "Se acabó el tiempo para esta pregunta.", variant: "destructive" });
    }
  }, [handleAnswerSubmit, toast, isEditorPreview]);


  const renderQuestionTemplate = () => {
    if (!currentQuestion) return <div className="text-center">Fin del Quiz</div>;
    
    // Aquí puedes añadir lógica para cambiar de plantilla según `form.template`
    // Por ahora, solo usamos MultipleChoiceTemplate
    switch (form.template) {
        case 'flip_card':
            // Implementar la plantilla de FlipCard aquí si se desea
            // Por ahora, recae en la de opción múltiple
        case 'image':
        case 'true_false':
        case 'default':
        default:
             return (
                <MultipleChoiceTemplate
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onSubmit={handleAnswerSubmit}
                  onTimeUp={handleTimeUp}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  template={form.template}
                  timerStyle={form.timerStyle}
                />
            );
    }
  };
  
  const handleRestart = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[300px] bg-gradient-to-br from-background via-muted to-background rounded-lg">
      <AnimatePresence mode="wait">
        {gameState === 'playing' ? (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            {renderQuestionTemplate()}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-4xl"
          >
             <ResultScreenTemplate
              score={score}
              totalQuestions={questions.length}
              formTitle={form.title}
              onRestart={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
