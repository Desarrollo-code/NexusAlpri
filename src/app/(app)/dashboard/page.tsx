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
  Loader2, 
  AlertTriangle, 
  BookOpenCheck, 
  GraduationCap,
  UsersRound,
  Activity,
  UserPlus,
  HelpCircle,
  Calendar as CalendarIcon,
  Bell,
  Trophy
} from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import type { AdminDashboardStats, EnrolledCourse, Course as AppCourseType, Announcement as AnnouncementType, CalendarEvent, UserRole } from '@/types';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from '@/components/course-card';
import { useTitle } from '@/contexts/title-context';
import { adminDashboardTour, studentDashboardTour, instructorDashboardTour } from '@/lib/tour-steps';
import { useTour } from '@/contexts/tour-context';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { es } from 'date-fns/locale';
import { format, isSameDay } from 'date-fns';
import { getEventColorClass } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// --- TYPE DEFINITIONS & MAPPERS ---
interface DashboardData {
    adminStats?: AdminDashboardStats;
    studentStats?: { enrolled: number; completed: number };
    instructorStats?: { taught: number; students: number };
    recentAnnouncements: AnnouncementType[];
    myDashboardCourses?: EnrolledCourse[];
    upcomingEvents?: CalendarEvent[];
    allCalendarEvents?: CalendarEvent[];
}

const MiniCalendar = ({ events }: { events: CalendarEvent[] }) => {
    console.log('[Dashboard Log] MiniCalendar renderizando con', events?.length || 0, 'eventos.');
    const [date, setDate] = React.useState<Date | undefined>(new Date());

    const eventsByDay = React.useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        if (!events) return map;
        events.forEach(event => {
            const dayKey = format(new Date(event.start), 'yyyy-MM-dd');
            if (!map.has(dayKey)) {
                map.set(dayKey, []);
            }
            map.get(dayKey)!.push(event);
        });
        return map;
    }, [events]);

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Calendario</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            locale={es}
            events={events}
            components={{
              DayContent: ({ date }) => {
                const dayKey = format(date, 'yyyy-MM-dd');
                const dayEvents = eventsByDay.get(dayKey);
                
                const content = (
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

                if (dayEvents) {
                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                {content}
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 space-y-2">
                                <p className="font-bold text-sm">{format(date, "EEEE, d 'de' MMMM", {locale: es})}</p>
                                {dayEvents.map(event => (
                                    <div key={event.id} className="text-xs flex items-start gap-2">
                                        <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", getEventColorClass(event.color))} />
                                        <div>
                                          <p className="font-semibold">{event.title}</p>
                                          {!event.allDay && <p className="text-muted-foreground">{format(new Date(event.start), 'p', {locale: es})}</p>}
                                        </div>
                                    </div>
                                ))}
                            </PopoverContent>
                        </Popover>
                    )
                }

                return content;
              }
            }}
          />
        </CardContent>
      </Card>
    );
};


const AnnouncementsList = ({ announcements }: { announcements: AnnouncementType[] }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Anuncios Recientes</CardTitle>
      </CardHeader>
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

const UpcomingEvents = ({ events }: { events: CalendarEvent[] }) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Próximos Eventos</h2>
    {events.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => (
          <Card key={event.id} className="hover:border-primary/50 transition-colors">
            <Link href="/calendar">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-primary">{format(new Date(event.start), "d MMM, p", {locale: es})}</p>
                <h3 className="font-semibold mt-1 truncate">{event.title}</h3>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{event.description}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    ) : (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
        <CalendarIcon className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="font-semibold">Sin eventos próximos</h3>
        <p className="text-sm text-muted-foreground">Tu calendario está despejado por ahora.</p>
      </Card>
    )}
  </div>
);


const RecentlyAccessed = ({ courses }: { courses: AppCourseType[] }) => (
    <div>
        <h2 className="text-xl font-semibold mb-4">Continuar Aprendiendo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.length > 0 ? (
                courses.map((course, index) => (
                    <CourseCard 
                        key={course.id} 
                        course={course} 
                        userRole="STUDENT"
                        priority={index < 3}
                    />
                ))
            ) : (
                 <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center border-dashed">
                    <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-semibold">Empieza tu viaje de aprendizaje</h3>
                    <p className="text-sm text-muted-foreground mb-4">No estás inscrito en ningún curso todavía.</p>
                    <Button asChild><Link href="/courses">Explorar Catálogo</Link></Button>
                 </Card>
            )}
        </div>
    </div>
);


