// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Award, Target, TrendingUp, Activity, ShieldAlert, Clock, Zap, ChevronRight, BarChart3, Settings, PlusCircle, Eye, Bell, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
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
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { HealthStatusWidget } from "./health-status-widget";
import { NotificationsWidget } from "./notifications-widget";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];
const ACTIVITY_COLORS = {
  users: '#8b5cf6',
  courses: '#10b981',
  enrollments: '#f59e0b',
  resources: '#06b6d4'
};

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
      stiffness: 120,
      damping: 15
    }
  }
};

// Metric card compacta
function CompactMetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  change?: number; 
  icon: any; 
  color: string; 
}) {
  return (
    <motion.div variants={item} whileHover={{ scale: 1.02 }}>
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                {change !== undefined && (
                  <Badge variant={change >= 0 ? "default" : "destructive"} className="text-xs h-5">
                    {change >= 0 ? '+' : ''}{change}%
                  </Badge>
                )}
              </div>
            </div>
            <div className={`p-2.5 rounded-lg ${color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Item de lista compacta
function CompactListItem({ 
  title, 
  subtitle, 
  status,
  href,
  badge
}: { 
  title: string; 
  subtitle: string; 
  status?: 'pending' | 'completed' | 'warning';
  href: string;
  badge?: string;
}) {
  const statusIcons = {
    pending: AlertCircle,
    completed: CheckCircle2,
    warning: AlertCircle
  };

  const statusColors = {
    pending: 'text-amber-500',
    completed: 'text-green-500',
    warning: 'text-red-500'
  };

  const StatusIcon = status ? statusIcons[status] : null;

  return (
    <motion.div whileHover={{ x: 4 }}>
      <Link href={href} className="group">
        <div className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            {StatusIcon && <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColors[status]}`} />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {badge && (
              <Badge variant="secondary" className="text-xs">{badge}</Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
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
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const { user, settings } = useAuth();

  if (!adminStats) return null;

  // Calcular porcentajes de crecimiento
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

  // Datos para gráficos
  const userRolesData = (adminStats.usersByRole || []).map(item => ({
    name: item.role,
    value: item.count,
    color: COLORS[item.role === 'STUDENT' ? 0 : item.role === 'INSTRUCTOR' ? 1 : 2]
  }));

  const activityData = adminStats.userRegistrationTrend?.slice(-14) || [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen pb-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, <span className="font-semibold text-primary">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Análisis detallado
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/manage-courses/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nuevo curso
            </Link>
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CompactMetricCard
          title="Usuarios Totales"
          value={adminStats?.totalUsers || 0}
          change={calculateGrowth(adminStats?.totalUsers || 0, previousStats.users)}
          icon={Users}
          color="bg-blue-500"
        />
        <CompactMetricCard
          title="Cursos Publicados"
          value={adminStats?.totalPublishedCourses || 0}
          change={calculateGrowth(adminStats?.totalPublishedCourses || 0, previousStats.courses)}
          icon={BookOpen}
          color="bg-purple-500"
        />
        <CompactMetricCard
          title="Inscripciones"
          value={adminStats?.totalEnrollments || 0}
          change={calculateGrowth(adminStats?.totalEnrollments || 0, previousStats.enrollments)}
          icon={Award}
          color="bg-pink-500"
        />
        <CompactMetricCard
          title="Recursos"
          value={adminStats?.totalResources || 0}
          change={calculateGrowth(adminStats?.totalResources || 0, previousStats.resources)}
          icon={Target}
          color="bg-amber-500"
        />
      </div>

      {/* Sección principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de actividad */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Actividad de la plataforma</CardTitle>
                <Badge variant="outline" className="text-xs">
                  Últimos 14 días
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-64">
              <ChartContainer className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={11}
                      tickFormatter={(value) => format(parseISO(value), 'd MMM', { locale: es })}
                    />
                    <YAxis fontSize={11} />
                    <Tooltip 
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) => format(parseISO(value), 'PPP', { locale: es })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={ACTIVITY_COLORS.users}
                      fill={ACTIVITY_COLORS.users}
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Nuevos usuarios"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribución de usuarios */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Distribución de usuarios</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRolesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {userRolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sección secundaria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cursos pendientes */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Cursos pendientes</CardTitle>
                {pendingCourses && pendingCourses.length > 0 && (
                  <Badge variant="secondary">{pendingCourses.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {pendingCourses && pendingCourses.length > 0 ? (
                    pendingCourses.slice(0, 5).map((course, idx) => (
                      <CompactListItem
                        key={course.id}
                        title={course.title}
                        subtitle={`Por: ${course.instructor.name}`}
                        status="pending"
                        href={`/manage-courses/${course.id}/edit`}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">Todos los cursos revisados</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actividad de seguridad */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Actividad de seguridad</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8">
                  <Link href="/security-audit">
                    <Eye className="h-3 w-3 mr-1" />
                    Ver todo
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {securityLogs.slice(0, 5).map((log, idx) => (
                    <motion.div
                      key={log.id}
                      whileHover={{ x: 4 }}
                      onClick={() => setSelectedLog(log)}
                      className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ShieldAlert className={`h-4 w-4 flex-shrink-0 ${
                          log.severity === 'HIGH' ? 'text-red-500' :
                          log.severity === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{log.event}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {format(parseISO(log.timestamp), 'PPp', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximos eventos */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Próximos eventos</CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Hoy
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {upcomingEvents && upcomingEvents.length > 0 ? (
                    upcomingEvents.slice(0, 5).map((event, idx) => (
                      <CompactListItem
                        key={event.id}
                        title={event.title}
                        subtitle={`${format(parseISO(event.start), 'HH:mm', { locale: es })} - ${event.location}`}
                        status={event.type === 'MEETING' ? 'pending' : 'completed'}
                        href={`/calendar/${event.id}`}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No hay eventos próximos</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sección inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Acciones rápidas */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Acciones rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: '/manage-courses', icon: BookOpen, label: 'Gestionar cursos', color: 'border-blue-200 bg-blue-50' },
                  { href: '/users', icon: Users, label: 'Usuarios', color: 'border-purple-200 bg-purple-50' },
                  { href: '/analytics', icon: BarChart3, label: 'Analíticas', color: 'border-green-200 bg-green-50' },
                  { href: '/settings', icon: Settings, label: 'Configuración', color: 'border-amber-200 bg-amber-50' },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-lg border ${action.color} hover:shadow-md transition-all cursor-pointer`}
                    >
                      <action.icon className="h-5 w-5 mb-2" />
                      <p className="text-sm font-medium">{action.label}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sistema y notificaciones */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">Estado del sistema</p>
                      <p className="text-xs text-muted-foreground">Todos los servicios operativos</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Online
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Última actualización</span>
                    <span className="font-medium">Hace 5 min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usuarios activos</span>
                    <span className="font-medium">247</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cursos activos</span>
                    <span className="font-medium">156</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de detalle de seguridad */}
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