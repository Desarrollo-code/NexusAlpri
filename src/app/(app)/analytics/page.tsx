
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, BarChart3, Users, BookOpenCheck, Download, FileText, Activity, UsersRound, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from "recharts";
import type { AnalyticsSummary } from '@/app/api/analytics/summary/route';
import { cn } from '@/lib/utils';


// --- Chart Configurations ---
const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const courseStatusChartConfig = {
  count: { label: "Cursos" },
  PUBLISHED: { label: "Publicados", color: "hsl(var(--chart-1))" },
  DRAFT: { label: "Borrador", color: "hsl(var(--chart-2))" },
  ARCHIVED: { label: "Archivados", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

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
                            {isPositive ? '+' : ''}{trend.toFixed(1)}% últimos 7 días
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
    
    const userRolesChartData = React.useMemo(() => {
        if (!summary?.usersByRole) return [];
        const order: ('STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR')[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
        return order.map(role => ({
            role: userRolesChartConfig[role]?.label || role,
            count: summary.usersByRole.find(item => item.role === role)?.count || 0,
        }));
    }, [summary?.usersByRole]);

    const courseStatusChartData = React.useMemo(() => {
        if (!summary?.coursesByStatus) return [];
        const order: ('DRAFT' | 'PUBLISHED' | 'ARCHIVED')[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
        return order.map(status => ({
            status: courseStatusChartConfig[status]?.label || status,
            count: summary.coursesByStatus.find(item => item.status === status)?.count || 0,
        }));
    }, [summary?.coursesByStatus]);

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

                    <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><Users /> Distribución de Usuarios por Rol</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {userRolesChartData.length > 0 ? (
                                    <ChartContainer config={userRolesChartConfig} className="h-[250px] w-full">
                                        <ResponsiveContainer>
                                            <BarChart data={userRolesChartData} layout="vertical" margin={{ left: 20 }}>
                                                <YAxis dataKey="role" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={80}/>
                                                <XAxis type="number" hide />
                                                <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                                <Bar dataKey="count" layout="vertical" radius={4}>
                                                    {userRolesChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (<p className="text-muted-foreground text-center py-4">No hay datos de usuarios.</p>)}
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><BookOpenCheck /> Estado General de Cursos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {courseStatusChartData.length > 0 ? (
                                    <ChartContainer config={courseStatusChartConfig} className="h-[250px] w-full">
                                        <ResponsiveContainer>
                                            <BarChart data={courseStatusChartData} margin={{ top: 20, right: 20, left: -5, bottom: 5 }} barGap={4}>
                                                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                                                <ChartTooltip cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} content={<ChartTooltipContent />} />
                                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                    {courseStatusChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (<p className="text-muted-foreground text-center py-4">No hay datos de cursos.</p>)}
                            </CardContent>
                        </Card>
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
