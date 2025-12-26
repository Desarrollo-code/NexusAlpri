// src/app/(app)/analytics/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    AlertTriangle,
    HelpCircle,
    Calendar as CalendarIcon,
    TrendingUp,
    Award,
    TrendingDown,
    BookOpenCheck,
    UserPlus,
    Flame,
    Zap,
    Trophy,
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Cell, Label, Sector, CartesianGrid, BarChart, Bar, Legend, ComposedChart, Line, XAxis, YAxis, Tooltip } from "recharts";
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
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { IconBookMarked, IconFileText, IconFolderDynamic, IconGraduationCap, IconUsersTotal, IconPercent, IconMegaphone, IconLibrary, IconFolderYellow, IconCalendarFilter } from '@/components/icons';
import { motion, AnimatePresence } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const formatDateTick = (tick: string): string => {
    const date = parseISO(tick);
    if (!isValid(date)) return tick;
    return format(date, "d MMM", { locale: es });
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

function RankingList({ title, items, icon: Icon, unit = '', variant = 'primary' }: { title: string, items: any[], icon: React.ElementType, unit?: string, variant?: 'primary' | 'success' | 'warning' }) {
    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <Icon className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Sin datos para mostrar</p>
            </div>
        );
    }

    const colorClasses = {
        primary: "text-blue-500 bg-blue-500/10",
        success: "text-emerald-500 bg-emerald-500/10",
        warning: "text-amber-500 bg-amber-500/10"
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", colorClasses[variant])}>
                        <Icon className="h-4 w-4" />
                    </div>
                    {title}
                </h3>
            </div>
            <div className="space-y-3">
                {items.slice(0, 5).map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-2 rounded-lg transition-all hover:bg-muted/50 group"
                    >
                        <div className="relative shrink-0">
                            <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30 w-4 text-center">
                                {index + 1}
                            </span>
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:scale-105 transition-transform ml-2">
                                <AvatarImage src={item.imageUrl || item.avatar || undefined} />
                                <AvatarFallback><Identicon userId={item.id} /></AvatarFallback>
                            </Avatar>
                            {index === 0 && <Trophy className="absolute -top-2 -right-1 h-4 w-4 text-yellow-500 drop-shadow-sm" />}
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="truncate font-semibold text-sm group-hover:text-primary transition-colors">
                                {item.title || item.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                {item.category || (item.role === 'INSTRUCTOR' ? 'Instructor' : 'Estudiante')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <div className="font-black text-sm bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60">
                                {item.value?.toLocaleString() ?? 0}{unit}
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                                <Flame className="h-3 w-3 text-orange-500" />
                                <span className="text-[10px] font-bold text-orange-500/70">Top</span>
                            </div>
                        </div>
                    </motion.div>
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
            fill: `hsl(var(--chart-${(['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'].indexOf(role) + 1)}))`,
        })).filter(item => item.count > 0);
    }, [stats?.usersByRole]);

    const courseStatusChartData = useMemo(() => {
        if (!stats?.coursesByStatus) return [];
        return ['DRAFT', 'PUBLISHED', 'ARCHIVED'].map(status => ({
            status: status,
            label: courseStatusChartConfig[status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED']?.label || status,
            count: stats.coursesByStatus.find(item => item.status === status)?.count || 0,
            fill: `hsl(var(--chart-${(['PUBLISHED', 'DRAFT', 'ARCHIVED'].indexOf(status) + 1)}))`
        })).filter(item => item.count > 0);
    }, [stats?.coursesByStatus]);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex justify-between items-end gap-4 mb-4">
                    <Skeleton className="h-12 w-64 rounded-xl" />
                    <Skeleton className="h-10 w-48 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
                    <Skeleton className="h-[400px] rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-[450px] rounded-2xl" />
                    <Skeleton className="h-[450px] rounded-2xl" />
                    <Skeleton className="h-[450px] rounded-2xl" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-3xl border border-destructive/20 text-destructive m-8">
                <AlertTriangle className="h-12 w-12 mb-4 animate-bounce" />
                <h3 className="text-xl font-bold">Error al Cargar Analíticas</h3>
                <p className="text-sm opacity-80 mb-6">{error}</p>
                <Button onClick={fetchStats} variant="destructive" className="rounded-xl px-8">
                    Reintentar Conexión
                </Button>
            </div>
        )
    }

    // Merge registration and content trends for a single view
    const combinedTrendData = stats?.userRegistrationTrend.map(item => {
        const contentItem = stats?.contentActivityTrend.find(c => c.date === item.date);
        return {
            ...item,
            newCourses: contentItem?.newCourses || 0,
            newEnrollments: contentItem?.newEnrollments || 0
        };
    }) || [];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="space-y-1">
                    <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                        <Zap className="h-3 w-3" /> Dashboard Administrativo
                    </motion.div>
                    <motion.h2 variants={item} className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                        Inteligencia de Datos
                    </motion.h2>
                    <motion.p variants={item} className="text-muted-foreground text-lg max-w-2xl">
                        Monitoriza el pulso de <span className="text-foreground font-semibold">NexusAlpri</span> en tiempo real con analíticas avanzadas.
                    </motion.p>
                </div>
                <motion.div variants={item} className="flex flex-wrap items-center gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant="outline" className={cn("min-w-[280px] justify-start text-left font-bold rounded-xl border-2 hover:border-primary transition-all", !date && "text-muted-foreground")}>
                                <IconCalendarFilter className="mr-2 h-5 w-5 text-primary" />
                                {date?.from ? (date.to ? (<>{format(date.from, "LLL dd", { locale: es })} - {format(date.to, "LLL dd, y", { locale: es })}</>) : (format(date.from, "LLL dd, y", { locale: es }))) : (<span>Seleccionar Período</span>)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl border-2" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es} />
                        </PopoverContent>
                    </Popover>
                    <Button variant="secondary" size="icon" className="rounded-xl h-11 w-11 shadow-sm" onClick={() => forceStartTour('analytics', analyticsTour)}>
                        <HelpCircle className="h-5 w-5" />
                    </Button>
                </motion.div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4" id="analytics-metric-cards">
                <MetricCard title="Usuarios" value={stats?.totalUsers || 0} icon={IconUsersTotal} index={0} description="Crecimiento total" />
                <MetricCard title="Cursos" value={stats?.totalCourses || 0} icon={IconLibrary} index={1} description="Catálogo activo" />
                <MetricCard title="Inscripciones" value={stats?.totalEnrollments || 0} icon={IconGraduationCap} index={2} description="Interés generado" />
                <MetricCard title="Cursos Publ." value={stats?.totalPublishedCourses || 0} icon={IconBookMarked} index={3} description="Contenido visible" />
                <MetricCard title="Recursos" value={stats?.totalResources || 0} icon={IconFolderYellow} index={4} description="Biblioteca" />
                <MetricCard title="Anuncios" value={stats?.totalAnnouncements || 0} icon={IconMegaphone} index={5} description="Comunicaciones" />
                <MetricCard title="Exámenes" value={stats?.totalForms || 0} icon={IconFileText} index={6} description="Evaluaciones" />
                <MetricCard title="Finalización" value={stats?.averageCompletionRate || 0} icon={IconPercent} suffix="%" description="Tasa de éxito" index={7} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div variants={item} className="lg:col-span-2">
                    <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    Tendencia de Crecimiento
                                </CardTitle>
                                <CardDescription>Histórico de usuarios, cursos e inscripciones.</CardDescription>
                            </div>
                            <TrendingUp className="h-5 w-5 text-emerald-500 opacity-50" />
                        </CardHeader>
                        <CardContent className="h-80 pr-4 pt-4">
                            <ChartContainer config={{
                                newUsers: { label: "Nuevos Usuarios", color: "hsl(var(--primary))" },
                                newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-2))" },
                                newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-3))" }
                            }} className="w-full h-full">
                                <ResponsiveContainer>
                                    <AreaChart data={combinedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={15}
                                            tickFormatter={formatDateTick}
                                            interval="preserveStartEnd"
                                            style={{ fontSize: '10px', fontWeight: 600 }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tickMargin={10} style={{ fontSize: '10px' }} />
                                        <Tooltip
                                            content={<ChartTooltipContent indicator="line" labelFormatter={formatDateTooltip} />}
                                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                                        />
                                        <Area type="monotone" dataKey="count" name="Nuevos Usuarios" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                        <Area type="monotone" dataKey="newEnrollments" name="Inscripciones" stroke="hsl(var(--chart-2))" strokeWidth={3} fillOpacity={1} fill="url(#colorEnrollments)" />
                                        <Line type="monotone" dataKey="newCourses" name="Nuevos Cursos" stroke="hsl(var(--chart-3))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="space-y-6">
                    <motion.div variants={item}>
                        <DonutChart title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
                    </motion.div>
                </div>
            </div>

            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Estado del Catálogo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <DonutChart title="" data={courseStatusChartData} config={courseStatusChartConfig} />
                    </CardContent>
                </Card>

                <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 overflow-hidden flex flex-col justify-center p-8 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award className="h-32 w-32" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Plataforma de Alto Impacto</h3>
                    <p className="text-muted-foreground mb-6">NexusAlpri está impulsando el aprendizaje corporativo con métricas sólidas y crecimiento constante.</p>
                    <div className="flex gap-4">
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-primary">+{combinedTrendData.reduce((acc, curr) => acc + curr.count, 0)}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-tight">Nuevos Usuarios<br />este mes</p>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-primary">{stats?.averageCompletionRate}%</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-tight">Retención de<br />Estudiantes</p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <Separator className="opacity-50" />

            <motion.div variants={item} className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    Rankings de Elite
                </h2>
                <p className="text-muted-foreground">Líderes y cursos destacados en la plataforma.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="analytics-course-rankings">
                <motion.div variants={item}>
                    <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6">
                            <RankingList title="Cursos Más Populares" items={stats?.topCoursesByEnrollment || []} icon={TrendingUp} unit=" insc." variant="primary" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6">
                            <RankingList title="Mejor Finalización" items={stats?.topCoursesByCompletion || []} icon={Award} unit="%" variant="success" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6">
                            <RankingList title="Oportunidades" items={stats?.lowestCoursesByCompletion || []} icon={TrendingDown} unit="%" variant="warning" />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="analytics-user-rankings">
                <motion.div variants={item}>
                    <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6">
                            <RankingList title="Estudiantes Activos" items={stats?.topStudentsByEnrollment || []} icon={IconUsersTotal} unit=" insc." variant="primary" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6">
                            <RankingList title="Mejores Estudiantes" items={stats?.topStudentsByCompletion || []} icon={BookOpenCheck} unit=" compl." variant="success" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6">
                            <RankingList title="Instructores Top" items={stats?.topInstructorsByCourses || []} icon={UserPlus} unit=" cursos" variant="warning" />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

export default function AnalyticsPageWrapper() {
    const { user, isLoading } = useAuth();
    const { setPageTitle } = useTitle();

    useEffect(() => {
        setPageTitle('Analíticas');
    }, [setPageTitle]);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse p-8">
                <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-96 rounded-2xl" />
                    <Skeleton className="h-96 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (user?.role === 'ADMINISTRATOR') {
        return <AdminAnalyticsPage />;
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="w-full max-w-md text-center bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 p-4">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="p-4 rounded-full bg-destructive/10">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-black">Acceso Denegado</CardTitle>
                        <CardDescription className="text-lg">
                            Esta página es exclusiva para el comando central de administración.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full rounded-xl h-12 text-lg font-bold">
                            <Link href="/dashboard text-center">Volver al Panel Principal</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
