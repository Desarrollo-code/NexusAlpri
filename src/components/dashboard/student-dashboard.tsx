
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
      {/* Metrics Grid - Compact Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Main Content - 70/30 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (70%) */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Continuar Aprendiendo
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-[11px] font-bold">
                    <Link href="/my-courses">Ver todo</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {myDashboardCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myDashboardCourses.slice(0, 4).map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative rounded-xl border border-[#E2E8F0] p-4 bg-slate-50/30 hover:bg-white transition-all cursor-pointer"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        <div className="flex gap-4">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                            <Image src={course.imageUrl || '/placeholder-course.jpg'} alt={course.title} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold line-clamp-1">{course.title}</h4>
                            <p className="text-[11px] text-muted-foreground mt-1">{course.instructor.name}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${course.progressPercentage}%` }} />
                              </div>
                              <span className="text-[10px] font-bold">{course.progressPercentage}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Explora nuevos horizontes</p>
                    <p className="text-[11px] text-muted-foreground/60 mb-4">Aún no tienes cursos inscritos.</p>
                    <Button asChild size="sm" className="h-8 text-[11px]">
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
        <div className="lg:col-span-4 space-y-6">
          <motion.div variants={item}>
            <InteractiveEventsWidget events={studentStats.interactiveEventsToday} onParticipate={onParticipate} compact />
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-primary" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-9 text-[11px] font-medium border-slate-200">
                  <Link href="/courses"><BookOpen className="h-3.5 w-3.5 mr-2" />Explorar Cursos</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-9 text-[11px] font-medium border-slate-200">
                  <Link href="/my-courses"><History className="h-3.5 w-3.5 mr-2" />Mis Cursos</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start h-9 text-[11px] font-medium border-slate-200">
                  <Link href="/resources"><Sparkles className="h-3.5 w-3.5 mr-2" />Recursos</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
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