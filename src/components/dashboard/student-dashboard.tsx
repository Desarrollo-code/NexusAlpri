// src/components/dashboard/student-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, ArrowRight, BookOpen, Sparkles, Activity } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20
    }
  }
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
      className="min-h-screen pb-12"
    >
      {/* Hero Header - Banner dinámico usando variables CSS del tema */}
      <motion.div variants={item} className="mb-8">
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-12"
             style={{
               background: `linear-gradient(135deg, 
                  hsl(var(--primary) / 0.9) 0%, 
                  hsl(var(--primary) / 0.7) 50%, 
                  hsl(var(--accent) / 0.8) 100%)`
             }}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          {/* Floating Orbs - usando colores del tema */}
          <motion.div 
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-20 w-64 h-64 rounded-full blur-3xl"
            style={{ 
              background: `hsl(var(--primary) / 0.15)`
            }}
          />
          <motion.div 
            animate={{ 
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-20 w-80 h-80 rounded-full blur-3xl"
            style={{ 
              background: `hsl(var(--accent) / 0.2)`
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-white dark:text-white">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-4"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-bold">Ruta de Aprendizaje</span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">
                ¡Hola, {user?.name}!
              </h1>
              <p className="text-lg md:text-xl text-white/90 dark:text-white/90 max-w-2xl">
                Tu progreso actual te acerca más a tu próxima meta. ¡Sigue así!
              </p>

              {/* XP Progress Bar */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-white/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nivel {level}
                    </Badge>
                    <span className="text-sm font-bold text-white/80">
                      {user?.xp || 0} XP
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white/80">
                    {Math.round(progressPercentage)}% al siguiente nivel
                  </span>
                </div>
                <div className="relative h-3 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-white via-white/80 to-white rounded-full"
                  />
                </div>
              </div>
            </div>

            {settings?.dashboardImageUrlStudent && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="relative"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full blur-2xl opacity-50"
                  style={{ 
                    background: `linear-gradient(to right, 
                       hsl(var(--primary)), 
                       hsl(var(--accent)))`
                  }}
                />
                <div className="relative w-48 h-48 md:w-64 md:h-64">
                  <Image 
                    src={settings.dashboardImageUrlStudent} 
                    alt="Estudiante" 
                    width={256} 
                    height={256} 
                    className="object-contain drop-shadow-2xl" 
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid - Modern Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard 
          title="Cursos Inscritos" 
          value={studentStats?.enrolled || 0} 
          icon={GraduationCap} 
          index={0} 
        />
        <MetricCard 
          title="Completados" 
          value={studentStats?.completed || 0} 
          icon={CheckCircle} 
          index={1} 
        />
        {hasInteractiveEvents && (
          <div className="col-span-2">
            <InteractiveEventsWidget events={studentStats.interactiveEventsToday} onParticipate={onParticipate} />
          </div>
        )}
      </div>

      {/* Main Content - Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assigned Courses - Priority */}
        {assignedCourses && assignedCourses.length > 0 && (
          <motion.div variants={item} className="lg:col-span-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-white dark:from-rose-950 dark:to-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">Cursos Obligatorios</div>
                      <div className="text-xs text-muted-foreground font-normal">Completar estos cursos es prioritario</div>
                    </div>
                  </CardTitle>
                  <Badge className="bg-rose-500 hover:bg-rose-600">
                    {assignedCourses.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedCourses.map((course, idx) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Link 
                        href={`/courses/${course.id}`}
                        className="group flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-sm">{course.title}</h3>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <Badge variant="outline" className="w-fit text-xs border-rose-200 text-rose-600">
                          Asignación Obligatoria
                        </Badge>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Continue Learning */}
        {myDashboardCourses && myDashboardCourses.length > 0 && (
          <motion.div variants={item} className={assignedCourses && assignedCourses.length > 0 ? "lg:col-span-12" : "lg:col-span-8"}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Continuar Aprendiendo</div>
                    <div className="text-xs text-muted-foreground font-normal">Tus cursos en progreso</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourseCarousel courses={myDashboardCourses} userRole="STUDENT" onEnrollmentChange={onEnrollmentChange} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {!hasCourses && (
          <motion.div variants={item} className="lg:col-span-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">¡Es hora de empezar!</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Explora nuestro catálogo y empieza a ganar XP hoy mismo.
                </p>
                <Button asChild size="lg">
                  <Link href="/courses">
                    Explorar Catálogo <Sparkles className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Calendar */}
        <motion.div variants={item} className="lg:col-span-6">
          <CalendarWidget events={upcomingEvents} />
        </motion.div>

        {/* Announcements */}
        <motion.div variants={item} className="lg:col-span-6">
          <AnnouncementsWidget announcements={recentAnnouncements} />
        </motion.div>
      </div>
    </motion.div>
  );
}