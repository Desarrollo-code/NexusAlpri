
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BookCopy, Clock, GitCommitHorizontal, TrendingUp, UserCheck, Users, UsersRound, PieChart as PieChartIcon, LineChart, ShieldCheck, Activity, BarChart3, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart as RechartsBarChart, CartesianGrid, LabelList, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import type { UserAnalyticsData, CourseAnalyticsData, ProgressAnalyticsData, SecurityLog as AppSecurityLog, Course as AppCourse, SecurityLogEvent, User as AppUser } from '@/types';
import { getEventDetails, getInitials } from '@/lib/security-log-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { GaugeChart } from '@/components/ui/gauge';

interface AnalyticsData {
  userStats: UserAnalyticsData | null;
  courseStats: CourseAnalyticsData | null;
  progressStats: ProgressAnalyticsData | null;
  securityLogs: AppSecurityLog[] | null;
}

const MetricCard = ({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: React.ElementType; description?: string }) => (
    <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
            <Icon className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-zinc-500">{description}</p>}
        </CardContent>
    </Card>
);

const MetricItem = ({ title, value }: { title: string; value: string | number; }) => (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-sm text-zinc-400">{title}</p>
        <p className="font-semibold">{value}</p>
    </div>
);


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

const Section = ({ title, icon: Icon, children, className }: { title: string; icon: React.ElementType, children: React.ReactNode, className?: string }) => (
    <section className={className}>
        <h2 className="text-xl font-semibold font-headline flex items-center gap-3 mb-4">
            <Icon className="text-primary" /> {title}
        </h2>
        {children}
    </section>
);


