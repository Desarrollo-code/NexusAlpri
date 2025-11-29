// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, GraduationCap, Percent, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, Database, ArrowRight, Folder, Megaphone, FileText, AlertCircle, Calendar, Pencil, ExternalLink, LineChart } from "lucide-react";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { SecurityLogTimeline } from "../security/security-log-timeline";
import { SecurityLogDetailSheet } from "../security/security-log-detail-sheet";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, ComposedChart, Legend, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { DonutChart } from "../analytics/donut-chart";
import { HealthStatusWidget } from "./health-status-widget";

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

const MetricCard = ({ title, value, icon: Icon, description, gradient, index = 0, onClick }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    gradient: string;
    index?: number;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);
    
    return (
        <Card 
            onClick={onClick} 
            className={cn(
                "relative text-white p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl rounded-2xl h-28 overflow-hidden border-0",
                gradient,
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex justify-between items-start z-10">
                <p className="text-sm font-semibold">{title}</p>
                <Icon className="h-5 w-5 text-white/80" />
            </div>
            
            <div className="z-10 text-left">
                <p className="text-4xl font-bold tracking-tighter">
                    {animatedValue}{description === 'Promedio' ? '%' : ''}
                </p>
            </div>
        </Card>
    );
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
            <Card id="admin-welcome-card" className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg h-full flex flex-col justify-between">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                        <p className="text-primary-foreground/80">Bienvenido al Centro de Mando de tu plataforma.</p>
                    </div>
                </div>
            </Card>
        </div>
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
             <MetricCard title="Usuarios Totales" value={adminStats?.totalUsers || 0} icon={Users} gradient="bg-gradient-blue" index={0} />
             <MetricCard title="Cursos Publicados" value={adminStats?.totalPublishedCourses || 0} icon={BookOpenCheck} gradient="bg-gradient-purple" index={1}/>
             <MetricCard title="Inscripciones Totales" value={adminStats?.totalEnrollments || 0} icon={GraduationCap} gradient="bg-gradient-blue" index={2} />
             <MetricCard title="Finalización Promedio" value={adminStats?.averageCompletionRate || 0} description="Promedio" icon={Percent} gradient="bg-gradient-purple" index={3} />
        </div>
      </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Gráficos Principales */}
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
                      <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Legend iconType="circle" />
                      <Bar dataKey="newCourses" fill="var(--color-newCourses)" radius={4} name="Nuevos Cursos" />
                      <Line type="monotone" dataKey="newEnrollments" stroke="var(--color-newEnrollments)" strokeWidth={3} dot={false} name="Inscripciones" />
                    </ComposedChart>
                  </ChartContainer>
              </CardContent>
            </Card>
            <DonutChart title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
        </div>

        {/* Columna Central: Alertas y Eventos */}
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary"/>Alertas & Notificaciones</CardTitle></CardHeader>
                 <CardContent><p className="text-sm text-center text-muted-foreground p-8">No hay alertas importantes.</p></CardContent>
             </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Pencil className="h-4 w-4 text-primary"/>Cursos Pendientes</CardTitle></CardHeader>
                 <CardContent><p className="text-sm text-center text-muted-foreground p-8">No hay cursos pendientes de revisión.</p></CardContent>
             </Card>
             <CalendarWidget events={upcomingEvents} />
        </div>
        
        {/* Columna Derecha: Acciones y Auditoría */}
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
        </div>
      </div>
      
      {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
