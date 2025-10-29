// src/app/(app)/analytics/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  UsersRound, 
  BookOpenCheck, 
  UserPlus,
  Loader2, 
  AlertTriangle,
  GraduationCap,
  Library,
  TrendingUp,
  TrendingDown,
  Award,
  BadgePercent,
  UserCheck,
  UserRound,
  FilePlus2 as CourseIcon,
  HelpCircle,
  Calendar as CalendarIcon,
  Folder,
  Megaphone,
  FileText
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Cell, Label, XAxis, YAxis, Sector, CartesianGrid, BarChart, Bar, Legend, ComposedChart, Line } from "recharts";
import type { AdminDashboardStats } from '@/types';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, startOfDay, subDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTitle } from '@/contexts/title-context';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTour } from '@/contexts/tour-context';
import { analyticsTour } from '@/lib/tour-steps';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { MetricCard } from '@/components/analytics/metric-card';
import { DonutChart } from '@/components/analytics/donut-chart';


const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  if (!isValid(date)) return tick;
  if (date.getDate() === 1) {
    return format(date, "d MMM", { locale: es });
  }
  return format(date, "d", { locale: es });
};

const formatDateTooltip = (dateString: string) => {
    try {
        const date = parseISO(dateString);
        return format(date, "EEEE, d 'de' MMMM", { locale: es });
    } catch (e) {
        return dateString;
    }
};

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Administradores", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const courseStatusChartConfig = {
    count: { label: "Cursos" },
    DRAFT: { label: "Borrador", color: "hsl(var(--chart-4))" },
    PUBLISHED: { label: "Publicado", color: "hsl(var(--chart-1))" },
    ARCHIVED: { label: "Archivado", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

function RankingList({ title, items, metric, icon: Icon, unit = '' }: { title: string, items: any[], metric: string, icon: React.ElementType, unit?: string }) {
    if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Datos no disponibles.</p>;
    }

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Icon className="text-primary h-4 w-4"/>{title}</h3>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={item.imageUrl || item.avatar || undefined} />
                            <AvatarFallback><Identicon userId={item.id}/></AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                           <p className="truncate font-medium">{item.title || item.name}</p>
                        </div>
                        <div className="font-bold text-primary shrink-0">{item.value?.toLocaleString() ?? 0}{unit}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}


