// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, GraduationCap, Percent, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, Database, LineChart, ArrowRight } from "lucide-react";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog } from '@/types';
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MetricCard } from "../analytics/metric-card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { SecurityLogTimeline } from "../security/security-log-timeline";
import { SecurityLogDetailSheet } from "../security/security-log-detail-sheet";
import { useRouter } from 'next/navigation';

const HealthStatusWidget = () => {
    const [healthStatus, setHealthStatus] = useState({ api: 'checking', db: 'checking' });

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const apiRes = await fetch('/api/health');
                const apiData = await apiRes.json();
                
                setHealthStatus({
                    api: apiRes.ok ? 'operational' : 'error',
                    db: apiData.db === 'connected' ? 'operational' : 'error',
                });
            } catch (error) {
                setHealthStatus({ api: 'error', db: 'error' });
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const StatusIndicator = ({ status }: { status: 'checking' | 'operational' | 'error' }) => (
        <div className="flex items-center gap-2 text-sm font-semibold">
            <div className={cn("h-2.5 w-2.5 rounded-full", {
                'bg-yellow-400 animate-pulse': status === 'checking',
                'bg-green-500': status === 'operational',
                'bg-red-500': status === 'error',
            })} />
            <span className={cn({
                'text-muted-foreground': status === 'checking',
                'text-green-600': status === 'operational',
                'text-destructive': status === 'error',
            })}>
                {status === 'checking' ? 'Verificando...' : (status === 'operational' ? 'Operacional' : 'Fallo')}
            </span>
        </div>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Salud de la Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><Monitor className="h-4 w-4"/><span>API</span></div><StatusIndicator status={healthStatus.api as any} /></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><Database className="h-4 w-4"/><span>Base de Datos</span></div><StatusIndicator status={healthStatus.db as any} /></div>
            </CardContent>
        </Card>
    );
}

const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  if (date.getDate() % 5 === 0 || date.getDate() === 1) { 
    return format(date, "d MMM", { locale: es });
  }
  return format(date, "d", { locale: es });
};

const chartConfig = {
  newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-2))" },
  newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export function AdminDashboard({ adminStats, securityLogs }: {
  adminStats: AdminDashboardStats;
  securityLogs: AppSecurityLog[];
}) {
  const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
  const router = useRouter();

  if (!adminStats) return null;

  return (
    <div className="space-y-8">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline">Centro de Mando</h1>
            <p className="text-muted-foreground">Una vista general y accionable del estado de tu plataforma.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-stats-cards">
            <MetricCard title="Usuarios Totales" value={adminStats.totalUsers} icon={Users} gradient="bg-gradient-blue" />
            <MetricCard title="Cursos Publicados" value={adminStats.totalPublishedCourses} icon={BookOpenCheck} gradient="bg-gradient-green" />
            <MetricCard title="Inscripciones Totales" value={adminStats.totalEnrollments} icon={GraduationCap} gradient="bg-gradient-purple" />
            <MetricCard title="Finalización Promedio" value={Math.round(adminStats.averageCompletionRate)} icon={Percent} suffix="%" gradient="bg-gradient-pink" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia de Actividad (Últimos 15 días)</CardTitle>
                        <CardDescription>Nuevos cursos creados vs. nuevas inscripciones.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72 pr-4">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                          <AreaChart data={adminStats.contentActivityTrend} accessibilityLayer margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-newCourses)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-newCourses)" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-newEnrollments)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-newEnrollments)" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12} tickMargin={5} />
                            <YAxis allowDecimals={false} width={30} fontSize={12}/>
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Area type="monotone" dataKey="newCourses" stroke="var(--color-newCourses)" strokeWidth={2} fillOpacity={0.4} fill="url(#colorCourses)" />
                            <Area type="monotone" dataKey="newEnrollments" stroke="var(--color-newEnrollments)" strokeWidth={2} fillOpacity={0.4} fill="url(#colorEnrollments)" />
                          </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Auditoría de Seguridad Activa</CardTitle>
                        <CardDescription className="text-xs">Últimos eventos importantes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog}/>
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" size="sm" className="w-full" asChild>
                           <Link href="/security-audit">Ver auditoría completa <ArrowRight className="ml-2 h-4 w-4"/></Link>
                       </Button>
                    </CardFooter>
                </Card>
                 <HealthStatusWidget />
                <Card>
                    <CardHeader><CardTitle className="text-base">Acciones Rápidas</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Button variant="outline" asChild><Link href="/manage-courses"><PlusCircle className="mr-2 h-4 w-4"/>Crear Curso</Link></Button>
                        <Button variant="outline" asChild><Link href="/users"><Users className="mr-2 h-4 w-4"/>Gestionar Usuarios</Link></Button>
                        <Button variant="outline" asChild><Link href="/analytics"><BarChart3 className="mr-2 h-4 w-4"/>Ver Analíticas</Link></Button>
                        <Button variant="outline" asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4"/>Ajustes</Link></Button>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
