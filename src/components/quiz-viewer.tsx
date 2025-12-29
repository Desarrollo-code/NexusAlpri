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
        <div className="w-full space-y-8 py-4">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-gray-900">Resumen de Respuestas</h3>
                <p className="text-gray-500 text-lg">Revisa tus selecciones antes de la calificación final.</p>
            </div>

            <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, idx) => {
                    const answer = answers[q.id];
                    const selectedOption = q.options.find((o: any) => o.id === answer?.answerId);

                    return (
                        <Card key={q.id} className="border-2 border-gray-100 hover:border-primary/20 transition-colors">
                            <CardContent className="p-6 flex items-center justify-between gap-6">
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded">PREGUNTA {idx + 1}</span>
                                        {answer ? (
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">Respondida</span>
                                        ) : (
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-tighter">Sin responder</span>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-800 text-lg truncate" dangerouslySetInnerHTML={{ __html: q.text }}></p>
                                    <p className="text-gray-500 mt-1 italic text-sm">
                                        Seleccionado: <span className="text-primary not-italic font-semibold" dangerouslySetInnerHTML={{ __html: selectedOption?.text || "Ninguna" }}></span>
                                    </p>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => onNavigate(idx)} className="shrink-0 font-bold">
                                    Cambiar
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex justify-center pt-4">
                <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className="w-full max-w-md font-black text-xl h-16 shadow-2xl rounded-2xl bg-primary hover:bg-primary/90 transition-transform hover:scale-[1.02]">
                    {isSubmitting ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <CheckCircle2 className="mr-3 h-6 w-6" />}
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
                <div className="w-full text-center space-y-6 py-10">
                    <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-4">
                        <PlayCircle className="h-16 w-16" />
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 leading-tight">{quiz?.title}</h3>
                    <p className="max-w-xl mx-auto text-lg text-gray-500">{quiz?.description || "Demuestra lo que has aprendido en esta lección."}</p>
                    
                    <div className="flex flex-wrap justify-center gap-4 py-4">
                        <div className="px-6 py-3 bg-gray-100 rounded-2xl font-bold text-gray-700">
                            {quiz?.questions.length} Preguntas
                        </div>
                        {!isCreatorPreview && quiz?.maxAttempts && (
                            <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-bold border border-blue-100">
                                {Math.max(0, quiz.maxAttempts - userAttempts)} Intentos restantes
                            </div>
                        )}
                    </div>

                    <div className="pt-6">
                        {!canRetry && !isCreatorPreview ? (
                            <Alert variant="destructive" className="max-w-md mx-auto text-left rounded-2xl">
                                <ShieldAlert className="h-5 w-5" />
                                <AlertTitle className="font-bold">Límite alcanzado</AlertTitle>
                                <AlertDescription>Has agotado todos los intentos permitidos.</AlertDescription>
                            </Alert>
                        ) : (
                            <Button size="lg" className="w-full max-w-sm h-16 text-xl font-black rounded-2xl shadow-xl" onClick={() => setGameState('playing')} disabled={(!isEnrolled && !isCreatorPreview) || isCheckingAttempts}>
                                {isCheckingAttempts ? <Loader2 className="mr-3 animate-spin" /> : '¡COMENZAR AHORA!'}
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        if (gameState === 'playing' && currentQuestion) {
            return (
                <div className="flex flex-col h-full space-y-8">
                    <div className="flex-grow">
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
                    
                    {/* Navegación Inferior Robusta */}
                    <div className="flex justify-between items-center bg-gray-50/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-gray-100 mt-auto">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="font-bold gap-2 text-gray-600"
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                        >
                            <ChevronLeft className="h-5 w-5" /> Anterior
                        </Button>

                        <div className="text-sm font-black text-gray-400 tracking-widest uppercase">
                            PASO {currentQuestionIndex + 1} DE {quiz?.questions.length}
                        </div>

                        {currentQuestionIndex < (quiz?.questions.length || 0) - 1 ? (
                            <Button
                                size="lg"
                                className="font-bold gap-2 px-8 rounded-xl shadow-lg"
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            >
                                Siguiente <ChevronRight className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 font-black px-8 rounded-xl shadow-lg animate-in fade-in zoom-in duration-300"
                                onClick={() => setGameState('summary')}
                            >
                                REVISAR TODO
                            </Button>
                        )}
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

    if (!isEnrolled && !isCreatorPreview) {
        return (
            <div className="flex items-center justify-center p-8 bg-black min-h-[400px]">
                <Alert variant="destructive" className="max-w-md rounded-2xl border-2">
                    <ShieldAlert className="h-5 w-5" />
                    <AlertTitle className="font-bold">Acceso Denegado</AlertTitle>
                    <AlertDescription>Inscríbete en el curso para desbloquear este quiz.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-6 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={gameState === 'playing' ? currentQuestionIndex : gameState}
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    // CAMBIO CLAVE: max-w-6xl y h-full con límites para un modal centrado y gigante
                    className="w-full max-w-6xl bg-white rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] overflow-hidden border border-white/20"
                >
                    <div className="flex-grow overflow-y-auto p-6 md:p-12 custom-scrollbar">
                        {renderContent()}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}