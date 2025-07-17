'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  FileWarning,
  TrendingUp,
  Users,
  ShieldAlert,
  Activity,
  UserCheck,
  Award,
  Percent,
  Clock,
  Download,
  BookMarked,
  UserCog,
  Info, // Añadido para un ícono informativo en el estado vacío
} from 'lucide-react';
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


// Componente de Elemento de Métrica más compacto
const MetricItem = ({ title, value, icon: Icon, unit = '' }: { title: string, value: string | number, icon: React.ElementType, unit?: string }) => (
  <Card className="flex flex-col items-center justify-center p-4"> {/* Ajustado padding y flex para centrar */}
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 w-full">
      <CardTitle className="text-sm font-medium text-center flex-grow">{title}</CardTitle> {/* Centrar título */}
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent className="pt-2"> {/* Reducido padding superior */}
      <div className="text-2xl font-bold text-center">{value}<span className="text-lg font-normal text-muted-foreground">{unit}</span></div>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Ajustado a 3 columnas para mejor distribución */}
      <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-1 gap-6"> {/* Un solo stack de métricas más compactas */}
        <MetricItem title="Total de Usuarios" value={totalUsers} icon={Users} />
        <MetricItem title="Usuarios Activos (7d)" value={data.activeUsersLast7Days} icon={UserCheck} />
      </div>

      <div className="lg:col-span-2"> {/* El gráfico de nuevos registros ocupa 2 columnas */}
        <Card>
          <CardHeader><CardTitle className="text-base">Nuevos Registros (Últimos 30 días)</CardTitle></CardHeader>
          <CardContent className="h-[280px]"> {/* Altura ligeramente reducida */}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.newUsersLast30Days}>
                <defs>
                  <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }} // Fuente más pequeña
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value, index) => (index % 5 === 0 ? value : "")}
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} /> {/* Fuente más pequeña */}
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
                <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" fill="url(#colorNewUsers)" name="Nuevos Usuarios" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1"> {/* El gráfico de roles se mantiene en una columna */}
        <Card className="h-full"> {/* Asegurarse de que la tarjeta ocupe toda la altura disponible */}
          <CardHeader><CardTitle className="text-base">Distribución por Rol</CardTitle></CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center"> {/* Ajustar altura y centrar contenido */}
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
          <MetricItem title="Tasa de Finalización" value={data.averageCompletionRate.toFixed(1)} icon={Percent} unit="%" />
          <MetricItem title="Puntaje Promedio (Quizzes)" value={data.averageQuizScore.toFixed(1)} icon={Award} unit="%" />
        </div>
        <Card className="h-full flex flex-col"> {/* Hace la tarjeta flexible para ocupar el espacio restante */}
          <CardHeader><CardTitle className="text-base">Top 5 Cursos Más Populares</CardTitle></CardHeader>
          <CardContent className="flex-grow"> {/* Permite que el contenido se expanda */}
            <ResponsiveContainer width="100%" height={250}> {/* Altura fija para el gráfico */}
              <BarChart data={data.mostEnrolledCourses} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="title" width={100} tick={{ fontSize: 10 }} className="truncate" axisLine={false} tickLine={false} /> {/* Ancho y fuente ajustados */}
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="enrollments" fill="hsl(var(--primary))" name="Inscripciones" barSize={15} radius={[0, 4, 4, 0]} /> {/* Bar size reducido */}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="h-full"> {/* Asegurarse de que la tarjeta ocupe toda la altura disponible */}
          <CardHeader><CardTitle className="text-base">Distribución por Categoría</CardTitle></CardHeader>
          <CardContent className="h-[345px] flex items-center justify-center"> {/* Ajustar altura y centrar contenido */}
            <ChartContainer
              config={categoryChartConfig}
              className="mx-auto aspect-square h-full"
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"> {/* Ajustado a 3 columnas */}
      <Card className="lg:col-span-1 flex flex-col justify-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tasa de Abandono (Est.)</CardTitle>
          <CardDescription>
            Porcentaje de usuarios que inician pero no completan los cursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center"> {/* Altura fija para el GaugeChart y centrado */}
          <GaugeChart value={data.dropoutRate} />
        </CardContent>
      </Card>
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6"> {/* Estas métricas ocupan 2 columnas */}
        <MetricItem title="Estudiantes en Progreso" value={data.activeStudentsInCourses} icon={UserCheck} />
        <MetricItem title="Tiempo Promedio Finalización" value={data.averageCompletionTimeDays} icon={Clock} unit=" días" />
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
      // Simulación de descarga de recursos para obtener el total de descargas
      // NOTA: Tu endpoint /api/resources actualmente no devuelve un total de descargas.
      // Necesitarás modificar tu API para que retorne esta métrica si la tienes disponible.
      // Por ahora, lo dejaré con un valor estático o calculado del cliente si fuera posible.
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Falló la carga de la lista de recursos');
      const { resources }: { resources: EnterpriseResource[] } = await response.json();
      
      // Si cada recurso tiene un campo 'downloadCount', puedes sumarlos aquí.
      // const totalDownloads = resources.reduce((sum, resource) => sum + (resource.downloadCount || 0), 0);
      // Por ahora, un valor dummy:
      const totalDownloads = resources.length * 5; // Ejemplo: 5 descargas por recurso
      
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

  // Nuevo componente para el estado vacío/No Disponible
  const EmptyMetricState = ({ title, icon: Icon, description }: { title: string, icon: React.ElementType, description: string }) => (
    <Card className="flex flex-col items-center justify-center p-6 text-center h-full">
      <Icon className="h-8 w-8 text-muted-foreground mb-3" />
      <CardTitle className="text-lg font-semibold mb-2">{title}</CardTitle>
      <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricItem title="Descargas de Recursos" value={data?.totalDownloads ?? "N/A"} icon={Download} />
      {/* Usar el nuevo componente para "Uso de Funcionalidades" */}
      <EmptyMetricState
        title="Uso de Funcionalidades"
        icon={UserCog}
        description="Datos de interacción detallados no disponibles actualmente. Se requiere configuración adicional."
      />
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
      <CardContent className="p-0"> {/* Elimina el padding de CardContent para que la tabla lo maneje */}
        {logs.length > 0 ? (
          <div className="overflow-x-auto"> {/* Para manejar el desbordamiento en pantallas pequeñas */}
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50"> {/* Fondo ligeramente diferente para el encabezado */}
                  <TableHead className="w-[150px] pl-6 py-3">Evento</TableHead> {/* Ajustado padding y ancho */}
                  <TableHead className="w-[200px]">Usuario</TableHead> {/* Ajustado ancho */}
                  <TableHead className="hidden md:table-cell w-[120px]">IP</TableHead> {/* Ajustado ancho */}
                  <TableHead className="text-right pr-6 w-[180px]">Fecha</TableHead> {/* Ajustado padding y ancho */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 20).map(log => {
                  const eventInfo = getEventDetails(log.event, log.details);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="pl-6 py-2"> {/* Ajustado padding */}
                        <div className="flex items-center gap-2">
                          {eventInfo.icon}
                          <Badge variant={eventInfo.variant}>{eventInfo.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-2"> {/* Ajustado padding */}
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7"><AvatarImage src={log.user.avatar || undefined} /><AvatarFallback>{getInitials(log.user.name)}</AvatarFallback></Avatar>
                            <span className="text-sm font-medium">{log.user.name}</span> {/* Texto un poco más grande y negrita */}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">{log.emailAttempt || 'N/A'}</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-mono py-2">{log.ipAddress}</TableCell> {/* Ajustado padding y fuente */}
                      <TableCell className="text-right text-sm py-2 pr-6">{new Date(log.createdAt).toLocaleString()}</TableCell> {/* Ajustado padding y fuente */}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <Info className="h-8 w-8 mb-4" />
            <p className="text-center">No hay registros de seguridad disponibles.</p>
          </div>
        )}
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
<<<<<<< HEAD
}
=======
  }

  return (
    <div className="space-y-8 p-6"> {/* Añadido padding general a la página */}
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2 text-foreground">Informes y Analíticas Avanzadas</h1>
        <p className="text-muted-foreground">Métricas clave para la toma de decisiones y el seguimiento del rendimiento de la plataforma.</p>
      </div>

      <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5']} className="w-full space-y-6"> {/* Abierto por defecto para ver los cambios */}
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold bg-card p-4 rounded-lg hover:bg-card/80 hover:no-underline border border-muted-foreground/20"> {/* Estilo para fondo oscuro */}
            <Users className="mr-3 h-5 w-5 text-primary" /> Analíticas de Usuarios
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-2"> {/* Pequeño padding horizontal */}
            <UserAnalyticsSection />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold bg-card p-4 rounded-lg hover:bg-card/80 hover:no-underline border border-muted-foreground/20">
            <BookMarked className="mr-3 h-5 w-5 text-primary" /> Analíticas de Cursos y Contenido
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-2">
            <CourseAnalyticsSection />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold bg-card p-4 rounded-lg hover:bg-card/80 hover:no-underline border border-muted-foreground/20">
            <TrendingUp className="mr-3 h-5 w-5 text-primary" /> Analíticas de Progreso de Estudiantes
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-2">
            <ProgressAnalyticsSection />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold bg-card p-4 rounded-lg hover:bg-card/80 hover:no-underline border border-muted-foreground/20">
            <Activity className="mr-3 h-5 w-5 text-primary" /> Analíticas de Interacción y Compromiso
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-2">
            <InteractionAnalyticsSection />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold bg-card p-4 rounded-lg hover:bg-card/80 hover:no-underline border border-muted-foreground/20">
            <ShieldAlert className="mr-3 h-5 w-5 text-primary" /> Analíticas de Seguridad
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-2">
            <SecurityAnalyticsSection />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
>>>>>>> 972d1c6954b626de8ee8b40995cc6cc439617185
