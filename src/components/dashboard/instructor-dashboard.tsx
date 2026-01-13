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
      {/* Top Section: Banner (8) + Metrics (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Banner - 8 Columns */}
        <motion.div variants={item} className="lg:col-span-8">
          <div className="relative h-full overflow-hidden rounded-2xl p-6 md:p-8 flex items-center"
            style={{
              background: `linear-gradient(135deg, #6366F1 0%, #A855F7 100%)`
            }}>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
              <div className="text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-3"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Creator Studio</span>
                </motion.div>

                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                  ¡Hola, {user?.name}!
                </h1>
                <p className="text-sm text-white/90 max-w-md font-medium leading-relaxed">
                  Tu espacio para crear, gestionar y ver el impacto de tu contenido educativo.
                </p>

                {/* Quick Stats Pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                    <span className="text-[11px] font-bold">{instructorStats?.taught || 0} cursos</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                    <span className="text-[11px] font-bold">{instructorStats?.students || 0} estudiantes</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block relative w-40 h-40 lg:w-48 lg:h-48">
                <Image
                  src="/images/instructor-illustration.png"
                  alt="Instructor"
                  width={256}
                  height={256}
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid - 4 Columns (2x2) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
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
          <MetricCard
            title="Actividad"
            value={taughtCourses?.length || 0}
            icon={Activity}
            index={2}
          />
          <MetricCard
            title="Impacto"
            value={instructorStats?.students > 0 ? 100 : 0}
            suffix="%"
            icon={Sparkles}
            index={3}
          />
        </div>
      </div>

      {/* Main Content - 70/30 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (70%) */}
        <div className="lg:col-span-8 space-y-4">
          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-3 border-b border-[#E2E8F0] bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-primary" />
                    Rendimiento de Cursos
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-[10px] font-bold">
                    <Link href="/manage-courses">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {taughtCourses && taughtCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {taughtCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <CourseProgressCard course={course} index={index} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs font-bold text-muted-foreground">Sin cursos activos</p>
                    <Button asChild size="sm" className="h-7 text-[10px] mt-2">
                      <Link href="/manage-courses">Crear Curso</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <CalendarWidget events={upcomingEvents} />
          </motion.div>
        </div>

        {/* Right Side (30%) */}
        <div className="lg:col-span-4 space-y-4">
          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-3 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-8 text-[10px] font-medium border-slate-200">
                  <Link href="/manage-courses"><BookOpen className="h-3 w-3 mr-2" />Crear Nuevo</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-8 text-[10px] font-medium border-slate-200">
                  <Link href="/manage-courses"><BookMarked className="h-3 w-3 mr-2" />Mis Contenidos</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-3 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-emerald-500" />
                  Anuncios
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <AnnouncementsWidget announcements={recentAnnouncements} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}