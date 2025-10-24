// src/app/(app)/dashboard/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Megaphone, 
  Folder, 
  BookMarked, 
  Settings, 
  CheckCircle, 
  ShieldAlert, 
  Loader2, 
  AlertTriangle, 
  BookOpenCheck, 
  Edit,
  GraduationCap,
  UsersRound,
  Activity,
  UserPlus,
  BarChart3,
  Server,
  KeyRound,
  UserCog,
  HelpCircle,
  TrendingUp,
  AlertCircleIcon,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { AdminDashboardStats, SecurityLog as AppSecurityLog, Course as AppCourseType, EnrolledCourse, CalendarEvent } from '@/types';
import type { Announcement as AnnouncementType, UserRole } from '@/types';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import type { Announcement as PrismaAnnouncement, Course as PrismaCourse, SecurityLog, User as PrismaUser } from '@prisma/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from '@/components/course-card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ComposedChart, Legend, Line, Cell } from "recharts";
import { getEventDetails } from '@/lib/security-log-utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTitle } from '@/contexts/title-context';
import { Identicon } from '@/components/ui/identicon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTour } from '@/contexts/tour-context';
import { adminDashboardTour, studentDashboardTour, instructorDashboardTour } from '@/lib/tour-steps';
import { MetricCard } from '@/components/analytics/metric-card';
import { useToast } from '@/hooks/use-toast';


// --- TYPE DEFINITIONS & MAPPERS ---
interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<PrismaUser, 'id' | 'name' | 'avatar'> | null;
}

interface DashboardData {
    adminStats: AdminDashboardStats | null;
    studentStats: { enrolled: number; completed: number } | null;
    instructorStats: { taught: number; students: number; } | null;
    recentAnnouncements: AnnouncementType[];
    securityLogs: SecurityLogWithUser[];
    taughtCourses: AppCourseType[];
    myDashboardCourses: EnrolledCourse[];
    assignedCourses: AppCourseType[] | null;
}


// --- DASHBOARD COMPONENTS PER ROLE ---

const formatDateTick = (tick: string) => {
    try {
        const date = parseISO(tick);
        return format(date, "d MMM", { locale: es });
    } catch(e) {
        return tick;
    }
};

const activityChartConfig = {
  newCourses: {
    label: "Nuevos Cursos",
    color: "hsl(var(--chart-2))",
  },
  newEnrollments: {
    label: "Inscripciones",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;


function AdminDashboard({ stats, logs, announcements, onParticipationChange }: { stats: Partial<AdminDashboardStats>, logs: SecurityLogWithUser[], announcements: AnnouncementType[], onParticipationChange: () => void }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleParticipate = async (event: CalendarEvent) => {
      try {
          const response = await fetch('/api/events/participate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventId: event.parentId || event.id, occurrenceDate: new Date(event.start).toISOString() }),
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'No se pudo confirmar la participación.');
          }
          toast({ title: "¡Bien hecho!", description: `Has confirmado tu participación en "${event.title}".` });
          onParticipationChange(); // Trigger a re-fetch in the parent
      } catch (err) {
          toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      }
  }

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4" id="admin-stats-cards">
            <MetricCard title="Total Usuarios" value={stats.totalUsers || 0} icon={UsersRound} gradient="bg-gradient-blue" />
            <MetricCard title="Cursos Publicados" value={stats.totalPublishedCourses || 0} icon={BookOpenCheck} gradient="bg-gradient-green" />
            <MetricCard title="Usuarios Activos" value={stats.recentLogins || 0} icon={Activity} description="Últimos 7 días" gradient="bg-gradient-orange" />
            <MetricCard title="Nuevas Inscripciones" value={stats.newEnrollmentsLast7Days || 0} icon={UserPlus} description="Últimos 7 días" gradient="bg-gradient-purple" />
        </div>
        
        {stats.interactiveEventsToday && stats.interactiveEventsToday.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {stats.interactiveEventsToday.map(event => (
                    <Card key={event.id} className={cn("relative overflow-hidden text-white flex flex-col justify-between", event.color ? `bg-event-${event.color}` : 'bg-primary')}>
                         <CardHeader>
                            <CardTitle>{event.title}</CardTitle>
                            <CardDescription className="text-white/80">{event.description}</CardDescription>
                         </CardHeader>
                         <CardFooter>
                              {event.hasParticipated ? (
                                <Button disabled variant="secondary" className="w-full bg-white/30 hover:bg-white/40">
                                    <CheckCircle className="mr-2 h-4 w-4"/> ¡Completado!
                                </Button>
                              ) : (
                                <Button onClick={() => handleParticipate(event)} variant="secondary" className="w-full bg-white/30 hover:bg-white/40">
                                  <Check className="mr-2 h-4 w-4"/> ¡Hecho!
                                </Button>
                              )}
                         </CardFooter>
                    </Card>
                 ))}
             </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2 space-y-6">
            <Card className="card-border-animated" id="course-activity-chart">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp/>Tendencia de Actividad</CardTitle>
                    <CardDescription>Actividad en los últimos 30 días.</CardDescription>
                </CardHeader>
                <CardContent className="h-80 p-0 pr-4">
                     <ChartContainer config={activityChartConfig} className="w-full h-full -ml-4 pl-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={stats.userRegistrationTrend || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={formatDateTick} tickLine={false} axisLine={false} tickMargin={10} interval={isMobile ? 6 : 3} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={10} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="newCourses" name="Cursos" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="newEnrollments" name="Inscripciones" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                     </ChartContainer>
                </CardContent>
            </Card>

             <section id="recent-announcements">
              <h2 className="text-2xl font-semibold">Anuncios Recientes</h2>
              {announcements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {announcements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              ) : (
                <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No hay anuncios recientes.</p></CardContent></Card>
              )}
            </section>
          </main>
          
          <aside className="lg:col-span-1 space-y-6">
             <Card className="card-border-animated" id="security-activity">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-primary"/>Última Actividad de Seguridad</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {logs.slice(0, 5).map(log => {
                           const eventUI = getEventDetails(log.event, log.details);
                           return (
                            <li key={log.id} className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full">{eventUI.icon}</div>
                                <div className="text-sm">
                                    <p className="font-semibold">{log.user?.name || log.emailAttempt}</p>
                                    <p className="text-muted-foreground">{eventUI.label}</p>
                                </div>
                            </li>
                           )
                        })}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="secondary" size="sm" className="w-full">
                        <Link href="/security-audit">Ver Auditoría Completa <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
             </Card>
             <Card className="card-border-animated" id="quick-access">
                <CardHeader>
                    <CardTitle>Accesos Rápidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/manage-courses" className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="flex items-center gap-3 font-medium"><BookMarked className="h-5 w-5 text-primary"/>Gestionar Cursos</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </li>
                        <li>
                            <Link href="/users" className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="flex items-center gap-3 font-medium"><Users className="h-5 w-5 text-primary"/>Gestionar Usuarios</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </li>
                         <li>
                            <Link href="/settings" className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="flex items-center gap-3 font-medium"><Settings className="h-5 w-5 text-primary"/>Configuración</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </li>
                         <li>
                            <Link href="/analytics" className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="flex items-center gap-3 font-medium"><BarChart3 className="h-5 w-5 text-primary"/>Analíticas</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </li>
                    </ul>
                </CardContent>
            </Card>
          </aside>
        </div>
    </div>
  );
}

