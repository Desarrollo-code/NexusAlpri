// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, GraduationCap, Percent, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, Database, ArrowRight, Folder, Megaphone, FileText, AlertCircle, Calendar, Pencil, ExternalLink } from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { MetricCard } from "../analytics/metric-card";


const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  // Muestra solo el número del día.
  return format(date, "d", { locale: es });
};

const chartConfig = {
  usuarios: { label: "Usuarios", color: "hsl(var(--chart-1))" },
  inscripciones: { label: "Inscripciones", color: "hsl(var(--chart-2))" },
  deberes: { label: "Deberes", color: "#16a34a" },
  hondo: { label: "Hondo", color: "#2563eb" },
  drordlikes: { label: "Drordlikes", color: "#dc2626" },
} satisfies ChartConfig;

const activityData = [
  { month: "Ene", usuarios: 186, inscripciones: 80 },
  { month: "Feb", usuarios: 305, inscripciones: 200 },
  { month: "Mar", usuarios: 237, inscripciones: 120 },
  { month: "Abr", usuarios: 73, inscripciones: 190 },
  { month: "May", usuarios: 209, inscripciones: 130 },
  { month: "Jun", usuarios: 214, inscripciones: 140 },
]

const trendData = [
    { name: "Deberes", value: 12 },
    { name: "Hondo", value: 19 },
    { name: "Drordlikes", value: 3 },
]

export function AdminDashboard({ adminStats, securityLogs }: {
  adminStats: AdminDashboardStats;
  securityLogs: AppSecurityLog[];
}) {
  const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
  const router = useRouter();
  const { user, settings } = useAuth();


  if (!adminStats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
        {/* Columna Izquierda (Bienvenida) */}
        <div className="lg:col-span-1 xl:col-span-3">
           <Card id="admin-welcome-card" className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg h-full flex flex-col justify-between">
              <div className="relative z-10 flex items-center justify-between">
                  <div>
                      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                      <p className="text-primary-foreground/80">Bienvenido al Centro de Mando de tu plataforma.</p>
                  </div>
                  {settings?.dashboardImageUrlAdmin && (
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <Image src={settings.dashboardImageUrlAdmin} alt="Imagen del panel de Administrador" fill className="object-contain" data-ai-hint="admin dashboard mascot" />
                    </div>
                  )}
              </div>
          </Card>
        </div>

        {/* Columna Derecha (Métricas) */}
        <div className="lg:col-span-1 xl:col-span-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-6">
           <MetricCard title="Usuarios Totales" value={adminStats.totalUsers} icon={Users} index={0} />
           <MetricCard title="Cursos Publicados" value={adminStats.totalPublishedCourses} icon={BookOpenCheck} index={1} />
           <MetricCard title="Inscripciones" value={adminStats.totalEnrollments} icon={GraduationCap} index={2}/>
           <MetricCard title="Finalización" value={adminStats.averageCompletionRate} icon={Percent} index={3} suffix="%"/>
        </div>
      </div>
        
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Columna 1: Tendencia y Accesos Rápidos */}
        <div className="xl:col-span-2 space-y-6">
           <Card>
              <CardHeader>
                  <CardTitle>Tendencia de Actividad</CardTitle>
              </CardHeader>
              <CardContent className="h-80 pr-4">
                 <ChartContainer config={chartConfig} className="w-full h-full">
                    <ComposedChart data={adminStats.contentActivityTrend} accessibilityLayer margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12}/>
                      <YAxis allowDecimals={false} width={30} fontSize={12}/>
                      <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Legend iconType="circle" />
                      <Bar dataKey="newCourses" fill="var(--color-usuarios)" radius={4} name="Nuevos Cursos" />
                      <Line type="monotone" dataKey="newEnrollments" stroke="var(--color-inscripciones)" strokeWidth={3} dot={false} name="Inscripciones" />
                    </ComposedChart>
                  </ChartContainer>
              </CardContent>
          </Card>
        </div>

        {/* Columna 2: Alertas y Eventos */}
        <div className="xl:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Accesos Rápidos</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                 <Button variant="outline" asChild><Link href="/manage-courses"><PlusCircle className="mr-2 h-4 w-4"/>Crear Curso</Link></Button>
                 <Button variant="outline" asChild><Link href="/users"><Users className="mr-2 h-4 w-4"/>Gestionar Usuarios</Link></Button>
                 <Button variant="outline" asChild><Link href="/analytics"><BarChart3 className="mr-2 h-4 w-4"/>Ver Analíticas</Link></Button>
                 <Button variant="outline" asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4"/>Ajustes</Link></Button>
              </CardContent>
           </Card>
           <Card>
              <CardHeader>
                  <CardTitle>Auditoría de Seguridad</CardTitle>
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
      </div>
      
      {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
