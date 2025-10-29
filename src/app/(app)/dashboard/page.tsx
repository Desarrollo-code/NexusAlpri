
// src/app/(app)/dashboard/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowRight,
  BookOpenCheck, 
  GraduationCap,
  UsersRound,
  FileText,
  BadgePercent,
  Hand,
  Layers,
  HelpCircle,
  Calendar as CalendarIcon,
  Bell,
  Trophy,
  Folder,
  Megaphone,
  LineChart,
  Settings,
  ShieldAlert,
  Users,
  BookMarked
} from 'lucide-react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { AdminDashboardStats, EnrolledCourse, Course as AppCourseType, Announcement as AnnouncementType, CalendarEvent, UserRole, SecurityLog } from '@/types';
import type { User as PrismaUser } from '@prisma/client';
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from '@/components/course-card';
import { useTitle } from '@/contexts/title-context';
import { adminDashboardTour, studentDashboardTour, instructorDashboardTour } from '@/lib/tour-steps';
import { useTour } from '@/contexts/tour-context';
import { es } from 'date-fns/locale';
import { format, isSameDay, startOfDay, endOfDay, subDays, isValid, parseISO, addMonths, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, Area, Line, PieChart, Pie, Cell, Sector } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { MetricCard } from '@/components/analytics/metric-card';
import { useToast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import Image from 'next/image';
import { expandRecurringEvents } from '@/lib/calendar-utils';
import { Calendar } from '@/components/ui/calendar';
import { useRouter } from 'next/navigation';
import { DonutChart } from '@/components/analytics/donut-chart';
import { AtRiskUsersCard } from '@/components/security/at-risk-users-card';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';

// --- TYPE DEFINITIONS ---
interface DashboardData {
    adminStats?: AdminDashboardStats;
    studentStats?: { enrolled: number; completed: number };
    instructorStats?: { taught: number; students: number };
    recentAnnouncements: AnnouncementType[];
    myDashboardCourses?: EnrolledCourse[];
    upcomingEvents?: CalendarEvent[];
    allCalendarEvents?: CalendarEvent[];
    assignedCourses?: AppCourseType[];
    interactiveEventsToday?: (CalendarEvent & { hasParticipated?: boolean })[];
    securityLogs?: SecurityLog[];
}


// --- UTILITY & HELPER FUNCTIONS ---
const formatDateTick = (tick: string): string => {
  const date = parseISO(tick);
  if (!isValid(date)) return tick;
  if (date.getDate() === 1) return format(date, "d MMM", { locale: es });
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

const userRolesChartConfig = {
    count: { label: "Usuarios" },
    STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
    INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
    ADMINISTRATOR: { label: "Administradores", color: "hsl(var(--chart-3))" },
};

const courseStatusChartConfig = {
    count: { label: "Cursos" },
    DRAFT: { label: "Borrador", color: "hsl(var(--chart-4))" },
    PUBLISHED: { label: "Publicado", color: "hsl(var(--chart-1))" },
    ARCHIVED: { label: "Archivado", color: "hsl(var(--chart-5))" },
};


// --- REUSABLE WIDGETS ---

const MiniCalendar = ({ events, currentDate, onDateSelect }: { events: CalendarEvent[], currentDate: Date, onDateSelect: (date: Date) => void }) => (
    <Card className="h-full">
        <CardContent className="p-1">
            <Calendar mode="single" selected={currentDate} onSelect={(day) => day && onDateSelect(day)} className="rounded-md" locale={es} events={events} />
        </CardContent>
    </Card>
);

const AnnouncementsList = ({ announcements }: { announcements: AnnouncementType[] }) => (
    <Card className="h-full">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary"/>Anuncios Recientes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
            {announcements.length > 0 ? announcements.map(ann => (
                <Link href="/messages" key={ann.id} className="block group"><div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"><div className="w-1.5 h-10 rounded-full shrink-0 bg-primary/70"/><div className="overflow-hidden"><p className="font-semibold text-sm truncate group-hover:text-primary">{ann.title}</p><p className="text-xs text-muted-foreground truncate">{ann.author?.name || 'Sistema'}</p></div></div></Link>
            )) : <p className="text-center text-sm text-muted-foreground py-4">No hay anuncios recientes.</p>}
        </CardContent>
    </Card>
);

const InteractiveEventsWidget = ({ events, onParticipate }: { events: (CalendarEvent & { hasParticipated?: boolean })[], onParticipate: (eventId: string, occurrenceDate: string) => void }) => {
    if (!events || events.length === 0) return null;
    return (
        <div className="space-y-4">
            {events.map(event => (
                <Card key={event.id} className="bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg">
                    <CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><CardTitle className="text-base flex items-center gap-2"><Hand/> {event.title}</CardTitle><p className="text-sm opacity-90">{event.description || 'Confirma tu participación para ganar puntos.'}</p></div><Button className="bg-white text-green-600 hover:bg-white/90" onClick={() => onParticipate(event.parentId || event.id, event.start)} disabled={event.hasParticipated}>{event.hasParticipated ? '¡Completado!' : '¡Confirmar!'}</Button></CardContent>
                </Card>
            ))}
        </div>
    );
};

const UpcomingEvents = ({ events }: { events: CalendarEvent[] }) => (
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary"/>Próximos Eventos</CardTitle></CardHeader><CardContent>{events.length > 0 ? (<div className="space-y-3">{events.map(event => (<Link href="/calendar" key={event.id} className="block group"><div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"><div className="w-1.5 h-full rounded-full bg-primary" /><div className="overflow-hidden"><p className="font-semibold text-sm truncate group-hover:text-primary">{event.title}</p><p className="text-xs text-muted-foreground">{format(new Date(event.start), "d MMM, p", {locale: es})}</p></div></div></Link>))}</div>) : (<div className="flex flex-col items-center justify-center p-4 text-center"><p className="text-sm text-muted-foreground">No hay eventos próximos.</p></div>)}</CardContent></Card>
);

