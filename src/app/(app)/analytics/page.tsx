
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileWarning, TrendingUp, Users, ShieldAlert, Activity, UserCheck, Award, Percent, Clock, Download, BookMarked, UserCog } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import type { UserAnalyticsData, CourseAnalyticsData, ProgressAnalyticsData, SecurityLog as AppSecurityLog, User as AppUser, EnterpriseResource } from '@/types';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { GaugeChart } from '@/components/ui/gauge';
import { getEventDetails, getInitials } from '@/lib/security-log-utils';


const MetricItem = ({ title, value, icon: Icon, unit = '' }: { title:string, value: string | number, icon: React.ElementType, unit?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}<span className="text-lg font-normal text-muted-foreground">{unit}</span></div>
        </CardContent>
    </Card>
);

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

const UserAnalyticsSection = () => {
    const [data, setData] = useState<UserAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analytics/users');
            if (!response.ok) throw new Error('Falló la carga de analíticas de usuario');
            const result: UserAnalyticsData = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserAnalytics();
    }, [fetchUserAnalytics]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <FileWarning className="h-6 w-6 mb-2" />
                <p>Error al cargar datos de usuarios.</p>
                <Button onClick={fetchUserAnalytics} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
        );
    }
    
    const pieChartData = data.usersByRole.map(roleData => ({
        name: userRolesChartConfig[roleData.role as keyof typeof userRolesChartConfig]?.label || roleData.role,
        count: roleData.count,
        fill: userRolesChartConfig[roleData.role as keyof typeof userRolesChartConfig]?.color || "hsl(var(--muted))"
    }));
    
    const totalUsers = data.usersByRole.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <MetricItem title="Total de Usuarios" value={totalUsers} icon={Users} />
              <MetricItem title="Usuarios Activos (7d)" value={data.activeUsersLast7Days} icon={UserCheck} />
            </div>
            
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader><CardTitle className="text-base">Nuevos Registros (Últimos 30 días)</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.newUsersLast30Days}>
                                <defs>
                                    <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tickFormatter={(value, index) => (index % 5 === 0 ? value : "")}
                                />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col">
                                              <span className="text-[0.70rem] uppercase text-muted-foreground">Fecha</span>
                                              <span className="font-bold text-muted-foreground">{payload[0].payload.date}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-[0.70rem] uppercase text-muted-foreground">Usuarios</span>
                                              <span className="font-bold text-foreground">{payload[0].value}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" fill="url(#colorNewUsers)" name="Nuevos Usuarios"/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Distribución por Rol</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                         <ChartContainer
                          config={userRolesChartConfig}
                          className="mx-auto aspect-square h-full"
                        >
                          <PieChart>
                            <ChartTooltip
                              content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                              data={pieChartData}
                              dataKey="count"
                              nameKey="name"
                              innerRadius={60}
                              strokeWidth={5}
                            >
                               {pieChartData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.fill}
                                />
                              ))}
                            </Pie>
                             <g>
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-3xl font-bold">
                                    {totalUsers.toLocaleString()}
                                </text>
                                <text x="50%" y="50%" dy="1.5em" textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground text-sm">
                                    Usuarios
                                </text>
                            </g>
                          </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const CourseAnalyticsSection = () => {
    const [data, setData] = useState<CourseAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourseAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analytics/courses');
            if (!response.ok) throw new Error('Falló la carga de analíticas de cursos');
            const result: CourseAnalyticsData = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourseAnalytics();
    }, [fetchCourseAnalytics]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <FileWarning className="h-6 w-6 mb-2" />
                <p>Error al cargar datos de cursos.</p>
                <Button onClick={fetchCourseAnalytics} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
        );
    }
    
    const categoryChartConfig = data.coursesByCategory.reduce((acc, cat, index) => {
        acc[cat.category] = {
            label: cat.category,
            color: `hsl(var(--chart-${(index % 5) + 1}))`
        };
        return acc;
    }, {} as ChartConfig);

    categoryChartConfig['count'] = { label: 'Cursos' };
    
    const categoryPieData = data.coursesByCategory.map((cat, index) => ({
        name: cat.category,
        count: cat.count,
        fill: `var(--color-${cat.category})`
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <MetricItem title="Tasa de Finalización" value={data.averageCompletionRate.toFixed(1)} icon={Percent} unit="%"/>
                    <MetricItem title="Puntaje Promedio (Quizzes)" value={data.averageQuizScore.toFixed(1)} icon={Award} unit="%"/>
                </div>
                <Card>
                    <CardHeader><CardTitle className="text-base">Top 5 Cursos Más Populares</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.mostEnrolledCourses} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 11 }} className="truncate" axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: "hsl(var(--muted))" }}/>
                                <Bar dataKey="enrollments" fill="hsl(var(--primary))" name="Inscripciones" barSize={20} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Distribución por Categoría</CardTitle></CardHeader>
                    <CardContent>
                        <ChartContainer
                          config={categoryChartConfig}
                          className="mx-auto aspect-square h-[345px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                  cursor={false}
                                  content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                  data={categoryPieData}
                                  dataKey="count"
                                  nameKey="name"
                                  innerRadius={60}
                                  strokeWidth={5}
                                  label
                                >
                                  {categoryPieData.map((entry) => (
                                    <Cell
                                      key={entry.name}
                                      fill={entry.fill}
                                      className="stroke-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                  ))}
                                </Pie>
                                <Legend content={<ChartTooltipContent hideLabel hideIndicator nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ProgressAnalyticsSection = () => {
    const [data, setData] = useState<ProgressAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProgressAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analytics/progress');
            if (!response.ok) throw new Error('Falló la carga de analíticas de progreso');
            const result: ProgressAnalyticsData = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProgressAnalytics();
    }, [fetchProgressAnalytics]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <FileWarning className="h-6 w-6 mb-2" />
                <p>Error al cargar datos de progreso.</p>
                <Button onClick={fetchProgressAnalytics} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            <Card className="lg:col-span-1 flex flex-col justify-center">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tasa de Abandono (Est.)</CardTitle>
                    <CardDescription>
                        Porcentaje de usuarios que inician pero no completan los cursos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <GaugeChart value={data.dropoutRate} />
                </CardContent>
            </Card>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricItem title="Estudiantes en Progreso" value={data.activeStudentsInCourses} icon={UserCheck}/>
                <MetricItem title="Tiempo Promedio Finalización" value={data.averageCompletionTimeDays} icon={Clock} unit=" días"/>
            </div>
        </div>
    );
};

const InteractionAnalyticsSection = () => {
    const [data, setData] = useState<{ totalDownloads: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInteractionAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/resources'); 
            if (!response.ok) throw new Error('Falló la carga de la lista de recursos');
            const { resources }: { resources: EnterpriseResource[] } = await response.json();
            const totalDownloads = 0;
            setData({ totalDownloads });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInteractionAnalytics();
    }, [fetchInteractionAnalytics]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }
     if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <FileWarning className="h-6 w-6 mb-2" />
                <p>Error al cargar datos de interacción.</p>
                <Button onClick={fetchInteractionAnalytics} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <MetricItem title="Descargas de Recursos" value={data?.totalDownloads ?? "N/A"} icon={Download}/>
           <MetricItem title="Uso de Funcionalidades" value="N/A" icon={Activity}/>
        </div>
    );
};

