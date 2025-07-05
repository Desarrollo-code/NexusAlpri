
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
  FolderKanban, 
  ListPlus, 
  SettingsIcon, 
  CheckCircle, 
  FileText, 
  UsersRound, 
  Activity, 
  ShieldAlert, 
  Archive, 
  Loader2, 
  AlertTriangle, 
  BookOpenCheck, 
  Edit, 
  Eye, 
  GraduationCap, 
  BarChart3, 
  LineChart as LineChartIcon,
  Rocket,
  X
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { AdminDashboardStats } from '@/pages/api/dashboard/admin-stats';
import type { Announcement as AnnouncementType, UserRole, Course as AppCourseType, EnrolledCourse } from '@/types';
import { AnnouncementCard } from '@/components/announcement-card';
import type { Announcement as PrismaAnnouncement, Course as PrismaCourse, CourseStatus as PrismaCourseStatus, UserRole as PrismaUserRole } from '@prisma/client';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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

const MiniTrendChart = ({ data, color }: { data: { value: number }[], color: string }) => (
    <div className="h-14 w-28">
        <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);


export default function DashboardPage() {
  // --- HOOKS ---
  // All hooks must be declared at the top level, before any conditional logic or returns.
  const { user } = useAuth();
  
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<DisplayAnnouncement[]>([]);
  const [taughtCourses, setTaughtCourses] = useState<AppCourseType[]>([]);
  const [myDashboardCourses, setMyDashboardCourses] = useState<EnrolledCourse[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isLoadingTaughtCourses, setIsLoadingTaughtCourses] = useState(false);
  const [isLoadingMyCourses, setIsLoadingMyCourses] = useState(false);
  
  const [statsError, setStatsError] = useState<string | null>(null);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [taughtCoursesError, setTaughtCoursesError] = useState<string | null>(null);
  const [myCoursesError, setMyCoursesError] = useState<string | null>(null);

  const [showWelcome, setShowWelcome] = useState(false);

  const fetchAdminStats = useCallback(async () => {
    if (user?.role !== 'ADMINISTRATOR') return;
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const response = await fetch('/api/dashboard/admin-stats');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch admin stats');
      }
      const data: AdminDashboardStats = await response.json();
      setAdminStats(data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Unknown error fetching stats');
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.role]);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    setAnnouncementsError(null);
    try {
      const response = await fetch('/api/announcements');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch announcements');
      }
      const data: PrismaAnnouncement[] = await response.json(); 
      const displayData: DisplayAnnouncement[] = data.map(ann => {
        let parsedAudience: UserRole[] | 'ALL' = 'ALL';
        if (typeof ann.audience === 'string') {
          if (ann.audience === 'ALL') parsedAudience = 'ALL';
          else try { const arr = JSON.parse(ann.audience); if (Array.isArray(arr)) parsedAudience = arr as UserRole[]; } catch (e) { /* ignore */ }
        } else if (Array.isArray(ann.audience)) parsedAudience = ann.audience as UserRole[];
        return { ...ann, author: ann.author ? { id: (ann.author as any).id, name: (ann.author as any).name } : null, audience: parsedAudience };
      });
      setRecentAnnouncements(displayData);
    } catch (err) {
      setAnnouncementsError(err instanceof Error ? err.message : 'Unknown error fetching announcements');
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  const fetchTaughtCourses = useCallback(async () => {
    if (!user || user.role !== 'INSTRUCTOR') return;
    setIsLoadingTaughtCourses(true);
    setTaughtCoursesError(null);
    try {
      const queryParams = new URLSearchParams({ manageView: 'true', userId: user.id, userRole: user.role });
      const response = await fetch(`/api/courses?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch taught courses');
      const data: ApiCourseForManage[] = await response.json();
      setTaughtCourses(data.map(mapApiCourseToAppCourse).slice(0, 3)); 
    } catch (err) {
      setTaughtCoursesError(err instanceof Error ? err.message : 'Unknown error fetching taught courses');
    } finally {
      setIsLoadingTaughtCourses(false);
    }
  }, [user]);

  const fetchMyDashboardCourses = useCallback(async () => {
    if (!user || user.role !== 'STUDENT') return;
    setIsLoadingMyCourses(true);
    setMyCoursesError(null);
    try {
      const response = await fetch(`/api/enrollment/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch enrolled courses');
      const data: any[] = await response.json();
      const mappedCourses: EnrolledCourse[] = data.map(item => ({
        id: item.id, title: item.title, description: item.description, instructor: item.instructorName || 'N/A',
        imageUrl: item.imageUrl, modulesCount: item.modulesCount || 0, enrolledAt: item.enrolledAt, isEnrolled: true, instructorId: item.instructorId, status: 'PUBLISHED', modules: []
      }));
      setMyDashboardCourses(mappedCourses.slice(0, 3)); 
    } catch (err) {
      setMyCoursesError(err instanceof Error ? err.message : 'Unknown error fetching enrolled courses');
    } finally {
      setIsLoadingMyCourses(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      if (user.role === 'ADMINISTRATOR') fetchAdminStats();
      if (user.role === 'INSTRUCTOR') fetchTaughtCourses();
      if (user.role === 'STUDENT') fetchMyDashboardCourses();
    }
  }, [user, fetchAdminStats, fetchAnnouncements, fetchTaughtCourses, fetchMyDashboardCourses]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
        const welcomeDismissed = localStorage.getItem(`welcomeDismissed_${user.id}`);
        if (!welcomeDismissed) {
            setShowWelcome(true);
        }
    }
  }, [user?.id]);

  const filteredAnnouncements = useMemo(() => {
    if (!user) return [];
    return recentAnnouncements
      .filter(ann => {
        if (ann.audience === 'ALL') return true;
        if (Array.isArray(ann.audience) && ann.audience.includes(user.role)) return true;
        if (typeof ann.audience === 'string') { try { const parsed = JSON.parse(ann.audience); if (Array.isArray(parsed) && parsed.includes(user.role)) return true; } catch (e) {} }
        return false;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3); 
  }, [recentAnnouncements, user]);

  const courseStatusChartData = useMemo(() => {
    if (!adminStats?.coursesByStatus) return [];
    const courseStatusChartConfig = {
      count: { label: "Cursos" },
      PUBLISHED: { label: "Publicados", color: "hsl(var(--chart-1))" },
      DRAFT: { label: "Borrador", color: "hsl(var(--chart-2))" },
      ARCHIVED: { label: "Archivados", color: "hsl(var(--chart-3))" },
    };
    const order: PrismaCourseStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
    return order.map(status => ({
        status: courseStatusChartConfig[status]?.label || status,
        count: adminStats.coursesByStatus.find(item => item.status === status)?.count || 0,
        fill: `var(--color-${status})`
    }));
  }, [adminStats?.coursesByStatus]);

  const userRolesChartData = useMemo(() => {
    if (!adminStats?.usersByRole) return [];
    const userRolesChartConfig = {
      count: { label: "Usuarios" },
      STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
      INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))"  },
      ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))"  },
    };
    const order: PrismaUserRole[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
    return order.map(role => ({
        role: userRolesChartConfig[role]?.label || role,
        count: adminStats.usersByRole.find(item => item.role === role)?.count || 0,
    }));
  }, [adminStats?.usersByRole]);

  // --- EARLY RETURN GUARD ---
  // If the user is not loaded yet, display a loader. This prevents hooks from being called conditionally.
  if (!user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Cargando...</div>;
  }
  
  // --- LOGIC & COMPONENTS DEPENDENT ON USER ---
  // This code only runs if 'user' is guaranteed to be defined.
  const handleDismissWelcome = () => {
    setShowWelcome(false);
    if (user?.id) {
        localStorage.setItem(`welcomeDismissed_${user.id}`, 'true');
    }
  };

  const WelcomeGuide = () => {
    let title = `¡Hola, ${user.name}! 👋`;
    let description = '';
    let ctaLink = '/';
    let ctaLabel = '';

    switch (user.role) {
        case 'STUDENT':
            description = "Bienvenido a tu centro de aprendizaje. Explora nuevos cursos, continúa tu progreso y alcanza tus metas.";
            ctaLink = "/courses";
            ctaLabel = "Explorar Cursos";
            break;
        case 'INSTRUCTOR':
            description = "Bienvenido a tu espacio de creación. Desde aquí puedes gestionar tus cursos, supervisar el progreso y comunicarte con tus estudiantes.";
            ctaLink = "/manage-courses";
            ctaLabel = "Gestionar mis Cursos";
            break;
        case 'ADMINISTRATOR':
            description = "Este es tu centro de control. Supervisa las estadísticas clave, gestiona usuarios y administra el contenido de toda la plataforma.";
            ctaLink = "/users";
            ctaLabel = "Gestionar Usuarios";
            break;
    }

    return (
        <Alert className="relative bg-primary/5 border-primary/20 shadow-md mb-8">
             <Button variant="ghost" size="icon" onClick={handleDismissWelcome} className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-primary/10 z-10">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
            </Button>
            <Rocket className="h-4 w-4 text-primary" />
            <AlertTitle className="font-headline text-lg text-primary">{title}</AlertTitle>
            <AlertDescription className="text-foreground/80 mt-2">
                {description}
            </AlertDescription>
            <div className="mt-4">
                <Button asChild>
                    <Link href={ctaLink}>
                        {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </Alert>
    );
  };
  
  const courseStatusChartConfig = {
    count: { label: "Cursos" },
    PUBLISHED: { label: "Publicados", color: "hsl(var(--chart-1))" },
    DRAFT: { label: "Borrador", color: "hsl(var(--chart-2))" },
    ARCHIVED: { label: "Archivados", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;
  
  const userRolesChartConfig = {
    count: { label: "Usuarios" },
    STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
    INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))"  },
    ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))"  },
  } satisfies ChartConfig;
  
  const quickLinks = {
    ADMINISTRATOR: [
      { href: '/users', label: 'Gestionar Usuarios', icon: Users, description: 'Administra cuentas y roles.' },
      { href: '/manage-courses', label: 'Gestionar Cursos', icon: ListPlus, description: 'Crea y edita cursos.' },
      { href: '/resources', label: 'Biblioteca', icon: FolderKanban, description: 'Administra recursos globales.' },
      { href: '/settings', label: 'Configuración', icon: SettingsIcon, description: 'Ajusta la plataforma.' },
    ],
    INSTRUCTOR: [
      { href: '/manage-courses', label: 'Mis Cursos', icon: ListPlus, description: 'Diseña y actualiza tus cursos.' },
      { href: '/enrollments', label: 'Progreso Estudiantes', icon: UsersRound, description: 'Supervisa el avance.' },
       { href: '/courses', label: 'Explorar Cursos', icon: BookOpen, description: 'Descubre nuevo contenido.' },
      { href: '/announcements', label: 'Anuncios', icon: Megaphone, description: 'Mantente al día.' },
    ],
    STUDENT: [
      { href: '/my-courses', label: 'Mis Cursos', icon: GraduationCap, description: 'Continúa tu aprendizaje.' },
      { href: '/courses', label: 'Explorar Cursos', icon: BookOpen, description: 'Descubre nuevas oportunidades.' },
      { href: '/resources', label: 'Biblioteca', icon: FolderKanban, description: 'Accede a guías y materiales.' },
      { href: '/announcements', label: 'Anuncios', icon: Megaphone, description: 'Revisa las últimas noticias.' },
    ],
  };
  const linksToShow = quickLinks[user.role] || [];
  
  const trendData1 = [{value: 10}, {value: 20}, {value: 15}, {value: 30}, {value: 25}, {value: 40}];
  const trendData2 = [{value: 40}, {value: 30}, {value: 35}, {value: 20}, {value: 25}, {value: 10}];
  const trendData3 = [{value: 5}, {value: 8}, {value: 6}, {value: 12}, {value: 10}, {value: 15}];
  const trendData4 = [{value: 15}, {value: 12}, {value: 18}, {value: 15}, {value: 22}, {value: 20}];

  // --- RENDER ---
  return (
    <div className="space-y-8">

      {showWelcome && <WelcomeGuide />}

      {user.role === 'ADMINISTRATOR' && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline">Estadísticas de la Plataforma</h2>
          {isLoadingStats && <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando estadísticas...</div>}
          {statsError && <div className="text-destructive"><AlertTriangle className="inline mr-2 h-5 w-5" />Error al cargar estadísticas: {statsError}</div>}
          {adminStats && !isLoadingStats && !statsError && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle><Users className="h-5 w-5 text-sky-400" />
                  </CardHeader>
                  <CardContent className="flex justify-between items-end">
                    <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
                    <MiniTrendChart data={trendData1} color="hsl(var(--chart-1))" />
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle><BookOpenCheck className="h-5 w-5 text-emerald-400" />
                  </CardHeader>
                  <CardContent className="flex justify-between items-end">
                    <div className="text-2xl font-bold">{adminStats.totalCourses}</div>
                    <MiniTrendChart data={trendData2} color="hsl(var(--chart-3))" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cursos Publicados</CardTitle><Activity className="h-5 w-5 text-amber-400" />
                  </CardHeader>
                  <CardContent className="flex justify-between items-end">
                    <div className="text-2xl font-bold">{adminStats.totalPublishedCourses}</div>
                    <MiniTrendChart data={trendData3} color="hsl(var(--chart-4))" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle><UsersRound className="h-5 w-5 text-rose-400" />
                  </CardHeader>
                  <CardContent className="flex justify-between items-end">
                    <div className="text-2xl font-bold">{adminStats.totalEnrollments}</div>
                    <MiniTrendChart data={trendData4} color="hsl(var(--chart-2))" />
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-5 w-5 text-primary"/>Distribución de Cursos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courseStatusChartData.length > 0 ? (
                       <ChartContainer config={courseStatusChartConfig} className="h-[250px] w-full">
                        <ResponsiveContainer>
                          <BarChart data={courseStatusChartData} margin={{ top: 20, right: 20, left: -5, bottom: 5 }} barGap={4}>
                            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="status" 
                              tickLine={false} 
                              axisLine={false} 
                              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                              allowDecimals={false}
                            />
                            <ChartTooltip
                              cursor={{fill: 'hsl(var(--muted))', radius: 4}}
                              content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {courseStatusChartData.map((entry, index) => (
                                    <Bar key={entry.status} dataKey="count" fill={`hsl(var(--chart-${index + 1}))`} />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (<p className="text-muted-foreground text-center py-4">No hay datos de cursos.</p>)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-5 w-5 text-primary"/>Distribución de Usuarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {userRolesChartData.length > 0 ? (
                        <ChartContainer config={userRolesChartConfig} className="h-[250px] w-full">
                          <ResponsiveContainer>
                           <BarChart data={userRolesChartData} margin={{ top: 20, right: 20, left: -5, bottom: 5 }} barGap={4}>
                              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                               <XAxis 
                                dataKey="role" 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                              />
                              <YAxis
                                  tickLine={false}
                                  axisLine={false}
                                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                  allowDecimals={false}
                               />
                              <ChartTooltip
                                  cursor={{fill: 'hsl(var(--muted))', radius: 4}}
                                  content={<ChartTooltipContent />}
                              />
                               <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {userRolesChartData.map((entry, index) => (
                                    <Bar key={entry.role} dataKey="count" fill={`hsl(var(--chart-${index + 1}))`} />
                                ))}
                               </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      ) : (<p className="text-muted-foreground text-center py-4">No hay datos de usuarios.</p>)}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {user.role === 'INSTRUCTOR' && (
              <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">Mis Cursos Impartidos</h2>
                {isLoadingTaughtCourses && <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando mis cursos...</div>}
                {taughtCoursesError && <div className="text-destructive"><AlertTriangle className="inline mr-2 h-5 w-5" />Error al cargar cursos: {taughtCoursesError}</div>}
                {!isLoadingTaughtCourses && !taughtCoursesError && taughtCourses.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {taughtCourses.map(course => (
                      <Card key={course.id} className="shadow-sm hover:shadow-md transition-shadow">
                         {course.imageUrl && <div className="aspect-video relative w-full rounded-t-lg overflow-hidden"><Image src={course.imageUrl} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online learning teacher" sizes="(max-width: 768px) 100vw, 50vw"/></div>}
                        <CardHeader><CardTitle className="text-lg">{course.title}</CardTitle><CardDescription className="text-xs">{course.modulesCount} módulos. Estado: <span className="capitalize">{course.status.toLowerCase()}</span></CardDescription></CardHeader>
                        <CardFooter><Button asChild className="w-full" size="sm"><Link href={`/manage-courses/${course.id}/edit`}><Edit className="mr-2"/> Editar Curso</Link></Button></CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
                {!isLoadingTaughtCourses && !taughtCoursesError && taughtCourses.length === 0 && (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No has creado cursos aún.</p></CardContent></Card>
                )}
              </section>
           )}

           {user.role === 'STUDENT' && (
              <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">Mis Cursos Inscritos</h2>
                {isLoadingMyCourses && <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando...</div>}
                {myCoursesError && <div className="text-destructive"><AlertTriangle className="inline mr-2"/>Error: {myCoursesError}</div>}
                {!isLoadingMyCourses && !myCoursesError && myDashboardCourses.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {myDashboardCourses.map(course => (
                      <Card key={course.id} className="shadow-sm hover:shadow-md transition-shadow">
                        {course.imageUrl && <div className="aspect-video relative w-full rounded-t-lg overflow-hidden"><Image src={course.imageUrl} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="education student" sizes="(max-width: 768px) 100vw, 50vw"/></div>}
                        <CardHeader><CardTitle className="text-lg">{course.title}</CardTitle><CardDescription className="text-xs">Por: {course.instructor}</CardDescription></CardHeader>
                        <CardFooter><Button asChild className="w-full" size="sm"><Link href={`/courses/${course.id}`}><Eye className="mr-2"/> Ver Curso</Link></Button></CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
                {!isLoadingMyCourses && !myCoursesError && myDashboardCourses.length === 0 && (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No estás inscrito en ningún curso.</p></CardContent></Card>
                )}
              </section>
           )}
           
            <section>
              <h2 className="text-2xl font-semibold font-headline mb-4">Anuncios Recientes</h2>
              {isLoadingAnnouncements && <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando anuncios...</div>}
              {announcementsError && <div className="text-destructive"><AlertTriangle className="inline mr-2" />Error: {announcementsError}</div>}
              {!isLoadingAnnouncements && !announcementsError && filteredAnnouncements.length > 0 && (
                <div className="space-y-4">
                  {filteredAnnouncements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              )}
              {!isLoadingAnnouncements && !announcementsError && filteredAnnouncements.length === 0 && (
                <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No hay anuncios recientes.</p></CardContent></Card>
              )}
            </section>
        </div>
        <div className="lg:col-span-1">
           <Card className="sticky top-24">
             <CardHeader><CardTitle>Accesos Rápidos</CardTitle></CardHeader>
             <CardContent className="space-y-3">
               {linksToShow.map((link) => (
                 <Link key={link.href} href={link.href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                   <div className="bg-muted p-2 rounded-md"><link.icon className="h-5 w-5 text-primary"/></div>
                   <div>
                      <p className="font-semibold">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                   </div>
                 </Link>
               ))}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