const RecentlyAccessed = ({ courses, assignedCourses, onEnrollmentChange }: { courses: EnrolledCourse[], assignedCourses: AppCourseType[], onEnrollmentChange: (courseId: string, status: boolean) => void }) => (
    <div>
        {assignedCourses.length > 0 && (
            <div className="mb-8">
                 <h2 className="text-xl font-semibold mb-4">Cursos Obligatorios Asignados</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedCourses.map((course, index) => <CourseCard key={course.id} course={course} userRole="STUDENT" priority={index<2} onEnrollmentChange={onEnrollmentChange} />)}
                 </div>
            </div>
        )}
        <h2 className="text-xl font-semibold mb-4">Continuar Aprendiendo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.length > 0 ? (
                courses.map((course, index) => <CourseCard key={course.id} course={course as AppCourseType} userRole="STUDENT" priority={index < 3} onEnrollmentChange={onEnrollmentChange}/>)
            ) : (
                 <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center border-dashed"><GraduationCap className="h-10 w-10 text-muted-foreground mb-2" /><h3 className="font-semibold">Empieza tu viaje de aprendizaje</h3><p className="text-sm text-muted-foreground mb-4">No estás inscrito en ningún curso todavía.</p><Button asChild><Link href="/courses">Explorar Catálogo</Link></Button></Card>
            )}
        </div>
    </div>
);


// --- ROLE-SPECIFIC DASHBOARDS ---

function StudentDashboard({ data, onParticipate, onEnrollmentChange }: { data: DashboardData, onParticipate: (eventId: string, occurrenceDate: string) => void, onEnrollmentChange: (courseId: string, status: boolean) => void }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    return (
        <div className="space-y-8">
            <InteractiveEventsWidget events={data.interactiveEventsToday || []} onParticipate={onParticipate} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <MetricCard title="Cursos Inscritos" value={data.studentStats?.enrolled || 0} icon={GraduationCap} gradient="bg-gradient-blue" />
                 <MetricCard title="Cursos Completados" value={data.studentStats?.completed || 0} icon={BookOpenCheck} gradient="bg-gradient-green" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-8">
                    <RecentlyAccessed courses={data.myDashboardCourses || []} assignedCourses={data.assignedCourses || []} onEnrollmentChange={onEnrollmentChange} />
                 </div>
                 <div className="lg:col-span-1 space-y-6">
                    <MiniCalendar events={data.allCalendarEvents || []} currentDate={selectedDate} onDateSelect={setSelectedDate} />
                    <UpcomingEvents events={data.upcomingEvents || []} />
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                 </div>
             </div>
        </div>
    );
}

