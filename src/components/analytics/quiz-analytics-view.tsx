// src/components/analytics/quiz-analytics-view.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Users, Target, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar, TooltipProps, ComposedChart, Cell } from 'recharts';
import type { FormFieldOption } from '@/types';


interface QuizAnalytics {
    quizId: string;
    quizTitle: string;
    totalAttempts: number;
    averageScore: number;
    questionAnalytics: {
        questionId: string;
        questionText: string;
        successRate: number;
        totalAnswers: number;
        options: {
            optionId: string;
            text: string;
            isCorrect: boolean;
            selectionCount: number;
            selectionPercentage: number;
        }[];
    }[];
}

interface QuizAnalyticsViewProps {
    quizId: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/90 p-2 shadow-sm backdrop-blur-sm">
        <p className="font-bold">{`${label}`}</p>
        <p className="text-primary">{`Respuestas: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


export const QuizAnalyticsView: React.FC<QuizAnalyticsViewProps> = ({ quizId }) => {
    const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/analytics/quiz/${quizId}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to fetch analytics');
                }
                const data = await res.json();
                setAnalytics(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                toast({ title: "Error", description: "No se pudieron cargar las analíticas.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [quizId, toast]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="text-center py-12 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>Error al cargar: {error}</p></div>;
    }
    
    if (!analytics || analytics.totalAttempts === 0) {
        return <div className="text-center py-16 text-muted-foreground"><p>Todavía no hay intentos para este quiz.</p></div>
    }

    return (
        <ScrollArea className="h-full pr-6">
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Intentos Totales</CardTitle>
                           <Users className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                           <div className="text-2xl font-bold">{analytics.totalAttempts}</div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Puntuación Promedio</CardTitle>
                           <Target className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                           <div className="text-2xl font-bold">{analytics.averageScore}%</div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h3 className="text-lg font-semibold mb-4">Análisis por Pregunta</h3>
                    <div className="space-y-4">
                        {analytics.questionAnalytics.map((q, index) => (
                            <Card key={q.questionId} className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-base">Pregunta {index + 1}: {q.questionText}</CardTitle>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                                        <span>Tasa de acierto: <span className="font-bold text-foreground">{Math.round(q.successRate)}%</span></span>
                                        <span>({q.totalAnswers} respuestas)</span>
                                    </div>
                                    <Progress value={q.successRate} className="mt-2 h-2"/>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="text-sm font-semibold mb-2">Distribución de Respuestas</h4>
                                     <div className="h-40">
                                         <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart layout="vertical" data={q.options.map(o => ({name: o.text, value: o.selectionCount, isCorrect: o.isCorrect}))} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" allowDecimals={false} />
                                                <YAxis dataKey="name" type="category" scale="band" width={120} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                                <Bar dataKey="value" barSize={15} name="Respuestas">
                                                    {q.options.map((entry, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={entry.isCorrect ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'} />
                                                    ))}
                                                </Bar>
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
};