function StudentDashboard({ data }: { data: DashboardData }) {
    console.log('[Dashboard Log] Renderizando StudentDashboard.');
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <MiniCalendar events={data.allCalendarEvents || []} />
                </div>
                <div className="lg:col-span-2">
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
            </div>
            <Separator />
            <UpcomingEvents events={data.upcomingEvents?.slice(0, 3) || []} />
            <Separator />
            <RecentlyAccessed courses={data.myDashboardCourses || []} />
        </div>
    );
}

function InstructorDashboard({ data }: { data: DashboardData }) {
     console.log('[Dashboard Log] Renderizando InstructorDashboard.');
     return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <MiniCalendar events={data.allCalendarEvents || []} />
                </div>
                <div className="lg:col-span-2">
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
            </div>
             <Separator />
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Card><CardHeader><CardTitle>Cursos Creados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data.instructorStats?.taught || 0}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Total Estudiantes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data.instructorStats?.students || 0}</p></CardContent></Card>
             </div>
             <Separator />
            <UpcomingEvents events={data.upcomingEvents?.slice(0, 3) || []} />
        </div>
    );
}

function AdminDashboard({ data }: { data: DashboardData }) {
    console.log('[Dashboard Log] Renderizando AdminDashboard.');
    const stats = data.adminStats;
    return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <MiniCalendar events={data.allCalendarEvents || []} />
                </div>
                <div className="lg:col-span-2">
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
            </div>
             <Separator />
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 <Card><CardHeader><CardTitle>Usuarios</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.totalUsers || 0}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Cursos</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.totalCourses || 0}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Inscripciones</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.totalEnrollments || 0}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Actividad (7d)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.recentLogins || 0}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Finalización</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.averageCompletionRate?.toFixed(0) || 0}%</p></CardContent></Card>
             </div>
             <Separator />
             <UpcomingEvents events={data.upcomingEvents?.slice(0, 3) || []} />
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
    if (!user) return;
    console.log(`[Dashboard Log] Iniciando tour para rol: ${user.role}`);
    if (user.role === 'ADMINISTRATOR') startTour('adminDashboard', adminDashboardTour);
    if (user.role === 'INSTRUCTOR') startTour('instructorDashboard', instructorDashboardTour);
    if (user.role === 'STUDENT') startTour('studentDashboard', studentDashboardTour);
  }, [setPageTitle, startTour, user]);
  
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
        const res = await fetch('/api/dashboard/data', { cache: 'no-store' });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: `Error ${res.status}` }));
            throw new Error(errorData.message || `Error al obtener datos del dashboard`);
        }
        const dashboardData = await res.json();
        console.log('[Dashboard Log] Datos recibidos de la API:', dashboardData);
        setData(dashboardData);
    } catch (err) {
      console.error('[Dashboard Log] Error capturado en fetchDashboardData:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener los datos del dashboard');
    } finally {
      console.log('[Dashboard Log] Proceso de obtención de datos finalizado.');
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('[Dashboard Log] Hook de efecto principal disparado.');
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading || !data) {
    console.log(`[Dashboard Log] Mostrando estado de carga. isLoading: ${isLoading}, data: ${!!data}`);
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-1 h-96" />
            <Skeleton className="lg:col-span-2 h-96" />
        </div>
        <Skeleton className="h-32 w-full"/>
         <Skeleton className="h-48 w-full"/>
      </div>
    );
  }
  
  if (error) {
    console.log(`[Dashboard Log] Mostrando estado de error: ${error}`);
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
    switch (user?.role) {
      case 'ADMINISTRATOR': return <AdminDashboard data={data} />;
      case 'INSTRUCTOR': return <InstructorDashboard data={data} />;
      case 'STUDENT': return <StudentDashboard data={data} />;
      default: 
        console.warn(`[Dashboard Log] Rol de usuario no reconocido: ${user?.role}`);
        return <p>Rol de usuario no reconocido.</p>;
    }
  };
  
  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    Hola, {user?.name}! 
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
