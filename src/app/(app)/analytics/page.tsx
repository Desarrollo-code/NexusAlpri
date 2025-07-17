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
  BookMarked,
  UserCog,
  Info,
  LineChart, // Añadir LineChart para la sección de progreso si queremos un gráfico de línea
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserAnalyticsData, CourseAnalyticsData, ProgressAnalyticsData, SecurityLog as AppSecurityLog, User as AppUser } from '@/types';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, AreaChart, Area } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { GaugeChart } from '@/components/ui/gauge';
import { getEventDetails, getInitials } from '@/lib/security-log-utils';
import { Separator } from '@/components/ui/separator';

// Componente para las métricas individuales (Tarjeta más compacta)
const MetricItem = ({ title, value, icon: Icon, unit = '' }: { title: string, value: string | number, icon: React.ElementType, unit?: string }) => (
  <Card className="flex flex-col p-4 bg-zinc-900 border-zinc-800 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"> {/* Fondo más oscuro, borde y sombra */}
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
      <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle> {/* Color de título más suave */}
      <Icon className="h-4 w-4 text-primary-foreground" /> {/* Icono en color de contraste */}
    </CardHeader>
    <CardContent className="p-0 pt-2">
      <div className="text-2xl font-bold text-teal-400">{value}<span className="text-lg font-normal text-teal-600">{unit}</span></div> {/* Valor en color de acento, unidad más suave */}
    </CardContent>
  </Card>
);

<<<<<<< HEAD
=======
const userRolesChartConfig = {
  count: { label: "Usuarios" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" }, // Asegurarse de que estos colores contrasten bien
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

const newUsersChartConfig = {
  count: { label: "Usuarios", color: "hsl(var(--accent))" }, // Accent debería ser un color vibrante
} satisfies ChartConfig

>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
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
    return <div className="flex justify-center items-center p-8 text-white"><Loader2 className="h-6 w-6 animate-spin text-primary" /> Cargando...</div>;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-400"> {/* Color para errores */}
        <FileWarning className="h-6 w-6 mb-2" />
        <p>Error al cargar datos de usuarios.</p>
        <Button onClick={fetchUserAnalytics} variant="outline" size="sm" className="mt-2 border-red-500 text-red-500 hover:bg-red-900">Reintentar</Button>
      </div>
    );
  }

  const userRolesChartConfig = {
    count: { label: "Usuarios" },
    ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" },
    INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
    STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig

  const newUsersChartConfig = {
    count: { label: "Usuarios", color: "hsl(var(--accent))" },
  } satisfies ChartConfig
  
  const pieChartData = data.usersByRole.map(roleData => ({
    name: userRolesChartConfig[roleData.role as keyof typeof userRolesChartConfig]?.label || roleData.role,
    count: roleData.count,
    fill: userRolesChartConfig[roleData.role as keyof typeof userRolesChartConfig]?.color || "hsl(var(--muted))"
  }));

  const totalUsers = data.usersByRole.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Gap más ajustado */}
      {/* Las dos primeras métricas se mantienen en línea */}
      <MetricItem title="Total de Usuarios" value={totalUsers} icon={Users} />
      <MetricItem title="Usuarios Activos (7d)" value={data.activeUsersLast7Days} icon={UserCheck} />

      {/* Gráfico de Nuevos Registros ahora en 2 columnas en pantallas grandes */}
      <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 text-white shadow-lg">
        <CardHeader className="pb-3"> {/* Padding inferior más pequeño */}
          <CardTitle className="text-base text-gray-200">Nuevos Registros (Últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] pb-0"> {/* Reducir altura del gráfico y quitar padding inferior */}
          <ChartContainer config={newUsersChartConfig} className="w-full h-full">
            <AreaChart data={data.newUsersLast30Days} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /> {/* Color de la rejilla más discreto */}
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(value, index) => (index % 5 === 0 ? value : "")} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator className="bg-zinc-800 text-white border-zinc-700" />} /> {/* Estilo del tooltip */}
              <Area type="monotone" dataKey="count" stroke="var(--color-count)" fill="url(#colorNewUsers)" name="Nuevos Usuarios" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

