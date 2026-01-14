
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, History, BookOpen, Sparkles, Activity, PlusCircle, MessageSquare, Gamepad2, ArrowRight, CheckCircle } from "lucide-react";
import type { EnrolledCourse, Course as AppCourse, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import Link from "next/link";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { useMemo } from "react";
import { InteractiveEventsWidget } from "./interactive-events-widget";
import { MetricCard } from "../analytics/metric-card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const averageProgress = useMemo(() => {
    if (!myDashboardCourses || myDashboardCourses.length === 0) return 0;
    const total = myDashboardCourses.reduce((acc, course) => acc + (course.progressPercentage || 0), 0);
    return Math.round(total / myDashboardCourses.length);
  }, [myDashboardCourses]);

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
              background: `linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)`
            }}>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
              <div className="text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-3"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ruta de Aprendizaje</span>
                </motion.div>

                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                  ¡Hola, {user?.name}!
                </h1>
                <p className="text-sm text-white/90 max-w-md font-medium leading-relaxed">
                  Continúa tu viaje de aprendizaje hoy. Tienes metas que alcanzar y nosotros estamos aquí para ayudarte.
                </p>

                {/* Quick Stats Pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                    <span className="text-[11px] font-bold">{averageProgress}% promedio</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                    <span className="text-[11px] font-bold">{studentStats?.enrolled || 0} cursos</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block relative w-40 h-40 lg:w-48 lg:h-48">
                <Image
                  src={settings?.dashboardImageUrlStudent || "/images/student-illustration.png"}
                  alt="Student"
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
            title="Mi Progreso"
            value={averageProgress}
            icon={Activity}
            suffix="%"
            index={0}
          />
          <MetricCard
            title="Inscritos"
            value={studentStats?.enrolled || 0}
            icon={GraduationCap}
            index={1}
            onClick={() => router.push('/my-courses')}
          />
          <MetricCard
            title="Completados"
            value={studentStats?.completed || 0}
            icon={CheckCircle}
            index={2}
          />
          <MetricCard
            title="Puntos XP"
            value={user?.xp || 0}
            icon={Trophy}
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
                    <History className="h-4 w-4 text-primary" />
                    Continuar Aprendiendo
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-[10px] font-bold">
                    <Link href="/my-courses">Ver todo</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {myDashboardCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myDashboardCourses.slice(0, 4).map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative rounded-xl border border-[#E2E8F0] p-3 bg-slate-50/10 hover:bg-white transition-all cursor-pointer"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        <div className="flex gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                            <Image src={course.imageUrl || '/placeholder-course.jpg'} alt={course.title} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[12px] font-bold line-clamp-1">{course.title}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{course.instructor.name}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${course.progressPercentage}%` }} />
                              </div>
                              <span className="text-[9px] font-bold">{course.progressPercentage}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-xs font-bold text-muted-foreground">Explora nuevos horizontes</p>
                    <Button asChild size="sm" className="h-7 text-[10px] mt-2">
                      <Link href="/courses">Explorar Catálogo</Link>
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
            <InteractiveEventsWidget events={studentStats.interactiveEventsToday} onParticipate={onParticipate} compact />
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-3 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-primary" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-8 text-[10px] font-medium border-slate-200">
                  <Link href="/courses"><BookOpen className="h-3 w-3 mr-2" />Catalogo</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-8 text-[10px] font-medium border-slate-200">
                  <Link href="/my-courses"><History className="h-3 w-3 mr-2" />Mis Cursos</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-3 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
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