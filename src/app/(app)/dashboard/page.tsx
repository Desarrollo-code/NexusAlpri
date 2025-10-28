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
} from 'lucide-react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { AdminDashboardStats, EnrolledCourse, Course as AppCourseType, Announcement as AnnouncementType, CalendarEvent, UserRole } from '@/types';
import type { User as PrismaUser } from '@prisma/client';
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from '@/components/course-card';
import { useTitle } from '@/contexts/title-context';
import { adminDashboardTour, studentDashboardTour, instructorDashboardTour } from '@/lib/tour-steps';
import { useTour } from '@/contexts/tour-context';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { es } from 'date-fns/locale';
import { format, isSameDay, startOfDay, endOfDay, subDays, isValid, parseISO } from 'date-fns';
import { getEventColorClass, cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, Area, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { MetricCard } from '@/components/analytics/metric-card';
import { useToast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';
import { AlertTriangle, Loader2 } from 'lucide-react';


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
    securityLogs?: any[];
}


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

const MiniCalendar = ({ events, currentDate, onDateSelect }: { events: CalendarEvent[], currentDate: Date, onDateSelect: (date: Date) => void }) => {
    const { toast } = useToast();

    const eventsByDay = React.useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        if (!events) return map;
        events.forEach(event => {
            const dayKey = format(new Date(event.start), 'yyyy-MM-dd');
            if (!map.has(dayKey)) map.set(dayKey, []);
            map.get(dayKey)!.push(event);
        });
        return map;
    }, [events]);
    
    return (
      <Card className="h-full">
        <CardContent className="p-2 sm:p-4">
          <Calendar
            mode="single" selected={currentDate} onSelect={(day) => day && onDateSelect(day)}
            className="rounded-md" locale={es}
            components={{
              DayContent: ({ date }) => {
                const dayKey = format(date, 'yyyy-MM-dd');
                const dayEvents = eventsByDay.get(dayKey);
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span className="z-10">{format(date, 'd')}</span>
                    {dayEvents && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayEvents.slice(0, 3).map(event => (
                          <div key={event.id} className={cn('h-1.5 w-1.5 rounded-full', getEventColorClass(event.color))} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </CardContent>
      </Card>
    );
};

const AnnouncementsList = ({ announcements }: { announcements: AnnouncementType[] }) => (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-lg">Anuncios Recientes</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {announcements.length > 0 ? announcements.map(ann => (
          <Link href="/messages" key={ann.id} className="block group">
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={cn("w-1 h-10 rounded-full", getEventColorClass(ann.color || 'blue'))} />
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate group-hover:text-primary">{ann.title}</p>
                <p className="text-xs text-muted-foreground truncate">{ann.author?.name || 'Sistema'}</p>
              </div>
            </div>
          </Link>
        )) : <p className="text-center text-sm text-muted-foreground py-4">No hay anuncios recientes.</p>}
      </CardContent>
    </Card>
);

const InteractiveEventsWidget = ({ events, onParticipate }: { events: (CalendarEvent & { hasParticipated?: boolean })[], onParticipate: (eventId: string, occurrenceDate: string) => void }) => {
    if (!events || events.length === 0) return null;
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">¡Acciones del Día!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
                <Card key={event.id} className="bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Hand/> {event.title}</CardTitle></CardHeader>
                    <CardContent><p className="text-sm opacity-90">{event.description || 'Participa en esta actividad diaria.'}</p></CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full bg-white text-green-600 hover:bg-white/90"
                            onClick={() => onParticipate(event.parentId || event.id, event.start)}
                            disabled={event.hasParticipated}
                        >
                            {event.hasParticipated ? '¡Completado!' : '¡Participar ahora!'}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            </div>
        </div>
    )
}

const UpcomingEvents = ({ events }: { events: CalendarEvent[] }) => (
    <Card>
        <CardHeader>
             <CardTitle className="text-lg">Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
            {events.length > 0 ? (
                <div className="space-y-3">
                    {events.map(event => (
                        <Link href="/calendar" key={event.id} className="block group">
                           <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className={cn("w-1 h-full rounded-full", getEventColorClass(event.color || 'blue'))} />
                              <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate group-hover:text-primary">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(event.start), "d MMM, p", {locale: es})}</p>
                              </div>
                           </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border-dashed rounded-lg">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-semibold">Sin eventos próximos</h3>
                    <p className="text-sm text-muted-foreground">Tu calendario está despejado por ahora.</p>
                </div>
            )}
        </CardContent>
    </Card>
);

const RecentlyAccessed = ({ courses, assignedCourses }: { courses: AppCourseType[], assignedCourses: AppCourseType[] }) => (
    <div>
        {assignedCourses.length > 0 && (
            <div className="mb-8">
                 <h2 className="text-xl font-semibold mb-4">Cursos Obligatorios Asignados</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedCourses.map((course, index) => <CourseCard key={course.id} course={course} userRole="STUDENT" priority={index<2} />)}
                 </div>
            </div>
        )}
        <h2 className="text-xl font-semibold mb-4">Continuar Aprendiendo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.length > 0 ? (
                courses.map((course, index) => <CourseCard key={course.id} course={course} userRole="STUDENT" priority={index < 3}/>)
            ) : (
                 <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center border-dashed"><GraduationCap className="h-10 w-10 text-muted-foreground mb-2" /><h3 className="font-semibold">Empieza tu viaje de aprendizaje</h3><p className="text-sm text-muted-foreground mb-4">No estás inscrito en ningún curso todavía.</p><Button asChild><Link href="/courses">Explorar Catálogo</Link></Button></Card>
            )}
        </div>
    </div>
);


function StudentDashboard({ data, onParticipate }: { data: DashboardData, onParticipate: (eventId: string, occurrenceDate: string) => void }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    return (
        <div className="space-y-8">
            <InteractiveEventsWidget events={data.interactiveEventsToday || []} onParticipate={onParticipate} />
            {data.interactiveEventsToday && data.interactiveEventsToday.length > 0 && <Separator/>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1"><MiniCalendar events={data.allCalendarEvents || []} currentDate={selectedDate} onDateSelect={setSelectedDate} /></div>
                <div className="lg:col-span-2"><UpcomingEvents events={data.allCalendarEvents?.filter(e => isSameDay(new Date(e.start), selectedDate)).slice(0,3) || []} /></div>
            </div>
            <Separator />
            <RecentlyAccessed courses={data.myDashboardCourses || []} assignedCourses={data.assignedCourses || []} />
        </div>
    );
}

function InstructorDashboard({ data }: { data: DashboardData }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
     return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1"><MiniCalendar events={data.allCalendarEvents || []} currentDate={selectedDate} onDateSelect={setSelectedDate} /></div>
                <div className="lg:col-span-2"><UpcomingEvents events={data.allCalendarEvents?.filter(e => isSameDay(new Date(e.start), selectedDate)).slice(0,3) || []} /></div>
            </div>
             <Separator />
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Card><CardHeader><CardTitle>Cursos Creados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data.instructorStats?.taught || 0}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Total Estudiantes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data.instructorStats?.students || 0}</p></CardContent></Card>
             </div>
        </div>
    );
}

