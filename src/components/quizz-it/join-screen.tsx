// src/components/quizz-it/join-screen.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

export function JoinScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [pin, setPin] = useState('');
    const [nickname, setNickname] = useState(user?.name || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin || !nickname) {
            setError("Tanto el PIN como el apodo son obligatorios.");
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/quizz-it/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, nickname }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'No se pudo unir al juego.');
            }
            router.push(`/quizz-it/player/${data.gameSessionId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-full w-fit mb-4">
                            <Ticket className="h-8 w-8" />
                        </div>
                        <CardTitle>Unirse a Quizz-IT</CardTitle>
                        <CardDescription>Introduce el PIN del juego para empezar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <Input
                                value={pin}
                                onChange={(e) => setPin(e.target.value.toUpperCase())}
                                placeholder="PIN del juego"
                                className="text-center text-2xl font-bold tracking-[0.5em] h-14"
                                maxLength={6}
                                disabled={isLoading}
                            />
                            <Input
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Tu apodo"
                                className="h-12"
                                required
                                disabled={isLoading}
                            />
                             {error && <p className="text-sm text-destructive text-center">{error}</p>}
                            <Button type="submit" className="w-full h-12" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : '¡Entrar!'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
