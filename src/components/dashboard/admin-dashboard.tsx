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
         staggerChildren: 0.08,
         delayChildren: 0.1
      }
   }
};

const item = {
   hidden: { opacity: 0, y: 30, scale: 0.95 },
   show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
         type: "spring",
         stiffness: 100,
         damping: 15
      }
   }
};

const shimmer = {
   hidden: { backgroundPosition: "200% 0" },
   show: {
      backgroundPosition: "-200% 0",
      transition: {
         repeat: Infinity,
         duration: 8,
         ease: "linear"
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
         className="space-y-8 pb-8"
      >
         {/* Hero Section */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <motion.div variants={item} className="lg:col-span-8">
               <Card className="group relative p-10 rounded-[2rem] overflow-hidden bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-black/50 dark:via-black/40 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] h-full transition-all duration-700 hover:shadow-[0_25px_90px_-15px_rgba(var(--primary),0.25)] hover:scale-[1.01]">
                  
                  {/* Animated Background */}
                  <div className="absolute inset-0 z-0 opacity-[0.07] transition-transform duration-1000 group-hover:scale-110" 
                       style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.15] via-transparent to-accent/[0.15] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(var(--accent-rgb),0.08),transparent_50%)]" />
                  
                  {/* Animated Shine Effect */}
                  <motion.div 
                     variants={shimmer}
                     initial="hidden"
                     animate="show"
                     className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                     style={{ backgroundSize: "200% 100%" }}
                  />
                  
                  <div className="relative z-10 flex items-center justify-between gap-8 h-full">
                     <div className="space-y-4 flex-1">
                        <motion.div 
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           transition={{ delay: 0.2, type: "spring" }}
                           className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/15 backdrop-blur-sm text-primary text-xs font-black uppercase tracking-[0.2em] mb-2 border border-primary/20 shadow-lg shadow-primary/10"
                        >
                           <Monitor className="h-3.5 w-3.5 animate-pulse" /> 
                           <span className="relative">
                              Sistema Activo
                              <span className="absolute -right-1 -top-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                           </span>
                        </motion.div>
                        
                        <motion.h1 
                           initial={{ x: -20, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           transition={{ delay: 0.3, type: "spring" }}
                           className="text-5xl font-black tracking-tight font-headline flex items-center gap-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
                        >
                           Hola, {user?.name}! 
                           <motion.span 
                              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                              className="text-4xl inline-block origin-[70%_70%]"
                           >
                              👋
                           </motion.span>
                        </motion.h1>
                        
                        <motion.p 
                           initial={{ x: -20, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           transition={{ delay: 0.4 }}
                           className="text-muted-foreground text-lg max-w-xl leading-relaxed"
                        >
                           Bienvenido al <span className="text-foreground font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Centro de Mando</span>. 
                           Todo el ecosistema NexusAlpri está bajo tu supervisión.
                        </motion.p>
                     </div>
                     
                     {settings?.dashboardImageUrlAdmin && (
                        <motion.div 
                           initial={{ scale: 0, rotate: -10 }}
                           animate={{ scale: 1, rotate: 0 }}
                           transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                           className="relative w-56 h-56 flex-shrink-0 hidden lg:block"
                        >
                           <motion.div
                              animate={{ 
                                 y: [0, -15, 0],
                                 rotate: [0, 3, -3, 0]
                              }}
                              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                              className="relative w-full h-full"
                           >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
                              <Image 
                                 src={settings.dashboardImageUrlAdmin} 
                                 alt="Admin" 
                                 width={224} 
                                 height={224} 
                                 className="relative object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" 
                              />
                           </motion.div>
                        </motion.div>
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

         {/* Main Content Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column - Charts */}
            <div className="lg:col-span-1 space-y-8">
               <motion.div variants={item}>
                  <Card className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[1.5rem] group">
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-lg font-black flex items-center gap-2.5">
                           <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20">
                              <LineChart className="h-4 w-4" />
                           </div>
                           <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                              Tendencia de Actividad
                           </span>
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="h-64 pr-4 pt-4 relative z-10">
                        <ChartContainer config={{ newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-2))" }, newUsers: { label: "Nuevos Usuarios", color: "hsl(var(--chart-1))" } }} className="w-full h-full">
                           <ComposedChart data={adminStats.userRegistrationTrend} accessibilityLayer margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                              <defs>
                                 <linearGradient id="colorBars" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9} />
                                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={10} axisLine={false} tickLine={false} />
                              <YAxis allowDecimals={false} width={25} fontSize={10} axisLine={false} tickLine={false} />
                              <Tooltip content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                              <Legend iconType="circle" />
                              <Bar dataKey="count" fill="url(#colorBars)" radius={[6, 6, 0, 0]} name="Usuarios" />
                              <Line type="monotone" dataKey="newCourses" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: 'white' }} name="Cursos" data={adminStats.contentActivityTrend} />
                           </ComposedChart>
                        </ChartContainer>
                     </CardContent>
                  </Card>
               </motion.div>

               <motion.div variants={item}>
                  <VerticalBarChart title="Distribución de Roles" data={userRolesChartData} />
               </motion.div>
            </div>

            {/* Center Column - Security & Tasks */}
            <div className="lg:col-span-1 space-y-8">
               <motion.div variants={item}>
                  <Card className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 shadow-xl overflow-hidden min-h-[320px] rounded-[1.5rem] group hover:shadow-2xl transition-all duration-500">
                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-lg font-black flex items-center justify-between">
                           <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
                                 <BookOpenCheck className="h-4 w-4" />
                              </div>
                              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                 Pendientes de Revisión
                              </span>
                           </div>
                           {pendingCourses && pendingCourses.length > 0 && (
                              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-black shadow-lg">
                                 {pendingCourses.length}
                              </Badge>
                           )}
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-4 relative z-10">
                        {pendingCourses && pendingCourses.length > 0 ? (
                           <div className="space-y-3">
                              {pendingCourses.map((course, idx) => (
                                 <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                 >
                                    <Link href={`/manage-courses/${course.id}/edit`} className="group/item flex items-center justify-between p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-white/30 dark:border-white/10 hover:bg-white dark:hover:bg-black/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                                       <div className="min-w-0 flex-1">
                                          <p className="font-black text-sm truncate group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">
                                             {course.title}
                                          </p>
                                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                                             Instructor: {course.instructor.name}
                                          </p>
                                       </div>
                                       <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all duration-300" />
                                    </Link>
                                 </motion.div>
                              ))}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center py-16 text-center">
                              <motion.div 
                                 animate={{ scale: [1, 1.1, 1] }}
                                 transition={{ duration: 2, repeat: Infinity }}
                                 className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mb-4 shadow-lg"
                              >
                                 <BookOpenCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                              </motion.div>
                              <p className="text-sm font-bold text-muted-foreground">Bandeja impecable</p>
                              <p className="text-xs text-muted-foreground/70 mt-1">Todo bajo control</p>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </motion.div>

               <motion.div variants={item}>
                  <Card className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 shadow-xl overflow-hidden rounded-[1.5rem] group hover:shadow-2xl transition-all duration-500">
                     <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                        <CardTitle className="text-lg font-black flex items-center gap-2.5">
                           <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/20">
                              <ShieldAlert className="h-4 w-4" />
                           </div>
                           <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                              Auditoría de Seguridad
                           </span>
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild className="h-9 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-300 rounded-xl font-bold">
                           <Link href="/security-audit">Ver todo</Link>
                        </Button>
                     </CardHeader>
                     <CardContent className="relative z-10">
                        <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog} compact />
                     </CardContent>
                  </Card>
               </motion.div>
            </div>

            {/* Right Column - Quick Actions & Widgets */}
            <div className="lg:col-span-1 space-y-8">
               <motion.div variants={item}>
                  <Card className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 shadow-xl overflow-hidden rounded-[1.5rem] group hover:shadow-2xl transition-all duration-500">
                     <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <CardHeader className="relative z-10">
                        <CardTitle className="text-lg font-black flex items-center gap-2.5">
                           <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/20">
                              <PlusCircle className="h-4 w-4" />
                           </div>
                           <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                              Accesos Rápidos
                           </span>
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="grid grid-cols-2 gap-3 pt-2 relative z-10">
                        <Button variant="outline" asChild className="rounded-xl border-white/30 dark:border-white/15 bg-white/40 dark:bg-black/20 hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 font-bold h-11">
                           <Link href="/manage-courses"><BookOpen className="h-4 w-4 mr-2" /> Crear Curso</Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-xl border-white/30 dark:border-white/15 bg-white/40 dark:bg-black/20 hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 font-bold h-11">
                           <Link href="/users"><Users className="h-4 w-4 mr-2" /> Usuarios</Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-xl border-white/30 dark:border-white/15 bg-white/40 dark:bg-black/20 hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 font-bold h-11">
                           <Link href="/analytics"><BarChart3 className="h-4 w-4 mr-2" /> Analíticas</Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-xl border-white/30 dark:border-white/15 bg-white/40 dark:bg-black/20 hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 font-bold h-11">
                           <Link href="/settings"><Settings className="h-4 w-4 mr-2" /> Ajustes</Link>
                        </Button>
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