interface SecurityLogWithUser extends AppSecurityLog {
  user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

const SecurityAnalyticsSection = () => {
    const [logs, setLogs] = useState<SecurityLogWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/security/logs');
            if (!response.ok) throw new Error('Falló la carga de registros de seguridad');
            const result: { logs: SecurityLogWithUser[] } = await response.json();
            setLogs(result.logs || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <FileWarning className="h-6 w-6 mb-2" />
                <p>Error al cargar registros de seguridad.</p>
                <Button onClick={fetchLogs} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
        );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Últimos Eventos de Seguridad</CardTitle>
          <CardDescription>
            Mostrando los últimos 20 eventos. Para un historial completo, visita la página de{' '}
            <Link href="/security-audit" className="text-primary hover:underline">Auditoría de Seguridad</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">IP</TableHead>
                <TableHead className="text-right">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 20).map(log => {
                const eventInfo = getEventDetails(log.event, log.details);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {eventInfo.icon}
                        <Badge variant={eventInfo.variant}>{eventInfo.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7"><AvatarImage src={log.user.avatar || undefined} /><AvatarFallback>{getInitials(log.user.name)}</AvatarFallback></Avatar>
                          <span className="text-xs">{log.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{log.emailAttempt || 'N/A'}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs font-mono">{log.ipAddress}</TableCell>
                    <TableCell className="text-right text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
};

export default function AnalyticsPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
        }
    }, [currentUser, router]);

    if (currentUser?.role !== 'ADMINISTRATOR') {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline mb-2">Informes y Analíticas Avanzadas</h1>
                <p className="text-muted-foreground">Métricas clave para la toma de decisiones y el seguimiento del rendimiento de la plataforma.</p>
            </div>
            
            <Accordion type="multiple" defaultValue={['item-1']} className="w-full space-y-6">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><Users className="mr-3 h-5 w-5 text-primary" /> Analíticas de Usuarios</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <UserAnalyticsSection />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><BookMarked className="mr-3 h-5 w-5 text-primary" /> Analíticas de Cursos y Contenido</AccordionTrigger>
                    <AccordionContent className="pt-4">
                         <CourseAnalyticsSection />
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="item-3">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><TrendingUp className="mr-3 h-5 w-5 text-primary" /> Analíticas de Progreso de Estudiantes</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <ProgressAnalyticsSection />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><Activity className="mr-3 h-5 w-5 text-primary" /> Analíticas de Interacción y Compromiso</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <InteractionAnalyticsSection />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><ShieldAlert className="mr-3 h-5 w-5 text-primary" /> Analíticas de Seguridad</AccordionTrigger>
                    <AccordionContent className="pt-4">
                       <SecurityAnalyticsSection />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
