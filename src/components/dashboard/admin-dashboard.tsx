// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, GraduationCap, Percent, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, Database, ArrowRight, Folder, Megaphone, FileText, AlertCircle, Calendar, Pencil, ExternalLink, LineChart } from "lucide-react";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { SecurityLogTimeline } from "../security/security-log-timeline";
import { SecurityLogDetailSheet } from "../security/security-log-detail-sheet";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { MetricCard } from "../analytics/metric-card";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, ComposedChart, Legend, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { DonutChart } from "../analytics/donut-chart";


const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Administradores", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;


const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  // Muestra solo el número del día.
  return format(date, "d", { locale: es });
};

export function AdminDashboard({ adminStats, securityLogs, recentAnnouncements, upcomingEvents }: {
  adminStats: AdminDashboardStats;
  securityLogs: AppSecurityLog[];
  recentAnnouncements?: AnnouncementType[];
  upcomingEvents?: CalendarEvent[];
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card id="admin-welcome-card" className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg h-full flex flex-col justify-between col-span-1 lg:col-span-4">
              <div className="relative z-10 flex items-center justify-between">
                  <div>
                      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                      <p className="text-primary-foreground/80">Bienvenido al Centro de Mando de tu plataforma.</p>
                  </div>
                  {settings?.dashboardImageUrlAdmin && (
                    <div className="relative w-28 h-28 flex-shrink-0 hidden md:block">
                      <Image src={settings.dashboardImageUrlAdmin} alt="Imagen del panel de Administrador" fill className="object-contain" data-ai-hint="admin dashboard mascot" />
                    </div>
                  )}
              </div>
          </Card>
      </div>
        
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Gráficos Principales */}
        <div className="xl:col-span-1 space-y-6">
           <DonutChart title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
           <Card>
              <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><LineChart className="h-4 w-4 text-primary"/>Tendencia de Actividad</CardTitle>
              </CardHeader>
              <CardContent className="h-64 pr-4">
                 <ChartContainer config={{ newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-1))" }, newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-2))" }}} className="w-full h-full">
                    <ComposedChart data={adminStats.contentActivityTrend} accessibilityLayer margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12}/>
                      <YAxis allowDecimals={false} width={30} fontSize={12}/>
                      <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Legend iconType="circle" />
                      <Bar dataKey="newCourses" fill="var(--color-newCourses)" radius={4} name="Nuevos Cursos" />
                      <Line type="monotone" dataKey="newEnrollments" stroke="var(--color-newEnrollments)" strokeWidth={3} dot={false} name="Inscripciones" />
                    </ComposedChart>
                  </ChartContainer>
              </CardContent>
          </Card>
        </div>

        {/* Columna Central: Auditoría */}
        <div className="xl:col-span-1">
            <Card>
              <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary"/>Auditoría de Seguridad</CardTitle>
                  <CardDescription>Últimos eventos importantes.</CardDescription>
              </CardHeader>
              <CardContent>
                  <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog}/>
              </CardContent>
              <CardFooter>
                 <Button variant="outline" size="sm" className="w-full" asChild><Link href="/security-audit">Ver auditoría completa <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
              </CardFooter>
           </Card>
        </div>
        
        {/* Columna Derecha: Acciones y Alertas */}
        <div className="xl:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4 text-primary"/>Accesos Rápidos</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                 <Button variant="outline" asChild><Link href="/manage-courses">Crear Curso</Link></Button>
                 <Button variant="outline" asChild><Link href="/users">Gestionar Usuarios</Link></Button>
                 <Button variant="outline" asChild><Link href="/analytics">Ver Analíticas</Link></Button>
                 <Button variant="outline" asChild><Link href="/settings">Ajustes</Link></Button>
              </CardContent>
           </Card>
            {upcomingEvents && upcomingEvents.length > 0 && <CalendarWidget events={upcomingEvents} />}
            {recentAnnouncements && recentAnnouncements.length > 0 && <AnnouncementsWidget announcements={recentAnnouncements} />}
        </div>
      </div>
      
      {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
