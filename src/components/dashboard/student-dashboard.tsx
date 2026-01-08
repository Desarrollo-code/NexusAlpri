// src/components/dashboard/student-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, ArrowRight, BookOpen, Sparkles } from "lucide-react";
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
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const shimmer = {
  hidden: { backgroundPosition: "200% 0" },
  show: {
    backgroundPosition: "-200% 0",
    transition: {
      repeat: Infinity,
      duration: 8,
      ease: "linear"
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
      className="space-y-8 pb-8"
    >
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        <div className={hasInteractiveEvents ? "lg:col-span-8" : "lg:col-span-12"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <motion.div variants={item}>
              <Card id="student-welcome-card" className="group relative p-10 rounded-[2rem] overflow-hidden bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-black/50 dark:via-black/40 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] flex flex-col justify-center h-full transition-all duration-700 hover:shadow-[0_25px_90px_-15px_rgba(var(--primary),0.25)] hover:scale-[1.01]">
                
                {/* Animated Background */}
                <div className="absolute inset-0 z-0 opacity-[0.07] transition-transform duration-1000 group-hover:scale-110" 
                     style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] to-accent/[0.08]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.12),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(var(--accent-rgb),0.08),transparent_50%)]" />
                
                {/* Animated Shine Effect */}
                <motion.div 
                  variants={shimmer}
                  initial="hidden"
                  animate="show"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{ backgroundSize: "200% 100%" }}
                />
                
                <div className="relative z-10 flex items-center justify-between gap-6">
                  <div className="space-y-5 flex-grow">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/15 backdrop-blur-sm text-primary text-xs font-black uppercase tracking-[0.2em] mb-2 border border-primary/20 shadow-lg shadow-primary/10"
                    >
                      <GraduationCap className="h-3.5 w-3.5" /> Ruta de Aprendizaje
                    </motion.div>
                    
                    <motion.h1 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="text-5xl font-black tracking-tight font-headline flex items-center gap-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
                    >
                      Hola, {user?.name}! 
                      <motion.span 
                        animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                        className="text-4xl inline-block origin-[70%_70%]"
                      >
                        👋
                      </motion.span>
                    </motion.h1>
                    
                    <motion.p 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-muted-foreground text-lg leading-relaxed"
                    >
                      Tu progreso actual te acerca más a tu <span className="text-foreground font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">próxima meta</span>.
                    </motion.p>

                    {/* XP Progress Bar */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="pt-4 space-y-3"
                    >
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 blur-lg rounded-xl" />
                            <div className="relative p-2 px-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white font-black text-sm shadow-lg shadow-primary/30 border border-primary/20">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" />
                                NIVEL {level}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-1 rounded-lg">
                            {user?.xp || 0} XP TOTAL
                          </span>
                        </div>
                        <p className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
                          {Math.round(progressPercentage)}% completado
                        </p>
                      </div>
                      <div className="relative h-4 w-full bg-primary/10 rounded-full overflow-hidden border-2 border-primary/20 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-primary to-accent shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)] relative overflow-hidden"
                        >
                          <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {settings?.dashboardImageUrlStudent && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                      className="relative w-36 h-36 flex-shrink-0 hidden sm:block"
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -12, 0],
                          rotate: [0, 4, -4, 0]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-full h-full"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
                        <Image 
                          src={settings.dashboardImageUrlStudent} 
                          alt="Estudiante" 
                          width={144} 
                          height={144} 
                          className="relative object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" 
                        />
                      </motion.div>
                    </motion.div>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-10">

          {assignedCourses && assignedCourses.length > 0 && (
            <motion.section variants={item}>
              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:text-rose-400 font-black shadow-lg shadow-rose-500/20"
                >
                  !
                </motion.div>
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Cursos Obligatorios
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignedCourses.map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="group relative flex flex-col bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-500 rounded-[1.5rem] p-1 hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader className="pb-4 relative z-10">
                        <CardTitle className="text-xl font-black group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase font-black tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-2 py-1 rounded-lg w-fit">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                          Asignación Mandatoria
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow pt-0 relative z-10">
                        <Button asChild className="w-full rounded-2xl h-12 font-black shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600">
                          <Link href={`/courses/${course.id}`}>
                            Empezar ahora <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {myDashboardCourses && myDashboardCourses.length > 0 && (
            <motion.section variants={item} id="continue-learning-section">
              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Continuar Aprendiendo
                </span>
              </h2>
              <CourseCarousel courses={myDashboardCourses} userRole="STUDENT" onEnrollmentChange={onEnrollmentChange} />
            </motion.section>
          )}

          {!hasCourses && (
            <motion.div variants={item}>
              <Card className="relative text-center py-24 bg-gradient-to-br from-white/40 to-white/20 dark:from-black/40 dark:to-black/20 backdrop-blur-xl border-dashed border-2 rounded-[2rem] border-primary/30 overflow-hidden group hover:border-primary/50 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative z-10">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="h-24 w-24 rounded-[1.5rem] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20"
                  >
                    <BookOpen className="h-12 w-12 text-primary" />
                  </motion.div>
                  <CardTitle className="text-3xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    ¡Es hora de empezar!
                  </CardTitle>
                  <CardDescription className="text-lg max-w-sm mx-auto mt-3 text-muted-foreground">
                    Explora nuestro catálogo y empieza a ganar <span className="text-primary font-black">XP</span> hoy mismo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary">
                    <Link href="/courses">
                      Explorar Catálogo <Sparkles className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>

        {/* Side Column */}
        <div id="student-side-widgets" className="lg:col-span-1 space-y-8">
          <motion.div variants={item}><AnnouncementsWidget announcements={recentAnnouncements} /></motion.div>
          <motion.div variants={item}><CalendarWidget events={upcomingEvents} /></motion.div>
        </div>
      </div>
    </motion.div>
  );
}