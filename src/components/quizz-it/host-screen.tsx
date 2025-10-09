// src/components/quizz-it/host-screen.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabaseAdmin, supabaseBrowserClient } from '@/lib/supabase-client';
import { Loader2, Users, Play, ChevronRight, BarChart3, Trophy, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/use-realtime-chat';

// --- Sub-components ---

const LobbyScreen = ({ pin, players, formTitle }: { pin: string, players: any[], formTitle: string }) => {
    const { toast } = useToast();

    const handleCopy = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: '¡Copiado!',
            description: message,
        });
    };
    
    const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/quizz-it/play` : '';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-between h-full text-center text-white p-4 md:p-8">
            <div className="w-full max-w-4xl mx-auto bg-black/20 p-4 rounded-xl shadow-lg border border-white/10">
                <p className="font-bold text-lg md:text-2xl">Únete en <span className="text-yellow-300 underline">{joinUrl}</span></p>
                <div className="mt-4 flex justify-center gap-2">
                    <Button onClick={() => handleCopy(joinUrl, 'El enlace para unirse ha sido copiado.')} variant="secondary">
                        <Copy className="mr-2 h-4 w-4" /> Copiar Enlace
                    </Button>
                    <Button onClick={() => handleCopy(pin, 'El PIN del juego ha sido copiado.')} variant="secondary">
                        <Copy className="mr-2 h-4 w-4" /> Copiar PIN
                    </Button>
                </div>
            </div>

            <div className="text-center my-6">
                <p className="text-base md:text-xl mb-2">PIN del juego:</p>
                <div className="bg-white text-black py-4 px-8 rounded-lg shadow-2xl inline-block">
                    <p className="text-5xl md:text-8xl font-bold tracking-widest">{pin}</p>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-auto flex items-center justify-between p-4 bg-black/20 rounded-lg min-h-[100px]">
                <div className="flex items-center gap-4">
                    <Users className="h-8 w-8" />
                    <p className="text-4xl font-bold">{players.length}</p>
                </div>
                 <AnimatePresence>
                    <motion.div className="flex flex-wrap justify-center gap-2 max-w-lg">
                        {players.map((player, i) => (
                            <motion.div
                                key={player.userId}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white text-gray-800 font-semibold px-3 py-1 rounded-lg shadow-md"
                            >
                                {player.nickname}
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const QuestionScreen = ({ question, questionIndex, totalQuestions, answersCount }: { question: any, questionIndex: number, totalQuestions: number, answersCount: number }) => {
    const [timer, setTimer] = useState(20);

    useEffect(() => {
        setTimer(20);
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [question]);

    const optionColors = ["bg-red-600", "bg-blue-600", "bg-yellow-500", "bg-green-600"];
    const optionShapes = [
        <path d="M12 2L2 22h20L12 2z" key="triangle"/>, // Triangle
        <path d="M12 2 L22 12 L12 22 L2 12 Z" key="diamond" />, // Diamond
        <circle cx="12" cy="12" r="11" key="circle"/>, // Circle
        <rect x="2" y="2" width="20" height="20" rx="2" key="square"/>, // Square
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full bg-background text-foreground p-4">
             {/* Header */}
            <div className="text-center mb-4">
                <p className="text-2xl font-bold">{question.label}</p>
            </div>
             {/* Main Content */}
            <div className="flex-grow flex items-center justify-between gap-4">
                 {/* Timer */}
                <div className="flex flex-col items-center justify-center h-24 w-24 rounded-full bg-muted shadow-inner">
                    <p className="text-4xl font-bold text-primary">{timer}</p>
                </div>
                 {/* Image/Logo Placeholder */}
                <div className="w-96 h-56 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center rounded-lg shadow-lg">
                    <h1 className="text-5xl font-extrabold text-white opacity-90">Quizz-IT!</h1>
                </div>
                 {/* Answers Count */}
                <div className="flex flex-col items-center justify-center w-24">
                     <p className="text-3xl font-bold">{answersCount}</p>
                    <p className="text-sm font-medium">Respuestas</p>
                </div>
            </div>
            {/* Options */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                {question.options.map((opt: any, index: number) => (
                    <div key={opt.id} className={`${optionColors[index]} flex items-center justify-start p-3 rounded-md shadow-lg text-white`}>
                        <svg viewBox="0 0 24 24" className="h-8 w-8 mr-3 fill-current">
                           {optionShapes[index]}
                        </svg>
                        <p className="font-semibold text-lg">{opt.text}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const ResultsScreen = ({ players, onNext }: { players: any[], onNext: () => void }) => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 5);

    return (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center h-full text-white p-8">
            <Trophy className="h-24 w-24 text-yellow-400 mb-4" />
            <h2 className="text-4xl font-bold mb-8">Ranking</h2>
            <div className="w-full max-w-md space-y-2">
                {sortedPlayers.map((player, index) => (
                    <motion.div
                        key={player.userId}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.15 }}
                        className="flex items-center justify-between bg-white/20 p-4 rounded-lg"
                    >
                        <p className="font-bold text-lg">{index + 1}. {player.nickname}</p>
                        <p className="font-semibold">{player.score.toLocaleString()} pts</p>
                    </motion.div>
                ))}
            </div>
            <Button onClick={onNext} className="mt-12 bg-green-500 hover:bg-green-600">
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </motion.div>
    )
}

// --- Main Host Screen Component ---
export function HostScreen({ sessionId }: { sessionId: string }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    
    const [sessionData, setSessionData] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [answersCount, setAnswersCount] = useState(0);
    const [gameState, setGameState] = useState('LOADING'); // LOADING, LOBBY, QUESTION, RESULTS, FINISHED
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const handleIncomingEvent = useCallback((payload: any) => {
        const event = payload.new.event;
        const data = payload.new.payload;

        if (event === 'PLAYER_JOINED') {
            setPlayers(prev => {
                if(prev.find(p => p.userId === data.userId)) return prev;
                return [...prev, data];
            });
        }
        if (event === 'PLAYER_ANSWERED') {
            setAnswersCount(prev => prev + 1);
        }
    }, []);

    useRealtime(`game:${sessionId}`, handleIncomingEvent);

    useEffect(() => {
        const fetchSession = async () => {
            const res = await fetch(`/api/quizz-it/session/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setSessionData(data);
                setPlayers(data.players);
                setGameState(data.session.status);
            } else {
                setGameState('ERROR');
            }
        };
        fetchSession();
    }, [sessionId]);

    const broadcastState = async (event: string, payload: any = {}) => {
        // Esta función ahora enviará la petición a una API Route para que el servidor haga el broadcast.
        await fetch(`/api/quizz-it/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, event, payload })
        });
    };
    
    const handleStartGame = () => {
        if (players.length === 0) return;
        setCurrentQuestionIndex(0);
        setGameState('GET_READY');
        broadcastState('GET_READY');
        
        setTimeout(() => {
            setAnswersCount(0);
            setGameState('QUESTION');
            broadcastState('NEXT_QUESTION', { question: sessionData.form.fields[0] });
            setTimeout(() => {
                setGameState('RESULTS');
                broadcastState('SHOW_RESULTS');
            }, 20000); // Duración de la pregunta
        }, 5000); // 5 second "get ready" timer
    };

    const handleNext = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < sessionData.form.fields.length) {
            setCurrentQuestionIndex(nextIndex);
            setGameState('GET_READY');
            broadcastState('GET_READY');
            setTimeout(() => {
                setAnswersCount(0);
                setGameState('QUESTION');
                broadcastState('NEXT_QUESTION', { question: sessionData.form.fields[nextIndex] });
                setTimeout(() => {
                    setGameState('RESULTS');
                    broadcastState('SHOW_RESULTS');
                }, 20000); // Duración de la pregunta
            }, 5000);
        } else {
            setGameState('FINISHED');
            broadcastState('GAME_OVER');
        }
    }
    
    if (isAuthLoading || gameState === 'LOADING') {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-900"><Loader2 className="h-12 w-12 text-white animate-spin" /></div>;
    }
    
    if (gameState === 'ERROR' || !sessionData) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">Error al cargar la sesión.</div>;
    }
    
    const renderGameState = () => {
        switch(gameState) {
            case 'LOBBY':
                return <LobbyScreen pin={sessionData.session.pin} players={players} formTitle={sessionData.form.title}/>;
            case 'GET_READY':
                 return <div className="flex flex-col items-center justify-center h-full text-white"><h2 className="text-4xl font-bold animate-pulse">¡Prepárate!</h2></div>
            case 'QUESTION':
                const question = sessionData.form.fields[currentQuestionIndex];
                return <QuestionScreen question={question} questionIndex={currentQuestionIndex} totalQuestions={sessionData.form.fields.length} answersCount={answersCount} />;
            case 'RESULTS':
                 return <ResultsScreen players={players} onNext={handleNext} />;
            case 'FINISHED':
                return <ResultsScreen players={players} onNext={() => router.push('/forms')} />;
            default:
                return <div className="text-white">Estado desconocido</div>;
        }
    }

    return (
        <div className="bg-gradient-to-br from-indigo-800 to-purple-900 h-screen w-screen">
            <div className="absolute top-4 left-4 flex gap-4">
                {gameState === 'LOBBY' && players.length > 0 && (
                    <Button onClick={handleStartGame} className="bg-green-500 hover:bg-green-600 text-lg py-6 px-8 shadow-lg">
                        <Play className="mr-2 h-5 w-5" />
                        Empezar
                    </Button>
                )}
            </div>
            {renderGameState()}
        </div>
    );
}
