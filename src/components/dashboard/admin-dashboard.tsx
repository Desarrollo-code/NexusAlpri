// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, PlusCircle, BarChart3, Settings, ShieldAlert, ArrowRight, BookOpen, TrendingUp, Activity } from "lucide-react";
import type { AdminDashboardStats, SecurityLog as AppSecurityLog, CalendarEvent, Course, Notification as AppNotification } from '@/types';
import Link from "next/link";
import { useState } from "react";
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
import { VerticalBarChart } from "../analytics/vertical-bar-chart";
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
         staggerChildren: 0.05,
         delayChildren: 0.05
      }
   }
};

const item = {
   hidden: { opacity: 0, y: 20 },
   show: {
      opacity: 1,
      y: 0,
      transition: {
         type: "spring",
         stiffness: 120,
         damping: 20
      }
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
      label: String(userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.label || item.role),
      count: item.count,
      fill: userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.color as string,
   })).filter(item => item.count > 0);

   return (
      <motion.div
         variants={container}
         initial="hidden"
         animate="show"
         className="min-h-screen pb-12"
      >
         {/* Top Section: Banner (8) + Metrics (4) */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            {/* Banner - 8 Columns */}
            <motion.div variants={item} className="lg:col-span-8">
               <div className="relative h-full overflow-hidden rounded-2xl p-6 md:p-8 flex items-center"
                  style={{
                     background: `linear-gradient(135deg, #FF9D6C 0%, #FFB088 100%)`
                  }}>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                     <div className="text-white">
                        <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-3"
                        >
                           <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                           <span className="text-[10px] font-bold uppercase tracking-wider">Sistema Online</span>
                        </motion.div>

                        <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                           ¡Hola, {user?.name}!
                        </h1>
                        <p className="text-sm text-white/90 max-w-md font-medium leading-relaxed">
                           Panel de control administrativo. Supervisa, gestiona y optimiza toda la plataforma desde aquí.
                        </p>

                        {/* Quick Stats Pills */}
                        <div className="flex flex-wrap gap-2 mt-4">
                           <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                              <span className="text-[11px] font-bold">{adminStats?.totalUsers || 0} usuarios</span>
                           </div>
                           <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                              <span className="text-[11px] font-bold">{adminStats?.totalPublishedCourses || 0} cursos</span>
                           </div>
                           <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                              <span className="text-[11px] font-bold">{adminStats?.totalEnrollments || 0} inscripciones</span>
                           </div>
                        </div>
                     </div>

                     <div className="hidden md:block relative w-48 h-48 lg:w-56 lg:h-56">
                        <Image
                           src={settings?.dashboardImageUrlAdmin || "/images/dashboard-illustration.png"}
                           alt="Dashboard"
                           width={256}
                           height={256}
                           className="object-contain drop-shadow-2xl"
                        />
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Metrics Grid - 4 Columns (2x2) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
               <MetricCard
                  title="Usuarios"
                  value={adminStats?.totalUsers || 0}
                  icon={IconUsersTotal}
                  index={0}
                  onClick={() => router.push('/users')}
               />
               <MetricCard
                  title="Cursos Publicados"
                  value={adminStats?.totalPublishedCourses || 0}
                  icon={IconBookMarked}
                  index={1}
                  onClick={() => router.push('/manage-courses?tab=PUBLISHED')}
               />
               <MetricCard
                  title="Inscripciones"
                  value={adminStats?.totalEnrollments || 0}
                  icon={IconGraduationCap}
                  index={2}
                  onClick={() => router.push('/enrollments')}
               />
               <MetricCard
                  title="Biblioteca"
                  value={adminStats?.totalResources || 0}
                  icon={IconFolderYellow}
                  index={3}
                  onClick={() => router.push('/resources')}
               />
            </div>
         </div>

         {/* Main Content - 70/30 Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Side (70%) */}
            <div className="lg:col-span-8 space-y-6">
               <motion.div variants={item}>
                  <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
                     <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                        <div className="flex items-center justify-between">
                           <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              Tendencia de Actividad
                           </CardTitle>
                           <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight">
                              Últimos 30 días
                           </Badge>
                        </div>
                     </CardHeader>
                     <CardContent className="p-4 h-[300px]">
                        <ChartContainer
                           config={{
                              newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-2))" },
                              newUsers: { label: "Nuevos Usuarios", color: "hsl(var(--chart-1))" }
                           }}
                           className="w-full h-full"
                        >
                           <ComposedChart
                              data={adminStats.userRegistrationTrend}
                              accessibilityLayer
                              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                           >
                              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                              <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={10} axisLine={false} tickLine={false} />
                              <YAxis allowDecimals={false} width={25} fontSize={10} axisLine={false} tickLine={false} />
                              <Tooltip content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Usuarios" barSize={12} />
                              <Line
                                 type="monotone"
                                 dataKey="newCourses"
                                 stroke="hsl(var(--chart-2))"
                                 strokeWidth={2}
                                 dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                                 name="Cursos"
                                 data={adminStats.contentActivityTrend}
                              />
                           </ComposedChart>
                        </ChartContainer>
                     </CardContent>
                  </Card>
               </motion.div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  <motion.div variants={item} className="h-full">
                     <HealthStatusWidget />
                  </motion.div>
                  <motion.div variants={item} className="h-full">
                     <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden h-full">
                        <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                           <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <PlusCircle className="h-4 w-4 text-primary" />
                              Acciones Rápidas
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 grid grid-cols-2 gap-2">
                           <Button asChild variant="outline" size="sm" className="flex flex-col items-center justify-center h-full min-h-[80px] text-[11px] font-bold border-slate-100 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1.5 rounded-xl py-3">
                              <Link href="/manage-courses">
                                 <BookOpen className="h-5 w-5 text-primary" />
                                 Contenidos
                              </Link>
                           </Button>
                           <Button asChild variant="outline" size="sm" className="flex flex-col items-center justify-center h-full min-h-[80px] text-[11px] font-bold border-slate-100 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1.5 rounded-xl py-3">
                              <Link href="/users">
                                 <Users className="h-5 w-5 text-primary" />
                                 Usuarios
                              </Link>
                           </Button>
                           <Button asChild variant="outline" size="sm" className="flex flex-col items-center justify-center h-full min-h-[80px] text-[11px] font-bold border-slate-100 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1.5 rounded-xl py-3">
                              <Link href="/analytics">
                                 <BarChart3 className="h-5 w-5 text-primary" />
                                 Analíticas
                              </Link>
                           </Button>
                           <Button asChild variant="outline" size="sm" className="flex flex-col items-center justify-center h-full min-h-[80px] text-[11px] font-bold border-slate-100 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1.5 rounded-xl py-3">
                              <Link href="/settings">
                                 <Settings className="h-5 w-5 text-primary" />
                                 Ajustes
                              </Link>
                           </Button>
                        </CardContent>
                     </Card>
                  </motion.div>
               </div>

               <motion.div variants={item}>
                  <CalendarWidget events={upcomingEvents} />
               </motion.div>
            </div>

            {/* Right Side (30%) */}
            <div className="lg:col-span-4 space-y-6">
               <motion.div variants={item}>
                  <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
                     <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                           <ShieldAlert className="h-4 w-4 text-destructive" />
                           Seguridad y Auditoría
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-4">
                        <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog} compact />
                        <Button variant="ghost" size="sm" asChild className="w-full mt-4 text-[12px] h-8 bg-slate-50 hover:bg-slate-100">
                           <Link href="/security-audit" className="flex items-center justify-center gap-2">
                              Ver historial completo <ArrowRight className="h-3 w-3" />
                           </Link>
                        </Button>
                     </CardContent>
                  </Card>
               </motion.div>

               <motion.div variants={item}>
                  <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
                     <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                           <Activity className="h-4 w-4 text-orange-500" />
                           Notificaciones del Sistema
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-0">
                        <NotificationsWidget notifications={notifications} />
                     </CardContent>
                  </Card>
               </motion.div>

            </div>
         </div>

         {selectedLog && (
            <SecurityLogDetailSheet
               log={selectedLog}
               isOpen={!!selectedLog}
               onClose={() => setSelectedLog(null)}
            />
         )}
      </motion.div>
   );
}