function StudentDashboard({ stats, announcements, myCourses, assignedCourses }: { stats: { enrolled: number, completed: number }, announcements: AnnouncementType[], myCourses: EnrolledCourse[], assignedCourses: AppCourseType[] }) {
  return (
    <div className="space-y-8">
       {assignedCourses && assignedCourses.length > 0 && (
        <section id="mandatory-courses-section">
            <Alert variant="default" className="bg-amber-100/60 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800">
                <AlertCircleIcon className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">Tienes Cursos Obligatorios Pendientes</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Se te han asignado los siguientes cursos. Inscríbete para comenzar tu aprendizaje.
                </AlertDescription>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {assignedCourses.map((course) => (
                        <CourseCard key={course.id} course={course} userRole="STUDENT" />
                    ))}
                </div>
            </Alert>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="student-stats-cards">
          <MetricCard title="Cursos Inscritos" value={stats.enrolled} icon={BookOpen} gradient="bg-gradient-blue" />
          <MetricCard title="Cursos Completados" value={stats.completed} icon={CheckCircle} gradient="bg-gradient-green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-6">
          <section id="continue-learning-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Continuar Aprendiendo</h2>
              {myCourses.length > 0 && (
                  <Button asChild variant="link">
                    <Link href="/my-courses">Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
                  </Button>
              )}
            </div>
            {myCourses.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {myCourses.slice(0, 2).map((course, index) => (
                  <CourseCard key={course.id} course={course} userRole="STUDENT" priority={index < 2}/>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>No estás inscrito en ningún curso. ¡Explora el catálogo!</p>
                  <Button asChild className="mt-4"><Link href="/courses">Ir al Catálogo</Link></Button>
                </CardContent>
              </Card>
            )}
          </section>
        </main>
        
        <aside className="lg:col-span-1 space-y-8">
          <Card className="card-border-animated sticky top-24" id="quick-access-student">
            <CardHeader><CardTitle>Accesos Rápidos</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li><Link href="/courses" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50"><span className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary"/>Catálogo de Cursos</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></li>
                <li><Link href="/my-courses" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50"><span className="flex items-center gap-3"><GraduationCap className="h-5 w-5 text-primary"/>Mis Cursos</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></li>
                <li><Link href="/my-notes" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50"><span className="flex items-center gap-3"><BookMarked className="h-5 w-5 text-primary"/>Mis Apuntes</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></li>
              </ul>
            </CardContent>
          </Card>
          <Card id="recent-announcements-student">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Anuncios</h2>
                  <Button asChild variant="link" className="-mr-4">
                      <Link href="/announcements">Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              {announcements.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {announcements.slice(0,1).map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground">No hay anuncios recientes.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}


function InstructorDashboard({ stats, announcements, taughtCourses }: { stats: { taught: number, students: number }, announcements: AnnouncementType[], taughtCourses: AppCourseType[] }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="instructor-stats-cards">
          <MetricCard title="Cursos Impartidos" value={stats.taught} icon={BookMarked} gradient="bg-gradient-blue" />
          <MetricCard title="Total Estudiantes" value={stats.students} icon={Users} gradient="bg-gradient-green" description="En todos tus cursos"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-6">
            <section id="my-taught-courses">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Mis Cursos Impartidos</h2>
                    {taughtCourses.length > 0 && (
                        <Button asChild variant="link">
                            <Link href="/manage-courses">Gestionar todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    )}
                </div>
              {taughtCourses.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {taughtCourses.slice(0,2).map(course => (
                      <CourseCard 
                        key={course.id}
                        course={course}
                        userRole="INSTRUCTOR"
                        viewMode="management"
                      />
                    ))}
                </div>
              ) : (
                 <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <p>No has creado cursos aún.</p>
                       <Button asChild className="mt-4"><Link href="/manage-courses">Crear mi primer curso</Link></Button>
                    </CardContent>
                 </Card>
              )}
            </section>
        </main>
        
        <aside className="lg:col-span-1 space-y-8">
          <Card className="card-border-animated sticky top-24" id="quick-access-instructor">
            <CardHeader><CardTitle>Accesos Rápidos</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li><Link href="/manage-courses" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50"><span className="flex items-center gap-3"><BookMarked className="h-5 w-5 text-primary"/>Gestionar Cursos</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></li>
                <li><Link href="/enrollments" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50"><span className="flex items-center gap-3"><Users className="h-5 w-5 text-primary"/>Ver Inscripciones</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></li>
              </ul>
            </CardContent>
          </Card>
           <Card id="recent-announcements-instructor">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Anuncios</h2>
                   <Button asChild variant="link" className="-mr-4">
                      <Link href="/announcements">Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {announcements.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {announcements.slice(0,1).map(announcement => (
                      <AnnouncementCard key={announcement.id} announcement={announcement} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground">No hay anuncios recientes.</p>
                )}
              </CardContent>
            </Card>
        </aside>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const { user } = useAuth();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();
  const [data, setData] = useState<Partial<DashboardData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Panel Principal');
    if (user?.role === 'ADMINISTRATOR') startTour('adminDashboard', adminDashboardTour);
    if (user?.role === 'INSTRUCTOR') startTour('instructorDashboard', instructorDashboardTour);
    if (user?.role === 'STUDENT') startTour('studentDashboard', studentDashboardTour);
  }, [setPageTitle, startTour, user?.role]);
  
  const handleShowTour = () => {
    if (user?.role === 'ADMINISTRATOR') forceStartTour('adminDashboard', adminDashboardTour);
    if (user?.role === 'INSTRUCTOR') forceStartTour('instructorDashboard', instructorDashboardTour);
    if (user?.role === 'STUDENT') forceStartTour('studentDashboard', studentDashboardTour);
  }

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
        const res = await fetch('/api/dashboard/data', { cache: 'no-store' });
        if (!res.ok) {
            const errorText = await res.text();
            let errorJson;
            try {
              errorJson = JSON.parse(errorText);
            } catch(e) {
              errorJson = { message: 'Error en la respuesta de la API del dashboard' };
            }
            console.error(`Error al obtener datos del dashboard:`, res.status, errorJson);
            throw new Error(errorJson.message || `Error al obtener datos del dashboard`);
        }
        const dashboardData = await res.json();
        setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [user]);


  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  
  if (!user || isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-96" />
                <Skeleton className="h-64" />
            </div>
            <div className="lg:col-span-1"><Skeleton className="h-[400px]" /></div>
        </div>
    </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Error al Cargar Dashboard</p>
            <p className="text-sm">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline" className="mt-4">Reintentar</Button>
        </div>
    )
  }

  const renderContentForRole = () => {
    switch (user.role) {
      case 'ADMINISTRATOR':
        return data?.adminStats ? <AdminDashboard stats={data.adminStats} logs={data.securityLogs || []} announcements={data.recentAnnouncements || []} onParticipationChange={fetchDashboardData}/> : null;
      case 'INSTRUCTOR':
        return data?.instructorStats ? <InstructorDashboard stats={data.instructorStats} announcements={data.recentAnnouncements || []} taughtCourses={data.taughtCourses || []} /> : null;
      case 'STUDENT':
        return data?.studentStats ? <StudentDashboard stats={data.studentStats} announcements={data.recentAnnouncements || []} myCourses={data.myDashboardCourses || []} assignedCourses={data.assignedCourses || []} /> : null;
      default:
        return <p>Rol de usuario no reconocido.</p>;
    }
  };
  

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    Hola, {user.name}! 
                    <span className="text-2xl animate-wave">👋</span>
                </h1>
                <p className="text-muted-foreground">Bienvenido de nuevo a tu plataforma de aprendizaje.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleShowTour}>
                <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
            </Button>
        </div>
      
      {renderContentForRole()}

    </div>
  );
}
