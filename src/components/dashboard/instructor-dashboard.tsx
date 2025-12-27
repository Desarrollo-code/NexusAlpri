// src/components/dashboard/instructor-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, PlusCircle, BookMarked, Layers, FileText, ArrowRight, Paintbrush } from "lucide-react";
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
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
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
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <motion.div variants={item} className="lg:col-span-8">
          <Card id="instructor-welcome-card" className="group relative p-8 rounded-3xl overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl h-full transition-all duration-500 hover:shadow-primary/5">
            <div className="absolute inset-0 z-0 opacity-10 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between gap-6 h-full">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                  <Paintbrush className="h-3 w-3" /> Creator Studio
                </div>
                <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
                  Hola, {user?.name}! <span className="text-3xl animate-wave inline-block">👋</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                  Tu espacio para crear, gestionar y ver el impacto de tu contenido en <span className="text-foreground font-bold">NexusAlpri</span>.
                </p>
              </div>
              {settings?.dashboardImageUrlInstructor && (
                <div className="relative w-40 h-40 flex-shrink-0 hidden sm:block">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Image src={settings.dashboardImageUrlInstructor} alt="Instructor" width={160} height={160} className="object-contain drop-shadow-2xl" />
                  </motion.div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <MetricCard title="Cursos Creados" value={instructorStats?.taught || 0} icon={GraduationCap} index={0} />
          <MetricCard title="Estudiantes Totales" value={instructorStats?.students || 0} icon={Users} index={1} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item}>
            <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-xl overflow-hidden min-h-[400px]">
              <CardHeader className="pb-2 border-b border-white/10 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <BookMarked className="h-5 w-5" />
                      </div>
                      Rendimiento de Cursos
                    </CardTitle>
                    <CardDescription className="text-base">Un vistazo rápido al progreso promedio de tus contenidos.</CardDescription>
                  </div>
                  <Button variant="outline" asChild size="sm" className="rounded-xl border-white/20 hover:border-primary transition-all">
                    <Link href="/manage-courses">Gestionar Cursos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {taughtCourses && taughtCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {taughtCourses.map((course, index) => (
                      <CourseProgressCard key={course.id} course={course} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                      <PlusCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">Aún no has creado ningún curso</h3>
                    <p className="text-muted-foreground mt-2 mb-6">¡Es hora de compartir tu conocimiento con el mundo!</p>
                    <Button asChild size="lg" className="rounded-2xl font-black px-8">
                      <Link href="/manage-courses">Crear mi Primer Curso</Link>
                    </Button>
                  </div>
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