const UserAnalyticsSection = ({ stats }: { stats: UserAnalyticsData }) => {
    const userRolesChartData = useMemo(() => {
        const order: ('STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR')[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
        return order.map(role => ({
            role: userRolesChartConfig[role]?.label || role,
            count: stats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role]?.color || 'hsl(var(--muted))'
        }));
    }, [stats.usersByRole]);
    const totalUsers = stats.usersByRole.reduce((acc, r) => acc + r.count, 0) || 0;

    return (
        <Section title="Analíticas de Usuarios" icon={UsersRound}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Usuarios" value={totalUsers} icon={Users} description={`${stats.activeUsersLast7Days} activos esta semana`} />
                <Card className="col-span-1 sm:col-span-2 lg:col-span-3 bg-zinc-900 border-zinc-800 shadow-lg p-2">
                    <ChartContainer config={{ count: { label: 'Nuevos usuarios', color: 'hsl(var(--primary))' } }} className="h-full w-full">
                       <p className="text-sm font-medium text-zinc-400 p-4 pb-0">Nuevos Registros (Últimos 30 días)</p>
                        <AreaChart data={stats.newUsersLast30Days} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <defs><linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNewUsers)" />
                        </AreaChart>
                    </ChartContainer>
                </Card>
            </div>
             <Card className="mt-6 bg-zinc-900 border-zinc-800 shadow-lg p-2">
                <ChartContainer config={userRolesChartConfig} className="h-[200px] w-full">
                     <p className="text-sm font-medium text-zinc-400 p-4 pb-0">Distribución de Usuarios por Rol</p>
                    <RechartsBarChart data={userRolesChartData} margin={{ top: 20, right: 20, left: -5, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="role" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <ChartTooltip cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {userRolesChartData.map((entry) => (<Cell key={`cell-${entry.role}`} fill={entry.fill} />))}
                        </Bar>
                    </RechartsBarChart>
                </ChartContainer>
            </Card>
        </Section>
    );
};

const CourseAnalyticsSection = ({ stats }: { stats: CourseAnalyticsData }) => {
     const categoryChartData = useMemo(() => {
        if (!stats?.coursesByCategory) return [];
        return stats.coursesByCategory.map(cat => ({
            ...cat,
            fill: categoryChartConfig[cat.category as keyof typeof categoryChartConfig]?.color || `hsl(${Math.random() * 360}, 70%, 50%)`
        }));
    }, [stats?.coursesByCategory]);

    return (
        <Section title="Analíticas de Cursos y Contenido" icon={ListChecks}>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <MetricCard title="Cursos Totales" value={stats.coursesByCategory.reduce((acc, c) => acc + c.count, 0)} icon={BookCopy} />
                 <MetricCard title="Puntuación Media" value={`${stats.averageQuizScore.toFixed(1)}%`} icon={TrendingUp} description="En todos los quices"/>
             </div>
             <Card className="mt-6 bg-zinc-900 border-zinc-800 shadow-lg p-4">
                 <CardTitle className="text-base font-medium text-zinc-400 flex items-center gap-2 mb-4"><PieChartIcon /> Cursos por Categoría</CardTitle>
                 <ChartContainer config={categoryChartConfig} className="h-52 w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="count" hideIndicator />} />
                        <Pie data={categoryChartData} dataKey="count" nameKey="category" innerRadius={50} outerRadius={70} paddingAngle={2} startAngle={-120} endAngle={240}>
                            {categoryChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
             </Card>
        </Section>
    );
};

const ProgressAnalyticsSection = ({ stats }: { stats: ProgressAnalyticsData }) => (
    <Section title="Analíticas de Progreso" icon={Activity}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <MetricCard title="Estudiantes Activos" value={stats.activeStudentsInCourses} icon={UserCheck} description="Con progreso en cursos" />
            <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-4">
                <Card className="bg-zinc-900 border-zinc-800 shadow-lg p-4 text-center flex flex-col justify-center">
                    <CardTitle className="text-sm font-medium text-zinc-400 mb-2">Finalización Media</CardTitle>
                    <p className="text-2xl font-bold">{stats.averageCompletionTimeDays.toFixed(1)} <span className="text-base text-zinc-500">días</span></p>
                </Card>
                 <Card className="bg-zinc-900 border-zinc-800 shadow-lg p-4 text-center">
                    <CardTitle className="text-sm font-medium text-zinc-400 mb-2">Tasa de Abandono</CardTitle>
                    <GaugeChart value={stats.dropoutRate} size="sm" />
                </Card>
            </div>
        </div>
    </Section>
);

const SecurityAnalyticsSection = ({ logs }: { logs: AppSecurityLog[] }) => (
    <Section title="Interacción y Seguridad" icon={ShieldCheck}>
        <div className="grid grid-cols-1 gap-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-zinc-400">Últimos Eventos de Seguridad</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800">
                                <TableHead className="text-zinc-500">Evento</TableHead>
                                <TableHead className="text-zinc-500">Usuario</TableHead>
                                <TableHead className="text-right text-zinc-500">Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.slice(0, 5).map(log => {
                                const eventInfo = getEventDetails(log.event);
                                return (
                                <TableRow key={log.id} className="border-zinc-800">
                                    <TableCell><Badge variant={eventInfo.variant}>{eventInfo.label}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6"><AvatarImage src={log.user?.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(log.user?.name)}</AvatarFallback></Avatar>
                                            <span className="text-xs">{log.user?.name || log.emailAttempt || 'Sistema'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-zinc-500">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </Section>
);


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
            const [userRes, courseRes, progressRes, securityRes] = await Promise.all([
                fetch('/api/analytics/users'),
                fetch('/api/analytics/courses'),
                fetch('/api/analytics/progress'),
                fetch('/api/security/logs'),
            ]);
            
            if (!userRes.ok || !courseRes.ok || !progressRes.ok || !securityRes.ok) {
                const errorDetails = [
                    userRes.ok ? '' : `Usuarios: ${userRes.statusText}`,
                    courseRes.ok ? '' : `Cursos: ${courseRes.statusText}`,
                    progressRes.ok ? '' : `Progreso: ${progressRes.statusText}`,
                    securityRes.ok ? '' : `Seguridad: ${securityRes.statusText}`,
                ].filter(Boolean).join(', ');
                throw new Error(`Falló la carga de datos. Errores: ${errorDetails}`);
            }

            const userStats = await userRes.json();
            const courseStats = await courseRes.json();
            const progressStats = await progressRes.json();
            const securityLogs = (await securityRes.json()).logs;

            setData({ userStats, courseStats, progressStats, securityLogs });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al cargar analíticas');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudieron cargar los datos de analíticas.', variant: 'destructive' });
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


    if (isAuthLoading || isLoading) {
      return (
        <div className="space-y-6 animate-pulse">
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
        <div className="bg-zinc-950 text-white min-h-screen -m-8 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold font-headline">Informes y Analíticas Avanzadas</h1>
                    <p className="text-zinc-400">Métricas clave para la toma de decisiones y el seguimiento del rendimiento de la plataforma.</p>
                </header>
                
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {data.userStats && <UserAnalyticsSection stats={data.userStats} />}
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        {data.courseStats && <CourseAnalyticsSection stats={data.courseStats} />}
                        {data.progressStats && <ProgressAnalyticsSection stats={data.progressStats} />}
                    </div>
                    <div className="lg:col-span-3">
                         {data.securityLogs && <SecurityAnalyticsSection logs={data.securityLogs} />}
                    </div>
                </main>
            </div>
        </div>
    );
}

