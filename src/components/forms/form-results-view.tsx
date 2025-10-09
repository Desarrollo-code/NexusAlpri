// src/components/forms/form-results-view.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Users, ListChecks, MessageSquare, BarChart, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Bar, XAxis, YAxis, CartesianGrid, ComposedChart } from 'recharts';
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
    responses?: any[]; // To show individual scores
    fields: {
        id: string;
        label: string;
        type: string;
        options: FormFieldOption[]; // Added for quiz correct answer display
        stats: any; // Can be counts for choices or list of text answers
    }[];
}

interface FormResultsViewProps {
    formId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-background/80 border rounded-lg shadow-lg">
        <p className="font-bold">{`${label}`}</p>
        <p className="text-primary">{`Respuestas: ${payload[0].value}`}</p>
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
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary"/>{field.label}</CardTitle>
                        <CardDescription>{field.stats.length} respuestas de texto.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48 border rounded-md p-2 bg-muted/50">
                           {field.stats.length > 0 ? (
                             <ul className="space-y-2">
                                {field.stats.map((answer: string, index: number) => (
                                    <li key={index} className="text-sm border-b pb-1">“{answer}”</li>
                                ))}
                            </ul>
                           ) : <p className="text-sm text-center text-muted-foreground pt-4">Sin respuestas</p>}
                        </ScrollArea>
                    </CardContent>
                </Card>
            );
        case 'MULTIPLE_CHOICE':
        case 'SINGLE_CHOICE':
             const chartData = field.stats.map((stat: any) => ({ name: stat.option, value: stat.count }));
             const correctOptionText = field.options?.find(o => o.isCorrect)?.text;
             return (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary"/>{field.label}</CardTitle>
                        <CardDescription>Distribución de respuestas</CardDescription>
                        {isQuiz && correctOptionText && <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 w-fit">Correcta: {correctOptionText}</Badge>}
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" scale="band" width={120} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="value" barSize={20} name="Respuestas">
                                    {chartData.map((entry: any, index: number) => {
                                        const isCorrect = isQuiz && entry.name === correctOptionText;
                                        return <Cell key={`cell-${index}`} fill={isCorrect ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'} />
                                    })}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
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
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="text-center py-12 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>Error al cargar: {error}</p></div>;
    }
    
     if (!results || results.totalResponses === 0) {
        return (
            <Card className="text-center py-16">
                 <CardHeader>
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                    <CardTitle>Aún no hay respuestas</CardTitle>
                    <CardDescription>Comparte el formulario para empezar a recolectar datos.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Resumen General</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-3xl font-bold">{results.totalResponses}</p>
                            <p className="text-xs text-muted-foreground">respuesta{results.totalResponses !== 1 && 's'} en total</p>
                        </div>
                    </div>
                    {results.isQuiz && (
                         <div className="flex items-center gap-4 p-4 border rounded-lg">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-3xl font-bold">{results.averageScore?.toFixed(1) || '0.0'}%</p>
                                <p className="text-xs text-muted-foreground">Puntuación Promedio</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {results.isQuiz && results.responses && (
                <Card>
                    <CardHeader><CardTitle>Resultados Individuales</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead className="text-right">Puntuación</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.responses.map(res => (
                                    <TableRow key={res.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={res.user.avatar || undefined} />
                                                    <AvatarFallback><Identicon userId={res.user.id} /></AvatarFallback>
                                                </Avatar>
                                                {res.user.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{res.score?.toFixed(1) || 'N/A'}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results.fields.map(field => (
                    <FieldResultCard key={field.id} field={field} isQuiz={results.isQuiz} />
                ))}
            </div>
        </div>
    );
};
    
