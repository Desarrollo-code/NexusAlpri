'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Quiz as AppQuiz } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, ShieldAlert, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
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
        <div className="w-full space-y-6 py-2">
            <div className="text-center space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">Resumen de Respuestas</h3>
                <p className="text-gray-500 text-sm">Revisa tus selecciones antes de enviar.</p>
            </div>

            <div className="grid gap-3 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, idx) => {
                    const answer = answers[q.id];
                    const selectedOption = q.options.find((o: any) => o.id === answer?.answerId);

                    return (
                        <Card key={q.id} className="border border-gray-100 shadow-sm hover:border-primary/20 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded uppercase">P{idx + 1}</span>
                                        {answer ? (
                                            <span className="text-[10px] font-bold text-green-600 uppercase">Respondida</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-600 uppercase">Pendiente</span>
                                        )}
                                    </div>
                                    <p className="font-semibold text-gray-800 text-sm truncate" dangerouslySetInnerHTML={{ __html: q.text }}></p>
                                    <p className="text-xs text-gray-500 mt-0.5 italic">
                                        Tu respuesta: <span className="text-primary not-italic font-medium" dangerouslySetInnerHTML={{ __html: selectedOption?.text || "Sin selección" }}></span>
                                    </p>
                                </div>
                                <Button variant="outline" size="xs" onClick={() => onNavigate(idx)} className="h-8 text-xs font-bold shrink-0">
                                    Editar
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex justify-center pt-2">
                <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className="w-full max-w-xs font-bold text-base h-12 shadow-lg rounded-xl bg-primary">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'CALCULANDO...' : 'ENVIAR QUIZ'}
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
            quiz?.questions.forEach(q => { if (answers[q.id]?.isCorrect) finalScore += 1; });
            const percentage = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;
            setScore(finalScore);

            if (user && courseId && !isCreatorPreview) {
                const res = await fetch(`/api/progress/${user.id}/${courseId}/quiz`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lessonId, quizId: quiz?.id, score: percentage, answers: Object.values(answers)
                    }),
                });
                if (!res.ok) throw new Error("No se pudo guardar el resultado.");
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
    }, [handleAnswerSubmit]);

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
                <div className="w-full text-center space-y-4 py-6">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
                        <PlayCircle className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 leading-tight">{quiz?.title}</h3>
                    <p className="max-w-md mx-auto text-base text-gray-500">{quiz?.description || "Demuestra lo que has aprendido."}</p>
                    
                    <div className="flex justify-center gap-3 py-2">
                        <div className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
                            {quiz?.questions.length} Preguntas
                        </div>
                        {!isCreatorPreview && quiz?.maxAttempts && (
                            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                                {Math.max(0, quiz.maxAttempts - userAttempts)} Intentos
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        {!canRetry && !isCreatorPreview ? (
                            <Alert variant="destructive" className="max-w-sm mx-auto text-left rounded-xl">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle className="text-xs font-bold">Límite alcanzado</AlertTitle>
                                <AlertDescription className="text-xs">Has agotado los intentos permitidos.</AlertDescription>
                            </Alert>
                        ) : (
                            <Button size="lg" className="w-full max-w-xs h-12 text-base font-bold rounded-xl shadow-md" onClick={() => setGameState('playing')} disabled={(!isEnrolled && !isCreatorPreview) || isCheckingAttempts}>
                                {isCheckingAttempts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'COMENZAR'}
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        if (gameState === 'playing' && currentQuestion) {
            return (
                <div className="flex flex-col h-full">
                    <div className="flex-grow pb-4">
                        <MultipleChoiceTemplate
                            key={currentQuestion.id}
                            question={currentQuestion}
                            onSubmit={handleAnswerSubmit}
                            onTimeUp={handleTimeUp}
                            questionNumber={currentQuestionIndex + 1}
                            totalQuestions={quiz?.questions.length || 0}
                            selectedOptionId={answers[currentQuestion.id]?.answerId}
                            showFeedback={false}
                        />
                    </div>
                </div>
            );
        }

        if (gameState === 'summary') {
            return <SummaryView questions={quiz?.questions || []} answers={answers} onNavigate={(idx) => { setCurrentQuestionIndex(idx); setGameState('playing'); }} onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} />;
        }

        if (gameState === 'finished') {
            return <ResultScreenTemplate score={score} totalQuestions={quiz?.questions.length || 0} formTitle={quiz?.title || ''} onRestart={resetQuiz} />;
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={gameState === 'playing' ? currentQuestionIndex : gameState}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                    <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        {renderContent()}
                    </div>

                    {gameState === 'playing' && (
                        <div className="border-t bg-gray-50/50 p-4 px-6 md:px-10 flex justify-between items-center shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="font-bold text-gray-500"
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                            </Button>

                            <div className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                {currentQuestionIndex + 1} / {quiz?.questions.length}
                            </div>

                            {currentQuestionIndex < (quiz?.questions.length || 0) - 1 ? (
                                <Button
                                    size="sm"
                                    className="font-bold px-6 rounded-lg"
                                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                >
                                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    className="bg-primary font-bold px-6 rounded-lg"
                                    onClick={() => setGameState('summary')}
                                >
                                    FINALIZAR
                                </Button>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}