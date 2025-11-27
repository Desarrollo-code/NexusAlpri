// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, GraduationCap, Percent, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, Database, ArrowRight, Folder, Megaphone, FileText } from "lucide-react";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog } from '@/types';
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Bar, Legend, Line } from "recharts"; 
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { SecurityLogTimeline } from "../security/security-log-timeline";
import { SecurityLogDetailSheet } from "../security/security-log-detail-sheet";
import { useRouter } from 'next/navigation';
import { MetricCard } from "../analytics/metric-card";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";


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
                'text-green-600 dark:text-green-400': status === 'operational',
                'text-destructive': status === 'error',
            })}>
                {status === 'checking' ? 'Verificando...' : (status === 'operational' ? 'Operacional' : 'Fallo')}
            </span>
        </div>
    );
    
    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base">Salud de la Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><Monitor className="h-4 w-4"/><span>API</span></div><StatusIndicator status={healthStatus.api as any} /></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><Database className="h-4 w-4"/><span>Base de Datos</span></div><StatusIndicator status={healthStatus.db as any} /></div>
            </CardContent>
        </Card>
    );
}

const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  // Muestra solo el número del día.
  return format(date, "d", { locale: es });
};

const chartConfig = {
  newUsers: { label: "Nuevos Usuarios", color: "hsl(var(--chart-1))" },
  newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export function AdminDashboard({ adminStats, securityLogs }: {
  adminStats: AdminDashboardStats;
  securityLogs: AppSecurityLog[];
}) {
  const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
  const router = useRouter();
  const { user, settings } = useAuth();


  if (!adminStats) return null;
  
  const getMonthRangeLabel = () => {
    if (!adminStats.userRegistrationTrend || adminStats.userRegistrationTrend.length === 0) return '';
    const startDate = parseISO(adminStats.userRegistrationTrend[0].date);
    const endMonth = format(new Date(), 'MMMM', { locale: es });
    const startMonth = format(startDate, 'MMMM', { locale: es});
    
    if (startMonth === endMonth) {
        return `Corresponde al mes de ${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)}`;
    }
    return `Actividad de ${startMonth} a ${endMonth}`;
  }

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
           <div className="lg:col-span-2">
                <Card id="admin-welcome-card" className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                    <div className="absolute inset-0 z-0">
                        {settings?.dashboardImageUrl && (
                            <Image src={settings.dashboardImageUrl} alt="Fondo decorativo" fill className="object-cover opacity-20" data-ai-hint="office background" />
                        )}
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="space-y-1">
                          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                          <p className="text-primary-foreground/80">Bienvenido al Centro de Mando de tu plataforma.</p>
                       </div>
                       {settings?.securityMascotUrl && (
                         <div className="relative w-28 h-28 flex-shrink-0">
                           <Image src={settings.securityMascotUrl} alt="Mascota de Seguridad" fill className="object-contain" data-ai-hint="cute robot mascot" />
                         </div>
                       )}
                    </div>
                </Card>
           </div>
           <div className="lg:col-span-1 grid grid-cols-2 gap-4">
              <MetricCard title="Usuarios Totales" value={adminStats.totalUsers} icon={Users} index={0} />
              <MetricCard title="Cursos Publicados" value={adminStats.totalPublishedCourses} icon={BookOpenCheck} index={1} />
              <MetricCard title="Inscripciones Totales" value={adminStats.totalEnrollments} icon={GraduationCap} index={2}/>
              <MetricCard title="Finalización Promedio" value={Math.round(adminStats.averageCompletionRate)} icon={Percent} suffix="%" index={3} />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div id="admin-charts-section" className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Tendencia de Actividad</CardTitle>
                        <CardDescription>Últimos 15 días</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 pr-4">
                       <ChartContainer config={chartConfig} className="w-full h-full">
                          <ComposedChart data={adminStats.userRegistrationTrend} accessibilityLayer margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12} tickMargin={5} interval={4} />
                            <YAxis yAxisId="left" allowDecimals={false} width={30} fontSize={12}/>
                            <YAxis yAxisId="right" orientation="right" allowDecimals={false} width={30} fontSize={12} />
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="count" fill="var(--color-newUsers)" radius={4} name="Usuarios" />
                            <Line yAxisId="right" type="monotone" dataKey="newEnrollments" stroke="var(--color-newEnrollments)" strokeWidth={2} name="Inscripciones" data={adminStats.contentActivityTrend} />
                          </ComposedChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
                <Card id="admin-quick-actions">
                    <CardContent className="grid grid-cols-2 gap-2 p-4">
                        <Button variant="outline" asChild><Link href="/manage-courses"><PlusCircle className="mr-2 h-4 w-4"/>Crear Curso</Link></Button>
                        <Button variant="outline" asChild><Link href="/users"><Users className="mr-2 h-4 w-4"/>Gestionar Usuarios</Link></Button>
                        <Button variant="outline" asChild><Link href="/analytics"><BarChart3 className="mr-2 h-4 w-4"/>Ver Analíticas</Link></Button>
                        <Button variant="outline" asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4"/>Ajustes</Link></Button>
                    </CardContent>
                </Card>
                <div id="admin-security-log-widget">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Auditoría de Seguridad</CardTitle>
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
                </div>
                <HealthStatusWidget />
            </div>
        </div>
        
        {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
