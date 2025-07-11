
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, Download, FileText, TrendingUp, TrendingDown, Users, BookOpenCheck, Activity, UsersRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { AnalyticsSummary } from '@/app/api/analytics/summary/route';
import { cn } from '@/lib/utils';

// --- Stat Card Component ---
const StatCard = ({ title, value, icon: Icon, trend, href }: { title: string; value: number; icon: React.ElementType; trend?: number; href?: string }) => {
    const hasTrend = typeof trend === 'number';
    const isPositive = hasTrend && trend >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const Wrapper = href ? Link : 'div';
  
    return (
        <Wrapper href={href || '#'}>
            <Card className={cn(href && "hover:bg-muted/50 transition-colors shadow-sm hover:shadow-md")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value.toLocaleString('es-CO')}</div>
                    {hasTrend && (
                        <p className={cn("text-xs flex items-center", isPositive ? "text-green-500" : "text-red-500")}>
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {isPositive ? '+' : ''}{trend.toFixed(1)}% respecto a los últimos 7 días
                        </p>
                    )}
                </CardContent>
            </Card>
        </Wrapper>
    );
};


export default function AnalyticsPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analytics/summary');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch analytics summary');
            }
            const data: AnalyticsSummary = await response.json();
            setSummary(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching data');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not load analytics.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchSummary();
    }, [currentUser, router, fetchSummary]);

    if (currentUser?.role !== 'ADMINISTRATOR') {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline mb-2">Informes y Analíticas</h1>
                <p className="text-muted-foreground">Analiza el rendimiento y la actividad de la plataforma.</p>
            </div>
            
            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando analíticas...</p></div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-destructive"><AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">{error}</p><Button onClick={fetchSummary} variant="outline" className="mt-4">Reintentar</Button></div>
            ) : summary ? (
                <>
                    <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total de Usuarios" value={summary.totalUsers} icon={Users} trend={summary.userTrend} href="/users" />
                        <StatCard title="Total de Cursos" value={summary.totalCourses} icon={BookOpenCheck} trend={summary.courseTrend} href="/manage-courses" />
                        <StatCard title="Cursos Publicados" value={summary.totalPublishedCourses} icon={Activity} />
                        <StatCard title="Total Inscripciones" value={summary.totalEnrollments} icon={UsersRound} />
                    </section>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Informes Descargables</CardTitle>
                            <CardDescription>Genera y descarga informes detallados para un análisis más profundo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Nombre del Informe</TableHead>
                                       <TableHead>Descripción</TableHead>
                                       <TableHead className="text-right">Acciones</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   <TableRow>
                                       <TableCell className="font-medium">Resumen de Progreso de Estudiantes</TableCell>
                                       <TableCell className="text-muted-foreground">Un informe general del progreso de todos los estudiantes en los cursos inscritos.</TableCell>
                                       <TableCell className="text-right space-x-2">
                                           <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> CSV</Button>
                                           <Button variant="outline" size="sm" disabled><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                                       </TableCell>
                                   </TableRow>
                                   <TableRow>
                                       <TableCell className="font-medium">Popularidad y Finalización de Cursos</TableCell>
                                       <TableCell className="text-muted-foreground">Analiza qué cursos son los más populares y cuáles tienen la mayor tasa de finalización.</TableCell>
                                        <TableCell className="text-right space-x-2">
                                           <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> CSV</Button>
                                           <Button variant="outline" size="sm" disabled><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                                       </TableCell>
                                   </TableRow>
                               </TableBody>
                           </Table>
                           <p className="text-center text-sm text-muted-foreground mt-4 italic">Más informes estarán disponibles próximamente.</p>
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
