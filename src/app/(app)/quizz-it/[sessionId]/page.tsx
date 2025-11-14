// src/app/(app)/quizz-it/[sessionId]/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { QuizGameView } from '@/components/quizz-it/quiz-game-view';
import type { AppForm } from '@/types';
import { useTitle } from '@/contexts/title-context';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { Skeleton } from '@/components/ui/skeleton';

const QuizSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)] gap-8">
      <Skeleton className="h-32 w-full max-w-2xl" />
      <Skeleton className="h-64 w-full max-w-lg" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
      </div>
  </div>
);

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
        return <QuizSkeleton />;
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
