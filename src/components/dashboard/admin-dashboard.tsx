// src/components/dashboard/admin-dashboard.tsx
'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, BookOpen, Award, Target, TrendingUp, ShieldAlert, 
  BookOpenCheck, Zap, ChevronRight, Sparkles, Eye, 
  BarChart3, Settings, Clock, Calendar, Bell, PlusCircle 
} from "lucide-react";
import Image from "next/image";

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { 
  AreaChart, Area, PieChart, Pie, Cell, 
  ResponsiveContainer, RadialBarChart, RadialBar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";

// Custom Components
import { SecurityLogTimeline } from "../security/security-log-timeline";
import { SecurityLogDetailSheet } from "../security/security-log-detail-sheet";
import { CalendarWidget } from "./calendar-widget";
import { HealthStatusWidget } from "./health-status-widget";
import { NotificationsWidget } from "./notifications-widget";
import { MetricCard } from "../analytics/metric-card";

// Types & Context
import type { AdminDashboardStats, SecurityLog as AppSecurityLog, CalendarEvent, Course, Notification as AppNotification } from '@/types';
import { useAuth } from "@/contexts/auth-context";

// Animations
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.01
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25
    }
  }
};

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];

// Helper Functions
const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  if (!isValid(date)) return tick;
  return format(date, "d MMM", { locale: es });
};

const formatDateTooltip = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  } catch {
    return dateString;
  }
};

