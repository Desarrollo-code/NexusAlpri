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
      label: userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.label || item.role,
      count: item.count,
      fill: userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.color,
   })).filter(item => item.count > 0);

   return (
      <motion.div
         variants={container}
         initial="hidden"
         animate="show"
         className="min-h-screen pb-12"
      >
         {/* Hero Header - Banner dinámico usando variables CSS del tema */}
         <motion.div variants={item} className="mb-8">
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-12" 
                 style={{
                    background: `linear-gradient(135deg, 
                       hsl(var(--primary) / 0.9) 0%, 
                       hsl(var(--primary) / 0.7) 50%, 
                       hsl(var(--accent) / 0.8) 100%)`
                 }}>
               {/* Animated Background Pattern */}
               <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{ 
                     backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                     backgroundSize: '40px 40px'
                  }} />
               </div>
               
               {/* Floating Orbs - usando colores del tema */}
               <motion.div 
                  animate={{ 
                     x: [0, 30, 0],
                     y: [0, -20, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-20 w-64 h-64 rounded-full blur-3xl"
                  style={{ 
                     background: `hsl(var(--primary) / 0.15)`
                  }}
               />
               <motion.div 
                  animate={{ 
                     x: [0, -20, 0],
                     y: [0, 30, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-10 left-20 w-80 h-80 rounded-full blur-3xl"
                  style={{ 
                     background: `hsl(var(--accent) / 0.2)`
                  }}
               />

               <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-white dark:text-white">
                     <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-4"
                     >
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-sm font-bold">Sistema Online</span>
                     </motion.div>

                     <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">
                        ¡Hola, {user?.name}!
                     </h1>
                     <p className="text-lg md:text-xl text-white/90 dark:text-white/90 max-w-2xl">
                        Panel de control administrativo. Supervisa, gestiona y optimiza toda la plataforma desde aquí.
                     </p>

                     {/* Quick Stats Pills */}
                     <div className="flex flex-wrap gap-3 mt-6">
                        <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md">
                           <span className="text-sm font-bold">{adminStats?.totalUsers || 0} usuarios</span>
                        </div>
                        <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md">
                           <span className="text-sm font-bold">{adminStats?.totalPublishedCourses || 0} cursos</span>
                        </div>
                        <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md">
                           <span className="text-sm font-bold">{adminStats?.totalEnrollments || 0} inscripciones</span>
                        </div>
                     </div>
                  </div>

                  {settings?.dashboardImageUrlAdmin && (
                     <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="relative"
                     >
                        <motion.div
                           animate={{ rotate: 360 }}
                           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                           className="absolute inset-0 rounded-full blur-2xl opacity-50"
                           style={{ 
                              background: `linear-gradient(to right, 
                                 hsl(var(--primary)), 
                                 hsl(var(--accent)))`
                           }}
                        />
                        <div className="relative w-48 h-48 md:w-64 md:h-64">
                           <Image 
                              src={settings.dashboardImageUrlAdmin} 
                              alt="Admin" 
                              width={256} 
                              height={256} 
                              className="object-contain drop-shadow-2xl" 
                           />
                        </div>
                     </motion.div>
                  )}
               </div>
            </div>
         </motion.div>

         {/* Metrics Grid - Modern Cards */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard 
               title="Usuarios Totales" 
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
               title="Recursos" 
               value={adminStats?.totalResources || 0} 
               icon={IconFolderYellow} 
               index={3} 
               onClick={() => router.push('/resources')} 
            />
         </div>

         {/* Main Content - Bento Grid Layout */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Activity Chart - Large */}
            <motion.div variants={item} className="lg:col-span-8">
               <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                              <TrendingUp className="h-5 w-5" />
                           </div>
                           <div>
                              <div className="text-lg font-bold">Tendencia de Actividad</div>
                              <div className="text-xs text-muted-foreground font-normal">Últimos 30 días</div>
                           </div>
                        </CardTitle>
                        <Badge variant="secondary" className="font-mono">
                           <Activity className="h-3 w-3 mr-1" />
                           Live
                        </Badge>
                     </div>
                  </CardHeader>
                  <CardContent className="h-80">
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
                           <defs>
                              <linearGradient id="colorBars" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                 <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                           <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={11} axisLine={false} tickLine={false} />
                           <YAxis allowDecimals={false} width={30} fontSize={11} axisLine={false} tickLine={false} />
                           <Tooltip content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                           <Legend iconType="circle" />
                           <Bar dataKey="count" fill="url(#colorBars)" radius={[8, 8, 0, 0]} name="Usuarios" />
                           <Line 
                              type="monotone" 
                              dataKey="newCourses" 
                              stroke="hsl(var(--chart-2))" 
                              strokeWidth={3} 
                              dot={{ r: 4, strokeWidth: 2, fill: 'white' }} 
                              name="Cursos" 
                              data={adminStats.contentActivityTrend} 
                           />
                        </ComposedChart>
                     </ChartContainer>
                  </CardContent>
               </Card>
            </motion.div>

            {/* Quick Actions - Compact */}
            <motion.div variants={item} className="lg:col-span-4">
               <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-slate-800 h-full">
                  <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                           <PlusCircle className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold">Acciones Rápidas</span>
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                     <Button 
                        asChild 
                        className="w-full justify-start bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950 text-foreground border-0 shadow-sm hover:shadow-md transition-all"
                        size="lg"
                     >
                        <Link href="/manage-courses">
                           <BookOpen className="h-4 w-4 mr-3" /> 
                           Crear Curso
                        </Link>
                     </Button>
                     <Button 
                        asChild 
                        variant="outline" 
                        className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-950"
                        size="lg"
                     >
                        <Link href="/users">
                           <Users className="h-4 w-4 mr-3" /> 
                           Gestionar Usuarios
                        </Link>
                     </Button>
                     <Button 
                        asChild 
                        variant="outline" 
                        className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-950"
                        size="lg"
                     >
                        <Link href="/analytics">
                           <BarChart3 className="h-4 w-4 mr-3" /> 
                           Ver Analíticas
                        </Link>
                     </Button>
                     <Button 
                        asChild 
                        variant="outline" 
                        className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-950"
                        size="lg"
                     >
                        <Link href="/settings">
                           <Settings className="h-4 w-4 mr-3" /> 
                           Configuración
                        </Link>
                     </Button>
                  </CardContent>
               </Card>
            </motion.div>

            {/* User Distribution */}
            <motion.div variants={item} className="lg:col-span-4">
               <VerticalBarChart title="Distribución de Roles" data={userRolesChartData} />
            </motion.div>

            {/* Pending Courses */}
            <motion.div variants={item} className="lg:col-span-4">
               <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-slate-800 h-full">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                              <BookOpenCheck className="h-5 w-5" />
                           </div>
                           <span className="text-lg font-bold">Pendientes</span>
                        </CardTitle>
                        {pendingCourses && pendingCourses.length > 0 && (
                           <Badge className="bg-green-500 hover:bg-green-600">
                              {pendingCourses.length}
                           </Badge>
                        )}
                     </div>
                  </CardHeader>
                  <CardContent>
                     {pendingCourses && pendingCourses.length > 0 ? (
                        <div className="space-y-2">
                           {pendingCourses.slice(0, 4).map((course, idx) => (
                              <motion.div
                                 key={course.id}
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.05 }}
                              >
                                 <Link 
                                    href={`/manage-courses/${course.id}/edit`} 
                                    className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-green-100 dark:hover:bg-green-950 transition-all border border-transparent hover:border-green-200 dark:hover:border-green-800"
                                 >
                                    <div className="min-w-0 flex-1">
                                       <p className="font-semibold text-sm truncate">{course.title}</p>
                                       <p className="text-xs text-muted-foreground">{course.instructor.name}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                                 </Link>
                              </motion.div>
                           ))}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                           <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                              <BookOpenCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                           </div>
                           <p className="text-sm font-semibold text-muted-foreground">Todo revisado</p>
                           <p className="text-xs text-muted-foreground/70">No hay cursos pendientes</p>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </motion.div>

            {/* Security Audit */}
            <motion.div variants={item} className="lg:col-span-4">
               <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-800 h-full">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white">
                              <ShieldAlert className="h-5 w-5" />
                           </div>
                           <span className="text-lg font-bold">Seguridad</span>
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild className="hover:bg-red-100 dark:hover:bg-red-950">
                           <Link href="/security-audit">Ver todo</Link>
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog} compact />
                  </CardContent>
               </Card>
            </motion.div>

            {/* Health Status */}
            <motion.div variants={item} className="lg:col-span-6">
               <HealthStatusWidget />
            </motion.div>

            {/* Notifications */}
            <motion.div variants={item} className="lg:col-span-6">
               <NotificationsWidget notifications={notifications} />
            </motion.div>

            {/* Calendar */}
            <motion.div variants={item} className="lg:col-span-12">
               <CalendarWidget events={upcomingEvents} />
            </motion.div>
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