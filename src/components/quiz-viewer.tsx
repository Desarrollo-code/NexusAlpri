// src/components/quiz-viewer.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { Quiz as AppQuiz } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, ShieldAlert, Check, Edit, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MultipleChoiceTemplate } from './quizz-it/templates/multiple-choice-template';
import { ResultScreenTemplate } from './quizz-it/templates/result-screen-template';
import { AnimatePresence, motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

interface QuizViewerProps {
  quiz: AppQuiz | undefined | null;
  lessonId: string;
  courseId?: string;
  isEnrolled?: boolean | null;
  isCreatorPreview?: boolean;
  onQuizCompleted?: (lessonId: string, score: number) => void;
}

const QuizStepper = ({ total, current, answered }: { total: number, current: number, answered: Set<number>}) => {
    return (
        <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: total }).map((_, index) => (
                <div key={index} className={cn(
                    "h-2.5 w-full rounded-full transition-all duration-300",
                    index === current ? 'bg-primary flex-1' : 'bg-muted w-4',
                    answered.has(index) && index !== current && 'bg-primary/50'
                )} />
            ))}
        </div>
    )
}

export function QuizViewer({ quiz, lessonId, courseId, isEnrolled, isCreatorPreview = false, onQuizCompleted }: QuizViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'review' | 'finished'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{score: number, total: number} | null>(null);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const currentQuestion = questions[currentQuestionIndex];
  const answeredQuestions = useMemo(() => new Set(Object.keys(answers).map(qid => questions.findIndex(q => q.id === qid))), [answers, questions]);

  const handleAnswerSubmit = useCallback((answerData: { questionId: string; answer: string | null; isCorrect: boolean }) => {
    setAnswers(prev => ({
        ...prev,
        [answerData.questionId]: {
            answer: answerData.answer,
            isCorrect: answerData.isCorrect
        }
    }));
  }, []);

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameState('review');
    }
  };
  
  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const correctAnswers = Object.values(answers).filter(a => a.isCorrect).length;
    const scorePercentage = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

    if (user && courseId && !isCreatorPreview) {
       try {
        await fetch(`/api/progress/${user.id}/${courseId}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId, quizId: quiz?.id, score: scorePercentage, answers }),
        });
        if (onQuizCompleted) onQuizCompleted(lessonId, scorePercentage);
       } catch (err) {
         toast({ title: "Error", description: "No se pudo guardar el resultado del quiz.", variant: "destructive" });
       }
    }
    setFinalResult({ score: correctAnswers, total: questions.length });
    setGameState('finished');
    setIsSubmitting(false);
  };
  
  const resetQuiz = () => {
    setGameState('intro');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFinalResult(null);
  };

  const renderContent = () => {
    switch(gameState) {
      case 'intro':
        return (
          <div className="w-full text-center">
              <h3 className="text-xl font-bold font-headline mt-2">{quiz?.title}</h3>
              <p className="max-w-prose mx-auto text-sm text-muted-foreground mt-2">{quiz?.description || "Prepárate para probar tus conocimientos."}</p>
              <p className="text-xs text-muted-foreground mt-4">Este quiz contiene {questions.length} pregunta{questions.length !== 1 ? 's' : ''}.</p>
              <div className="mt-6">
                  <Button className="w-full max-w-sm" onClick={() => setGameState('playing')} disabled={!isEnrolled && !isCreatorPreview}>
                      <PlayCircle className="mr-2 h-4 w-4"/>
                      {isCreatorPreview ? 'Comenzar (Vista Previa)' : 'Comenzar Quiz'}
                  </Button>
              </div>
          </div>
        );
      case 'playing':
        return (
          <div className="w-full">
            <QuizStepper total={questions.length} current={currentQuestionIndex} answered={answeredQuestions}/>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MultipleChoiceTemplate
                  question={currentQuestion}
                  onSubmit={handleAnswerSubmit}
                  initialAnswer={answers[currentQuestion?.id]}
                  timerStyle={quiz?.timerStyle}
                />
              </motion.div>
            </AnimatePresence>
             <div className="flex justify-between items-center mt-6">
                <Button variant="outline" onClick={goToPrevious} disabled={currentQuestionIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Anterior
                </Button>
                <Button onClick={goToNext}>
                   {currentQuestionIndex === questions.length - 1 ? 'Revisar Respuestas' : 'Siguiente'}
                   <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </div>
          </div>
        );
      case 'review':
         return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Revisa tus Respuestas</CardTitle>
                    <CardDescription>Asegúrate de que todo esté correcto antes de enviar tu quiz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Pregunta</TableHead><TableHead className="text-center">Estado</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {questions.map((q, index) => (
                                <TableRow key={q.id}>
                                    <TableCell className="font-medium">{index + 1}. {q.text}</TableCell>
                                    <TableCell className="text-center">
                                        {answers[q.id] ? <span className="flex items-center justify-center gap-1 text-green-600 text-sm"><Check className="h-4 w-4"/> Respondida</span> : <span className="text-muted-foreground text-sm">Pendiente</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => { setCurrentQuestionIndex(index); setGameState('playing'); }}>
                                            <Edit className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGameState('playing')}>Volver a Editar</Button>
                     <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                         {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                         Enviar y Finalizar
                    </Button>
                </CardFooter>
            </Card>
         );
      case 'finished':
          return (
            <ResultScreenTemplate
                score={finalResult?.score || 0}
                totalQuestions={finalResult?.total || 0}
                formTitle={quiz?.title || ''}
                onRestart={resetQuiz}
            />
          );
      default: return null;
    }
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
    <div className="flex flex-col items-center justify-center p-4 min-h-[400px]">
        {renderContent()}
    </div>
  );
}