function AdminDashboard({ data, onParticipate }: { data: DashboardData, onParticipate: (eventId: string, occurrenceDate: string) => void }) {
    const stats = data.adminStats;
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div className="space-y-8">
            <InteractiveEventsWidget events={data.interactiveEventsToday || []} onParticipate={onParticipate} />
            {data.interactiveEventsToday && data.interactiveEventsToday.length > 0 && <Separator/>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mt-4">
                <MetricCard title="Total Usuarios" value={stats?.totalUsers || 0} icon={UsersRound} gradient="bg-gradient-blue" />
                <MetricCard title="Total Cursos" value={stats?.totalCourses || 0} icon={Layers} gradient="bg-gradient-green"/>
                <MetricCard title="Inscripciones" value={stats?.totalEnrollments || 0} icon={GraduationCap} gradient="bg-gradient-purple" />
                <MetricCard title="Finalización" value={stats?.averageCompletionRate || 0} icon={BadgePercent} suffix="%" description="Promedio" gradient="bg-gradient-orange" />
            </div>
             <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Actividad Reciente en la Plataforma</CardTitle>
                    <CardDescription>Evolución de usuarios, cursos e inscripciones en el periodo seleccionado.</CardDescription>
                </CardHeader>
                <CardContent className="h-80 pr-4 -ml-4">
                     <ChartContainer config={{ newCourses: { label: "Nuevos Cursos", color: "hsl(var(--chart-2))" }, newUsers: { label: "Nuevos Usuarios", color: "hsl(var(--chart-1))" }, newEnrollments: { label: "Inscripciones", color: "hsl(var(--chart-3))" }}} className="w-full h-full">
                        <ResponsiveContainer>
                           <ComposedChart data={stats?.userRegistrationTrend || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={true} tickMargin={10} tickFormatter={formatDateTick} interval={'preserveStartEnd'} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={true} tickMargin={10} width={30}/>
                                <ChartTooltip cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} content={<ChartTooltipContent indicator="dot" labelFormatter={formatDateTooltip} />} />
                                <Legend />
                                <Bar dataKey="newCourses" name="Nuevos Cursos" fill="var(--color-newCourses)" radius={4} />
                                <Line type="monotone" dataKey="newUsers" name="Nuevos Usuarios" stroke="var(--color-newUsers)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="newEnrollments" name="Inscripciones" fill="var(--color-newEnrollments)" stroke="var(--color-newEnrollments)" strokeWidth={2} fillOpacity={0.3} dot={false}/>
                           </ComposedChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <MiniCalendar events={data.allCalendarEvents || []} currentDate={selectedDate} onDateSelect={setSelectedDate} />
                    <UpcomingEvents events={data.allCalendarEvents?.filter(e => isSameDay(new Date(e.start), selectedDate)).slice(0,3) || []} />
                </div>
                <div className="lg:col-span-2">
                     <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
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
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  });

  const handleShowTour = () => {
    if (!user) return;
    if (user.role === 'ADMINISTRATOR') forceStartTour('adminDashboard', adminDashboardTour);
    if (user.role === 'INSTRUCTOR') forceStartTour('instructorDashboard', instructorDashboardTour);
    if (user.role === 'STUDENT') forceStartTour('studentDashboard', studentDashboardTour);
  }

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    console.log('[Dashboard Log] Empezando a obtener datos del dashboard...');
    setIsLoading(true);
    setError(null);
    try {
        const params = new URLSearchParams();
        if (dateRange?.from) params.set('startDate', dateRange.from.toISOString());
        if (dateRange?.to) params.set('endDate', dateRange.to.toISOString());

        const res = await fetch(`/api/dashboard/data?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: `Error ${res.status}` }));
            throw new Error(errorData.message || `Error al obtener datos del dashboard`);
        }
        const dashboardData = await res.json();
        console.log('[Dashboard Log] Datos recibidos de la API:', dashboardData);
        setData(dashboardData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener los datos del dashboard';
      console.error('[Dashboard Log] Error en fetch:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('[Dashboard Log] Proceso de obtención de datos finalizado.');
      setIsLoading(false);
    }
  }, [user, dateRange]);
  
  const handleParticipate = async (eventId: string, occurrenceDate: string) => {
      try {
          const res = await fetch('/api/events/participate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventId, occurrenceDate }),
          });
          if (!res.ok) throw new Error((await res.json()).message || 'No se pudo registrar la participación.');
          toast({ title: "¡Participación Registrada!", description: "Has ganado puntos de experiencia. ¡Bien hecho!" });
          setData(prev => prev ? ({ ...prev, adminStats: { ...prev.adminStats!, interactiveEventsToday: prev.adminStats!.interactiveEventsToday?.map(e => e.id === eventId || e.parentId === eventId ? { ...e, hasParticipated: true } : e) } }) : null);
      } catch (err) {
          toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
      }
  };


  useEffect(() => {
    setPageTitle('Panel Principal');
    if (!user) return;
    
    const tourKey = user.role === 'ADMINISTRATOR' ? 'adminDashboard' : (user.role === 'INSTRUCTOR' ? 'instructorDashboard' : 'studentDashboard');
    const tourSteps = user.role === 'ADMINISTRATOR' ? adminDashboardTour : (user.role === 'INSTRUCTOR' ? instructorDashboardTour : studentDashboardTour);
    
    console.log(`[Dashboard Log] Iniciando tour para rol: ${user.role}`);
    startTour(tourKey, tourSteps);
  }, [setPageTitle, startTour, user]);


  useEffect(() => {
    console.log('[Dashboard Log] Hook de efecto principal disparado.');
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading || !data) {
    console.log(`[Dashboard Log] Mostrando estado de carga. isLoading: ${isLoading}, data: ${!!data}`);
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-80 w-full"/>
                <Skeleton className="h-48 w-full"/>
            </div>
            <div className="space-y-6">
                 <Skeleton className="h-72 w-full"/>
                 <Skeleton className="h-56 w-full"/>
            </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">Error al Cargar Dashboard</p><p className="text-sm">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline" className="mt-4">Reintentar</Button>
        </div>
    )
  }

  const renderContentForRole = () => {
    switch (user?.role) {
      case 'ADMINISTRATOR':
        console.log('[Dashboard Log] Renderizando AdminDashboard.');
        return <AdminDashboard data={data} onParticipate={handleParticipate} />;
      case 'INSTRUCTOR':
        console.log('[Dashboard Log] Renderizando InstructorDashboard.');
        return <InstructorDashboard data={data} />;
      case 'STUDENT':
        console.log('[Dashboard Log] Renderizando StudentDashboard.');
        return <StudentDashboard data={data} onParticipate={handleParticipate} />;
      default: return <p>Rol de usuario no reconocido.</p>;
    }
  };
  
  return (
    <div className="space-y-8">
       <div className="relative p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                    <p className="text-primary-foreground/80">Bienvenido de nuevo a tu centro de aprendizaje y gestión.</p>
                </div>
                 <div className="flex items-center gap-2">
                   {user?.role === 'ADMINISTRATOR' && <DateRangePicker date={dateRange} onDateChange={setDateRange}/>}
                    <Button variant="outline" size="sm" onClick={handleShowTour} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                        <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                    </Button>
                 </div>
            </div>
        </div>
      
      {renderContentForRole()}

    </div>
  );
}
