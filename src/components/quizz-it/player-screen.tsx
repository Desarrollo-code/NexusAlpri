// src/components/quizz-it/player-screen.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/use-realtime';

const optionColors = ["bg-red-600", "bg-blue-600", "bg-yellow-500", "bg-green-600"];
const optionShapes = [
    <path d="M12 2L2 22h20L12 2z" key="triangle"/>,
    <path d="M12 2 L22 12 L12 22 L2 12 Z" key="diamond" />,
    <circle cx="12" cy="12" r="11" key="circle"/>,
    <rect x="2" y="2" width="20" height="20" rx="2" key="square"/>,
];


const WaitingScreen = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg font-semibold">{message}</p>
    </div>
);

const AnswerResultScreen = ({ isCorrect, scoreAwarded }: { isCorrect: boolean, scoreAwarded: number }) => (
    <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center text-white"
    >
        {isCorrect ? (
            <CheckCircle className="h-24 w-24 text-green-400 mb-4" />
        ) : (
            <XCircle className="h-24 w-24 text-red-400 mb-4" />
        )}
        <h2 className="text-4xl font-bold">{isCorrect ? '¡Correcto!' : 'Incorrecto'}</h2>
        {isCorrect && <p className="text-xl mt-2">+{scoreAwarded.toLocaleString()} puntos</p>}
    </motion.div>
);

export function PlayerScreen({ sessionId }: { sessionId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [gameState, setGameState] = useState('WAITING_FOR_GAME');
    const [question, setQuestion] = useState<any>(null);
    const [answerResult, setAnswerResult] = useState<any>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [startTime, setStartTime] = useState(0);

     const handleIncomingEvent = useCallback(({ event, payload }: { event: string, payload: any }) => {
        switch(event) {
            case 'START_GAME':
            case 'GET_READY':
                setGameState('GET_READY');
                break;
            case 'NEXT_QUESTION':
                setQuestion(payload.question);
                setHasAnswered(false);
                setAnswerResult(null);
                setGameState('QUESTION_ACTIVE');
                setStartTime(Date.now());
                break;
            case 'SHOW_RESULTS':
                setGameState('SHOWING_RESULTS');
                break;
            case 'GAME_OVER':
                setGameState('GAME_FINISHED');
                break;
        }
    }, []);

    useRealtime(`game:${sessionId}`, handleIncomingEvent);
    
    const handleAnswer = async (optionId: string) => {
        if (hasAnswered) return;
        setHasAnswered(true);

        const responseTimeMs = Date.now() - startTime;

        try {
            const response = await fetch('/api/quizz-it/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, questionId: question.id, optionId, responseTimeMs }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al enviar la respuesta');
            setAnswerResult(result);
            setGameState('ANSWERED');
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive'});
            setHasAnswered(false); // Permite reintentar si falla
        }
    };

    const renderContent = () => {
        switch (gameState) {
            case 'QUESTION_ACTIVE':
                if (!question) return <WaitingScreen message="Cargando pregunta..." />;
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 p-3 h-full w-full">
                        {question.options.map((opt: any, index: number) => (
                            <motion.button
                                key={opt.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                                onClick={() => handleAnswer(opt.id)}
                                className={cn(
                                  "flex items-center justify-center p-4 rounded-lg shadow-lg transform active:scale-95 transition-transform",
                                  optionColors[index],
                                  hasAnswered ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
                                )}
                                disabled={hasAnswered}
                            >
                                 <svg viewBox="0 0 24 24" className="h-24 w-24 fill-current text-white">
                                    {optionShapes[index]}
                                 </svg>
                            </motion.button>
                        ))}
                    </div>
                );
            case 'ANSWERED':
                return <WaitingScreen message="¡Respuesta enviada! Esperando a los demás jugadores..." />;
            case 'SHOWING_RESULTS':
                 return answerResult ? (
                    <AnswerResultScreen
                        isCorrect={answerResult.isCorrect}
                        scoreAwarded={answerResult.scoreAwarded}
                    />
                ) : <WaitingScreen message="No respondiste a tiempo..." />;
            case 'GET_READY':
                return <div className="flex flex-col items-center justify-center h-full text-white"><h2 className="text-4xl font-bold animate-pulse">¡Prepárate!</h2></div>
            case 'GAME_FINISHED':
                return <div className="flex flex-col items-center justify-center h-full text-white"><h2 className="text-2xl font-bold">¡Juego Terminado!</h2><p>Revisa la pantalla principal para ver el podio.</p></div>;
            default:
                return <WaitingScreen message="Esperando que el anfitrión inicie el juego..." />;
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-800 to-purple-900 h-screen w-screen flex flex-col items-center justify-center">
            {renderContent()}
        </div>
    );
}
