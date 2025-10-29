// src/app/(app)/dashboard/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  BookOpenCheck, 
  GraduationCap,
  UsersRound,
  Layers,
  HelpCircle,
  Calendar as CalendarIcon,
  Megaphone,
  LineChart,
  Settings,
  ShieldAlert,
  Users,
  BookMarked,
  Hand,
  Trophy,
  Activity,
  Mail,
  Database
} from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import type { AdminDashboardStats, EnrolledCourse, Course as AppCourseType, Announcement as AnnouncementType, CalendarEvent, UserRole, SecurityLog } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from '@/components/course-card';
import { useTitle } from '@/contexts/title-context';
import { adminDashboardTour, studentDashboardTour, instructorDashboardTour } from '@/lib/tour-steps';
import { useTour } from '@/contexts/tour-context';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/analytics/metric-card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import Image from 'next/image';
import { expandRecurringEvents } from '@/lib/calendar-utils';
import { Calendar } from '@/components/ui/calendar';
import { useRouter } from 'next/navigation';
import { CourseCarousel } from '@/components/course-carousel';
import { AtRiskUsersCard } from '@/components/security/at-risk-users-card';

// --- TYPE DEFINITIONS ---
interface DashboardData {
    adminStats?: AdminDashboardStats;
    studentStats?: { enrolled: number; completed: number };
    instructorStats?: { taught: number; students: number };
    recentAnnouncements?: AnnouncementType[];
    myDashboardCourses?: EnrolledCourse[];
    allCalendarEvents?: CalendarEvent[];
    assignedCourses?: AppCourseType[];
    interactiveEventsToday?: (CalendarEvent & { hasParticipated?: boolean })[];
    securityLogs?: SecurityLog[];
    systemHealth?: { api: boolean; db: boolean; mail: boolean };
    atRiskUsers?: any[];
}


// --- WIDGETS REUTILIZABLES ---

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

// --- DASHBOARDS POR ROL ---

function StudentDashboard({ data, onEnrollmentChange, onParticipate }: { data: DashboardData, onEnrollmentChange: (courseId: string, status: boolean) => void, onParticipate: (eventId: string, occurrenceDate: string) => void }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { user } = useAuth();
    
    // Gamification Level Calculation
    const calculateLevel = (xp: number) => {
        const baseXP = 250;
        const exponent = 1.5;
        let level = 1;
        let requiredXP = baseXP;
        while (xp >= requiredXP) {
            level++;
            xp -= requiredXP;
            requiredXP = Math.floor(baseXP * Math.pow(level, exponent));
        }
        const xpForNextLevel = Math.floor(baseXP * Math.pow(level, exponent));
        const progressPercentage = Math.max(0, Math.min(100, (xp / xpForNextLevel) * 100));

        return { level, progressPercentage };
    };
    
    const { level, progressPercentage } = calculateLevel(user?.xp || 0);

    return (
        <div className="space-y-8">
            <InteractiveEventsWidget events={data.interactiveEventsToday || []} onParticipate={onParticipate} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {data.assignedCourses && data.assignedCourses.length > 0 && (
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle>Cursos Obligatorios Asignados</CardTitle>
                                <CardDescription>Estos cursos han sido asignados para tu desarrollo. ¡Complétalos para seguir creciendo!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.assignedCourses.map((course, index) => <CourseCard key={course.id} course={course} userRole="STUDENT" priority={index < 2} onEnrollmentChange={onEnrollmentChange} />)}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <section>
                         <h2 className="text-xl font-semibold mb-4">Continuar Aprendiendo</h2>
                          {data.myDashboardCourses && data.myDashboardCourses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {data.myDashboardCourses.map((course, index) => <CourseCard key={course.id} course={course as AppCourseType} userRole="STUDENT" priority={index < 3} onEnrollmentChange={onEnrollmentChange}/>)}
                            </div>
                        ) : (
                            <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center border-dashed"><GraduationCap className="h-10 w-10 text-muted-foreground mb-2" /><h3 className="font-semibold">Empieza tu viaje de aprendizaje</h3><p className="text-sm text-muted-foreground mb-4">No estás inscrito en ningún curso todavía.</p><Button asChild><Link href="/courses">Explorar Catálogo</Link></Button></Card>
                        )}
                    </section>
                </div>

                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mi Progreso</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <div className="relative inline-block">
                                <Trophy className="h-16 w-16 text-amber-400" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-lg font-bold text-amber-800">{level}</div>
                            </div>
                            <p className="font-bold mt-2">Nivel {level}</p>
                            <Progress value={progressPercentage} className="h-2 mt-2"/>
                            <p className="text-xs text-muted-foreground mt-1">{user?.xp || 0} XP</p>
                        </CardContent>
                    </Card>
                    <MiniCalendar events={data.allCalendarEvents || []} currentDate={selectedDate} onDateSelect={setSelectedDate} />
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
            </div>
        </div>
    );
}