<<<<<<< HEAD
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Distribución por Rol</CardTitle></CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
                 <ChartContainer config={userRolesChartConfig} className="w-full h-full">
                    <BarChart data={pieChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" name="Usuarios" radius={[4, 4, 0, 0]}>
                        {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
=======
      {/* Gráfico de Distribución por Rol en 2 columnas en pantallas grandes */}
      <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 text-white shadow-lg">
        <CardHeader className="pb-3"><CardTitle className="text-base text-gray-200">Distribución por Rol</CardTitle></CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center pt-0"> {/* Reducir padding superior */}
          <ChartContainer config={userRolesChartConfig} className="w-full h-full">
            <BarChart data={pieChartData} layout="horizontal" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}> {/* Márgenes ajustados */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent hideLabel className="bg-zinc-800 text-white border-zinc-700" />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }} /> {/* Estilo de la leyenda */}
              <Bar dataKey="count" name="Usuarios" radius={[4, 4, 0, 0]}>
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
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
    return <div className="flex justify-center items-center p-8 text-white"><Loader2 className="h-6 w-6 animate-spin text-primary" /> Cargando...</div>;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-400">
        <FileWarning className="h-6 w-6 mb-2" />
        <p>Error al cargar datos de cursos.</p>
        <Button onClick={fetchCourseAnalytics} variant="outline" size="sm" className="mt-2 border-red-500 text-red-500 hover:bg-red-900">Reintentar</Button>
      </div>
    );
  }

  const categoryChartConfig = data.coursesByCategory.reduce((acc, cat, index) => {
    acc[cat.category.replace(/\s/g, '_')] = { label: cat.category, color: `hsl(var(--chart-${(index % 5) + 1}))` };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"> {/* Ajuste de gap */}
      {/* Métricas de cursos en una sola fila */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full"> {/* Asegurarse de que ocupen el ancho completo si es necesario */}
        <MetricItem title="Tasa de Finalización" value={data.averageCompletionRate.toFixed(1)} icon={Percent} unit="%" />
        <MetricItem title="Puntaje Promedio (Quizzes)" value={data.averageQuizScore.toFixed(1)} icon={Award} unit="%" />
      </div>

      <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 text-white shadow-lg"> {/* Ocupa una columna en lg */}
        <CardHeader className="pb-3"><CardTitle className="text-base text-gray-200">Top 5 Cursos Más Populares</CardTitle></CardHeader>
        <CardContent className="h-[250px] pt-0"> {/* Ajuste de altura y padding */}
          <ChartContainer config={{ enrollments: { label: 'Inscripciones', color: 'hsl(var(--primary))' } }} className="w-full h-full">
            <BarChart data={data.mostEnrolledCourses} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}> {/* Margen izquierdo ajustado */}
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} className="truncate" axisLine={false} tickLine={false} />
<<<<<<< HEAD
              <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent />} />
              <Bar dataKey="enrollments" name="Inscripciones" barSize={15} radius={[0, 4, 4, 0]} fill="var(--color-enrollments)" />
