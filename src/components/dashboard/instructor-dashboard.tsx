// src/components/dashboard/instructor-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, PlusCircle, BookMarked, BookOpen, Sparkles, Activity } from "lucide-react";
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
                <span className="text-sm font-bold">Creator Studio</span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">
                ¡Hola, {user?.name}!
              </h1>
              <p className="text-lg md:text-xl text-white/90 dark:text-white/90 max-w-2xl">
                Tu espacio para crear, gestionar y ver el impacto de tu contenido educativo.
              </p>

              {/* Quick Stats Pills */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md">
                  <span className="text-sm font-bold">{instructorStats?.taught || 0} cursos creados</span>
                </div>
                <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md">
                  <span className="text-sm font-bold">{instructorStats?.students || 0} estudiantes</span>
                </div>
              </div>
            </div>

            {settings?.dashboardImageUrlInstructor && (
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
                    src={settings.dashboardImageUrlInstructor} 
                    alt="Instructor" 
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
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
        <MetricCard 
          title="Cursos Creados" 
          value={instructorStats?.taught || 0} 
          icon={GraduationCap} 
          index={0} 
        />
        <MetricCard 
          title="Estudiantes Totales" 
          value={instructorStats?.students || 0} 
          icon={Users} 
          index={1} 
        />
      </div>

      {/* Main Content - Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Course Performance - Large */}
        <motion.div variants={item} className="lg:col-span-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <BookMarked className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Rendimiento de Cursos</div>
                    <div className="text-xs text-muted-foreground font-normal">Progreso promedio de estudiantes</div>
                  </div>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/manage-courses">
                    Gestionar
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {taughtCourses && taughtCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                    <PlusCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Aún no has creado ningún curso</p>
                  <p className="text-xs text-muted-foreground/70 mb-4">¡Es hora de compartir tu conocimiento!</p>
                  <Button asChild size="sm">
                    <Link href="/manage-courses">
                      Crear mi Primer Curso <Sparkles className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions - Compact */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-slate-800 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">Acciones Rápidas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                asChild 
                className="w-full justify-start bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950 text-foreground border-0 shadow-sm hover:shadow-md transition-all"
                size="lg"
              >
                <Link href="/manage-courses">
                  <BookOpen className="h-4 w-4 mr-3" /> 
                  Crear Curso
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-950"
                size="lg"
              >
                <Link href="/manage-courses">
                  <BookMarked className="h-4 w-4 mr-3" /> 
                  Mis Cursos
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-950"
                size="lg"
              >
                <Link href="/announcements">
                  <Activity className="h-4 w-4 mr-3" /> 
                  Anuncios
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

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