// Compact Metric Card
function CompactMetricCard({ 
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
  return (
    <motion.div variants={item} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Card 
        onClick={onClick}
        className={`relative overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br ${color} p-0`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/90">{title}</p>
                <p className="text-lg font-bold text-white">{value.toLocaleString()}</p>
              </div>
            </div>
            {change !== undefined && (
              <Badge variant="secondary" className={`text-xs ${change >= 0 ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Activity Chart Tabs
function ActivityChartTabs({ 
  data, 
  contentActivityData,
  view,
  onViewChange 
}: { 
  data: any[];
  contentActivityData: any[];
  view: string;
  onViewChange: (view: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-bold text-sm">Actividad</span>
        </div>
        <Tabs value={view} onValueChange={onViewChange} className="w-auto">
          <TabsList className="h-8">
            <TabsTrigger value="users" className="text-xs px-3">Usuarios</TabsTrigger>
            <TabsTrigger value="courses" className="text-xs px-3">Cursos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={view === 'users' ? data : contentActivityData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={view === 'users' ? "#8b5cf6" : "#ec4899"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={view === 'users' ? "#8b5cf6" : "#ec4899"} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={view === 'users' ? "#8b5cf6" : "#ec4899"} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdminDashboard({ 
  adminStats, 
  securityLogs, 
  upcomingEvents, 
  pendingCourses, 
  notifications 
}: {
  adminStats: AdminDashboardStats;
  securityLogs: AppSecurityLog[];
  upcomingEvents?: CalendarEvent[];
  pendingCourses?: Course[];
  notifications?: AppNotification[];
}) {
  const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
  const [activeChart, setActiveChart] = useState<'users' | 'courses'>('users');
  const router = useRouter();
  const { user, settings } = useAuth();

  if (!adminStats) return null;

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  const previousStats = {
    users: Math.round((adminStats?.totalUsers || 0) * 0.9),
    courses: Math.round((adminStats?.totalPublishedCourses || 0) * 0.85),
    enrollments: Math.round((adminStats?.totalEnrollments || 0) * 0.95),
    resources: Math.round((adminStats?.totalResources || 0) * 0.88),
  };

  // User roles data for pie chart
  const userRolesData = (adminStats.usersByRole || []).map(item => ({
    name: item.role,
    value: item.count,
  }));

  // Quick actions
  const quickActions = [
    { href: '/manage-courses', icon: PlusCircle, label: 'Nuevo Curso', color: 'from-blue-500 to-cyan-500' },
    { href: '/users', icon: Users, label: 'Usuarios', color: 'from-violet-500 to-purple-500' },
    { href: '/analytics', icon: BarChart3, label: 'Analíticas', color: 'from-pink-500 to-rose-500' },
    { href: '/settings', icon: Settings, label: 'Ajustes', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-8"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Hola, {user?.name}!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Panel de control administrativo
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Sistema Online
          </div>
          {settings?.dashboardImageUrlAdmin && (
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow">
              <Image 
                src={settings.dashboardImageUrlAdmin} 
                alt="Admin" 
                width={40} 
                height={40} 
                className="object-cover"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Metrics Grid - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CompactMetricCard
          title="Usuarios"
          value={adminStats?.totalUsers || 0}
          change={calculateGrowth(adminStats?.totalUsers || 0, previousStats.users)}
          icon={Users}
          color="from-blue-500 to-cyan-500"
          onClick={() => router.push('/users')}
        />
        <CompactMetricCard
          title="Cursos"
          value={adminStats?.totalPublishedCourses || 0}
          change={calculateGrowth(adminStats?.totalPublishedCourses || 0, previousStats.courses)}
          icon={BookOpen}
          color="from-violet-500 to-purple-500"
          onClick={() => router.push('/manage-courses')}
        />
        <CompactMetricCard
          title="Inscripciones"
          value={adminStats?.totalEnrollments || 0}
          change={calculateGrowth(adminStats?.totalEnrollments || 0, previousStats.enrollments)}
          icon={Award}
          color="from-pink-500 to-rose-500"
          onClick={() => router.push('/enrollments')}
        />
        <CompactMetricCard
          title="Recursos"
          value={adminStats?.totalResources || 0}
          change={calculateGrowth(adminStats?.totalResources || 0, previousStats.resources)}
          icon={Target}
          color="from-amber-500 to-orange-500"
          onClick={() => router.push('/resources')}
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Chart */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <ActivityChartTabs 
                  data={adminStats.userRegistrationTrend}
                  contentActivityData={adminStats.contentActivityTrend}
                  view={activeChart}
                  onViewChange={setActiveChart}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Two Column Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Distribution */}
            <motion.div variants={item}>
              <Card className="border-0 shadow-sm h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-md bg-violet-500/10">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="font-bold text-sm">Distribución de Roles</span>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userRolesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {userRolesData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Courses */}
            <motion.div variants={item}>
              <Card className="border-0 shadow-sm h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-amber-500/10">
                        <BookOpenCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="font-bold text-sm">Cursos Pendientes</span>
                    </div>
                    {pendingCourses && pendingCourses.length > 0 && (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">
                        {pendingCourses.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pendingCourses && pendingCourses.length > 0 ? (
                      pendingCourses.slice(0, 3).map((course) => (
                        <Link 
                          key={course.id}
                          href={`/manage-courses/${course.id}/edit`}
                          className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{course.title}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.instructor.name}
                            </p>
                          </div>
                          <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No hay pendientes</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Security Logs */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-red-500/10">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-bold text-sm">Actividad de Seguridad</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="h-7">
                    <Link href="/security-audit">
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <SecurityLogTimeline 
                    logs={securityLogs.slice(0, 3)} 
                    onLogClick={setSelectedLog} 
                    compact 
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-md bg-indigo-500/10">
                    <Zap className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="font-bold text-sm">Acciones Rápidas</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 rounded-lg bg-gradient-to-br ${action.color} text-white text-center cursor-pointer`}
                      >
                        <action.icon className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs font-bold">{action.label}</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Health Status */}
          <motion.div variants={item}>
            <HealthStatusWidget />
          </motion.div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <motion.div variants={item} className="lg:col-span-1">
          <NotificationsWidget notifications={notifications} compact />
        </motion.div>

        {/* Calendar */}
        <motion.div variants={item} className="lg:col-span-2">
          <CalendarWidget events={upcomingEvents} compact />
        </motion.div>
      </div>

      {/* Security Log Detail */}
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