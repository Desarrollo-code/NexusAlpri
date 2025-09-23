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
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { AdminDashboardStats, SecurityLog as AppSecurityLog } from '@/types';
import type { Announcement as AnnouncementType, UserRole, Course as AppCourseType, EnrolledCourse } from '@/types';
import { AnnouncementCard } from '@/components/announcement-card';
import type { Announcement as PrismaAnnouncement, Course as PrismaCourse, SecurityLog, User as PrismaUser } from '@prisma/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from '@/components/course-card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ComposedChart, Legend, Line, Cell } from "recharts";
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { getEventDetails } from '@/lib/security-log-utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTitle } from '@/contexts/title-context';
import { Identicon } from '@/components/ui/identicon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTour } from '@/contexts/tour-context';
import { adminDashboardTour, studentDashboardTour, instructorDashboardTour } from '@/lib/tour-steps';


// --- TYPE DEFINITIONS & MAPPERS ---
interface DisplayAnnouncement extends Omit<PrismaAnnouncement, 'author' | 'audience'> {
  author: { id: string; name: string; email?: string } | null;
  audience: UserRole[] | 'ALL' | string;
}

interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor: { id: string; name: string } | null;
  _count: { modules: number };
  status: AppCourseType['status'];
}

function mapApiCourseToAppCourse(apiCourse: ApiCourseForManage): AppCourseType {
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description || '',
    instructor: apiCourse.instructor?.name || 'N/A',
    instructorId: apiCourse.instructorId || undefined,
    imageUrl: apiCourse.imageUrl || undefined,
    modulesCount: apiCourse._count?.modules ?? 0,
    status: apiCourse.status,
    modules: [],
  };
}

interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<PrismaUser, 'id' | 'name' | 'avatar'> | null;
}

interface DashboardData {
    adminStats: AdminDashboardStats | null;
    studentStats: { enrolled: number; completed: number } | null;
    instructorStats: { taught: number } | null;
    recentAnnouncements: AnnouncementType[];
    securityLogs: SecurityLogWithUser[];
    taughtCourses: AppCourseType[];
    myDashboardCourses: EnrolledCourse[];
}


// --- DASHBOARD COMPONENTS PER ROLE ---

const MetricCard = ({ title, value, icon: Icon, description, gradient, id }: { title: string; value: number; icon: React.ElementType; description?: string, gradient: string, id?: string }) => {
    const animatedValue = useAnimatedCounter(value);
    return (
        <Card id={id} className={cn("relative overflow-hidden text-white card-border-animated", gradient)}>
            <div className="absolute inset-0 bg-black/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
                <Icon className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent className="relative">
                <div className="text-3xl font-bold text-white">{animatedValue}</div>
                {description && <p className="text-xs text-white/70">{description}</p>}
            </CardContent>
        </Card>
    );
};

