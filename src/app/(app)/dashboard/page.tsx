

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
  BarChart3, 
  Rocket,
  X,
  TrendingUp,
  Activity,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { AdminDashboardStats } from '@/app/api/dashboard/admin-stats/route';
import type { Announcement as AnnouncementType, UserRole, Course as AppCourseType, EnrolledCourse } from '@/types';
import { AnnouncementCard } from '@/components/announcement-card';
import type { Announcement as PrismaAnnouncement, Course as PrismaCourse } from '@prisma/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from '@/components/course-card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, ResponsiveContainer, Cell, Label } from "recharts";
import { cn } from '@/lib/utils';
import { GradientIcon } from '@/components/ui/gradient-icon';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCarousel } from '@/components/course-carousel';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

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

interface DashboardData {
    adminStats: AdminDashboardStats | null;
    studentStats: { enrolled: number; completed: number } | null;
    instructorStats: { taught: number } | null;
    recentAnnouncements: DisplayAnnouncement[];
    taughtCourses: AppCourseType[];
    myDashboardCourses: EnrolledCourse[];
}

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const courseStatusChartConfig = {
  count: { label: "Cursos" },
  PUBLISHED: { label: "Publicados", color: "hsl(var(--chart-2))" },
  DRAFT: { label: "Borrador", color: "hsl(var(--chart-1))" },
  ARCHIVED: { label: "Archivados", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const StatCard = ({ title, value: finalValue, icon: Icon, href }: { title: string; value: number; icon: React.ElementType; href: string;}) => {
    const animatedValue = useAnimatedCounter(finalValue);
    return (
        <Link href={href}>
            <div className="statistic-card">
                 <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">{title}</h3>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{animatedValue}</div>
                </div>
            </div>
        </Link>
    );
};

function DonutChartCard({ title, data, config, description }: { title: string, data: any[], config: ChartConfig, description?: string }) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={config} className="mx-auto aspect-square h-full max-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie data={data} dataKey="count" nameKey="label" innerRadius="60%" strokeWidth={2}>
                 {data.map((entry) => (
                    <Cell key={`cell-${entry.label}`} fill={entry.fill} />
                  ))}
                 <Label
                    content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan x={viewBox.cx} y={viewBox.cy} className="text-3xl font-bold fill-foreground">
                                        {total.toLocaleString()}
                                    </tspan>
                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="text-sm fill-muted-foreground">
                                        Total
                                    </tspan>
                                </text>
                            );
                        }
                    }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
       <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex w-full items-center gap-2 font-medium leading-none">
          Visualización de la distribución.
        </div>
        <div className="flex w-full items-center gap-1 text-muted-foreground">
          {Object.entries(config).filter(([key]) => key !== 'count').map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: value.color }} />
              <span>{value.label}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}


function AdminDashboard({ stats }: { stats: AdminDashboardStats }) {
    const userRolesChartData = React.useMemo(() => {
        const order: ('STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR')[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
        return order.map(role => ({
            role: role,
            label: userRolesChartConfig[role]?.label || role,
            count: stats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role]?.color || 'hsl(var(--muted))'
        }));
    }, [stats.usersByRole]);
    
    const courseStatusChartData = React.useMemo(() => {
        if (!stats?.coursesByStatus) return [];
        const order: ('DRAFT' | 'PUBLISHED' | 'ARCHIVED')[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
        return order.map(status => ({
            status: status,
            label: courseStatusChartConfig[status]?.label || status,
            count: stats.coursesByStatus.find(item => item.status === status)?.count || 0,
            fill: courseStatusChartConfig[status]?.color || 'hsl(var(--muted))'
        }));
    }, [stats?.coursesByStatus]);


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold font-headline">Estadísticas de la Plataforma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <StatCard title="Total Usuarios" value={stats.totalUsers} icon={Users} href="/users" />
                <StatCard title="Total Cursos" value={stats.totalCourses} icon={BookOpenCheck} href="/manage-courses" />
                <StatCard title="Cursos Publicados" value={stats.totalPublishedCourses} icon={Activity} href="/manage-courses" />
                <StatCard title="Total Inscripciones" value={stats.totalEnrollments} icon={UsersRound} href="/enrollments" />
            </div>
             <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <DonutChartCard
                    title={<><Users className="text-primary" /> Distribución de Usuarios</>}
                    data={userRolesChartData}
                    config={userRolesChartConfig}
                    description="Proporción de cada rol en la plataforma."
                />
                <DonutChartCard
                    title={<><BookOpenCheck className="text-primary" /> Estado General de Cursos</>}
                    data={courseStatusChartData}
                    config={courseStatusChartConfig}
                    description="Distribución de los cursos según su estado."
                />
            </section>
        </div>
    );
}

