
'use client';

import React, { useState, useMemo } from 'react';
import type { Quiz as AppQuiz, AnswerOption as AppAnswerOption, Question as AppQuestion } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Award, MessageCircleQuestion, Loader2, PlayCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface QuizViewerProps {
  quiz: AppQuiz | undefined | null;
  lessonId: string;
  courseId?: string;
  isEnrolled?: boolean | null;
  isInstructorPreview?: boolean;
  onQuizCompleted?: (lessonId: string, score: number) => void;
}

interface Result {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  questionResults: Record<string, {
    selectedOptionId: string;
    correctOptionId: string;
    isCorrect: boolean;
  }>;
}

export function QuizViewer({ quiz, lessonId, courseId, isEnrolled, isInstructorPreview = false, onQuizCompleted }: QuizViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false); // New state

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length !== (quiz?.questions.length || 0)) {
        toast({
            title: "Cuestionario Incompleto",
            description: "Por favor, responde todas las preguntas antes de enviar.",
            variant: "destructive"
        });
        return;
    }

    setIsSubmitting(true);
    
    let correctCount = 0;
    const questionResults: Result['questionResults'] = {};
    
    quiz?.questions.forEach(q => {
        const correctOption = q.options.find(opt => opt.isCorrect);
        const selectedOptionId = selectedAnswers[q.id];
        const isCorrect = correctOption?.id === selectedOptionId;

        if (isCorrect) {
            correctCount++;
        }
        
        if (correctOption) {
            questionResults[q.id] = {
                selectedOptionId: selectedOptionId,
                correctOptionId: correctOption.id,
                isCorrect,
            };
        }
    });

    const score = quiz?.questions.length ? (correctCount / quiz.questions.length) * 100 : 0;
    
    if (user && courseId && !isInstructorPreview) {
       try {
            const response = await fetch(`/api/progress/${user.id}/${courseId}/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, score }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar el resultado');

            toast({
                title: score >= 80 ? "¡Quiz Aprobado!" : "Quiz Enviado",
                description: `Has obtenido una puntuación de ${Math.round(score)}%. Tu progreso se ha actualizado.`,
            });

       } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudo guardar el resultado del quiz.", variant: "destructive"});
       } finally {
            if (onQuizCompleted) {
                onQuizCompleted(lessonId, score); 
            }
       }
    }
    
    setResult({
        score: Math.round(score),
        correctAnswers: correctCount,
        totalQuestions: quiz?.questions.length || 0,
        questionResults,
    });
    
    setIsSubmitting(false);
  };
  
  const resetQuiz = () => {
    setSelectedAnswers({});
    setResult(null);
    setQuizStarted(false); // Reset to show intro screen
  }

  if (!quiz) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudo cargar la información del quiz. Puede que no esté configurado.</AlertDescription>
      </Alert>
    );
  }
  
  const canAttemptQuiz = isEnrolled || isInstructorPreview;

  if (!canAttemptQuiz) {
      return (
          <Alert>
              <AlertTitle>Inscripción Requerida</AlertTitle>
              <AlertDescription>Debes estar inscrito en el curso para realizar este quiz.</AlertDescription>
          </Alert>
      )
  }

  if (result) {
    return (
      <Card className="mt-4 border-primary/20">
        <CardHeader className="text-center">
            <Award className="mx-auto h-12 w-12 text-primary" fill="currentColor" />
            <CardTitle className="text-2xl font-bold">Resultados del Quiz</CardTitle>
            <CardDescription>{quiz.title}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
            <p className="text-4xl font-bold">{result.score}%</p>
            <Progress value={result.score} className="w-full" />
            <p className="text-muted-foreground">Respondiste correctamente {result.correctAnswers} de {result.totalQuestions} preguntas.</p>
        </CardContent>
        <CardFooter className="flex-col gap-6">
            <div className="w-full space-y-4">
                {quiz.questions.map(question => {
                    const qResult = result.questionResults[question.id];
                    if (!qResult) return null;
                    return (
                        <div key={question.id} className="p-4 border rounded-md bg-muted/30">
                            <p className="font-semibold mb-2">{question.text}</p>
                            {question.options.map(option => {
                                const isCorrectAnswer = option.id === qResult.correctOptionId;
                                const isSelectedAnswer = option.id === qResult.selectedOptionId;

                                return (
                                <div key={option.id} className={cn(
                                    "flex items-start gap-3 p-3 rounded-md text-sm mb-2 border",
                                    isCorrectAnswer ? "bg-green-100/80 border-green-300 dark:bg-green-900/30 dark:border-green-700" : "",
                                    !isCorrectAnswer && isSelectedAnswer ? "bg-red-100/80 border-red-300 dark:bg-red-900/30 dark:border-red-700" : ""
                                )}>
                                    <div className="flex-shrink-0 pt-0.5">
                                        {isCorrectAnswer ? <CheckCircle className="h-4 w-4 text-green-600" fill="currentColor" /> : 
                                         (isSelectedAnswer ? <XCircle className="h-4 w-4 text-red-600" fill="currentColor" /> : <div className="h-4 w-4" />)}
                                    </div>
                                    <div className="flex-grow">
                                        <p>{option.text}</p>
                                        {option.feedback && (isCorrectAnswer || isSelectedAnswer) && (
                                            <p className={cn(
                                                "text-xs mt-1 p-2 rounded-md",
                                                isCorrectAnswer ? "bg-green-200/50 dark:bg-green-800/40" : "bg-red-200/50 dark:bg-red-800/40"
                                            )}>{option.feedback}</p>
                                        )}
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    );
                })}
            </div>
            <Button onClick={resetQuiz}>
                Volver a intentar
            </Button>
        </CardFooter>
      </Card>
    );
  }

  // New intro screen
  if (!quizStarted) {
    return (
        <Card className="my-4 shadow-lg text-center">
            <CardHeader>
                <MessageCircleQuestion className="mx-auto h-12 w-12 text-primary"/>
                <CardTitle className="text-2xl font-headline mt-2">{quiz.title}</CardTitle>
                <CardDescription className="max-w-prose mx-auto">{quiz.description || "Prepárate para probar tus conocimientos."}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Este quiz contiene {quiz.questions.length} pregunta{quiz.questions.length !== 1 ? 's' : ''}.</p>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={() => setQuizStarted(true)}>
                    <PlayCircle className="mr-2 h-4 w-4"/>
                    {isInstructorPreview ? 'Comenzar (Vista Previa)' : 'Comenzar Quiz'}
                </Button>
            </CardFooter>
        </Card>
    )
  }

  // Quiz questions view (previously the main view)
  return (
    <Card className="my-4 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
            <MessageCircleQuestion className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.description || "Responde las siguientes preguntas."}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="p-4 border rounded-lg bg-muted/20">
            <p className="font-semibold mb-3">Pregunta {index + 1}: {question.text}</p>
            <RadioGroup
              value={selectedAnswers[question.id]}
              onValueChange={(value) => handleOptionChange(question.id, value)}
            >
              {question.options.map(option => (
                <div key={option.id} className="flex items-center space-x-2 p-2 hover:bg-muted/40 rounded-md">
                  <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                  <Label htmlFor={`${question.id}-${option.id}`} className="font-normal cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </CardContent>
      <CardFooter>
         <Button 
            className="w-full"
            onClick={handleSubmit} 
            disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
            {isInstructorPreview ? 'Enviar (Vista Previa)' : 'Enviar Respuestas'}
        </Button>
      </CardFooter>
    </Card>
  );
}
