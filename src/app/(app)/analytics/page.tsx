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
import {
    Area,
    AreaChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Cell,
    Label,
    Sector,
    CartesianGrid,
    BarChart,
    Bar,
    Legend,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    RadialBarChart,
    RadialBar
} from "recharts";
import type { AdminDashboardStats } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-primary/20">
                <Icon className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest leading-none">Sin datos activos</p>
            </div>
        );
    }

    const colorClasses = {
        primary: "text-primary bg-primary/10 border-primary/20",
        success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        warning: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-foreground/80">
                    <div className={cn("p-1.5 rounded-lg border", colorClasses[variant])}>
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
                        className="flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-primary/5 group border border-transparent hover:border-primary/10"
                    >
                        <div className="relative shrink-0">
                            <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 w-4 text-center">
                                {index + 1}
                            </span>
                            <Avatar className="h-10 w-10 border-2 border-background shadow-md group-hover:scale-110 transition-transform ml-2">
                                <AvatarImage src={item.imageUrl || item.avatar || undefined} />
                                <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground"><Identicon userId={item.id} /></AvatarFallback>
                            </Avatar>
                            {index === 0 && (
                                <div className="absolute -top-2 -right-1 bg-yellow-500 rounded-full p-0.5 shadow-lg animate-bounce">
                                    <Trophy className="h-3 w-3 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="truncate font-bold text-sm group-hover:text-primary transition-colors leading-tight">
                                {item.title || item.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                                {item.category || (item.role === 'INSTRUCTOR' ? 'Instructor' : 'Estudiante')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <div className="font-black text-sm bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60 tracking-tighter">
                                {item.value?.toLocaleString() ?? 0}{unit}
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">Explosivo</span>
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
    const { setPageTitle, setHeaderActions } = useTitle();
    const isMobile = useIsMobile();
    const { startTour, forceStartTour } = useTour();
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        const element = document.getElementById('analytics-content');
        if (!element) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: null,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`NexusAlpri-Analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (err) {
            console.error('Error exporting PDF:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: startOfDay(new Date()),
    });

    useEffect(() => {
        setPageTitle('Analíticas');
        startTour('analytics', analyticsTour);
        setHeaderActions(
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex items-center gap-2 font-bold h-9 rounded-xl border-primary/20 hover:bg-primary/10 transition-all"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                >
                    {isExporting ? <ColorfulLoader className="h-4 w-4" /> : <IconFileText className="h-4 w-4" />}
                    {isExporting ? 'Generando...' : 'Exportar PDF'}
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant="outline" className={cn("min-w-[240px] justify-start text-left font-normal shadow-sm h-9", !date && "text-muted-foreground")}>
                            <IconCalendarFilter className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "LLL dd", { locale: es })} - {format(date.to, "LLL dd, y", { locale: es })}</>) : (format(date.from, "LLL dd, y", { locale: es }))) : (<span>Seleccionar Período</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es} />
                    </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => forceStartTour('analytics', analyticsTour)}>
                    <HelpCircle className="h-5 w-5" />
                </Button>
            </div>
        );
        return () => setHeaderActions(null);
    }, [setPageTitle, startTour, setHeaderActions, date, forceStartTour]); // Added dependencies

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (date?.from) queryParams.append('from', date.from.toISOString());
            if (date?.to) queryParams.append('to', date.to.toISOString());

            const response = await fetch(`/api/dashboard/data?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data: AdminDashboardStats = await response.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    useEffect(() => {
        if (user?.role === 'ADMINISTRATOR') {
            fetchStats();
        }
    }, [user, fetchStats]);


    const combinedTrendData = useMemo(() => {
        if (!stats) return [];

        const trendMap = new Map<string, any>();

        // Safely handle arrays if undefined
        (stats.userRegistrationTrend || []).forEach(item => {
            const date = item.date;
            if (!trendMap.has(date)) trendMap.set(date, { date, count: 0, newEnrollments: 0, newCourses: 0 });
            trendMap.get(date).count = item.count;
        });

        (stats.contentActivityTrend || []).forEach(item => {
            const date = item.date;
            if (!trendMap.has(date)) trendMap.set(date, { date, count: 0, newEnrollments: 0, newCourses: 0 });
            const entry = trendMap.get(date);
            entry.newEnrollments = item.newEnrollments;
            entry.newCourses = item.newCourses;
        });

        return Array.from(trendMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [stats]);

    const userRolesChartData = useMemo(() => {
        if (!stats) return [];
        const getCount = (role: string) => stats.usersByRole?.find(r => r.role === role)?.count || 0;
        return [
            { role: 'STUDENT', count: getCount('STUDENT'), fill: "hsl(var(--chart-1))" },
            { role: 'INSTRUCTOR', count: getCount('INSTRUCTOR'), fill: "hsl(var(--chart-2))" },
            { role: 'ADMINISTRATOR', count: getCount('ADMINISTRATOR'), fill: "hsl(var(--chart-3))" },
        ];
    }, [stats]);


    const courseStatusChartData = useMemo(() => {
        if (!stats) return [];
        const getCount = (status: string) => stats.coursesByStatus?.find(s => s.status === status)?.count || 0;
        return [
            { status: 'PUBLISHED', count: getCount('PUBLISHED'), fill: "hsl(var(--chart-1))" },
            { status: 'DRAFT', count: getCount('DRAFT'), fill: "hsl(var(--chart-4))" },
            { status: 'ARCHIVED', count: getCount('ARCHIVED'), fill: "hsl(var(--chart-5))" },
        ]
    }, [stats]);

    const activityRadarData = useMemo(() => {
        if (!stats) return [];
        return [
            { subject: 'Usuarios', A: stats.totalUsers || 0, fullMark: 100 },
            { subject: 'Cursos', A: stats.totalCourses || 0, fullMark: 100 },
            { subject: 'Inscrip.', A: stats.totalEnrollments || 0, fullMark: 100 },
            { subject: 'Recursos', A: stats.totalResources || 0, fullMark: 100 },
            { subject: 'Anuncios', A: stats.totalAnnouncements || 0, fullMark: 100 },
            { subject: 'Exámenes', A: stats.totalForms || 0, fullMark: 100 },
        ];
    }, [stats]);

    const overallEfficiencyData = useMemo(() => {
        if (!stats) return [];
        return [
            {
                name: 'Completado',
                value: stats.averageCompletionRate || 0,
                fill: 'hsl(var(--primary))',
            }
        ];
    }, [stats]);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
            id="analytics-content"
        >
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
                    Centro de Comando Analytics
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-3xl leading-relaxed">
                    Inteligencia de datos en tiempo real. Monitoriza el pulso de NexusAlpri con visualizaciones de alto impacto y métricas predictivas para la toma de decisiones estratégicas.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3" id="analytics-metric-cards">
                <MetricCard title="Usuarios" value={stats?.totalUsers || 0} icon={IconUsersTotal} index={0} description="Crecimiento" />
                <MetricCard title="Cursos" value={stats?.totalCourses || 0} icon={IconLibrary} index={1} description="Catálogo" />
                <MetricCard title="Inscripciones" value={stats?.totalEnrollments || 0} icon={IconGraduationCap} index={2} description="Interés" />
                <MetricCard title="Cursos Publ." value={stats?.totalPublishedCourses || 0} icon={IconBookMarked} index={3} description="Contenido" />
                <MetricCard title="Recursos" value={stats?.totalResources || 0} icon={IconFolderYellow} index={4} description="Biblioteca" />
                <MetricCard title="Anuncios" value={stats?.totalAnnouncements || 0} icon={IconMegaphone} index={5} description="Avisos" />
                <MetricCard title="Exámenes" value={stats?.totalForms || 0} icon={IconFileText} index={6} description="Evaluación" />
                <MetricCard title="Éxito" value={stats?.averageCompletionRate || 0} icon={IconPercent} suffix="%" description="Progreso" index={7} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <motion.div variants={item} className="lg:col-span-2">
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-primary/10 overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-[2rem]">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    Tendencia de Crecimiento
                                </CardTitle>
                                <CardDescription>Histórico de usuarios, cursos e inscripciones.</CardDescription>
                            </div>
                            <div className="p-2 rounded-xl bg-primary/10 transition-transform group-hover:rotate-12">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
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

                <motion.div variants={item} className="lg:col-span-1">
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-primary/10 overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-[2rem]">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Balance de Actividad</CardTitle>
                            <CardDescription>Distribución de recursos y usuarios.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={activityRadarData}>
                                    <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Radar
                                        name="Nexus"
                                        dataKey="A"
                                        stroke="hsl(var(--primary))"
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.5}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="lg:col-span-1 flex flex-col gap-4">
                    <DonutChart title="Roles" data={userRolesChartData} config={userRolesChartConfig} />
                </motion.div>
            </div>

            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="bg-card/40 backdrop-blur-xl border-primary/10 overflow-hidden rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Estado del Catálogo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-0">
                        <DonutChart title="" data={courseStatusChartData} config={courseStatusChartConfig} />
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-xl border-primary/10 overflow-hidden rounded-[2rem] flex flex-col items-center justify-center p-6 text-center">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold">Salud del Ecosistema</CardTitle>
                        <CardDescription>Eficiencia de finalización global.</CardDescription>
                    </CardHeader>
                    <div className="relative h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="100%"
                                barSize={20}
                                data={overallEfficiencyData}
                                startAngle={180}
                                endAngle={0}
                            >
                                <RadialBar
                                    background
                                    dataKey="value"
                                    cornerRadius={15}
                                    fill="hsl(var(--primary))"
                                />
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-foreground text-4xl font-black"
                                >
                                    {stats?.averageCompletionRate}%
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-sm font-bold text-primary uppercase tracking-tighter mt-[-40px]">Meta de Excelencia</p>
                </Card>

                <Card className="bg-primary/10 overflow-hidden flex flex-col justify-center p-8 relative rounded-[2rem] border-primary/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award className="h-32 w-32 text-primary" />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                            <Zap className="h-3 w-3 fill-primary" /> IA Insights Activos
                        </div>
                        <h3 className="text-3xl font-black mb-2 tracking-tighter leading-tight">Impulsando el Impacto</h3>
                        <p className="text-muted-foreground mb-6 font-medium">NexusAlpri está escalando el aprendizaje corporativo con métricas de alto rendimiento.</p>
                        <div className="flex gap-4">
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-primary tracking-tighter">+{combinedTrendData.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0)}</p>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-tight">Nuevos Usuarios<br />Periodo Actual</p>
                            </div>
                            <Separator orientation="vertical" className="h-12 bg-primary/20" />
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-primary tracking-tighter">{stats?.averageCompletionRate}%</p>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-tight">Retención de<br />Estudiantes</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <Separator className="opacity-50" />

            <motion.div variants={item} className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    <h2 className="text-2xl font-black tracking-tight uppercase">Rankings de Elite</h2>
                </div>
                <p className="text-muted-foreground font-medium text-lg ml-1">Reconocimiento al desempeño excepcional en la plataforma NexusAlpri.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="analytics-course-rankings">
                <motion.div variants={item}>
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-primary/10 rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                        <CardContent className="pt-8">
                            <RankingList title="Cursos Más Populares" items={stats?.topCoursesByEnrollment || []} icon={TrendingUp} unit=" insc." variant="primary" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-emerald-500/10 rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                        <CardContent className="pt-8">
                            <RankingList title="Mejor Finalización" items={stats?.topCoursesByCompletion || []} icon={Award} unit="%" variant="success" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-amber-500/10 rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                        <CardContent className="pt-8">
                            <RankingList title="Oportunidades" items={stats?.lowestCoursesByCompletion || []} icon={TrendingDown} unit="%" variant="warning" />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="analytics-user-rankings">
                <motion.div variants={item}>
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-primary/10 rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                        <CardContent className="pt-8">
                            <RankingList title="Estudiantes Activos" items={stats?.topStudentsByEnrollment || []} icon={IconUsersTotal} unit=" insc." variant="primary" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-emerald-500/10 rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                        <CardContent className="pt-8">
                            <RankingList title="Mejores Estudiantes" items={stats?.topStudentsByCompletion || []} icon={BookOpenCheck} unit=" compl." variant="success" />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card className="h-full bg-card/40 backdrop-blur-xl border-amber-500/10 rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                        <CardContent className="pt-8">
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