export default function DashboardPage() {
  const { user, settings } = useAuth();
  const isMobile = useIsMobile();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showWelcome, setShowWelcome] = useState(false);

  const shouldSetup2fa = useMemo(() => {
    if (!settings || !user) return false;
    return settings.require2faForAdmins && user.role === 'ADMINISTRATOR' && !user.isTwoFactorEnabled;
  }, [settings, user]);
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
        const promises: Promise<any>[] = [fetch('/api/announcements')];
        
        if (user.role === 'ADMINISTRATOR') {
            promises.push(fetch('/api/dashboard/admin-stats'));
        }
        if (user.role === 'INSTRUCTOR') {
            const queryParams = new URLSearchParams({ manageView: 'true', userId: user.id, userRole: user.role });
            promises.push(fetch(`/api/courses?${queryParams.toString()}`));
        }
        if (user.role === 'STUDENT') {
            promises.push(fetch(`/api/enrollment/${user.id}`));
        }

        const responses = await Promise.all(promises);
        
        for (const res of responses) {
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Error en la petición: ${res.statusText}` }));
                throw new Error(errorData.message || 'Una de las peticiones de datos falló');
            }
        }
        
        const [announcementsRes, ...roleSpecificRes] = responses;
        const announcementsJson = await announcementsRes.json();
        const announcementsData = Array.isArray(announcementsJson) ? announcementsJson : announcementsJson.announcements || [];

        const dashboardPayload: DashboardData = {
            adminStats: null,
            studentStats: null,
            instructorStats: null,
            recentAnnouncements: announcementsData.map((ann: any) => ({
                ...ann,
                audience: ann.audience as any,
                author: ann.author ? { id: (ann.author as any).id, name: (ann.author as any).name } : null,
            })),
            taughtCourses: [],
            myDashboardCourses: [],
        };

        if (user.role === 'ADMINISTRATOR') {
            dashboardPayload.adminStats = await roleSpecificRes[0].json();
        } else if (user.role === 'INSTRUCTOR') {
            const taughtCoursesResponse = await roleSpecificRes[0].json();
            const taughtCoursesData = Array.isArray(taughtCoursesResponse) ? taughtCoursesResponse : (taughtCoursesResponse.courses || []);
            dashboardPayload.instructorStats = { taught: taughtCoursesData.length };
            dashboardPayload.taughtCourses = taughtCoursesData.map(mapApiCourseToAppCourse).slice(0, 4);
        } else if (user.role === 'STUDENT') {
            const enrolledData: any[] = await roleSpecificRes[0].json();
            const mappedCourses: EnrolledCourse[] = enrolledData.map(item => ({
              id: item.id, title: item.title, description: item.description, instructor: item.instructorName || 'N/A',
              imageUrl: item.imageUrl, modulesCount: item.modulesCount || 0, enrolledAt: item.enrolledAt, isEnrolled: true, instructorId: item.instructorId, status: 'PUBLISHED', modules: [],
              progressPercentage: item.progressPercentage || 0,
            }));
            const completedCount = mappedCourses.filter(c => c.progressPercentage === 100).length;
            dashboardPayload.studentStats = { enrolled: mappedCourses.length, completed: completedCount };
            dashboardPayload.myDashboardCourses = mappedCourses.slice(0, 4);
        }
        
        setData(dashboardPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
        const welcomeDismissed = localStorage.getItem(`welcomeDismissed_${user.id}`);
        if (!welcomeDismissed) {
            setShowWelcome(true);
        }
    }
  }, [user?.id]);
  
  const filteredAnnouncements = useMemo(() => {
    if (!user || !data?.recentAnnouncements) return [];
    return data.recentAnnouncements
      .filter(ann => {
        if (ann.audience === 'ALL') return true;
        if (Array.isArray(ann.audience) && ann.audience.includes(user.role)) return true;
        if (typeof ann.audience === 'string') { try { const parsed = JSON.parse(ann.audience); if (Array.isArray(parsed) && parsed.includes(user.role)) return true; } catch (e) {} }
        return false;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3); 
  }, [data?.recentAnnouncements, user]);

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Cargando...</div>;
  }
  
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
        <Alert className="relative bg-primary/10 border-primary/20 shadow-md mb-8">
             <Button variant="ghost" size="icon" onClick={handleDismissWelcome} className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-primary/20 z-10">
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
    
  const quickLinks = {
    ADMINISTRATOR: [
      { href: '/users', label: 'Gestionar Usuarios', icon: Users, description: 'Administra cuentas y roles.'},
      { href: '/manage-courses', label: 'Gestionar Cursos', icon: BookMarked, description: 'Crea y edita cursos.'},
      { href: '/analytics', label: 'Ver Analíticas', icon: BarChart3, description: 'Analiza el rendimiento.'},
      { href: '/settings', label: 'Configuración', icon: Settings, description: 'Ajusta la plataforma.'},
    ],
    INSTRUCTOR: [
      { href: '/manage-courses', label: 'Mis Cursos', icon: BookMarked, description: 'Diseña y actualiza tus cursos.'},
      { href: '/enrollments', label: 'Progreso Estudiantes', icon: TrendingUp, description: 'Supervisa el avance.'},
      { href: '/courses', label: 'Explorar Cursos', icon: BookOpen, description: 'Descubre nuevo contenido.'},
      { href: '/announcements', label: 'Anuncios', icon: Megaphone, description: 'Mantente al día.'},
    ],
    STUDENT: [
      { href: '/my-courses', label: 'Mis Cursos', icon: GraduationCap, description: 'Continúa tu aprendizaje.'},
      { href: '/courses', label: 'Explorar Cursos', icon: BookOpen, description: 'Descubre nuevas oportunidades.'},
      { href: '/resources', label: 'Biblioteca', icon: Folder, description: 'Accede a guías y materiales.'},
      { href: '/announcements', label: 'Anuncios', icon: Megaphone, description: 'Revisa las últimas noticias.'},
    ],
  };
  const linksToShow = quickLinks[user.role] || [];
  
  if (isLoading) {
      return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-80" />
                    <Skeleton className="h-64" />
                </div>
                <div className="lg:col-span-1"><Skeleton className="h-[400px]" /></div>
            </div>
        </div>
      )
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

  return (
    <div className="space-y-8">

      {showWelcome && <WelcomeGuide />}

      {shouldSetup2fa && (
        <Alert variant="destructive" className="mb-8">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acción de Seguridad Requerida</AlertTitle>
            <AlertDescription>
                La política de la plataforma requiere que todos los administradores usen autenticación de dos factores. 
                Por favor, <Link href="/profile" className="font-bold underline animated-underline">activa 2FA en tu perfil</Link> para asegurar tu cuenta.
            </AlertDescription>
        </Alert>
      )}

      {user.role === 'STUDENT' && data?.studentStats && (
        <section>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
                  <BookOpen className="h-5 w-5 text-chart-1" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.studentStats.enrolled}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
                  <CheckCircle className="h-5 w-5 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.studentStats.completed}</div>
                </CardContent>
              </Card>
            </div>
        </section>
      )}

      {user.role === 'INSTRUCTOR' && data?.instructorStats && (
         <section>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Impartidos</CardTitle>
                  <BookMarked className="h-5 w-5 text-chart-1" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.instructorStats.taught}</div>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
                  <Users className="h-5 w-5 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Próximamente</p>
                </CardContent>
              </Card>
            </div>
        </section>
      )}
      
      {user.role === 'ADMINISTRATOR' && data?.adminStats && <AdminDashboard stats={data.adminStats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {user.role === 'INSTRUCTOR' && (
              <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">Mis Cursos Impartidos Recientemente</h2>
                 {data?.taughtCourses && data.taughtCourses.length > 0 ? (
                  isMobile ? (
                    <CourseCarousel courses={data.taughtCourses.map(c => ({ ...c, isEnrolled: false, progressPercentage: 0, enrolledAt:'' }))} userRole={user.role} />
                  ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                      {data.taughtCourses.map(course => (
                        <Card key={course.id} className="shadow-sm hover:shadow-md transition-shadow">
                           {course.imageUrl && <div className="aspect-video relative w-full rounded-t-lg overflow-hidden"><Image src={course.imageUrl} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online learning teacher" sizes="(max-width: 768px) 100vw, 50vw"/></div>}
                          <CardHeader><CardTitle className="text-lg">{course.title}</CardTitle><CardDescription className="text-xs">{course.modulesCount} módulos. Estado: <span className="capitalize">{course.status.toLowerCase()}</span></CardDescription></CardHeader>
                          <CardFooter><Button asChild className="w-full" size="sm"><Link href={`/manage-courses/${course.id}/edit`}><Edit className="mr-2"/> Editar Curso</Link></Button></CardFooter>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No has creado cursos aún.</p></CardContent></Card>
                )}
              </section>
           )}

           {user.role === 'STUDENT' && (
              <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">Continuar Aprendiendo</h2>
                 {data?.myDashboardCourses && data.myDashboardCourses.length > 0 ? (
                   isMobile ? (
                     <CourseCarousel courses={data.myDashboardCourses} userRole={user.role} />
                   ) : (
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        {data.myDashboardCourses.map((course, index) => (
                          <CourseCard key={course.id} course={course} userRole={user.role} priority={index < 2}/>
                        ))}
                      </div>
                   )
                ) : (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No estás inscrito en ningún curso.</p></CardContent></Card>
                )}
              </section>
           )}
           
            <section>
              <h2 className="text-2xl font-semibold font-headline mb-4">Anuncios Recientes</h2>
              {filteredAnnouncements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAnnouncements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              ) : (
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
                   <GradientIcon icon={link.icon} size="lg"/>
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
