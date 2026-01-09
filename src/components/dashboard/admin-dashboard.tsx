// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, ArrowRight, LineChart, BookOpen, TrendingUp, Activity, Zap, Target, Award, Clock, Calendar, Bell, ChevronRight, Sparkles, Eye, ThumbsUp } from "lucide-react";
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
import { AreaChart, Area, ComposedChart, Legend, Line, XAxis, YAxis, CartesianGrid, Tooltip, Bar, PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { VerticalBarChart } from "../analytics/vertical-bar-chart";
import { HealthStatusWidget } from "./health-status-widget";
import { NotificationsWidget } from "./notifications-widget";
import { MetricCard } from "../analytics/metric-card";
import { IconUsersTotal, IconBookMarked, IconGraduationCap, IconFolderYellow } from '@/components/icons';
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const userRolesChartConfig: ChartConfig = {
   count: { label: "Usuarios", color: "transparent" },
   STUDENT: { label: "Estudiantes", color: "#8b5cf6" },
   INSTRUCTOR: { label: "Instructores", color: "#ec4899" },
   ADMINISTRATOR: { label: "Administradores", color: "#f59e0b" },
};

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];

const formatDateTick = (tick: string): string => {
   const date = parseISO(tick);
   if (!isValid(date)) return tick;
   return format(date, "d MMM", { locale: es });
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
         staggerChildren: 0.04,
         delayChildren: 0.02
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
         stiffness: 150,
         damping: 20
      }
   }
};

// Custom animated pie label
const renderCustomLabel = (entry: any) => {
   return `${entry.value}`;
};

// Interactive metric card component
function InteractiveMetricCard({ 
   title, 
   value, 
   change, 
   icon: Icon, 
   color, 
   onClick 
}: { 
   title: string; 
   value: number; 
   change?: number; 
   icon: any; 
   color: string; 
   onClick?: () => void;
}) {
   const [isHovered, setIsHovered] = useState(false);

   return (
      <motion.div
         whileHover={{ scale: 1.02, y: -4 }}
         whileTap={{ scale: 0.98 }}
         onHoverStart={() => setIsHovered(true)}
         onHoverEnd={() => setIsHovered(false)}
      >
         <Card 
            onClick={onClick}
            className={`relative overflow-hidden cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${color}`}
         >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
               <Icon className="w-full h-full" />
            </div>
            
            <CardContent className="p-6 relative z-10">
               <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm`}>
                     <Icon className="h-6 w-6 text-white" />
                  </div>
                  {change !== undefined && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                           change >= 0 ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
                        }`}
                     >
                        {change >= 0 ? '+' : ''}{change}%
                     </motion.div>
                  )}
               </div>
               
               <div className="text-white">
                  <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
                  <p className="text-3xl font-black mb-2">
                     <motion.span
                        key={value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                     >
                        {value.toLocaleString()}
                     </motion.span>
                  </p>
               </div>

               <motion.div
                  animate={{ x: isHovered ? 5 : 0 }}
                  className="flex items-center gap-1 text-white/80 text-xs font-semibold mt-3"
               >
                  Ver detalles <ChevronRight className="h-3 w-3" />
               </motion.div>
            </CardContent>
         </Card>
      </motion.div>
   );
}

// Activity Heatmap Component
function ActivityHeatmap({ data }: { data: any[] }) {
   const [selectedDay, setSelectedDay] = useState<any>(null);

   return (
      <div className="space-y-4">
         <div className="grid grid-cols-7 gap-2">
            {data.slice(0, 28).map((day, idx) => {
               const intensity = Math.min(day.count / 10, 1);
               return (
                  <motion.div
                     key={idx}
                     whileHover={{ scale: 1.2, zIndex: 10 }}
                     onClick={() => setSelectedDay(day)}
                     className={`aspect-square rounded-lg cursor-pointer transition-all ${
                        selectedDay?.date === day.date ? 'ring-2 ring-white' : ''
                     }`}
                     style={{
                        backgroundColor: `rgba(139, 92, 246, ${intensity})`,
                     }}
                     title={`${day.date}: ${day.count} usuarios`}
                  />
               );
            })}
         </div>
         {selectedDay && (
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
            >
               <p className="text-sm font-bold">{formatDateTooltip(selectedDay.date)}</p>
               <p className="text-2xl font-black text-violet-600 dark:text-violet-400">
                  {selectedDay.count} nuevos usuarios
               </p>
            </motion.div>
         )}
      </div>
   );
}

