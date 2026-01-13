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
      {/* Metrics Grid - Compact Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Main Content - 70/30 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (70%) */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-primary" />
                    Rendimiento de Cursos
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-[11px] font-bold">
                    <Link href="/manage-courses">Gestionar Cursos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {taughtCourses && taughtCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {taughtCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <CourseProgressCard course={course} index={index} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <PlusCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Sin cursos activos</p>
                    <p className="text-[11px] text-muted-foreground/60 mb-4">Empieza creando tu primer curso hoy.</p>
                    <Button asChild size="sm" className="h-8 text-[11px]">
                      <Link href="/manage-courses">
                        Crear Curso <Sparkles className="ml-1.5 h-3 w-3" />
                      </Link>
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
        <div className="lg:col-span-4 space-y-6">
          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-9 text-[11px] font-medium border-slate-200">
                  <Link href="/manage-courses"><BookOpen className="h-3.5 w-3.5 mr-2" />Crear Nuevo Curso</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-9 text-[11px] font-medium border-slate-200">
                  <Link href="/manage-courses"><BookMarked className="h-3.5 w-3.5 mr-2" />Mis Contenidos</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-9 text-[11px] font-medium border-slate-200">
                  <Link href="/announcements"><Activity className="h-3.5 w-3.5 mr-2" />Centro de Anuncios</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-emerald-500" />
                  Anuncios Recientes
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