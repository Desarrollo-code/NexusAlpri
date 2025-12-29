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
        <div className="w-full space-y-4 py-2">
            <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-gray-900">Resumen de Respuestas</h3>
                <p className="text-gray-500 text-xs">Revisa tus selecciones antes de enviar.</p>
            </div>

            <div className="grid gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, idx) => {
                    const answer = answers[q.id];
                    const selectedOption = q.options.find((o: any) => o.id === answer?.answerId);

                    return (
                        <Card key={q.id} className="border border-gray-100 shadow-sm hover:border-primary/20 transition-colors">
                            <CardContent className="p-3 flex items-center justify-between gap-3">
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[9px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 uppercase">P{idx + 1}</span>
                                        {answer ? (
                                            <span className="text-[9px] font-bold text-green-600 uppercase">Respondida</span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-amber-600 uppercase">Pendiente</span>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-800 text-xs truncate" dangerouslySetInnerHTML={{ __html: q.text }}></p>
                                    <p className="text-[10px] text-gray-500 mt-0.5 italic truncate">
                                        Tu respuesta: <span className="text-primary not-italic font-medium" dangerouslySetInnerHTML={{ __html: selectedOption?.text || "Sin selección" }}></span>
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => onNavigate(idx)} className="h-7 text-[10px] font-bold shrink-0">
                                    Editar
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex justify-center pt-2">
                <Button onClick={onSubmit} disabled={isSubmitting} size="sm" className="w-full max-w-xs font-bold text-sm h-10 shadow-lg rounded-xl bg-primary">
                    {isSubmitting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
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
                <div className="w-full text-center space-y-3 py-4">
                    <div className="inline-flex p-2.5 rounded-2xl bg-primary/10 text-primary">
                        <PlayCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">{quiz?.title}</h3>
                    <p className="max-w-xs mx-auto text-xs text-gray-500">{quiz?.description || "Demuestra lo que has aprendido."}</p>
                    
                    <div className="flex justify-center gap-2 py-1">
                        <div className="px-3 py-1 bg-gray-100 rounded-xl text-[10px] font-bold text-gray-600">
                            {quiz?.questions.length} Preguntas
                        </div>
                    </div>

                    <div className="pt-2">
                        {!canRetry && !isCreatorPreview ? (
                            <Alert variant="destructive" className="max-w-xs mx-auto text-left rounded-xl py-2">
                                <ShieldAlert className="h-3 w-3" />
                                <AlertTitle className="text-[10px] font-bold">Límite alcanzado</AlertTitle>
                            </Alert>
                        ) : (
                            <Button size="sm" className="w-full max-w-[200px] h-10 text-xs font-bold rounded-xl shadow-md" onClick={() => setGameState('playing')} disabled={(!isEnrolled && !isCreatorPreview) || isCheckingAttempts}>
                                {isCheckingAttempts ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : 'COMENZAR'}
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        if (gameState === 'playing' && currentQuestion) {
            return (
                <div className="flex flex-col h-full w-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-3 md:p-4 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={gameState === 'playing' ? currentQuestionIndex : gameState}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-white/20"
                >
                    {/* Cuerpo con Scroll Interno */}
                    <div className="flex-grow overflow-y-auto p-5 md:p-8 custom-scrollbar">
                        {renderContent()}
                    </div>

                    {/* Footer de Navegación Compacto */}
                    {gameState === 'playing' && (
                        <div className="border-t bg-slate-50/50 p-3 px-5 md:px-8 flex justify-between items-center shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="font-bold text-gray-400 hover:text-gray-600 text-[11px] h-8 px-2"
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronLeft className="h-3 w-3 mr-1" /> Anterior
                            </Button>

                            <div className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">
                                {currentQuestionIndex + 1} / {quiz?.questions.length}
                            </div>

                            {currentQuestionIndex < (quiz?.questions.length || 0) - 1 ? (
                                <Button
                                    size="sm"
                                    className="font-bold text-[11px] h-8 px-5 rounded-lg shadow-sm"
                                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                >
                                    Siguiente <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    className="bg-primary font-bold text-[11px] h-8 px-5 rounded-lg shadow-lg"
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