
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, UsersRound, BookOpenCheck, ShieldCheck, Activity, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Cell, Label } from "recharts";
import type { UserAnalyticsData, CourseAnalyticsData, ProgressAnalyticsData, SecurityLog as AppSecurityLog } from '@/types';
import { CourseCarousel } from '@/components/course-carousel';
import { getEventDetails, getInitials } from '@/lib/security-log-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GaugeChart } from '@/components/ui/gauge';

const MetricCard = ({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: React.ElementType; description?: string }) => (
    <Card className="shadow-lg backdrop-blur-sm bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-2))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-1))" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const courseStatusChartConfig = {
  count: { label: "Cursos" },
  DRAFT: { label: "Borrador", color: "hsl(var(--chart-1))" },
  PUBLISHED: { label: "Publicados", color: "hsl(var(--chart-2))" },
  ARCHIVED: { label: "Archivados", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

function DonutChartCard({ title, data, config }: { title: string, data: any[], config: ChartConfig }) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} strokeWidth={2}>
                 {data.map((entry) => (
                    <Cell key={`cell-${entry.label}`} fill={entry.fill} />
                  ))}
                 <Label
                    content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan x={viewBox.cx} y={viewBox.cy} className="text-2xl font-bold fill-foreground">
                                        {total.toLocaleString()}
                                    </tspan>
                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="text-xs fill-muted-foreground">
                                        Total
                                    </tspan>
                                </text>
                            );
                        }
                    }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function UserAnalyticsSection({ stats }: { stats: UserAnalyticsData }) {
    const userRolesChartData = useMemo(() => {
        const order: ('STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR')[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
        return order.map(role => ({
            role: role,
            label: userRolesChartConfig[role]?.label || role,
            count: stats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role]?.color || 'hsl(var(--muted))'
        }));
    }, [stats.usersByRole]);

    return (
        <section className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-3"><Users className="text-primary"/> Analíticas de Usuarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Usuarios" value={userRolesChartData.reduce((acc, r) => acc + r.count, 0)} icon={UsersRound} description={`${stats.activeUsersLast7Days} activos esta semana`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Nuevos Registros (Últimos 30 días)</CardTitle></CardHeader>
                    <CardContent className="h-72">
                         <ChartContainer config={{ count: { label: 'Nuevos usuarios', color: 'hsl(var(--primary))' } }} className="h-full w-full">
                            <AreaChart data={stats.newUsersLast30Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs><linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNewUsers)" />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <DonutChartCard title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
            </div>
        </section>
    );
};

function CourseAnalyticsSection({ stats }: { stats: CourseAnalyticsData }) {
    const courseStatusData = useMemo(() => {
        const order: ('DRAFT' | 'PUBLISHED' | 'ARCHIVED')[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
        return order.map(status => ({
            status: status,
            label: courseStatusChartConfig[status]?.label || status,
            count: stats.coursesByStatus.find(item => item.status === status)?.count || 0,
            fill: courseStatusChartConfig[status]?.color || 'hsl(var(--muted))'
        }));
    }, [stats.coursesByStatus]);

    return (
        <section className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-3"><BookOpenCheck className="text-primary"/> Analíticas de Cursos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Cursos" value={courseStatusData.reduce((acc, c) => acc + c.count, 0)} icon={FileText} />
                <MetricCard title="Puntuación Media" value={`${stats.averageQuizScore.toFixed(1)}%`} icon={TrendingUp} description="En todos los quices"/>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <Card>
                       <CardHeader><CardTitle>Cursos Más Populares</CardTitle></CardHeader>
                       <CardContent>
                           {stats.mostEnrolledCourses.length > 0 ? (
                              <CourseCarousel courses={stats.mostEnrolledCourses} userRole="ADMINISTRATOR" />
                           ) : (
                              <p className="text-muted-foreground text-center py-8">No hay datos de inscripciones para mostrar.</p>
                           )}
                       </CardContent>
                   </Card>
                </div>
                <DonutChartCard title="Estado General de Cursos" data={courseStatusData} config={courseStatusChartConfig} />
            </div>
        </section>
    );
};

function ProgressAnalyticsSection({ stats }: { stats: ProgressAnalyticsData }) {
    return (
        <section className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-3"><Activity className="text-primary"/> Analíticas de Progreso</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card>
                    <CardHeader><CardTitle>Estudiantes Activos</CardTitle><CardDescription>Con progreso reciente</CardDescription></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{stats.activeStudentsInCourses}</p></CardContent>
                 </Card>
                 <Card>
                    <CardHeader><CardTitle>Finalización Media</CardTitle><CardDescription>Tiempo para completar</CardDescription></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{stats.averageCompletionTimeDays.toFixed(1)} <span className="text-base text-muted-foreground">días</span></p></CardContent>
                 </Card>
                 <Card className="flex flex-col items-center justify-center text-center">
                    <CardHeader><CardTitle>Tasa de Abandono</CardTitle></CardHeader>
                    <CardContent><GaugeChart value={stats.dropoutRate} size="lg" /></CardContent>
                 </Card>
            </div>
        </section>
    );
};

function SecurityAnalyticsSection({ logs }: { logs: AppSecurityLog[] }) {
    return (
         <section className="space-y-6">
             <h2 className="text-xl font-semibold flex items-center gap-3"><ShieldCheck className="text-primary"/> Interacción y Seguridad</h2>
             <Card>
                <CardHeader><CardTitle>Últimos Eventos de Seguridad</CardTitle></CardHeader>
                <CardContent className="px-0">
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Evento</TableHead><TableHead>Usuario</TableHead><TableHead className="text-right">Fecha</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.slice(0, 5).map(log => {
                                const eventInfo = getEventDetails(log.event);
                                return (
                                <TableRow key={log.id}>
                                    <TableCell><Badge variant={eventInfo.variant}>{eventInfo.label}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6"><AvatarImage src={log.user?.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(log.user?.name)}</AvatarFallback></Avatar>
                                            <span className="text-xs">{log.user?.name || log.emailAttempt || 'Sistema'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </section>
    )
}

export default function AnalyticsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [data, setData] = useState<{
        userStats: UserAnalyticsData | null;
        courseStats: CourseAnalyticsData | null;
        progressStats: ProgressAnalyticsData | null;
        securityLogs: AppSecurityLog[] | null;
    } | null>(null);
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
                const errors = [];
                if (!userRes.ok) errors.push(`Usuarios: ${userRes.statusText}`);
                if (!courseRes.ok) errors.push(`Cursos: ${courseRes.statusText}`);
                if (!progressRes.ok) errors.push(`Progreso: ${progressRes.statusText}`);
                if (!securityRes.ok) errors.push(`Seguridad: ${securityRes.statusText}`);
                throw new Error(`Falló la carga de datos. Errores: ${errors.join(', ')}`);
            }

            const [userStats, courseStats, progressStats, securityLogsData] = await Promise.all([
                userRes.json(),
                courseRes.json(),
                progressRes.json(),
                securityRes.json()
            ]);

            setData({ userStats, courseStats, progressStats, securityLogs: securityLogsData.logs });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al cargar analíticas');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudieron cargar los datos.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
        } else if (user) {
            fetchAnalytics();
        }
    }, [isAuthLoading, user, router, fetchAnalytics]);


    if (isAuthLoading || isLoading) {
      return (
        <div className="space-y-6 animate-pulse">
            <Skeleton className="h-9 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
            </div>
        </div>
      );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">{error}</p>
                <Button onClick={fetchAnalytics} variant="outline" className="mt-4">Reintentar</Button>
            </div>
        );
    }
    
    if (!data) return null;

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Informes y Analíticas Avanzadas</h1>
                <p className="text-muted-foreground">Métricas clave para la toma de decisiones y el seguimiento del rendimiento de la plataforma.</p>
            </header>
            
            <main className="space-y-12">
                {data.userStats && <UserAnalyticsSection stats={data.userStats} />}
                {data.courseStats && <CourseAnalyticsSection stats={data.courseStats} />}
                {data.progressStats && <ProgressAnalyticsSection stats={data.progressStats} />}
                {data.securityLogs && <SecurityAnalyticsSection logs={data.securityLogs} />}
            </main>
        </div>
    );
}