function AdminAnalyticsPage() {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const { setPageTitle } = useTitle();
    const isMobile = useIsMobile();
    const { startTour, forceStartTour } = useTour();

     const [date, setDate] = React.useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: startOfDay(new Date()),
    });

    useEffect(() => {
        setPageTitle('Analíticas');
        startTour('analytics', analyticsTour);
    }, [setPageTitle, startTour]);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (date?.from) params.append('startDate', date.from.toISOString());
            if (date?.to) params.append('endDate', date.to.toISOString());

            const res = await fetch(`/api/dashboard/data?${params.toString()}`);
            if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch stats");
            const data = await res.json();
            setStats(data.adminStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    useEffect(() => {
        if (user?.role === 'ADMINISTRATOR') {
            fetchStats();
        } else if (user) {
            router.push('/dashboard');
        }
    }, [user, router, fetchStats]);

    const userRolesChartData = useMemo(() => {
        if (!stats?.usersByRole) return [];
        return ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'].map(role => ({
            role: role,
            label: userRolesChartConfig[role as 'STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR']?.label || role,
            count: stats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role as 'STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR']?.color || 'hsl(var(--muted))'
        })).filter(item => item.count > 0);
    }, [stats?.usersByRole]);
    
    const courseStatusChartData = useMemo(() => {
        if (!stats?.coursesByStatus) return [];
        return ['DRAFT', 'PUBLISHED', 'ARCHIVED'].map(status => ({
            status: status,
            label: courseStatusChartConfig[status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED']?.label || status,
            count: stats.coursesByStatus.find(item => item.status === status)?.count || 0,
            fill: courseStatusChartConfig[status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED']?.color || 'hsl(var(--muted))'
        })).filter(item => item.count > 0);
    }, [stats?.coursesByStatus]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[450px]" />
                    <Skeleton className="h-[450px]" />
                    <Skeleton className="h-[450px]" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Error al Cargar Analíticas</p>
                <p className="text-sm">{error}</p>
                <Button onClick={fetchStats} variant="outline" className="mt-4">Reintentar</Button>
            </div>
        )
    }

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Resumen de la Plataforma</h2>
                <p className="text-muted-foreground">Métricas clave sobre el rendimiento y uso de NexusAlpri.</p>
            </div>
             <div className="flex items-center gap-2">
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button id="date" variant="outline" className={cn("w-full justify-start text-left font-normal md:w-[300px]", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y", { locale: es })} - {format(date.to, "LLL dd, y", { locale: es })}</>) : (format(date.from, "LLL dd, y", { locale: es }))) : (<span>Elige una fecha</span>)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es}/>
                    </PopoverContent>
                  </Popover>
                 <Button variant="outline" size="sm" onClick={() => forceStartTour('analytics', analyticsTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
             </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4 mt-4" id="analytics-metric-cards">
            <MetricCard title="Total Usuarios" value={stats?.totalUsers || 0} icon={UsersRound} gradient="bg-gradient-blue" />
            <MetricCard title="Total Cursos" value={stats?.totalCourses || 0} icon={Library} gradient="bg-gradient-green"/>
            <MetricCard title="Inscripciones" value={stats?.totalEnrollments || 0} icon={GraduationCap} gradient="bg-gradient-purple" />
            <MetricCard title="Cursos Publicados" value={stats?.totalPublishedCourses || 0} icon={BookOpenCheck} gradient="bg-gradient-orange" />
            <MetricCard title="Recursos" value={stats?.totalResources || 0} icon={Folder} gradient="bg-gradient-pink" />
            <MetricCard title="Anuncios" value={stats?.totalAnnouncements || 0} icon={Megaphone} gradient="bg-gradient-blue" />
            <MetricCard title="Formularios" value={stats?.totalForms || 0} icon={FileText} gradient="bg-gradient-green" />
            <MetricCard title="Finalización" value={stats?.averageCompletionRate || 0} icon={BadgePercent} suffix="%" description="Promedio" gradient="bg-gradient-purple" />
        </div>
        
        <Separator />
        
        <div className="space-y-8">
            <Card>
                 <CardHeader>
                    <CardTitle>Tendencia de Actividad</CardTitle>
                     <CardDescription>Actividad en el rango de fechas seleccionado.</CardDescription>
                </CardHeader>
                <CardContent className="h-80 pr-4">
                     <ChartContainer config={{ newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-2))" }, newUsers: { label: "Nuevos Usuarios", color: "hsl(var(--chart-1))" }, newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-3))" }}} className="w-full h-full">
                        <ResponsiveContainer>
                           <ComposedChart data={stats?.userRegistrationTrend || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={true} tickMargin={10} tickFormatter={formatDateTick} interval={isMobile ? 'preserveEnd' : 'preserveStartEnd'} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={true} tickMargin={10} width={30}/>
                                <ChartTooltip cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                                <Legend />
                                <Bar dataKey="newUsers" name="Usuarios" fill="var(--color-newUsers)" radius={4} />
                                <Line type="monotone" dataKey="newCourses" name="Cursos" stroke="var(--color-newCourses)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="newEnrollments" name="Inscripciones" fill="var(--color-newEnrollments)" stroke="var(--color-newEnrollments)" strokeWidth={2} fillOpacity={0.3} dot={false}/>
                           </ComposedChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="analytics-distribution-charts">
                 <DonutChart title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
                 <DonutChart title="Distribución de Cursos" data={courseStatusChartData} config={courseStatusChartConfig} />
             </div>
        </div>

        <Separator />
        <h2 className="text-2xl font-semibold">Rankings de Rendimiento</h2>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="analytics-course-rankings">
            <Card>
                <CardContent className="pt-6">
                    <RankingList title="Cursos Más Populares" items={stats?.topCoursesByEnrollment || []} metric="Inscritos" icon={TrendingUp} />
                </CardContent>
            </Card>
             <Card>
                <CardContent className="pt-6">
                     <RankingList title="Cursos con Mejor Finalización" items={stats?.topCoursesByCompletion || []} metric="Completado" icon={Award} unit="%"/>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="pt-6">
                     <RankingList title="Cursos de Oportunidad" items={stats?.lowestCoursesByCompletion || []} metric="Completado" icon={TrendingDown} unit="%"/>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="analytics-user-rankings">
             <Card>
                <CardContent className="pt-6">
                     <RankingList title="Estudiantes Más Activos" items={stats?.topStudentsByEnrollment || []} metric="Inscripciones" icon={UserRound} />
                </CardContent>
            </Card>
             <Card>
                <CardContent className="pt-6">
                    <RankingList title="Mejores Estudiantes" items={stats?.topStudentsByCompletion || []} metric="Completados" icon={UserCheck} />
                </CardContent>
            </Card>
             <Card>
                <CardContent className="pt-6">
                    <RankingList title="Instructores Destacados" items={stats?.topInstructorsByCourses || []} metric="Cursos Creados" icon={CourseIcon} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default function AnalyticsPageWrapper() {
  const { user } = useAuth();
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Analíticas');
  }, [setPageTitle]);

  if (user?.role === 'ADMINISTRATOR') {
    return <AdminAnalyticsPage />;
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Acceso Denegado</CardTitle>
          <CardDescription>
            Esta página solo está disponible para administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Volver al Panel Principal</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
  
}
