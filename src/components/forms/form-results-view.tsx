// src/components/forms/form-results-view.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Users, ListChecks, MessageSquare, BarChart, FileText, CheckCircle, Award, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Legend } from 'recharts';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import type { FormFieldOption } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface FormResults {
    formTitle: string;
    isQuiz: boolean;
    totalResponses: number;
    averageScore?: number;
    responses?: any[];
    fields: {
        id: string;
        label: string;
        type: string;
        options: FormFieldOption[];
        stats: any;
    }[];
}

interface FormResultsViewProps {
    formId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 text-sm bg-background/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl">
        <p className="font-bold text-lg mb-1">{`${label}`}</p>
        <p className="text-primary font-semibold flex items-center gap-2">
            <BarChart className="h-4 w-4"/>
            {`Respuestas: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const FieldResultCard = ({ field, isQuiz }: { field: FormResults['fields'][0], isQuiz: boolean }) => {
    switch (field.type) {
        case 'SHORT_TEXT':
        case 'LONG_TEXT':
            return (
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 group">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                        <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <MessageSquare className="h-5 w-5 text-primary"/>
                            </div>
                            {field.label}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-semibold">
                                {field.stats.length} respuesta{field.stats.length !== 1 && 's'}
                            </Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ScrollArea className="h-64 rounded-xl border-2 p-4 bg-gradient-to-br from-muted/30 to-muted/10">
                           {field.stats.length > 0 ? (
                             <ul className="space-y-3">
                                {field.stats.map((answer: string, index: number) => (
                                    <li 
                                        key={index} 
                                        className="text-sm p-3 rounded-lg bg-background/80 border hover:border-primary/50 transition-all duration-200 hover:shadow-md"
                                    >
                                        <span className="text-xs text-muted-foreground font-semibold mr-2">#{index + 1}</span>
                                        "{answer}"
                                    </li>
                                ))}
                            </ul>
                           ) : (
                               <div className="flex flex-col items-center justify-center h-full text-center">
                                   <FileText className="h-12 w-12 text-muted-foreground/30 mb-3"/>
                                   <p className="text-sm text-muted-foreground">Sin respuestas aún</p>
                               </div>
                           )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            );
        case 'MULTIPLE_CHOICE':
        case 'SINGLE_CHOICE':
             const chartData = field.stats.map((stat: any) => ({ name: stat.option, value: stat.count }));
             const correctOptionText = field.options?.find(o => o.isCorrect)?.text;
             const totalResponses = chartData.reduce((sum: number, item: any) => sum + item.value, 0);
             
             return (
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 group">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                        <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <ListChecks className="h-5 w-5 text-primary"/>
                            </div>
                            {field.label}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="font-semibold">
                                {totalResponses} respuesta{totalResponses !== 1 && 's'}
                            </Badge>
                            {isQuiz && correctOptionText && (
                                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                                    <Target className="h-3 w-3 mr-1"/>
                                    Correcta: {correctOptionText}
                                </Badge>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart 
                                    layout="vertical" 
                                    data={chartData} 
                                    margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis 
                                        type="number" 
                                        allowDecimals={false}
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        scale="band" 
                                        width={140} 
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                    <Bar dataKey="value" barSize={24} name="Respuestas" radius={[0, 8, 8, 0]}>
                                        {chartData.map((entry: any, index: number) => {
                                            const isCorrect = isQuiz && entry.name === correctOptionText;
                                            return (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={isCorrect ? 'hsl(var(--primary))' : COLORS[index % COLORS.length]}
                                                    className="hover:opacity-80 transition-opacity"
                                                />
                                            );
                                        })}
                                    </Bar>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            );
        default:
            return null;
    }
}


export const FormResultsView: React.FC<FormResultsViewProps> = ({ formId }) => {
    const [results, setResults] = useState<FormResults | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/forms/${formId}/results`);
                if (!res.ok) throw new Error((await res.json()).message || 'No se pudieron cargar los resultados.');
                const data = await res.json();
                setResults(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
                toast({ title: "Error", description: "No se pudieron cargar los resultados.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, [formId, toast]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando resultados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="text-center py-16 border-2 border-destructive/20 bg-destructive/5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-lg font-semibold text-destructive">Error al cargar</p>
                <p className="text-muted-foreground mt-2">{error}</p>
            </Card>
        );
    }
    
     if (!results || results.totalResponses === 0) {
        return (
            <Card className="text-center py-20 border-2 border-dashed hover:border-primary/50 transition-all duration-300">
                 <CardHeader>
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6">
                        <FileText className="h-10 w-10 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl mb-2">Aún no hay respuestas</CardTitle>
                    <CardDescription className="text-lg">
                        Comparte el formulario para empezar a recolectar datos valiosos.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Card className="overflow-hidden shadow-xl border-2">
                <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-primary"/>
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-8">
                    <CardTitle className="text-2xl flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <BarChart className="h-6 w-6 text-primary"/>
                        </div>
                        Resumen General
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                    <div className="relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"/>
                        <div className="relative flex items-center gap-6 p-6 border-2 rounded-xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <p className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    {results.totalResponses}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium mt-1">
                                    respuesta{results.totalResponses !== 1 && 's'} en total
                                </p>
                            </div>
                        </div>
                    </div>
                    {results.isQuiz && (
                         <div className="relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"/>
                            <div className="relative flex items-center gap-6 p-6 border-2 rounded-xl hover:border-green-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-green-500/5">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                                    <Award className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                                        {results.averageScore?.toFixed(1) || '0.0'}%
                                    </p>
                                    <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3"/>
                                        Puntuación Promedio
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {results.isQuiz && results.responses && (
                <Card className="overflow-hidden shadow-xl border-2">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="h-5 w-5 text-primary"/>
                            </div>
                            Resultados Individuales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/70">
                                        <TableHead className="font-bold">Usuario</TableHead>
                                        <TableHead className="text-right font-bold">Puntuación</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.responses.map((res, index) => (
                                        <TableRow 
                                            key={res.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                                                        <AvatarImage src={res.user.avatar || undefined} />
                                                        <AvatarFallback><Identicon userId={res.user.id} /></AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{res.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">Participante #{index + 1}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge 
                                                    variant="secondary" 
                                                    className={cn(
                                                        "text-lg font-bold px-4 py-1",
                                                        (res.score || 0) >= 70 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                                                        (res.score || 0) < 70 && (res.score || 0) >= 50 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                                                        (res.score || 0) < 50 && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                    )}
                                                >
                                                    {res.score?.toFixed(1) || 'N/A'}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <BarChart className="h-6 w-6 text-primary"/>
                    </div>
                    Análisis por Pregunta
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {results.fields.map((field, index) => (
                        <div 
                            key={field.id}
                            className="animate-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <FieldResultCard field={field} isQuiz={results.isQuiz} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}