const activityChartConfig = {
  newCourses: { label: "Nuevos Cursos", color: "hsl(var(--primary))" },
  newEnrollments: { label: "Nuevas Inscripciones", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;


const formatDateTick = (tick: string) => {
    try {
        const date = parseISO(tick);
        return format(date, "d MMM", { locale: es });
    } catch (e) {
        return tick;
    }
};

const formatDateTooltip = (dateString: string, payload?: any) => {
    try {
        const date = parseISO(dateString);
        return format(date, "d/MM/yyyy", { locale: es });
    } catch (e) {
        return dateString;
    }
};


function AdminDashboard({ stats, logs, announcements }: { stats: AdminDashboardStats, logs: SecurityLogWithUser[], announcements: AnnouncementType[] }) {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4" id="admin-stats-cards">
            <MetricCard title="Total Usuarios" value={stats.totalUsers} icon={UsersRound} gradient="bg-gradient-blue" />
            <MetricCard title="Cursos Publicados" value={stats.totalPublishedCourses} icon={BookOpenCheck} gradient="bg-gradient-green" />
            <MetricCard title="Usuarios Activos" value={stats.recentLogins} icon={Activity} description="Últimos 7 días" gradient="bg-gradient-orange" />
            <MetricCard title="Nuevas Inscripciones" value={stats.newEnrollmentsLast7Days} icon={UserPlus} description="Últimos 7 días" gradient="bg-gradient-purple" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2 space-y-6">
            <Card className="card-border-animated" id="course-activity-chart">
              <CardHeader>
                  <CardTitle>Actividad Diaria (Últimos 30 días)</CardTitle>
                  <CardDescription>Resumen de nuevos cursos e inscripciones por día.</CardDescription>
              </CardHeader>
                  <CardContent className="h-[350px] p-0 pr-4">
                   <ChartContainer config={activityChartConfig} className="w-full h-full -ml-4 pl-4">
                    <ResponsiveContainer>
                        <AreaChart data={stats.userRegistrationTrend} margin={{ top: 20, right: 20, bottom: 50, left: 0 }}>
                           <defs>
                              <linearGradient id="colorNewCourses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-newCourses)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-newCourses)" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorNewEnrollments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-newEnrollments)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-newEnrollments)" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={10} 
                                angle={-45} 
                                textAnchor="end" 
                                interval={isMobile ? 6 : 2} 
                                tickFormatter={formatDateTick} 
                            />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={10}/>
                            <ChartTooltip cursor={{stroke: 'hsl(var(--border))', strokeWidth: 1.5, radius: 4}} content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                            <Legend verticalAlign="top" height={36} />
                            <Area type="monotone" dataKey="newCourses" name="Nuevos Cursos" stroke="var(--color-newCourses)" fill="url(#colorNewCourses)" strokeWidth={2} />
                            <Area type="monotone" dataKey="newEnrollments" name="Nuevas Inscripciones" stroke="var(--color-newEnrollments)" fill="url(#colorNewEnrollments)" strokeWidth={2} />
                        </AreaChart>
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

function StudentDashboard({ stats, announcements, myCourses }: { stats: { enrolled: number, completed: number }, announcements: AnnouncementType[], myCourses: EnrolledCourse[] }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Tu Progreso</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2" id="student-stats-cards">
          <Card className="card-border-animated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enrolled}</div>
            </CardContent>
          </Card>
          <Card className="card-border-animated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          <section id="continue-learning-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Continuar Aprendiendo</h2>
              <Button asChild variant="link">
                <Link href="/my-courses">Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
            </div>
            {myCourses.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {myCourses.map((course, index) => (
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

          <section id="recent-announcements-student">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Anuncios Recientes</h2>
                 <Button asChild variant="link">
                    <Link href="/announcements">Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </div>
            {announcements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map(announcement => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            ) : (
              <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No hay anuncios recientes.</p></CardContent></Card>
            )}
          </section>
        </main>
        
        <aside className="lg:col-span-1">
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
        </aside>
      </div>
    </div>
  );
}


function InstructorDashboard({ stats, announcements, taughtCourses }: { stats: { taught: number }, announcements: AnnouncementType[], taughtCourses: AppCourseType[] }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Resumen de Instructor</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2" id="instructor-stats-cards">
          <Card className="card-border-animated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Impartidos</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taught}</div>
            </CardContent>
          </Card>
          <Card className="card-border-animated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">N/A</div>
              <p className="text-xs text-muted-foreground">Próximamente</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
            <section id="my-taught-courses">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Mis Cursos Impartidos</h2>
                    <Button asChild variant="link">
                        <Link href="/manage-courses">Gestionar todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </div>
              {taughtCourses.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {taughtCourses.map(course => (
                      <Card key={course.id} className="shadow-sm hover:shadow-md transition-shadow card-border-animated">
                        <div className="aspect-video relative w-full rounded-t-lg overflow-hidden bg-muted/30">
                           {course.imageUrl && <Image src={course.imageUrl} alt={course.title} fill className="object-cover" quality={100} data-ai-hint="online learning teacher" />}
                        </div>
                        <CardHeader><CardTitle className="text-lg">{course.title}</CardTitle><CardDescription className="text-xs">{course.modulesCount} módulos. Estado: <span className="capitalize">{course.status.toLowerCase()}</span></CardDescription></CardHeader>
                        <CardFooter><Button asChild className="w-full" size="sm"><Link href={`/manage-courses/${course.id}/edit`}><Edit className="mr-2"/> Editar Contenido</Link></Button></CardFooter>
                      </Card>
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
            
             <section id="recent-announcements-instructor">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Anuncios Recientes</h2>
                 <Button asChild variant="link">
                    <Link href="/announcements">Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
              </div>
              {announcements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              ) : (
                <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No hay anuncios recientes.</p></CardContent></Card>
              )}
            </section>
        </main>
        
        <aside className="lg:col-span-1">
          <Card className="card-border-animated sticky top-24" id="quick-access-instructor">
            <CardHeader><CardTitle>Accesos Rápidos</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li><Link href="/manage-courses" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50"><span className="flex items-center gap-3"><BookMarked className="h-5 w-5 text-primary"/>Gestionar Cursos</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></li>
                <li><Link href="/enrollments" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50"><span className="flex items-center gap-3"><Users className="h-5 w-5 text-primary"/>Ver Inscripciones</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></li>
              </ul>
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
  const [data, setData] = useState<DashboardData | null>(null);
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
    
    const fetchWithFallback = async (url: string, fallback: any): Promise<any> => {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                const errorText = await res.text();
                let errorJson;
                try {
                  errorJson = JSON.parse(errorText);
                } catch(e) {
                  errorJson = { message: `Error en la respuesta de ${url}` };
                }
                console.error(`Error al obtener datos de ${url}:`, res.status, errorJson);
                throw new Error(errorJson.message || `Error al obtener datos de ${url}`);
            }
            return await res.json();
        } catch (e) {
            console.error(`Fallo completo al hacer fetch a ${url}:`, e);
            setError((e as Error).message);
            return fallback;
        }
    };
    
    try {
      let dashboardPayload: DashboardData = {
          adminStats: null,
          studentStats: null,
          instructorStats: null,
          recentAnnouncements: [],
          taughtCourses: [],
          myDashboardCourses: [],
          securityLogs: [],
      };
      
      const announcementsData = await fetchWithFallback(`/api/announcements?pageSize=2`, { announcements: [] });
      if (announcementsData && announcementsData.announcements) {
          dashboardPayload.recentAnnouncements = announcementsData.announcements;
      }

      if (user.role === 'ADMINISTRATOR') {
          const [adminStats, securityLogs] = await Promise.all([
             fetchWithFallback('/api/dashboard/admin-stats', null),
             fetchWithFallback('/api/security/logs?pageSize=5', { logs: [] }),
          ]);
          dashboardPayload.adminStats = adminStats;
          dashboardPayload.securityLogs = securityLogs.logs;
      } else if (user.role === 'INSTRUCTOR') {
          const taughtCoursesResponse = await fetchWithFallback(`/api/courses?manageView=true&userId=${user.id}&userRole=${user.role}&pageSize=4`, { courses: [], totalCourses: 0 });
          dashboardPayload.instructorStats = { taught: taughtCoursesResponse.totalCourses };
          dashboardPayload.taughtCourses = (taughtCoursesResponse.courses || []).map(mapApiCourseToAppCourse);
      } else if (user.role === 'STUDENT') {
           const enrolledData = await fetchWithFallback(`/api/enrollment/${user.id}`, []);
          const mappedCourses: EnrolledCourse[] = enrolledData.map((item: any) => ({
            id: item.id, title: item.title, description: item.description, instructor: item.instructorName || 'N/A',
            imageUrl: item.imageUrl, modulesCount: item.modulesCount || 0, duration: item.duration, modules: [], 
            enrolledAt: item.enrolledAt, isEnrolled: true, instructorId: item.instructorId, status: 'PUBLISHED',
            progressPercentage: item.progressPercentage || 0,
          }));
          const completedCount = mappedCourses.filter(c => c.progressPercentage === 100).length;
          dashboardPayload.studentStats = { enrolled: mappedCourses.length, completed: completedCount };
          dashboardPayload.myDashboardCourses = mappedCourses.slice(0, 4);
      }
      
      setData(dashboardPayload);
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
        return data?.adminStats ? <AdminDashboard stats={data.adminStats} logs={data.securityLogs} announcements={data.recentAnnouncements} /> : null;
      case 'INSTRUCTOR':
        return data?.instructorStats ? <InstructorDashboard stats={data.instructorStats} announcements={data.recentAnnouncements} taughtCourses={data.taughtCourses} /> : null;
      case 'STUDENT':
        return data?.studentStats ? <StudentDashboard stats={data.studentStats} announcements={data.recentAnnouncements} myCourses={data.myDashboardCourses} /> : null;
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