export function AdminDashboard({ adminStats, securityLogs, upcomingEvents, pendingCourses, notifications }: {
   adminStats: AdminDashboardStats;
   securityLogs: AppSecurityLog[];
   upcomingEvents?: CalendarEvent[];
   pendingCourses?: Course[];
   notifications?: AppNotification[];
}) {
   const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
   const [chartView, setChartView] = useState<'area' | 'bar' | 'heatmap'>('area');
   const router = useRouter();
   const { user, settings } = useAuth();

   if (!adminStats) return null;

   const userRolesChartData = (adminStats.usersByRole || []).map(item => ({
      role: item.role,
      label: userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.label || item.role,
      count: item.count,
      fill: userRolesChartConfig[item.role as keyof typeof userRolesChartConfig]?.color,
   })).filter(item => item.count > 0);

   // Calculate growth percentages
   const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return 100;
      return Math.round(((current - previous) / previous) * 100);
   };

   // Simulated comparison data (in real app, this would come from API)
   const previousStats = {
      users: Math.round((adminStats?.totalUsers || 0) * 0.9),
      courses: Math.round((adminStats?.totalPublishedCourses || 0) * 0.85),
      enrollments: Math.round((adminStats?.totalEnrollments || 0) * 0.95),
      resources: Math.round((adminStats?.totalResources || 0) * 0.88),
   };

   // Engagement data for radial chart
   const engagementData = [
      { name: 'Completado', value: 75, fill: '#10b981' },
      { name: 'En Progreso', value: 60, fill: '#f59e0b' },
      { name: 'Iniciado', value: 45, fill: '#8b5cf6' },
   ];

   return (
      <motion.div
         variants={container}
         initial="hidden"
         animate="show"
         className="min-h-screen pb-12 space-y-8"
      >
         {/* Hero Header */}
         <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-900 dark:via-purple-900 dark:to-fuchsia-900 p-8 md:p-12">
            <div className="absolute inset-0 opacity-10">
               <div className="absolute inset-0" style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '40px 40px'
               }} />
            </div>
            
            <motion.div 
               animate={{ 
                  x: [0, 30, 0],
                  y: [0, -20, 0],
               }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-10 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
               <div className="flex-1 text-white">
                  <motion.div
                     initial={{ scale: 0, rotate: -180 }}
                     animate={{ scale: 1, rotate: 0 }}
                     transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                     className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-4"
                  >
                     <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                     />
                     <span className="text-sm font-bold">Sistema Online</span>
                     <Sparkles className="h-4 w-4" />
                  </motion.div>

                  <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">
                     ¡Hola, {user?.name}!
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                     Panel de control administrativo. Supervisa, gestiona y optimiza toda la plataforma desde aquí.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-6">
                     {[
                        { label: `${adminStats?.totalUsers || 0} usuarios`, icon: Users },
                        { label: `${adminStats?.totalPublishedCourses || 0} cursos`, icon: BookOpen },
                        { label: `${adminStats?.totalEnrollments || 0} inscripciones`, icon: Award },
                     ].map((stat, idx) => (
                        <motion.div
                           key={idx}
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: 0.3 + idx * 0.1 }}
                           className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md flex items-center gap-2"
                        >
                           <stat.icon className="h-4 w-4" />
                           <span className="text-sm font-bold">{stat.label}</span>
                        </motion.div>
                     ))}
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
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-full blur-2xl opacity-50"
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
         </motion.div>

         {/* Interactive Metrics Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <InteractiveMetricCard
               title="Usuarios Totales"
               value={adminStats?.totalUsers || 0}
               change={calculateGrowth(adminStats?.totalUsers || 0, previousStats.users)}
               icon={Users}
               color="from-blue-500 to-cyan-500"
               onClick={() => router.push('/users')}
            />
            <InteractiveMetricCard
               title="Cursos Publicados"
               value={adminStats?.totalPublishedCourses || 0}
               change={calculateGrowth(adminStats?.totalPublishedCourses || 0, previousStats.courses)}
               icon={BookOpen}
               color="from-violet-500 to-purple-500"
               onClick={() => router.push('/manage-courses?tab=PUBLISHED')}
            />
            <InteractiveMetricCard
               title="Inscripciones"
               value={adminStats?.totalEnrollments || 0}
               change={calculateGrowth(adminStats?.totalEnrollments || 0, previousStats.enrollments)}
               icon={Award}
               color="from-pink-500 to-rose-500"
               onClick={() => router.push('/enrollments')}
            />
            <InteractiveMetricCard
               title="Recursos"
               value={adminStats?.totalResources || 0}
               change={calculateGrowth(adminStats?.totalResources || 0, previousStats.resources)}
               icon={Target}
               color="from-amber-500 to-orange-500"
               onClick={() => router.push('/resources')}
            />
         </div>

         {/* Main Analytics Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Chart with Tabs */}
            <motion.div variants={item} className="lg:col-span-2">
               <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                  <CardHeader>
                     <div className="flex items-center justify-between flex-wrap gap-4">
                        <CardTitle className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                              <TrendingUp className="h-5 w-5" />
                           </div>
                           <div>
                              <div className="text-lg font-bold">Actividad de la Plataforma</div>
                              <div className="text-xs text-muted-foreground font-normal">Últimos 30 días</div>
                           </div>
                        </CardTitle>
                        
                        <Tabs value={chartView} onValueChange={(v) => setChartView(v as any)} className="w-auto">
                           <TabsList className="grid grid-cols-3 w-[240px]">
                              <TabsTrigger value="area" className="text-xs">Área</TabsTrigger>
                              <TabsTrigger value="bar" className="text-xs">Barras</TabsTrigger>
                              <TabsTrigger value="heatmap" className="text-xs">Mapa</TabsTrigger>
                           </TabsList>
                        </Tabs>
                     </div>
                  </CardHeader>
                  <CardContent className="h-80">
                     <AnimatePresence mode="wait">
                        {chartView === 'area' && (
                           <motion.div
                              key="area"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="h-full"
                           >
                              <ChartContainer 
                                 config={{ 
                                    newCourses: { label: "Nuevos Cursos", color: "#ec4899" }, 
                                    newUsers: { label: "Nuevos Usuarios", color: "#8b5cf6" } 
                                 }} 
                                 className="w-full h-full"
                              >
                                 <AreaChart 
                                    data={adminStats.userRegistrationTrend}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                                 >
                                    <defs>
                                       <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                       </linearGradient>
                                       <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                                       </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={11} />
                                    <YAxis fontSize={11} />
                                    <Tooltip content={<ChartTooltipContent labelFormatter={formatDateTooltip} />} />
                                    <Legend />
                                    <Area 
                                       type="monotone" 
                                       dataKey="count" 
                                       stroke="#8b5cf6" 
                                       fillOpacity={1} 
                                       fill="url(#colorUsers)" 
                                       name="Usuarios"
                                       strokeWidth={2}
                                    />
                                    <Area 
                                       type="monotone" 
                                       dataKey="newCourses" 
                                       stroke="#ec4899" 
                                       fillOpacity={1} 
                                       fill="url(#colorCourses)" 
                                       name="Cursos"
                                       data={adminStats.contentActivityTrend}
                                       strokeWidth={2}
                                    />
                                 </AreaChart>
                              </ChartContainer>
                           </motion.div>
                        )}

                        {chartView === 'bar' && (
                           <motion.div
                              key="bar"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="h-full"
                           >
                              <ChartContainer 
                                 config={{ 
                                    newCourses: { label: "Nuevos Cursos", color: "#ec4899" }, 
                                    newUsers: { label: "Nuevos Usuarios", color: "#8b5cf6" } 
                                 }} 
                                 className="w-full h-full"
                              >
                                 <ComposedChart 
                                    data={adminStats.userRegistrationTrend}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                                 >
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={11} />
                                    <YAxis fontSize={11} />
                                    <Tooltip content={<ChartTooltipContent labelFormatter={formatDateTooltip} />} />
                                    <Legend />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Usuarios" />
                                    <Line 
                                       type="monotone" 
                                       dataKey="newCourses" 
                                       stroke="#ec4899" 
                                       strokeWidth={3} 
                                       dot={{ r: 4, fill: '#ec4899' }} 
                                       name="Cursos"
                                       data={adminStats.contentActivityTrend}
                                    />
                                 </ComposedChart>
                              </ChartContainer>
                           </motion.div>
                        )}

                        {chartView === 'heatmap' && (
                           <motion.div
                              key="heatmap"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="h-full flex items-center justify-center"
                           >
                              <ActivityHeatmap data={adminStats.userRegistrationTrend} />
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </CardContent>
               </Card>
            </motion.div>

            {/* User Distribution - Pie Chart */}
            <motion.div variants={item}>
               <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50 to-white dark:from-violet-950 dark:to-slate-800 h-full">
                  <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                           <Users className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold">Distribución de Roles</span>
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={userRolesChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderCustomLabel}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              animationBegin={0}
                              animationDuration={800}
                           >
                              {userRolesChartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip />
                           <Legend />
                        </PieChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
            </motion.div>
         </div>

         {/* Secondary Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Engagement Radial Chart */}
            <motion.div variants={item}>
               <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-slate-800 h-full">
                  <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                           <Target className="h-5 w-5" />
                        </div>
                        <div>
                           <div className="text-lg font-bold">Engagement</div>
                           <div className="text-xs text-muted-foreground font-normal">Nivel de compromiso</div>
                        </div>
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                           cx="50%" 
                           cy="50%" 
                           innerRadius="10%" 
                           outerRadius="80%" 
                           barSize={10} 
                           data={engagementData}
                        >
                           <RadialBar
                              minAngle={15}
                              label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                              background
                              clockWise
                              dataKey="value"
                           />
                           <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                        </RadialBarChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
            </motion.div>

            {/* Pending Courses */}
            <motion.div variants={item}>
               <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-slate-800 h-full">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                              <BookOpenCheck className="h-5 w-5" />
                           </div>
                           <span className="text-lg font-bold">Pendientes</span>
                        </CardTitle>
                        {pendingCourses && pendingCourses.length > 0 && (
                           <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring" }}
                           >
                              <Badge className="bg-amber-500 hover:bg-amber-600">
                                 {pendingCourses.length}
                              </Badge>
                           </motion.div>
                        )}
                     </div>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-auto">
                     {pendingCourses && pendingCourses.length > 0 ? (
                        <div className="space-y-2">
                           {pendingCourses.map((course, idx) => (
                              <motion.div
                                 key={course.id}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.05 }}
                                 whileHover={{ scale: 1.02, x: 4 }}
                              >
                                 <Link 
                                    href={`/manage-courses/${course.id}/edit`} 
                                    className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950 transition-all border border-transparent hover:border-amber-300 dark:hover:border-amber-700 shadow-sm hover:shadow-md"
                                 >
                                    <div className="min-w-0 flex-1">
                                       <p className="font-semibold text-sm truncate">{course.title}</p>
                                       <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3" />
                                          {course.instructor.name}
                                       </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                                 </Link>
                              </motion.div>
                           ))}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                           <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-3"
                           >
                              <BookOpenCheck className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                           </motion.div>
                           <p className="text-sm font-semibold text-muted-foreground">Todo revisado</p>
                           <p className="text-xs text-muted-foreground/70">No hay cursos pendientes</p>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </motion.div>

            {/* Security Logs */}
            <motion.div variants={item}>
               <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-800 h-full">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white">
                              <ShieldAlert className="h-5 w-5" />
                           </div>
                           <span className="text-lg font-bold">Seguridad</span>
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild className="hover:bg-red-100 dark:hover:bg-red-950">
                           <Link href="/security-audit">
                              Ver todo
                              <Eye className="h-3 w-3 ml-1" />
                           </Link>
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <SecurityLogTimeline logs={securityLogs} onLogClick={setSelectedLog} compact />
                  </CardContent>
               </Card>
            </motion.div>
         </div>

         {/* Quick Actions Section */}
         <motion.div variants={item}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
               <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                     <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
                        <Zap className="h-5 w-5" />
                     </div>
                     <span className="text-lg font-bold">Acciones Rápidas</span>
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {[
                        { href: '/manage-courses', icon: BookOpen, label: 'Crear Curso', color: 'from-blue-500 to-cyan-500' },
                        { href: '/users', icon: Users, label: 'Gestionar Usuarios', color: 'from-violet-500 to-purple-500' },
                        { href: '/analytics', icon: BarChart3, label: 'Ver Analíticas', color: 'from-pink-500 to-rose-500' },
                        { href: '/settings', icon: Settings, label: 'Configuración', color: 'from-amber-500 to-orange-500' },
                     ].map((action, idx) => (
                        <motion.div
                           key={action.href}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.1 }}
                           whileHover={{ scale: 1.05, y: -4 }}
                           whileTap={{ scale: 0.95 }}
                        >
                           <Link href={action.href}>
                              <div className={`p-6 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-2xl transition-all cursor-pointer group`}>
                                 <action.icon className="h-8 w-8 mb-3 group-hover:scale-110 transition-transform" />
                                 <p className="font-bold text-sm">{action.label}</p>
                                 <ChevronRight className="h-4 w-4 mt-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </div>
                           </Link>
                        </motion.div>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </motion.div>

         {/* Bottom Section */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item}>
               <HealthStatusWidget />
            </motion.div>

            <motion.div variants={item}>
               <NotificationsWidget notifications={notifications} />
            </motion.div>

            <motion.div variants={item} className="lg:col-span-2">
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