function InstructorDashboard({ data }: { data: DashboardData }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const router = useRouter();
    return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <MetricCard title="Cursos Creados" value={data.instructorStats?.taught || 0} icon={Layers} gradient="bg-gradient-blue" />
                 <MetricCard title="Total Estudiantes" value={data.instructorStats?.students || 0} icon={UsersRound} gradient="bg-gradient-green" />
             </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Accesos Rápidos</CardTitle></CardHeader>
                         <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button asChild variant="outline" className="h-14 justify-start p-4 text-left"><Link href="/manage-courses"><Layers className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Gestionar Cursos</p><p className="text-xs text-muted-foreground">Editar y crear contenido</p></div></Link></Button>
                             <Button asChild variant="outline" className="h-14 justify-start p-4 text-left"><Link href="/enrollments"><UsersRound className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Ver Inscritos</p><p className="text-xs text-muted-foreground">Seguimiento de alumnos</p></div></Link></Button>
                         </CardContent>
                    </Card>
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
                 <div className="lg:col-span-1 space-y-6">
                    <MiniCalendar events={data.allCalendarEvents || []} currentDate={selectedDate} onDateSelect={setSelectedDate} />
                    <UpcomingEvents events={data.upcomingEvents || []} />
                </div>
            </div>
        </div>
    );
}

