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
import { useMemo } from "react";
import { InteractiveEventsWidget } from "./interactive-events-widget";
import { MetricCard } from "../analytics/metric-card";
import { motion } from "framer-motion";

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
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
  const hasInteractiveEvents = studentStats?.interactiveEventsToday && studentStats.interactiveEventsToday.length > 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        <div className={hasInteractiveEvents ? "lg:col-span-8" : "lg:col-span-12"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <motion.div variants={item}>
              <Card id="student-welcome-card" className="group relative p-8 rounded-3xl overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl flex flex-col justify-center h-full transition-all duration-500 hover:shadow-primary/5">
                <div className="absolute inset-0 z-0 opacity-10 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="relative z-10 flex items-center justify-between gap-6">
                  <div className="space-y-4 flex-grow">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                      <GraduationCap className="h-3 w-3" /> Ruta de Aprendizaje
                    </div>
                    <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
                      Hola, {user?.name}! <span className="text-3xl animate-wave inline-block">👋</span>
                    </h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Tu progreso actual te acerca más a tu <span className="text-foreground font-bold">próxima meta</span>.
                    </p>

                    <div className="pt-4 space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div className="p-1 px-2 rounded-lg bg-primary text-white font-black text-sm">NIVEL {level}</div>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.xp || 0} TOTAL XP</span>
                        </div>
                        <p className="text-xs font-bold text-primary">{Math.round(progressPercentage)}% completado</p>
                      </div>
                      <div className="relative h-3 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                  {settings?.dashboardImageUrlStudent && (
                    <div className="relative w-32 h-32 flex-shrink-0 hidden sm:block">
                      <motion.div
                        animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Image src={settings.dashboardImageUrlStudent} alt="Mascota Estudiante" width={128} height={128} className="object-contain drop-shadow-2xl" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <div id="student-stats-cards" className="grid grid-cols-2 gap-4">
              <MetricCard title="Cursos Inscritos" value={studentStats?.enrolled || 0} icon={GraduationCap} index={0} />
              <MetricCard title="Cursos Completados" value={studentStats?.completed || 0} icon={CheckCircle} index={1} />
            </div>
          </div>
        </div>

        {hasInteractiveEvents && (
          <motion.div variants={item} className="lg:col-span-4">
            <InteractiveEventsWidget events={studentStats.interactiveEventsToday} onParticipate={onParticipate} />
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-10">

          {assignedCourses && assignedCourses.length > 0 && (
            <motion.section variants={item}>
              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold">
                  !
                </div>
                Cursos Obligatorios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignedCourses.map(course => (
                  <Card key={course.id} className="group relative flex flex-col bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl p-1">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{course.title}</CardTitle>
                      <CardDescription className="text-xs uppercase font-bold tracking-widest text-rose-500">Asignación Mandatoria</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow pt-0">
                      <Button asChild className="w-full rounded-2xl h-11 font-bold shadow-lg hover:scale-[1.02] transition-transform">
                        <Link href={`/courses/${course.id}`}>
                          Empezar ahora <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}

          {myDashboardCourses && myDashboardCourses.length > 0 && (
            <motion.section variants={item} id="continue-learning-section">
              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                Continuar Aprendiendo
              </h2>
              <CourseCarousel courses={myDashboardCourses} userRole="STUDENT" onEnrollmentChange={onEnrollmentChange} />
            </motion.section>
          )}

          {!hasCourses && (
            <motion.div variants={item}>
              <Card className="text-center py-20 bg-white/10 dark:bg-black/20 backdrop-blur-md border-dashed border-2 rounded-3xl border-primary/20">
                <CardHeader>
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-primary opacity-50" />
                  </div>
                  <CardTitle className="text-2xl font-black">¡Es hora de empezar!</CardTitle>
                  <CardDescription className="text-lg max-w-sm mx-auto">
                    Explora nuestro catálogo y empieza a ganar XP hoy mismo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg" className="rounded-2xl font-black px-8 h-12">
                    <Link href="/courses">
                      Explorar Catálogo
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>

        {/* Columna Lateral */}
        <div id="student-side-widgets" className="lg:col-span-1 space-y-8">
          <motion.div variants={item}><AnnouncementsWidget announcements={recentAnnouncements} /></motion.div>
          <motion.div variants={item}><CalendarWidget events={upcomingEvents} /></motion.div>
        </div>
      </div>
    </motion.div>
  );
}