=======
              <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent className="bg-zinc-800 text-white border-zinc-700" />} />
              <Bar dataKey="enrollments" name="Inscripciones" barSize={15} radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" /> {/* Color de barra */}
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
<<<<<<< HEAD
=======
      <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 text-white shadow-lg"> {/* Ocupa la otra columna en lg */}
        <CardHeader className="pb-3"><CardTitle className="text-base text-gray-200">Distribución por Categoría</CardTitle></CardHeader>
        <CardContent className="h-[300px] pt-0">
          <ChartContainer config={categoryChartConfig} className="w-full h-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="bg-zinc-800 text-white border-zinc-700" />} />
              <Pie data={data.coursesByCategory} dataKey="count" nameKey="category" innerRadius={60} strokeWidth={5} >
                {data.coursesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`var(--color-${entry.category.replace(/\s/g, '_')})`} className="stroke-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2" />
                ))}
              </Pie>
              <Legend content={<ChartTooltipContent hideLabel hideIndicator nameKey="category" className="bg-zinc-800 text-white border-zinc-700" />} wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
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
    return <div className="flex justify-center items-center p-8 text-white"><Loader2 className="h-6 w-6 animate-spin text-primary" /> Cargando...</div>;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-400">
        <FileWarning className="h-6 w-6 mb-2" />
        <p>Error al cargar datos de progreso.</p>
        <Button onClick={fetchProgressAnalytics} variant="outline" size="sm" className="mt-2 border-red-500 text-red-500 hover:bg-red-900">Reintentar</Button>
      </div>
    );
  }

  // Ejemplo de datos para un LineChart si quisieras agregarlo para el progreso
  // const progressOverTimeData = [
  //   { date: '2023-01-01', completion: 10 },
  //   { date: '2023-01-15', completion: 25 },
  //   { date: '2023-02-01', completion: 40 },
  //   { date: '2023-02-15', completion: 60 },
  //   { date: '2023-03-01', completion: 75 },
  // ];
  // const progressChartConfig = {
  //   completion: { label: "Tasa de Finalización", color: "hsl(var(--chart-4))" },
  // } satisfies ChartConfig

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Ajuste de gap */}
      <MetricItem title="Estudiantes en Progreso" value={data.activeStudentsInCourses} icon={UserCheck} />
      <MetricItem title="Tiempo Promedio Finalización" value={data.averageCompletionTimeDays} icon={Clock} unit=" días" />
      <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Tasa de Abandono (Est.)</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center p-0">
          <GaugeChart value={data.dropoutRate} size={120} /> {/* El componente GaugeChart ya es genial */}
        </CardContent>
      </Card>
      {/* Puedes añadir un gráfico de línea aquí para mostrar progreso a lo largo del tiempo */}
      {/* <Card className="md:col-span-3 bg-zinc-900 border-zinc-800 text-white shadow-lg">
        <CardHeader><CardTitle className="text-base text-gray-200">Progreso General del Estudiante</CardTitle></CardHeader>
        <CardContent className="h-[200px] pt-0">
          <ChartContainer config={progressChartConfig} className="w-full h-full">
            <LineChart data={progressOverTimeData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator className="bg-zinc-800 text-white border-zinc-700" />} />
              <Line type="monotone" dataKey="completion" stroke="var(--color-completion)" name="Completado %" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card> */}
    </div>
  );
};

const InteractionAnalyticsSection = () => {
<<<<<<< HEAD
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted-foreground">
                  <UserCog className="h-8 w-8 mb-3" />
                  <p className="font-semibold">Datos de Interacción</p>
                  <p className="text-sm">Métricas detalladas de interacción no disponibles actualmente.</p>
                </div>
            </CardContent>
        </Card>
    );
=======
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
      <CardHeader><CardTitle className="text-base text-gray-200">Interacción y Compromiso</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-6 text-center h-full text-gray-500"> {/* Reducir padding */}
          <UserCog className="h-8 w-8 mb-3 text-gray-600" /> {/* Color de icono más suave */}
          <p className="font-semibold text-gray-400">Datos de Interacción</p>
          <p className="text-sm text-gray-500">Métricas detalladas de interacción no disponibles actualmente.</p>
        </div>
      </CardContent>
    </Card>
  );
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
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
    return <div className="flex justify-center items-center p-8 text-white"><Loader2 className="h-6 w-6 animate-spin text-primary" /> Cargando...</div>;
  }

  if (error) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-red-400">
            <FileWarning className="h-6 w-6 mb-2" />
            <p>Error al cargar registros de seguridad.</p>
            <Button onClick={fetchLogs} variant="outline" size="sm" className="mt-2 border-red-500 text-red-500 hover:bg-red-900">Reintentar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
<<<<<<< HEAD
    <Card>
      <CardHeader>
        <CardDescription>
