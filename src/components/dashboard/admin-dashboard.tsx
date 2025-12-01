// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, GraduationCap, Percent, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, Database, ArrowRight, LineChart, UsersRound, BookOpen } from "lucide-react";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog, Announcement as AnnouncementType, CalendarEvent, Course, Notification as AppNotification } from '@/types';
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { SecurityLogTimeline } from "../security/security-log-timeline";
import { SecurityLogDetailSheet } from "../security/security-log-detail-sheet";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DonutChart } from "../analytics/donut-chart";
import { HealthStatusWidget } from "./health-status-widget";
import { MetricCard } from "../analytics/metric-card";
import { NotificationsWidget } from "./notifications-widget";

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Administradores", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  if (!isValid(date)) return tick;
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

export function AdminDashboard({ adminStats, securityLogs, upcomingEvents, pendingCourses, notifications }: {
  adminStats: AdminDashboardStats;
  securityLogs: AppSecurityLog[];
  upcomingEvents?: CalendarEvent[];
  pendingCourses?: Course[];
  notifications?: AppNotification[];
}) {
  const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
  const router = useRouter();
  const { user, settings } = useAuth();


  if (!adminStats) return null;
  
  const userRolesChartData = (adminStats.usersByRole || []).map(item => ({
      role: item.role,
      label: userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.label || item.role,
      count: item.count,
      fill: userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.color,
  })).filter(item => item.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-8 relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground shadow-lg flex items-center">
            <div className="relative z-10 flex items-center justify-between gap-6 w-full">
               <div className="space-y-1">
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                  <p className="text-primary-foreground/80">Bienvenido al Centro de Mando de tu plataforma.</p>
               </div>
               {settings?.dashboardImageUrlAdmin && (
                 <div className="relative w-32 h-32 flex-shrink-0 hidden sm:block">
                   <Image src={settings.dashboardImageUrlAdmin} alt="Imagen del panel de Admin" fill className="object-contain" data-ai-hint="admin dashboard mascot"/>
                 </div>
               )}
            </div>
        </Card>
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <MetricCard title="Usuarios Totales" value={adminStats?.totalUsers || 0} icon={UsersRound} index={0} onClick={() => router.push('/users')} />
            <MetricCard title="Cursos Publicados" value={adminStats?.totalPublishedCourses || 0} icon={GraduationCap} index={1} onClick={() => router.push('/manage-courses?tab=PUBLISHED')} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* --- COLUMNA IZQUIERDA: GRÁFICOS --- */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><LineChart className="h-4 w-4 text-primary"/>Tendencia de Actividad</CardTitle>
              </CardHeader>
              <CardContent className="h-64 pr-4">
                 <ChartContainer config={{ newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-1))" }, newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-2))" }}} className="w-full h-full">
                    <ComposedChart data={adminStats.contentActivityTrend} accessibilityLayer margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12}/>
                      <YAxis allowDecimals={false} width={30} fontSize={12}/>
                      <Tooltip content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                      <Legend iconType="circle" />
                      <Bar dataKey="newCourses" fill="var(--color-newCourses)" radius={4} name="Nuevos Cursos" />
                      <Line type="monotone" dataKey="newEnrollments" stroke="var(--color-newEnrollments)" strokeWidth={3} dot={false} name="Inscripciones" />
                    </ComposedChart>
                  </ChartContainer>
              </CardContent>
            </Card>
             <DonutChart title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
        </div>

        {/* --- COLUMNA CENTRAL: SEGURIDAD Y TAREAS --- */}
        <div className="lg:col-span-1 space-y-6">
           <Card>
              <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary"/>Auditoría de Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                  <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog}/>
              </CardContent>
              <CardFooter>
                 <Button variant="outline" size="sm" className="w-full" asChild><Link href="/security-audit">Ver auditoría completa <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
              </CardFooter>
           </Card>
            <Card>
              <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-primary" />Cursos Pendientes de Revisión</CardTitle>
              </CardHeader>
              <CardContent>
                 {pendingCourses && pendingCourses.length > 0 ? (
                    <div className="space-y-2">
                        {pendingCourses.map(course => (
                            <Link key={course.id} href={`/manage-courses/${course.id}/edit`} className="block p-2 rounded-md hover:bg-muted">
                                <p className="font-semibold text-sm">{course.title}</p>
                                <p className="text-xs text-muted-foreground">Por {course.instructor.name}</p>
                            </Link>
                        ))}
                    </div>
                 ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay cursos pendientes de revisión.</p>
                 )}
              </CardContent>
           </Card>
        </div>
        
        {/* --- COLUMNA DERECHA: ACCIONES Y ALERTAS --- */}
        <div className="lg:col-span-1 space-y-6">
             <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4 text-primary"/>Accesos Rápidos</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                 <Button variant="outline" asChild><Link href="/manage-courses">Crear Curso</Link></Button>
                 <Button variant="outline" asChild><Link href="/users">Gestionar Usuarios</Link></Button>
                 <Button variant="outline" asChild><Link href="/analytics">Ver Analíticas</Link></Button>
                 <Button variant="outline" asChild><Link href="/settings">Ajustes</Link></Button>
              </CardContent>
           </Card>
           <NotificationsWidget notifications={notifications} />
           <CalendarWidget events={upcomingEvents} />
        </div>
      </div>
      
      {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
