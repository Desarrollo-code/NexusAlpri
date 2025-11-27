// src/components/dashboard/instructor-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, PlusCircle, BookMarked, Layers, FileText } from "lucide-react";
import type { Course as AppCourse, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import Link from "next/link";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";
import { CourseProgressCard } from "./course-progress-card";
import { MetricCard } from "../analytics/metric-card";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
         <div className="lg:col-span-2">
           <Card id="instructor-welcome-card" className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                <div className="absolute inset-0 z-0">
                    {settings?.dashboardImageUrlInstructor && (
                        <Image src={settings.dashboardImageUrlInstructor} alt="Fondo decorativo del dashboard de instructor" fill className="object-cover opacity-20" data-ai-hint="office background" />
                    )}
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="space-y-1">
                      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Estudio del Creador <span className="text-2xl">🎨</span></h1>
                      <p className="text-primary-foreground/80">Tu espacio para crear, gestionar y ver el impacto de tu contenido.</p>
                   </div>
                   {settings?.securityMascotUrl && (
                     <div className="relative w-28 h-28 flex-shrink-0">
                       <Image src={settings.securityMascotUrl} alt="Mascota" fill className="object-contain" data-ai-hint="cute robot mascot" />
                     </div>
                   )}
                </div>
            </Card>
         </div>
         <div className="lg:col-span-1 grid grid-cols-2 gap-4">
           <MetricCard title="Cursos Creados" value={instructorStats?.taught || 0} icon={GraduationCap} index={0} />
           <MetricCard title="Estudiantes Totales" value={instructorStats?.students || 0} icon={Users} index={1} />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle>Rendimiento de Cursos</CardTitle>
                  <CardDescription>Un vistazo rápido al progreso promedio de tus cursos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {taughtCourses && taughtCourses.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {taughtCourses.map((course, index) => (
                           <CourseProgressCard key={course.id} course={course} index={index} />
                        ))}
                       </div>
                    ) : (
                         <div className="text-center py-12 border-dashed border-2 rounded-lg">
                           <h3 className="text-lg font-semibold">Aún no has creado ningún curso</h3>
                           <p className="text-muted-foreground text-sm mt-1 mb-4">¡Es hora de compartir tu conocimiento!</p>
                           <Button asChild size="sm">
                             <Link href="/manage-courses"><PlusCircle className="mr-2 h-4 w-4"/>Crear mi Primer Curso</Link>
                           </Button>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <CalendarWidget events={upcomingEvents} />
            <AnnouncementsWidget announcements={recentAnnouncements} />
        </div>
      </div>
    </div>
  );
}
