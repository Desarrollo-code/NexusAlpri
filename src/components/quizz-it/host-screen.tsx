// src/components/quizz-it/host-screen.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabaseBrowserClient } from '@/lib/supabase-client';
import { Loader2, Users, Music, Play, ChevronRight, BarChart3, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

// --- Sub-components ---

const LobbyScreen = ({ pin, players }: { pin: string, players: any[] }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center text-white p-8">
        <p className="text-xl">Únete en tu dispositivo</p>
        <h1 className="text-4xl font-bold my-4">nexus.alpri/quizz-it/play</h1>
        <p className="text-xl mb-8">PIN del juego:</p>
        <div className="bg-white text-black p-6 rounded-lg shadow-2xl mb-12">
            <p className="text-8xl font-bold tracking-widest">{pin}</p>
        </div>
        <div className="flex items-center gap-4">
            <Users className="h-8 w-8" />
            <p className="text-4xl font-bold">{players.length}</p>
        </div>
        <AnimatePresence>
            <motion.div className="flex flex-wrap justify-center gap-4 mt-8">
                {players.map((player, i) => (
                    <motion.div
                        key={player.userId}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white text-gray-800 font-semibold px-4 py-2 rounded-lg shadow-md"
                    >
                        {player.nickname}
                    </motion.div>
                ))}
            </motion.div>
        </AnimatePresence>
    </motion.div>
);

const QuestionScreen = ({ question, questionIndex, totalQuestions }: { question: any, questionIndex: number, totalQuestions: number }) => {
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

    const optionColors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];
    const optionShapes = [
        <path d="M12 2L2 22h20L12 2z" />, // Triangle
        <rect x="2" y="2" width="20" height="20" rx="4" />, // Square
        <circle cx="12" cy="12" r="11" />, // Circle
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /> // Diamond
    ];

    return (
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col h-full text-white p-8">
            <div className="text-center mb-8">
                <p className="text-2xl font-bold">{question.label}</p>
            </div>
            <div className="flex-grow flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <p className="text-8xl font-bold opacity-80">{timer}</p>
                </div>
                {/* Placeholder for an image if available */}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {question.options.map((opt: any, index: number) => (
                    <div key={opt.id} className={`${optionColors[index]} flex items-center justify-start p-4 rounded-lg shadow-lg`}>
                        <svg viewBox="0 0 24 24" className="h-8 w-8 mr-4 fill-current">
                           {optionShapes[index]}
                        </svg>
                        <p className="font-semibold text-lg">{opt.text}</p>
                    </div>
                ))}
            </div>
            <div className="text-center mt-4 text-sm">{questionIndex + 1} / {totalQuestions}</div>
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
            <Button onClick={onNext} className="mt-12">
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
    const [gameState, setGameState] = useState('LOADING'); // LOADING, LOBBY, QUESTION, RESULTS, FINISHED
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const handleIncomingMessage = useCallback((payload: any) => {
        if (payload.new.event === 'PLAYER_JOINED') {
            setPlayers(prev => [...prev, payload.new.payload]);
        }
    }, []);

    useEffect(() => {
        if (!sessionId) return;
        const channel = supabaseBrowserClient.channel(`game:${sessionId}`);
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'RealtimeMessage', filter: `channel=eq.game:${sessionId}`}, handleIncomingMessage).subscribe();
        return () => { channel.unsubscribe(); };
    }, [sessionId, handleIncomingMessage]);

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
    
    const handleStartGame = () => {
        // Send a message to Supabase to update game state
        setGameState('QUESTION');
    };

    const handleNext = () => {
        if (gameState === 'RESULTS') {
            if (currentQuestionIndex + 1 < sessionData.form.fields.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setGameState('QUESTION');
            } else {
                setGameState('FINISHED');
            }
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
                return <LobbyScreen pin={sessionData.session.pin} players={players} />;
            case 'QUESTION':
                const question = sessionData.form.fields[currentQuestionIndex];
                return <QuestionScreen question={question} questionIndex={currentQuestionIndex} totalQuestions={sessionData.form.fields.length} />;
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
                    <Button onClick={handleStartGame} className="bg-green-500 hover:bg-green-600">
                        <Play className="mr-2 h-4 w-4" />
                        Empezar
                    </Button>
                )}
            </div>
            {renderGameState()}
        </div>
    );
}
