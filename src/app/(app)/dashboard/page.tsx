

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
  AreaChart,
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
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area as RechartsArea, Pie, PieChart, ResponsiveContainer, Cell, Label, XAxis, YAxis, Sector, CartesianGrid } from "recharts";
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


// --- DASHBOARD COMPONENTS PER ROLE ---

const MetricCard = ({ title, value: finalValue, icon: Icon, description }: { title: string; value: number; icon: React.ElementType; description?: string }) => {
    const animatedValue = useAnimatedCounter(finalValue);
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{animatedValue}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
};

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 11;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={4} textAnchor="middle" fill={fill} className="text-base font-bold">
        {payload.label}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
       <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
       <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
       <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 6} dy="-0.5em">{value}</tspan>
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 6} dy="1em">{`(${(percent * 100).toFixed(0)}%)`}</tspan>
      </text>
    </g>
  );
};


function DonutChartCard({ title, data, config }: { title: string, data: any[], config: ChartConfig }) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, [setActiveIndex]);
  
  return (
    <Card className="card-border-animated">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie 
                data={data} 
                dataKey="count" 
                nameKey="label" 
                innerRadius={60} 
                strokeWidth={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                className="cursor-pointer"
              >
                 {data.map((entry) => (
                    <Cell key={`cell-${entry.label}`} fill={entry.fill} />
                  ))}
                 {activeIndex === undefined && (
                    <Label
                        content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                        <tspan x={viewBox.cx} y={viewBox.cy} className="text-2xl font-bold fill-foreground">
                                            {total.toLocaleString()}
                                        </tspan>
                                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="text-xs fill-muted-foreground">
                                            Total
                                        </tspan>
                                    </text>
                                );
                            }
                        }}
                    />
                 )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function AdminDashboard({ stats }: { stats: AdminDashboardStats }) {
    const userRolesChartData = useMemo(() => {
        if (!stats?.usersByRole) return [];
        const order: ('STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR')[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
        return order.map(role => ({
            role: role,
            label: userRolesChartConfig[role]?.label || role,
            count: stats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role]?.color || 'hsl(var(--muted))'
        }));
    }, [stats.usersByRole]);
    
    const registrationTrendChartConfig = {
      count: {
        label: "Nuevos Usuarios",
        color: "hsl(var(--chart-2))",
      },
    } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Resumen de la Plataforma</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <MetricCard title="Total Usuarios" value={stats.totalUsers} icon={UsersRound} />
            <MetricCard title="Total Cursos" value={stats.totalCourses} icon={BookOpenCheck} />
            <MetricCard title="Usuarios Activos" value={stats.recentLogins} icon={Activity} description="En los últimos 7 días" />
            <MetricCard title="Nuevos Usuarios" value={stats.newUsersLast7Days} icon={UserPlus} description="En los últimos 7 días"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DonutChartCard title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
            <Card className="lg:col-span-2 card-border-animated">
            <CardHeader>
                <CardTitle>Tendencia de Registros (Últimos 7 Días)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                    <ChartContainer config={registrationTrendChartConfig} className="w-full h-full">
                    <RechartsArea
                        data={stats.userRegistrationTrend}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)}/>
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}/>
                        <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                        <RechartsArea dataKey="count" type="monotone" fill="var(--color-count)" fillOpacity={0.4} stroke="var(--color-count)" />
                    </RechartsArea>
                    </ChartContainer>
            </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shouldSetup2fa = useMemo(() => {
    // This logic depends on settings, which are not part of this component's state.
    // Assuming a simplified check for now.
    return user?.role === 'ADMINISTRATOR' && !user.isTwoFactorEnabled;
  }, [user]);
  
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Hola, {user.name}! 👋</h1>
          <p className="text-muted-foreground">Bienvenido de nuevo a tu plataforma de aprendizaje.</p>
        </div>
      </div>

      {shouldSetup2fa && (
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acción de Seguridad Requerida</AlertTitle>
            <AlertDescription>
                La política de la plataforma requiere que todos los administradores usen autenticación de dos factores. 
                Por favor, <Link href="/profile" className="font-bold underline">activa 2FA en tu perfil</Link> para asegurar tu cuenta.
            </AlertDescription>
        </Alert>
      )}

      {user.role === 'STUDENT' && data?.studentStats && (
        <section>
            <h2 className="text-2xl font-semibold mb-4">Tu Progreso</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.studentStats.enrolled}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
            <h2 className="text-2xl font-semibold mb-4">Resumen de Instructor</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Impartidos</CardTitle>
                  <BookMarked className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.instructorStats.taught}</div>
                </CardContent>
              </Card>
               <Card>
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
      )}
      
      {user.role === 'ADMINISTRATOR' && data?.adminStats && <AdminDashboard stats={data.adminStats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {user.role === 'INSTRUCTOR' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Mis Cursos Impartidos Recientemente</h2>
                 {data?.taughtCourses && data.taughtCourses.length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                      {data.taughtCourses.map(course => (
                        <Card key={course.id} className="shadow-sm hover:shadow-md transition-shadow">
                           {course.imageUrl && <div className="aspect-video relative w-full rounded-t-lg overflow-hidden"><Image src={course.imageUrl} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online learning teacher" sizes="(max-width: 768px) 100vw, 50vw"/></div>}
                          <CardHeader><CardTitle className="text-lg">{course.title}</CardTitle><CardDescription className="text-xs">{course.modulesCount} módulos. Estado: <span className="capitalize">{course.status.toLowerCase()}</span></CardDescription></CardHeader>
                          <CardFooter><Button asChild className="w-full" size="sm"><Link href={`/manage-courses/${course.id}/edit`}><Edit className="mr-2"/> Editar Contenido</Link></Button></CardFooter>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No has creado cursos aún.</p></CardContent></Card>
                )}
              </section>
           )}

           {user.role === 'STUDENT' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Continuar Aprendiendo</h2>
                 {data?.myDashboardCourses && data.myDashboardCourses.length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {data.myDashboardCourses.map((course, index) => (
                      <CourseCard key={course.id} course={course} userRole={user.role} priority={index < 2}/>
                    ))}
                  </div>
                ) : (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground"><p>No estás inscrito en ningún curso.</p></CardContent></Card>
                )}
              </section>
           )}
           
            <section>
              <h2 className="text-2xl font-semibold mb-4">Anuncios Recientes</h2>
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
           <Card>
             <CardHeader>
               <CardTitle>Accesos Rápidos</CardTitle>
             </CardHeader>
             <CardContent>
               <ul className="space-y-3">
                 <li>
                   <Link href="/courses" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                     <span className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary"/>Catálogo de Cursos</span>
                     <ArrowRight className="h-4 w-4 text-muted-foreground" />
                   </Link>
                 </li>
                 <li>
                   <Link href="/my-courses" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                     <span className="flex items-center gap-3"><GraduationCap className="h-5 w-5 text-primary"/>Mis Cursos</span>
                     <ArrowRight className="h-4 w-4 text-muted-foreground" />
                   </Link>
                 </li>
                 {(user.role === 'ADMINISTRATOR' || user.role === 'INSTRUCTOR') && (
                     <li>
                        <Link href="/manage-courses" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                            <span className="flex items-center gap-3"><BookMarked className="h-5 w-5 text-primary"/>Gestionar Cursos</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                     </li>
                 )}
                 {user.role === 'ADMINISTRATOR' && (
                     <li>
                        <Link href="/users" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                            <span className="flex items-center gap-3"><Users className="h-5 w-5 text-primary"/>Gestionar Usuarios</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                     </li>
                 )}
                 {user.role === 'ADMINISTRATOR' && (
                     <li>
                        <Link href="/settings" className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                            <span className="flex items-center gap-3"><Settings className="h-5 w-5 text-primary"/>Configuración</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                     </li>
                 )}
               </ul>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
