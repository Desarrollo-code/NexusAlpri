// src/components/quizz-it/quiz-game-view.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { AppForm } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { MultipleChoiceTemplate } from './templates/multiple-choice-template';
import { ResultScreenTemplate } from './templates/result-screen-template';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface QuizGameViewProps {
  form: AppForm;
}

export function QuizGameView({ form }: QuizGameViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

  const currentQuestion = form.fields[currentQuestionIndex];

  const handleAnswerSubmit = useCallback((isCorrect: boolean, answerData: any) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, ...answerData, isCorrect }]);

    // Move to next question or finish
    setTimeout(() => {
      if (currentQuestionIndex < form.fields.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setGameState('finished');
      }
    }, 2000); // Wait 2 seconds before moving on
  }, [currentQuestionIndex, form.fields.length, currentQuestion.id]);
  
  const handleTimeUp = useCallback(() => {
    handleAnswerSubmit(false, { answer: null, timedOut: true });
    toast({ title: "¡Tiempo!", description: "Se acabó el tiempo para esta pregunta.", variant: "destructive" });
  }, [handleAnswerSubmit, toast]);


  const renderQuestionTemplate = () => {
    if (!currentQuestion) return null;

    // Lógica para elegir plantilla (simplificada por ahora)
    if (currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE') {
      return (
        <MultipleChoiceTemplate
          key={currentQuestion.id}
          question={currentQuestion}
          onSubmit={handleAnswerSubmit}
          onTimeUp={handleTimeUp}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={form.fields.length}
        />
      );
    }
    
    // Aquí se podrían añadir `ImageQuestionTemplate`, `TrueFalseTemplate`, etc.

    return <div>Tipo de pregunta no soportado.</div>;
  };
  
  const handleRestart = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-8rem)] bg-gradient-to-br from-background via-muted to-background">
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
              totalQuestions={form.fields.length}
              formTitle={form.title}
              onRestart={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
