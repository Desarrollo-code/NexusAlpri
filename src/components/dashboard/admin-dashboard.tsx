// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, ArrowRight, LineChart, BookOpen } from "lucide-react";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog, CalendarEvent, Course, Notification as AppNotification } from '@/types';
import Link from "next/link";
import { useState, useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { SecurityLogTimeline } from "../security/security-log-timeline";
import { SecurityLogDetailSheet } from "../security/security-log-detail-sheet";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { CalendarWidget } from "./calendar-widget";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Legend, Line, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from "recharts";
import { DonutChart } from "../analytics/donut-chart";
import { HealthStatusWidget } from "./health-status-widget";
import { NotificationsWidget } from "./notifications-widget";
import { MetricCard } from "../analytics/metric-card";
import { IconUsersTotal, IconBookMarked, IconGraduationCap, IconFolderYellow } from '@/components/icons';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const userRolesChartConfig: ChartConfig = {
   count: { label: "Usuarios", color: "transparent" },
   STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
   INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
   ADMINISTRATOR: { label: "Administradores", color: "hsl(var(--chart-3))" },
};

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
      <motion.div
         variants={container}
         initial="hidden"
         animate="show"
         className="space-y-8"
      >
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <motion.div variants={item} className="lg:col-span-8">
               <Card className="group relative p-8 rounded-3xl overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl h-full transition-all duration-500 hover:shadow-primary/5">
                  <div className="absolute inset-0 z-0 opacity-10 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between gap-6 h-full">
                     <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                           <Monitor className="h-3 w-3" /> Sistema Activo
                        </div>
                        <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
                           Hola, {user?.name}! <span className="text-3xl animate-wave inline-block">👋</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                           Bienvenido al <span className="text-foreground font-bold">Centro de Mando</span>. Todo el ecosistema NexusAlpri está bajo tu supervisión.
                        </p>
                     </div>
                     {settings?.dashboardImageUrlAdmin && (
                        <div className="relative w-48 h-48 flex-shrink-0 hidden sm:block">
                           <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                           >
                              <Image src={settings.dashboardImageUrlAdmin} alt="Mascota Admin" width={192} height={192} className="object-contain drop-shadow-2xl" />
                           </motion.div>
                        </div>
                     )}
                  </div>
               </Card>
            </motion.div>
            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
               <MetricCard title="Usuarios Totales" value={adminStats?.totalUsers || 0} icon={IconUsersTotal} index={0} onClick={() => router.push('/users')} />
               <MetricCard title="Cursos Publ." value={adminStats?.totalPublishedCourses || 0} icon={IconBookMarked} index={1} onClick={() => router.push('/manage-courses?tab=PUBLISHED')} />
               <MetricCard title="Inscripciones" value={adminStats?.totalEnrollments || 0} icon={IconGraduationCap} index={2} onClick={() => router.push('/enrollments')} />
               <MetricCard title="Recursos" value={adminStats?.totalResources || 0} icon={IconFolderYellow} index={3} onClick={() => router.push('/resources')} />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* --- COLUMNA IZQUIERDA: GRÁFICOS --- */}
            <div className="lg:col-span-1 space-y-8">
               <motion.div variants={item}>
                  <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                     <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                           <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                              <LineChart className="h-4 w-4" />
                           </div>
                           Tendencia de Actividad
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="h-64 pr-4 pt-4">
                        <ChartContainer config={{ newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-2))" }, newUsers: { label: "Nuevos Usuarios", color: "hsl(var(--chart-1))" } }} className="w-full h-full">
                           <ComposedChart data={adminStats.userRegistrationTrend} accessibilityLayer margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                              <defs>
                                 <linearGradient id="colorBars" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                              <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={10} axisLine={false} tickLine={false} />
                              <YAxis allowDecimals={false} width={25} fontSize={10} axisLine={false} tickLine={false} />
                              <Tooltip content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                              <Legend iconType="circle" />
                              <Bar dataKey="count" fill="url(#colorBars)" radius={[4, 4, 0, 0]} name="Usuarios" />
                              <Line type="monotone" dataKey="newCourses" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} name="Cursos" data={adminStats.contentActivityTrend} />
                           </ComposedChart>
                        </ChartContainer>
                     </CardContent>
                  </Card>
               </motion.div>

               <motion.div variants={item}>
                  <DonutChart title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
               </motion.div>
            </div>

            {/* --- COLUMNA CENTRAL: SEGURIDAD Y TAREAS --- */}
            <div className="lg:col-span-1 space-y-8">
               <motion.div variants={item}>
                  <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-xl overflow-hidden min-h-[300px]">
                     <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                 <BookOpenCheck className="h-4 w-4" />
                              </div>
                              Pendientes de Revisión
                           </div>
                           {pendingCourses && pendingCourses.length > 0 && (
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">{pendingCourses.length}</Badge>
                           )}
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-4">
                        {pendingCourses && pendingCourses.length > 0 ? (
                           <div className="space-y-3">
                              {pendingCourses.map(course => (
                                 <Link key={course.id} href={`/manage-courses/${course.id}/edit`} className="group flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5 hover:bg-white dark:hover:bg-black/40 transition-all">
                                    <div className="min-w-0">
                                       <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{course.title}</p>
                                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Instructor: {course.instructor.name}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                 </Link>
                              ))}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                 <BookOpenCheck className="h-6 w-6" />
                              </div>
                              <p className="text-sm font-medium">Bandeja impecable</p>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </motion.div>

               <motion.div variants={item}>
                  <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
                     <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                           <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                              <ShieldAlert className="h-4 w-4" />
                           </div>
                           Auditoría de Seguridad
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-rose-500/10 hover:text-rose-600 transition-colors">
                           <Link href="/security-audit">Ver todo</Link>
                        </Button>
                     </CardHeader>
                     <CardContent>
                        <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog} compact />
                     </CardContent>
                  </Card>
               </motion.div>
            </div>

            {/* --- COLUMNA DERECHA: ACCIONES Y ALERTAS --- */}
            <div className="lg:col-span-1 space-y-8">
               <motion.div variants={item}>
                  <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
                     <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                           <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                              <PlusCircle className="h-4 w-4" />
                           </div>
                           Accesos Rápidos
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="grid grid-cols-2 gap-3 pt-2">
                        <Button variant="outline" asChild className="rounded-xl border-white/20 hover:border-primary hover:text-primary transition-all"><Link href="/manage-courses"><BookOpen className="h-4 w-4 mr-2" /> Crear Curso</Link></Button>
                        <Button variant="outline" asChild className="rounded-xl border-white/20 hover:border-primary hover:text-primary transition-all"><Link href="/users"><Users className="h-4 w-4 mr-2" /> Usuarios</Link></Button>
                        <Button variant="outline" asChild className="rounded-xl border-white/20 hover:border-primary hover:text-primary transition-all"><Link href="/analytics"><BarChart3 className="h-4 w-4 mr-2" /> Analíticas</Link></Button>
                        <Button variant="outline" asChild className="rounded-xl border-white/20 hover:border-primary hover:text-primary transition-all"><Link href="/settings"><Settings className="h-4 w-4 mr-2" /> Ajustes</Link></Button>
                     </CardContent>
                  </Card>
               </motion.div>

               <motion.div variants={item}><HealthStatusWidget /></motion.div>
               <motion.div variants={item}><NotificationsWidget notifications={notifications} /></motion.div>
               <motion.div variants={item}><CalendarWidget events={upcomingEvents} /></motion.div>
            </div>
         </div>

         {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
      </motion.div>
   );
}
