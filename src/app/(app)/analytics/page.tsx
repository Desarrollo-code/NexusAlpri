
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BookCopy, PieChart as PieChartIcon, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserAnalyticsData, CourseAnalyticsData, ProgressAnalyticsData, Course as AppCourse } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CourseCarousel } from '@/components/course-carousel';
import { cn } from '@/lib/utils';
import { GradientIcon } from '@/components/ui/gradient-icon';

interface AnalyticsData {
  userStats: UserAnalyticsData | null;
  courseStats: CourseAnalyticsData | null;
  progressStats: ProgressAnalyticsData | null;
}

const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => {
    return (
        <Card className="shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <GradientIcon icon={icon} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
};

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-2))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-1))" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const categoryChartConfig = {
  count: { label: "Cursos" },
  "Recursos Humanos": { label: "RRHH", color: "hsl(var(--chart-1))" },
  "TI y Seguridad": { label: "TI", color: "hsl(var(--chart-2))" },
  Marketing: { label: "Marketing", color: "hsl(var(--chart-3))" },
  Ventas: { label: "Ventas", color: "hsl(var(--chart-4))" },
  General: { label: "General", color: "hsl(var(--chart-5))" },
  Legal: { label: "Legal", color: `hsl(var(--chart-1) / 0.5)` },
  Operaciones: { label: "Operaciones", color: `hsl(var(--chart-2) / 0.5)` },
  Finanzas: { label: "Finanzas", color: `hsl(var(--chart-3) / 0.5)` },
  'Formación Interna': { label: 'Formación', color: `hsl(var(--chart-4) / 0.5)` },
  'Documentación de Producto': { label: 'Producto', color: `hsl(var(--chart-5) / 0.5)` },
} satisfies ChartConfig;


export default function AnalyticsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [userRes, courseRes, progressRes] = await Promise.all([
                fetch('/api/analytics/users'),
                fetch('/api/analytics/courses'),
                fetch('/api/analytics/progress')
            ]);
            
            if (!userRes.ok || !courseRes.ok || !progressRes.ok) {
                const errorDetails = [
                    userRes.ok ? '' : `Usuarios: ${userRes.statusText}`,
                    courseRes.ok ? '' : `Cursos: ${courseRes.statusText}`,
                    progressRes.ok ? '' : `Progreso: ${progressRes.statusText}`,
                ].filter(Boolean).join(', ');
                throw new Error(`Falló la carga de datos. Errores: ${errorDetails}`);
            }

            const userStats = await userRes.json();
            const courseStats = await courseRes.json();
            const progressStats = await progressRes.json();

            setData({ userStats, courseStats, progressStats });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al cargar analíticas');
            toast({ title: 'Error', description: 'No se pudieron cargar los datos de analíticas.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        if (user) {
            fetchAnalytics();
        }
    }, [isAuthLoading, user, router, fetchAnalytics]);

    const userRolesChartData = useMemo(() => {
        if (!data?.userStats) return [];
        const order: ('STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR')[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
        return order.map(role => ({
            role: userRolesChartConfig[role]?.label || role,
            count: data.userStats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role]?.color || 'hsl(var(--muted))'
        }));
    }, [data?.userStats]);
    
    const categoryChartData = useMemo(() => {
        if (!data?.courseStats) return [];
        return data.courseStats.coursesByCategory.map(cat => ({
            ...cat,
            fill: categoryChartConfig[cat.category as keyof typeof categoryChartConfig]?.color || `hsl(${Math.random() * 360}, 70%, 50%)`
        }));
    }, [data?.courseStats]);
    
    const averageScore = useMemo(() => {
        if (!data?.courseStats?.averageQuizScore) return 0;
        return data.courseStats.averageQuizScore;
    }, [data?.courseStats]);

    if (isAuthLoading || isLoading) {
      return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <Skeleton className="h-80" />
                 <Skeleton className="h-80" />
            </div>
        </div>
      );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">{error}</p>
                <Button onClick={fetchAnalytics} variant="outline" className="mt-4">
                    Reintentar
                </Button>
            </div>
        );
    }
    
    if (!data) return null;

    const totalUsers = data.userStats?.usersByRole.reduce((acc, r) => acc + r.count, 0) || 0;
    const totalCourses = data.courseStats?.coursesByCategory.reduce((acc, c) => acc + c.count, 0) || 0;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Panel de Analíticas</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Usuarios" value={totalUsers} icon={Users} description={`Total de usuarios registrados.`} />
                <StatCard title="Total Cursos" value={totalCourses} icon={BookCopy} description={`Tasa media de finalización: ${data.courseStats?.averageCompletionRate.toFixed(1)}%`} />
                <StatCard title="Inscripciones" value={data.progressStats?.activeStudentsInCourses || 0} icon={UserCheck} description={`Tasa de abandono: ${data.progressStats?.dropoutRate.toFixed(1)}%`} />
                <StatCard title="Puntuación Media" value={`${averageScore.toFixed(1)}%`} icon={TrendingUp} description="En todos los quices"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Nuevos Registros (Últimos 30 días)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 w-full">
                        <ChartContainer config={{ count: { label: 'Nuevos usuarios', color: 'hsl(var(--primary))' } }}>
                            <AreaChart data={data.userStats?.newUsersLast30Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs><linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNewUsers)" />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Distribución de Usuarios por Rol</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 w-full">
                        <ChartContainer config={userRolesChartConfig}>
                            <BarChart data={userRolesChartData} margin={{ top: 20, right: 20, left: -5, bottom: 5 }}>
                                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="role" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                                <ChartTooltip cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} content={<ChartTooltipContent />} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                  {userRolesChartData.map((entry) => (
                                    <Cell key={`cell-${entry.role}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold font-headline">Analíticas de Cursos</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-lg">
                   <CardHeader>
                        <CardTitle>Top 5 Cursos Más Populares</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {data.courseStats && data.courseStats.mostEnrolledCourses.length > 0 ? (
                           <CourseCarousel courses={data.courseStats.mostEnrolledCourses as AppCourse[]} userRole={user?.role || 'ADMINISTRATOR'} />
                       ) : (
                          <p className="text-muted-foreground text-center py-8">No hay suficientes datos de inscripción.</p>
                       )}
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PieChartIcon className="text-primary"/> Cursos por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ChartContainer config={categoryChartConfig}>
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="count" hideIndicator />} />
                                <Pie data={categoryChartData} dataKey="count" nameKey="category" innerRadius={60} outerRadius={80} paddingAngle={2}>
                                    {categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList
                                        dataKey="category"
                                        className="fill-muted-foreground"
                                        fontSize={12}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
              </div>
            </div>
        </div>
    );
}

    