

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, UsersRound, BookOpenCheck, ShieldCheck, Activity, Users, FileText, BarChart3, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Cell, Label, XAxis, YAxis, Sector } from "recharts";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog } from '@/types';
import { getEventDetails, getInitials } from '@/lib/security-log-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GaugeChart } from '@/components/ui/gauge';

const MetricCard = ({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: React.ElementType; description?: string }) => (
    <Card>
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
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const courseStatusChartConfig = {
  count: { label: "Cursos" },
  DRAFT: { label: "Borrador", color: "hsl(var(--chart-1))" },
  PUBLISHED: { label: "Publicados", color: "hsl(var(--chart-2))" },
  ARCHIVED: { label: "Archivados", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;


const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 11;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={4} textAnchor="middle" fill={fill} className="text-base font-bold">
        {payload.label}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
       <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
       <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
       <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 6} dy="-0.5em">{value}</tspan>
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 6} dy="1em">{`(${(percent * 100).toFixed(0)}%)`}</tspan>
      </text>
    </g>
  );
};


function DonutChartCard({ title, data, config }: { title: string, data: any[], config: ChartConfig }) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, [setActiveIndex]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie 
                data={data} 
                dataKey="count" 
                nameKey="label" 
                innerRadius={60} 
                strokeWidth={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                className="cursor-pointer"
              >
                 {data.map((entry) => (
                    <Cell key={`cell-${entry.label}`} fill={entry.fill} />
                  ))}
                 {activeIndex === undefined && (
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
                 )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function UserAnalyticsSection({ stats }: { stats: AdminDashboardStats }) {
    const userRolesChartData = useMemo(() => {
        if (!stats?.usersByRole) return [];
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MetricCard title="Total Usuarios" value={stats.totalUsers} icon={Users} />
                <DonutChartCard title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
            </div>
        </section>
    );
};

function CourseAnalyticsSection({ stats }: { stats: AdminDashboardStats }) {
    const courseStatusData = useMemo(() => {
        if (!stats?.coursesByStatus) return [];
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
                <MetricCard title="Total Cursos" value={stats.totalCourses} icon={FileText} />
                <MetricCard title="Cursos Publicados" value={stats.totalPublishedCourses} icon={BookOpenCheck} />
                <MetricCard title="Total Inscripciones" value={stats.totalEnrollments} icon={TrendingUp} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <DonutChartCard title="Distribución de Cursos" data={courseStatusData} config={courseStatusChartConfig} />
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
        adminStats: AdminDashboardStats | null;
        securityLogs: AppSecurityLog[] | null;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [adminStatsRes, securityRes] = await Promise.all([
                fetch('/api/dashboard/admin-stats'),
                fetch('/api/security/logs'),
            ]);
            
            if (!adminStatsRes.ok || !securityRes.ok) {
                const errors = [];
                if (!adminStatsRes.ok) errors.push(`Estadísticas: ${adminStatsRes.statusText}`);
                if (!securityRes.ok) errors.push(`Seguridad: ${securityRes.statusText}`);
                throw new Error(`Falló la carga de datos. Errores: ${errors.join(', ')}`);
            }

            const [adminStats, securityLogsData] = await Promise.all([
                adminStatsRes.json(),
                securityRes.json()
            ]);

            setData({ adminStats, securityLogs: securityLogsData.logs });

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
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3"><BarChart3/> Informes y Analíticas Avanzadas</h1>
                <p className="text-muted-foreground">Métricas clave para la toma de decisiones y el seguimiento del rendimiento de la plataforma.</p>
            </header>
            
            <main className="space-y-12">
                {data.adminStats && <UserAnalyticsSection stats={data.adminStats} />}
                {data.adminStats && <CourseAnalyticsSection stats={data.adminStats} />}
                {data.securityLogs && <SecurityAnalyticsSection logs={data.securityLogs} />}
            </main>
        </div>
    );
}
