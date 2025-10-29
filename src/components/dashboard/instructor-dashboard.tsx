// src/components/dashboard/instructor-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, PlusCircle, BookMarked } from "lucide-react";
import type { Course as AppCourse, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import Link from "next/link";
import { CourseCarousel } from "../course-carousel";
import { AnnouncementsWidget } from "./announcements-widget";
import { CalendarWidget } from "./calendar-widget";

interface InstructorDashboardProps {
  instructorStats: {
    taught: number;
    students: number;
  };
  recentAnnouncements: AnnouncementType[];
  upcomingEvents: CalendarEvent[];
  taughtCourses: AppCourse[]; // Asegurado que esto se recibe
}

export function InstructorDashboard({ instructorStats, recentAnnouncements, taughtCourses, upcomingEvents }: InstructorDashboardProps) {

  return (
    <div className="space-y-8">
      <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Estudio del Creador</h1>
          <p className="text-muted-foreground">Tu espacio para crear, gestionar y ver el impacto de tu contenido.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cursos Creados</CardTitle><GraduationCap className="h-4 w-4 text-primary"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">{instructorStats?.taught || 0}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes Totales</CardTitle><Users className="h-4 w-4 text-primary"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">{instructorStats?.students || 0}</div></CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Mis Cursos en Foco</h2>
        {taughtCourses && taughtCourses.length > 0 ? (
          <CourseCarousel courses={taughtCourses} userRole="INSTRUCTOR" />
        ) : (
          <Card className="text-center py-12 border-dashed">
            <CardHeader>
              <CardTitle>Aún no has creado ningún curso</CardTitle>
              <CardDescription>¡Es hora de compartir tu conocimiento con el mundo!</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/manage-courses"><PlusCircle className="mr-2 h-4 w-4"/>Crear mi Primer Curso</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
            <AnnouncementsWidget announcements={recentAnnouncements} />
        </div>
        <div className="lg:col-span-1">
            <CalendarWidget events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
}
