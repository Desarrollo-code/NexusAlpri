// src/app/(app)/quizz-it/[sessionId]/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { QuizGameView } from '@/components/quizz-it/quiz-game-view';
import type { AppForm } from '@/types';
import { useTitle } from '@/contexts/title-context';

export default function QuizzITSessionPage({ params }: { params: { sessionId: string } }) {
    const { sessionId } = params;
    const { toast } = useToast();
    const router = useRouter();
    const { setPageTitle } = useTitle();
    
    const [form, setForm] = useState<AppForm | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFormForSession = async () => {
            setIsLoading(true);
            try {
                // El sessionId es el formId en este contexto asíncrono
                const res = await fetch(`/api/forms/${sessionId}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'No se pudo cargar el quiz.');
                }
                const formData: AppForm = await res.json();
                
                if (formData.status !== 'PUBLISHED' || !formData.isQuiz) {
                    throw new Error('Este quiz no está disponible para ser jugado.');
                }
                
                setForm(formData);
                setPageTitle(`Quizz-IT: ${formData.title}`);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
                toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudo iniciar la sesión de quiz.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchFormForSession();
    }, [sessionId, toast, setPageTitle]);
    
    if (isLoading) {
        return (
            <div className="flex h-full min-h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex h-full min-h-[calc(100vh-10rem)] items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>
                        <CardTitle>Error al cargar el Quiz</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/forms')}>Volver a Formularios</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!form) return null;

    return <QuizGameView form={form} />;
}
