// src/components/dashboard/instructor-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, PlusCircle, BookMarked, Paintbrush, Sparkles } from "lucide-react";
import type { Course as AppCourse, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import Link from "next/link";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";
import { CourseProgressCard } from "./course-progress-card";
import { MetricCard } from "../analytics/metric-card";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { motion } from "framer-motion";

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

interface InstructorDashboardProps {
  instructorStats: {
    taught: number;
    students: number;
  };
  recentAnnouncements: AnnouncementType[];
  upcomingEvents: CalendarEvent[];
  taughtCourses: AppCourse[];
}

export function InstructorDashboard({ instructorStats, recentAnnouncements, taughtCourses, upcomingEvents }: InstructorDashboardProps) {
  const { user, settings } = useAuth();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-8"
    >
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <motion.div variants={item} className="lg:col-span-8">
          <Card id="instructor-welcome-card" className="group relative p-10 rounded-[2rem] overflow-hidden bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-black/50 dark:via-black/40 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] h-full transition-all duration-700 hover:shadow-[0_25px_90px_-15px_rgba(var(--primary),0.25)] hover:scale-[1.01]">
            
            {/* Animated Background */}
            <div className="absolute inset-0 z-0 opacity-[0.07] transition-transform duration-1000 group-hover:scale-110" 
                 style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.15] via-transparent to-accent/[0.15] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(var(--accent-rgb),0.08),transparent_50%)]" />
            
            {/* Animated Shine Effect */}
            <motion.div 
              variants={shimmer}
              initial="hidden"
              animate="show"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ backgroundSize: "200% 100%" }}
            />
            
            <div className="relative z-10 flex items-center justify-between gap-8 h-full">
              <div className="space-y-4 flex-1">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/15 backdrop-blur-sm text-primary text-xs font-black uppercase tracking-[0.2em] mb-2 border border-primary/20 shadow-lg shadow-primary/10"
                >
                  <Paintbrush className="h-3.5 w-3.5" /> 
                  <span className="relative flex items-center gap-2">
                    Creator Studio
                    <Sparkles className="h-3 w-3 animate-pulse" />
                  </span>
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
                  className="text-muted-foreground text-lg max-w-xl leading-relaxed"
                >
                  Tu espacio para crear, gestionar y ver el impacto de tu contenido en <span className="text-foreground font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">NexusAlpri</span>.
                </motion.p>
              </div>
              
              {settings?.dashboardImageUrlInstructor && (
                <motion.div 
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                  className="relative w-48 h-48 flex-shrink-0 hidden lg:block"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 3, -3, 0]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-full h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
                    <Image 
                      src={settings.dashboardImageUrlInstructor} 
                      alt="Instructor" 
                      width={192} 
                      height={192} 
                      className="relative object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" 
                    />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
        
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <MetricCard title="Cursos Creados" value={instructorStats?.taught || 0} icon={GraduationCap} index={0} />
          <MetricCard title="Estudiantes Totales" value={instructorStats?.students || 0} icon={Users} index={1} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item}>
            <Card className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-2xl border-white/30 dark:border-white/15 shadow-xl overflow-hidden min-h-[420px] rounded-[1.5rem] group hover:shadow-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardHeader className="pb-6 border-b border-white/10 mb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20">
                        <BookMarked className="h-5 w-5" />
                      </div>
                      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Rendimiento de Cursos
                      </span>
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Un vistazo rápido al progreso promedio de tus contenidos.
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild size="sm" className="rounded-xl border-white/30 dark:border-white/15 bg-white/40 dark:bg-black/20 hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 font-bold h-10">
                    <Link href="/manage-courses">Gestionar Cursos</Link>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                {taughtCourses && taughtCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {taughtCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CourseProgressCard course={course} index={index} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="h-24 w-24 rounded-[1.5rem] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 shadow-2xl shadow-primary/20"
                    >
                      <PlusCircle className="h-12 w-12 text-primary" />
                    </motion.div>
                    <h3 className="text-2xl font-black mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Aún no has creado ningún curso
                    </h3>
                    <p className="text-muted-foreground mt-2 mb-8 text-lg max-w-md">
                      ¡Es hora de compartir tu conocimiento con el mundo!
                    </p>
                    <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary">
                      <Link href="/manage-courses">
                        Crear mi Primer Curso <Sparkles className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <div className="lg:col-span-1 space-y-8">
          <motion.div variants={item}><CalendarWidget events={upcomingEvents} /></motion.div>
          <motion.div variants={item}><AnnouncementsWidget announcements={recentAnnouncements} /></motion.div>
        </div>
      </div>
    </motion.div>
  );
}