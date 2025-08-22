// src/components/forms/form-results-view.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Users, ListChecks, MessageSquare, BarChart, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Bar, XAxis, YAxis, CartesianGrid, ComposedChart } from 'recharts';
import { ScrollArea } from '../ui/scroll-area';

interface FormResults {
    totalResponses: number;
    fields: {
        id: string;
        label: string;
        type: string;
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

const FieldResultCard = ({ field }: { field: FormResults['fields'][0] }) => {
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
             return (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary"/>{field.label}</CardTitle>
                        <CardDescription>Distribución de respuestas</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" scale="band" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="value" barSize={20} name="Respuestas">
                                    {chartData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Resumen General</CardTitle>
                    <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{results.totalResponses}</p>
                    <p className="text-xs text-muted-foreground">respuesta{results.totalResponses !== 1 && 's'} en total</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results.fields.map(field => (
                    <FieldResultCard key={field.id} field={field} />
                ))}
            </div>
        </div>
    );
};