function AdminDashboard({ data, onParticipate, onSuspendUser }: { data: DashboardData, onParticipate: (eventId: string, occurrenceDate: string) => void, onSuspendUser: (user: any) => void }) {
    const stats = data.adminStats;
    const router = useRouter();
    
    const userRolesChartData = useMemo(() => {
        if (!stats?.usersByRole) return [];
        return ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'].map(role => ({
            role: role,
            label: userRolesChartConfig[role as 'STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR']?.label || role,
            count: stats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role as 'STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR']?.color || 'hsl(var(--muted))'
        })).filter(item => item.count > 0);
    }, [stats?.usersByRole]);
    const courseStatusChartData = useMemo(() => {
        if (!stats?.coursesByStatus) return [];
        return ['DRAFT', 'PUBLISHED', 'ARCHIVED'].map(status => ({
            status: status,
            label: courseStatusChartConfig[status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED']?.label || status,
            count: stats.coursesByStatus.find(item => item.status === status)?.count || 0,
            fill: courseStatusChartConfig[status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED']?.color || 'hsl(var(--muted))'
        })).filter(item => item.count > 0);
    }, [stats?.coursesByStatus]);

    return (
        <div className="space-y-6">
            <InteractiveEventsWidget events={data.interactiveEventsToday || []} onParticipate={onParticipate} />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Usuarios Totales" value={stats?.totalUsers || 0} icon={UsersRound} gradient="bg-gradient-blue" trendData={stats?.userRegistrationTrend || []} dataKey="newUsers"/>
                <MetricCard title="Cursos Totales" value={stats?.totalCourses || 0} icon={Layers} gradient="bg-gradient-green" trendData={stats?.userRegistrationTrend || []} dataKey="newCourses"/>
                <MetricCard title="Inscripciones" value={stats?.totalEnrollments || 0} icon={GraduationCap} gradient="bg-gradient-purple" trendData={stats?.userRegistrationTrend || []} dataKey="newEnrollments"/>
                <MetricCard title="Finalización" value={stats?.averageCompletionRate || 0} icon={BadgePercent} suffix="%" description="Promedio" gradient="bg-gradient-orange" />
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                <Card className="lg:col-span-2 xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Tendencia de Actividad</CardTitle>
                        <CardDescription>Actividad en el rango de fechas seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 pr-4 -ml-4">
                        <ChartContainer config={{ newCourses: { label: "Cursos", color: "hsl(var(--chart-2))" }, newUsers: { label: "Usuarios", color: "hsl(var(--chart-1))" }, newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-3))" }}} className="w-full h-full">
                            <ResponsiveContainer>
                                <ComposedChart data={stats?.userRegistrationTrend || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={true} tickMargin={10} tickFormatter={formatDateTick} interval={'preserveStartEnd'} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={true} tickMargin={10} width={30}/>
                                    <ChartTooltip cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                                    <Legend />
                                    <Bar dataKey="newUsers" name="Usuarios" fill="var(--color-newUsers)" radius={4} />
                                    <Area type="monotone" dataKey="newEnrollments" name="Inscripciones" fill="var(--color-newEnrollments)" stroke="var(--color-newEnrollments)" strokeWidth={2} fillOpacity={0.3} dot={false}/>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <DonutChart title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
                    <DonutChart title="Estado de Cursos" data={courseStatusChartData} config={courseStatusChartConfig} />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DeviceDistributionChart browserData={stats?.browsers} osData={stats?.os} isLoading={false}/>
                    <AtRiskUsersCard users={stats?.atRiskUsers || []} onSuspend={onSuspendUser} isLoading={false} />
                </div>
                 <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Accesos Rápidos</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Button asChild variant="outline"><Link href="/manage-courses"><BookMarked className="mr-2 h-4 w-4"/>Cursos</Link></Button>
                            <Button asChild variant="outline"><Link href="/users"><Users className="mr-2 h-4 w-4"/>Usuarios</Link></Button>
                            <Button asChild variant="outline"><Link href="/settings"><Settings className="mr-2 h-4 w-4"/>Ajustes</Link></Button>
                            <Button asChild variant="outline"><Link href="/analytics"><LineChart className="mr-2 h-4 w-4"/>Analíticas</Link></Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Actividad de Seguridad Reciente</CardTitle></CardHeader>
                        <CardContent><SecurityLogTimeline logs={data.securityLogs || []} onLogClick={() => router.push('/security-audit')} /></CardContent>
                    </Card>
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
            </div>
        </div>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function DashboardPage() {
  const { user, settings } = useAuth();
  const { setPageTitle } = useTitle();
  const router = useRouter();
  const { startTour } = useTour();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
        const params = new URLSearchParams();
        if (dateRange?.from) params.set('startDate', dateRange.from.toISOString());
        if (dateRange?.to) params.set('endDate', dateRange.to.toISOString());

        const res = await fetch(`/api/dashboard/data?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Error al obtener datos`);
        setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    setPageTitle('Panel Principal');
    if (!user) return;
    const tourKeyMap = { ADMINISTRATOR: 'adminDashboard', INSTRUCTOR: 'instructorDashboard', STUDENT: 'studentDashboard' };
    const tourStepsMap = { ADMINISTRATOR: adminDashboardTour, INSTRUCTOR: instructorDashboardTour, STUDENT: studentDashboardTour };
    startTour(tourKeyMap[user.role], tourStepsMap[user.role]);
  }, [setPageTitle, startTour, user]);
  
  const handleParticipate = async (eventId: string, occurrenceDate: string) => {
      try {
          const res = await fetch('/api/events/participate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, occurrenceDate }) });
          if (!res.ok) throw new Error((await res.json()).message || 'No se pudo registrar la participación.');
          toast({ title: "¡Participación Registrada!", description: "Has ganado puntos de experiencia. ¡Bien hecho!" });
          fetchDashboardData();
      } catch (err) {
          toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
      }
  };

  const handleSuspendUser = (userToSuspend: any) => {
    // Implementar la lógica o modal de suspensión aquí si es necesario
    console.log("Suspender usuario:", userToSuspend);
    toast({ title: "Acción requerida", description: `Considera suspender al usuario ${userToSuspend.name} desde la página de auditoría.`})
  }

  const renderContentForRole = () => {
    if (!user || !data) return null;
    const commonProps = { data, onParticipate: handleParticipate, onEnrollmentChange: fetchDashboardData };
    switch (user?.role) {
      case 'ADMINISTRATOR': return <AdminDashboard data={data} onParticipate={handleParticipate} onSuspendUser={handleSuspendUser} />;
      case 'INSTRUCTOR': return <InstructorDashboard {...commonProps} />;
      case 'STUDENT': return <StudentDashboard {...commonProps} />;
      default: return <p>Rol de usuario no reconocido.</p>;
    }
  };
  
  return (
    <div className="space-y-8">
       <div className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-500 to-indigo-600 text-white shadow-lg">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                    <p className="text-white/80">Bienvenido de nuevo a tu centro de aprendizaje y gestión.</p>
                </div>
                {user?.role === 'ADMINISTRATOR' && (
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                )}
                 <div className="flex-shrink-0 w-32 h-32 hidden md:block">
                     {settings?.securityMascotUrl && <Image src={settings.securityMascotUrl} alt="Mascota" width={128} height={128} data-ai-hint="friendly mascot" />}
                 </div>
            </div>
        </div>
      
      {isLoading ? (
        <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6"><Skeleton className="h-80 w-full"/><Skeleton className="h-48 w-full"/></div>
                <div className="space-y-6"><Skeleton className="h-72 w-full"/><Skeleton className="h-56 w-full"/></div>
            </div>
        </div>
      ) : error ? (
        <div className="text-center py-10"><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><p className="mt-2 font-semibold text-destructive">{error}</p></div>
      ) : renderContentForRole()}
    </div>
  );
}