function InstructorDashboard({ data }: { data: DashboardData }) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Cursos Creados" value={data.instructorStats?.taught || 0} icon={Layers} gradient="bg-gradient-blue" />
                <MetricCard title="Estudiantes Totales" value={data.instructorStats?.students || 0} icon={UsersRound} gradient="bg-gradient-green" />
                <MetricCard title="Cursos Activos" value={0} icon={BookOpenCheck} gradient="bg-gradient-purple" description="Próximamente" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                 <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Accesos Rápidos de Creación</CardTitle>
                        </CardHeader>
                         <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button asChild variant="outline" className="h-16 justify-start p-4 text-left"><Link href="/manage-courses"><Layers className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Gestionar Cursos</p><p className="text-xs text-muted-foreground">Editar y crear contenido</p></div></Link></Button>
                             <Button asChild variant="outline" className="h-16 justify-start p-4 text-left"><Link href="/enrollments"><UsersRound className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Ver Inscritos</p><p className="text-xs text-muted-foreground">Seguimiento de alumnos</p></div></Link></Button>
                         </CardContent>
                    </Card>
                    <AnnouncementsList announcements={data.recentAnnouncements || []} />
                </div>
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    <MiniCalendar events={data.allCalendarEvents || []} currentDate={selectedDate} onDateSelect={setSelectedDate} />
                </div>
            </div>
        </div>
    );
}

function AdminDashboard({ data, onParticipate }: { data: DashboardData, onParticipate: (eventId: string, occurrenceDate: string) => void }) {
    const stats = data.adminStats;
    const router = useRouter();

    return (
        <div className="space-y-8">
             <InteractiveEventsWidget events={data.interactiveEventsToday || []} onParticipate={onParticipate} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Usuarios Totales" value={stats?.totalUsers || 0} icon={UsersRound} gradient="bg-gradient-blue" />
                <MetricCard title="Cursos Totales" value={stats?.totalCourses || 0} icon={Layers} gradient="bg-gradient-green" />
                <MetricCard title="Inscripciones" value={stats?.totalEnrollments || 0} icon={GraduationCap} gradient="bg-gradient-purple" />
                <MetricCard title="Finalización" value={stats?.averageCompletionRate || 0} icon={BookOpenCheck} suffix="%" description="Promedio" gradient="bg-gradient-orange" />
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary"/>Actividad Reciente</CardTitle></CardHeader>
                        <CardContent><SecurityLogTimeline logs={data.securityLogs || []} onLogClick={() => router.push('/security-audit')} /></CardContent>
                    </Card>
                    <AtRiskUsersCard users={data.atRiskUsers || []} onSuspend={() => {}} isLoading={false} />
                </div>
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Estado de la Plataforma</CardTitle></CardHeader>
                         <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Database className="h-4 w-4"/>Base de Datos</span><span className="flex items-center gap-2 font-semibold"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"/>Operacional</span></div>
                            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Mail className="h-4 w-4"/>Servicio de Correo</span><span className="flex items-center gap-2 font-semibold"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"/>Operacional</span></div>
                         </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base">Accesos Rápidos</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Button asChild variant="outline"><Link href="/manage-courses"><BookMarked className="mr-2 h-4 w-4"/>Cursos</Link></Button>
                            <Button asChild variant="outline"><Link href="/users"><Users className="mr-2 h-4 w-4"/>Usuarios</Link></Button>
                            <Button asChild variant="outline"><Link href="/settings"><Settings className="mr-2 h-4 w-4"/>Ajustes</Link></Button>
                            <Button asChild variant="outline"><Link href="/analytics"><LineChart className="mr-2 h-4 w-4"/>Analíticas</Link></Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function DashboardPage() {
  const { user } = useAuth();
  const { setPageTitle } = useTitle();
  const { startTour } = useTour();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
        const res = await fetch(`/api/dashboard/data`, { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Error al obtener datos`);
        setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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

  const handleEnrollmentChange = () => {
      fetchDashboardData();
  }

  const renderContentForRole = () => {
    if (!user || !data) return null;
    const commonProps = { data, onEnrollmentChange: handleEnrollmentChange, onParticipate: handleParticipate };
    switch (user?.role) {
      case 'ADMINISTRATOR': return <AdminDashboard {...commonProps} />;
      case 'INSTRUCTOR': return <InstructorDashboard data={data} />;
      case 'STUDENT': return <StudentDashboard {...commonProps} />;
      default: return <p>Rol de usuario no reconocido.</p>;
    }
  };
  
  return (
    <div className="space-y-8">
       <div className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-500 to-indigo-600 text-white shadow-lg">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                <p className="text-white/80">Bienvenido de nuevo a tu centro de aprendizaje y gestión.</p>
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
```