=======
    <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-gray-200">Últimos Eventos de Seguridad</CardTitle>
        <CardDescription className="text-gray-400"> {/* Color de descripción */}
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
          Mostrando los últimos 20 eventos. Para un historial completo, visita la página de{' '}
          <Link href="/security-audit" className="text-teal-400 hover:underline">Auditoría de Seguridad</Link>. {/* Enlace en color de acento */}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-800 text-gray-300"> {/* Fila de encabezado con fondo más oscuro y texto más claro */}
                  <TableHead className="w-[150px] pl-6 py-3">Evento</TableHead>
                  <TableHead className="w-[200px]">Usuario</TableHead>
                  <TableHead className="hidden md:table-cell w-[120px]">IP</TableHead>
                  <TableHead className="text-right pr-6 w-[180px]">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 20).map(log => {
                  const eventInfo = getEventDetails(log.event, log.details);
                  return (
                    <TableRow key={log.id} className="border-zinc-700 hover:bg-zinc-800/50 transition-colors"> {/* Borde y hover más sutil */}
                      <TableCell className="pl-6 py-2">
                        <div className="flex items-center gap-2">{eventInfo.icon}
                          <Badge variant={eventInfo.variant} className="border-transparent text-xs px-2 py-0.5" >{eventInfo.label}</Badge> {/* Badge más compacto */}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-zinc-700"> {/* Borde para avatar */}
                              <AvatarImage src={log.user.avatar || undefined} />
                              <AvatarFallback className="bg-zinc-700 text-gray-300 text-xs">{getInitials(log.user.name)}</AvatarFallback> {/* Fallback estilizado */}
                            </Avatar>
                            <span className="text-sm font-medium text-gray-200">{log.user.name}</span>
                          </div>
                        ) : (<span className="text-sm text-gray-500">{log.emailAttempt || 'N/A'}</span>)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-mono py-2 text-gray-400">{log.ipAddress}</TableCell>
                      <TableCell className="text-right text-sm py-2 pr-6 text-gray-400">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Info className="h-8 w-8 mb-4 text-gray-600" />
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
      <div className="flex h-full items-center justify-center bg-zinc-950"> {/* Fondo consistente */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

<<<<<<< HEAD
  const Section = ({ title, icon: Icon, children, className }: { title: string, icon: React.ElementType, children: React.ReactNode, className?: string }) => (
    <section className={className}>
      <h2 className="text-2xl font-semibold font-headline flex items-center gap-3 mb-4">
        <Icon className="h-6 w-6 text-primary" />
=======
  const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <section className="space-y-6"> {/* Espacio entre secciones un poco más ajustado */}
      <h2 className="text-2xl font-semibold font-headline flex items-center gap-3 text-white"> {/* Título en blanco */}
        <Icon className="h-6 w-6 text-teal-400" /> {/* Icono de sección en color de acento */}
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
        {title}
      </h2>
      {children}
    </section>
  );

  return (
<<<<<<< HEAD
    <div className="space-y-8 p-1">
=======
    <div className="space-y-12 p-8 bg-zinc-950 min-h-screen text-white"> {/* Fondo oscuro principal y padding general */}
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
      <div>
        <h1 className="text-4xl font-bold font-headline mb-2 text-white">Informes y Analíticas Avanzadas</h1> {/* Título más grande y blanco */}
        <p className="text-gray-400">Métricas clave para la toma de decisiones y el seguimiento del rendimiento de la plataforma.</p> {/* Descripción más suave */}
      </div>

      <Separator className="bg-zinc-700" /> {/* Separador más oscuro */}

<<<<<<< HEAD
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Section title="Analíticas de Usuarios" icon={Users}>
                <UserAnalyticsSection />
            </Section>
            
            <Section title="Analíticas de Cursos y Contenido" icon={BookMarked}>
                <CourseAnalyticsSection />
            </Section>
=======
      <Section title="Analíticas de Usuarios" icon={Users}>
        <UserAnalyticsSection />
      </Section>

      <Separator className="bg-zinc-700" />

      <Section title="Analíticas de Cursos y Contenido" icon={BookMarked}>
        <CourseAnalyticsSection />
      </Section>

      <Separator className="bg-zinc-700" />

      <Section title="Analíticas de Progreso de Estudiantes" icon={TrendingUp}>
        <ProgressAnalyticsSection />
      </Section>

      <Separator className="bg-zinc-700" />

      <Section title="Analíticas de Interacción y Seguridad" icon={Activity}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"> {/* Ajuste de gap */}
          <div className="lg:col-span-1">
            <InteractionAnalyticsSection />
          </div>
          <div className="lg:col-span-2">
            <SecurityAnalyticsSection />
          </div>
>>>>>>> 6de95f814409b4bf084da5bdfce0bbcb0ad7ab0d
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Section title="Progreso de Estudiantes" icon={TrendingUp}>
                <ProgressAnalyticsSection />
            </Section>

            <Section title="Interacción" icon={UserCog}>
                <InteractionAnalyticsSection />
            </Section>
        </div>
      </div>
      
      <Section title="Últimos Eventos de Seguridad" icon={Activity}>
        <SecurityAnalyticsSection />
      </Section>

    </div>
  );
}