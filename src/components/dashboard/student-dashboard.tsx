// src/components/dashboard/student-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, ArrowRight, BookOpen } from "lucide-react";
import type { EnrolledCourse, Course as AppCourse, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import Link from "next/link";
import { CourseCarousel } from "../course-carousel";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { VerifiedBadge } from "../ui/verified-badge";
import { useMemo } from "react";
import { InteractiveEventsWidget } from "./interactive-events-widget";
import { MetricCard } from "../analytics/metric-card";
import { Skeleton } from "../ui/skeleton";

const calculateLevel = (xp: number) => {
    const baseXP = 250; const exponent = 1.5;
    let level = 1; let requiredXP = baseXP;
    while (xp >= requiredXP) {
        level++;
        xp -= requiredXP;
        requiredXP = Math.floor(baseXP * Math.pow(level, exponent));
    }
    const xpForNextLevel = Math.floor(baseXP * Math.pow(level, exponent));
    const progressPercentage = Math.max(0, Math.min(100, (xp / xpForNextLevel) * 100));
    return { level, progressPercentage };
};

interface StudentDashboardProps {
  studentStats: { enrolled: number; completed: number; interactiveEventsToday?: (CalendarEvent & { hasParticipated?: boolean })[] };
  myDashboardCourses: EnrolledCourse[];
  assignedCourses: AppCourse[];
  recentAnnouncements: AnnouncementType[];
  upcomingEvents: CalendarEvent[];
  onEnrollmentChange: () => void;
  onParticipate: (eventId: string, occurrenceDate: Date) => void;
}

export function StudentDashboard({ studentStats, myDashboardCourses, assignedCourses, recentAnnouncements, upcomingEvents, onEnrollmentChange, onParticipate }: StudentDashboardProps) {
  const { user, settings } = useAuth();
  const { level, progressPercentage } = useMemo(() => calculateLevel(user?.xp || 0), [user?.xp]);
  
  const hasCourses = (myDashboardCourses && myDashboardCourses.length > 0) || (assignedCourses && assignedCourses.length > 0);

  return (
    <div className="space-y-8">
       <Card id="student-welcome-card" className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
           <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
           <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Hola, {user?.name}! <span className="text-2xl animate-wave">👋</span></h1>
                  <p className="text-primary-foreground/80">Bienvenido de nuevo a tu centro de aprendizaje.</p>
                  <div className="pt-2">
                      <div className="flex justify-between items-end mb-1">
                          <p className="font-semibold text-primary-foreground">Nivel {level}</p>
                          <p className="text-sm text-primary-foreground/80">{user?.xp || 0} XP</p>
                      </div>
                      <Progress value={progressPercentage} className="h-2 bg-white/20"/>
                  </div>
              </div>
               {settings?.dashboardImageUrlStudent && (
                 <div className="relative w-28 h-28 flex-shrink-0">
                   <Image src={settings.dashboardImageUrlStudent} alt="Imagen del panel de Estudiante" fill className="object-contain" data-ai-hint="student dashboard mascot"/>
                 </div>
               )}
          </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-8">
           <div id="student-stats-cards" className="grid grid-cols-2 gap-4">
              <MetricCard title="Cursos Inscritos" value={studentStats?.enrolled || 0} icon={GraduationCap} index={0} />
              <MetricCard title="Cursos Completados" value={studentStats?.completed || 0} icon={CheckCircle} index={1} />
           </div>
          
          <InteractiveEventsWidget events={studentStats.interactiveEventsToday} onParticipate={onParticipate} />
          
          {assignedCourses && assignedCourses.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Cursos Obligatorios Asignados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedCourses.map(course => (
                      <Card key={course.id} className="flex flex-col">
                          <CardHeader>
                              <CardTitle>{course.title}</CardTitle>
                              <CardDescription>Asignado por un administrador</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              <Button asChild className="w-full">
                                  <Link href={`/courses/${course.id}`}>
                                      Empezar Curso <ArrowRight className="ml-2 h-4 w-4"/>
                                  </Link>
                              </Button>
                          </CardContent>
                      </Card>
                  ))}
              </div>
            </section>
          )}

          {myDashboardCourses && myDashboardCourses.length > 0 && (
            <section id="continue-learning-section">
              <h2 className="text-2xl font-semibold mb-4">Continuar Aprendiendo</h2>
              <CourseCarousel courses={myDashboardCourses} userRole="STUDENT" onEnrollmentChange={onEnrollmentChange} />
            </section>
          )}

          {!hasCourses && (
             <Card className="text-center py-12 border-dashed">
                <CardHeader>
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>¡Es hora de empezar a aprender!</CardTitle>
                    <CardDescription>Parece que aún no te has inscrito a ningún curso. Explora nuestro catálogo para encontrar tu próxima aventura de conocimiento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/courses">
                            Explorar Catálogo de Cursos
                        </Link>
                    </Button>
                </CardContent>
            </Card>
          )}

        </div>

        {/* Columna Lateral */}
        <div id="student-side-widgets" className="lg:col-span-1 space-y-6">
          <AnnouncementsWidget announcements={recentAnnouncements} />
          <CalendarWidget events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
}
