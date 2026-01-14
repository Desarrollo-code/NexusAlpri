// src/app/(app)/my-courses/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { CourseCard } from '@/components/course-card';
import type { EnrolledCourse, UserRole, Course as AppCourseType } from '@/types';
import {
  GraduationCap, Loader2, AlertTriangle, Info, Search, HelpCircle,
  BookOpen, TrendingUp, Award, Clock, ChevronRight, X,
  PlayCircle, Target, BarChart3, Sparkles
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useTitle } from '@/contexts/title-context';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { EmptyState } from '@/components/empty-state';
import { useTour } from '@/contexts/tour-context';
import { myCoursesTour } from '@/lib/tour-steps';
import { StatsCard } from '@/components/ui/stats-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

type FilterStatus = 'all' | 'in-progress' | 'completed';

// Stats Card Component
// StatsCard removed - using shared component

export default function MyCoursesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();

  const [myEnrolledCourses, setMyEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isFetchingPageData, setIsFetchingPageData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setPageTitle('Mis Cursos');
    startTour('myCourses', myCoursesTour);
  }, [setPageTitle, startTour]);

  const fetchMyEnrollments = useCallback(async () => {
    if (!user) {
      setIsFetchingPageData(false);
      setMyEnrolledCourses([]);
      return;
    }

    setIsFetchingPageData(true);
    setError(null);
    try {
      const response = await fetch(`/api/enrollment/${user.id}`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch enrolled courses: ${response.statusText}`);
      }
      const data: any[] = await response.json();
      const mappedCourses: EnrolledCourse[] = data
        .filter(item => item && item.course)
        .map(item => ({
          id: item.course.id,
          title: item.course.title,
          description: item.course.description,
          instructor: {
            id: item.course.instructor?.id || 'unknown',
            name: item.course.instructor?.name || 'N/A',
            avatar: item.course.instructor?.avatar || null
          },
          imageUrl: item.course.imageUrl,
          modulesCount: item.course._count?.modules || 0,
          enrolledAt: item.enrolledAt,
          isEnrolled: true,
          instructorId: item.course.instructorId,
          status: item.course.status || 'PUBLISHED',
          progressPercentage: item.progress?.progressPercentage || 0,
          certificateTemplateId: item.course.certificateTemplateId,
          enrollmentId: item.id,
          modules: [],
          prerequisite: null,
          prerequisiteId: null,
          isMandatory: false,
          category: 'General',
          createdAt: new Date(),
          updatedAt: new Date(),
          lessonsCount: 0,
          enrollmentsCount: 0,
          averageCompletion: 0,
          userProgress: [],
          prerequisiteCompleted: false
        }));
      setMyEnrolledCourses(mappedCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar tus cursos inscritos');
      setMyEnrolledCourses([]);
      toast({
        title: "Error al cargar cursos",
        description: err instanceof Error ? err.message : 'No se pudieron cargar tus cursos inscritos.',
        variant: "destructive"
      });
    } finally {
      setIsFetchingPageData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      fetchMyEnrollments();
    } else if (!user && !isAuthLoading) {
      setIsFetchingPageData(false);
      setMyEnrolledCourses([]);
    }
  }, [user, isAuthLoading, fetchMyEnrollments]);

  const { completedCourses, inProgressCourses } = useMemo(() => {
    const completed = myEnrolledCourses
      .filter(c => (c.progressPercentage || 0) === 100)
      .filter(c => c.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    const inProgress = myEnrolledCourses
      .filter(c => (c.progressPercentage || 0) < 100)
      .filter(c => c.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    if (filterStatus === 'completed') return { completedCourses: completed, inProgressCourses: [] };
    if (filterStatus === 'in-progress') return { completedCourses: [], inProgressCourses: inProgress };

    return { completedCourses: completed, inProgressCourses: inProgress };

  }, [myEnrolledCourses, filterStatus, debouncedSearchTerm]);

  // Estadísticas para el dashboard
  const stats = useMemo(() => {
    const total = myEnrolledCourses.length;
    const completed = myEnrolledCourses.filter(c => (c.progressPercentage || 0) === 100).length;
    const inProgress = myEnrolledCourses.filter(c => (c.progressPercentage || 0) < 100 && (c.progressPercentage || 0) > 0).length;
    const notStarted = myEnrolledCourses.filter(c => (c.progressPercentage || 0) === 0).length;
    const averageProgress = myEnrolledCourses.length > 0
      ? Math.round(myEnrolledCourses.reduce((sum, course) => sum + (course.progressPercentage || 0), 0) / myEnrolledCourses.length)
      : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      averageProgress
    };
  }, [myEnrolledCourses]);

  const handleEnrollmentChangeOnPage = (courseId: string, newStatus: boolean) => {
    if (!newStatus) {
      setMyEnrolledCourses(prev => prev.filter(c => c.id !== courseId));
    } else {
      fetchMyEnrollments();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all';

  if (isAuthLoading || isFetchingPageData) {
    return (
      <div className="space-y-8 pb-12">
        {/* Banner Skeleton */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-border/50 p-6 sm:p-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Courses Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="flex flex-col overflow-hidden h-full">
                <Skeleton className="aspect-video w-full" />
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" id="my-courses-content">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="my-courses-hero">
        <div className="space-y-1">
          <p className="text-muted-foreground">Continúa tu aprendizaje y revisa tu progreso en los cursos a los que te has unido.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en mis cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open('/courses', '_blank')}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Explorar más cursos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => forceStartTour('myCourses', myCoursesTour)}
            variant="outline"
            size="icon"
            className="shrink-0"
            id="my-courses-help-button"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div
        className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4"
        id="my-courses-stats"
      >
        <StatsCard
          icon={BookOpen}
          label="Total de Cursos"
          value={stats.total}
          subtitle="Cursos inscritos"
          color="blue"
        />
        <StatsCard
          icon={TrendingUp}
          label="En Progreso"
          value={stats.inProgress}
          subtitle={`${stats.notStarted} sin comenzar`}
          color="green"
        />
        <StatsCard
          icon={Award}
          label="Completados"
          value={stats.completed}
          subtitle="Logros obtenidos"
          color="purple"
        />
        <StatsCard
          icon={BarChart3}
          label="Progreso Promedio"
          value={`${stats.averageProgress}%`}
          subtitle="Avance general"
          color="orange"
        />
      </div>

      {/* Controls Bar */}
      <Card
        className="shadow-sm border"
        id="my-courses-controls"
      >
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Top Row: Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Status Tabs */}
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="all" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Todos</span>
                  <Badge variant="secondary" className="ml-1">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="gap-2" id="my-courses-in-progress">
                  <PlayCircle className="h-4 w-4" />
                  <span>En Progreso</span>
                  <Badge variant="secondary" className="ml-1">
                    {stats.inProgress + stats.notStarted}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2" id="my-courses-completed">
                  <Award className="h-4 w-4" />
                  <span>Completados</span>
                  <Badge variant="secondary" className="ml-1">
                    {stats.completed}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2 text-xs"
                >
                  <X className="h-3 w-3" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Búsqueda: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Estado: {filterStatus === 'in-progress' ? 'En progreso' : 'Completados'}
                  <button onClick={() => setFilterStatus('all')} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courses Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Error al Cargar Cursos</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchMyEnrollments} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && user && (
        <div className="space-y-8">
          {/* In Progress Courses */}
          {inProgressCourses.length > 0 && (
            <section
              className="space-y-4"
              id="my-courses-in-progress"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">Continuar Aprendiendo</h2>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {inProgressCourses.length} {inProgressCourses.length === 1 ? 'curso' : 'cursos'}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {inProgressCourses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    userRole={user.role}
                    onEnrollmentChange={handleEnrollmentChangeOnPage}
                    priority={index < 4}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Courses */}
          {completedCourses.length > 0 && (
            <section
              className="space-y-4"
              id="my-courses-completed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">Cursos Completados</h2>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {completedCourses.length} {completedCourses.length === 1 ? 'curso' : 'cursos'}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Ver certificados <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {completedCourses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    userRole={user.role}
                    onEnrollmentChange={handleEnrollmentChangeOnPage}
                    priority={index < 4}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty States */}
          {myEnrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <EmptyState
                  icon={GraduationCap}
                  title="Aún no estás inscrito en ningún curso"
                  description={
                    <div className="text-center">
                      <p className="mb-4">Visita nuestro catálogo para encontrar tu próxima aventura de aprendizaje.</p>
                      <Button asChild>
                        <Link href="/courses">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Explorar cursos disponibles
                        </Link>
                      </Button>
                    </div>
                  }
                  imageUrl={settings?.emptyStateMyCoursesUrl}
                />
              </CardContent>
            </Card>
          ) : inProgressCourses.length === 0 && completedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <EmptyState
                  icon={Search}
                  title="No se encontraron cursos"
                  description="Ninguno de tus cursos coincide con los filtros de búsqueda actuales."
                  imageUrl={settings?.emptyStateMyCoursesUrl}
                />
                <div className="flex justify-center mt-4">
                  <Button onClick={clearFilters} variant="outline">
                    <X className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* User Not Authenticated */}
      {!user && !isAuthLoading && !isFetchingPageData && (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Usuario no autenticado</AlertTitle>
              <AlertDescription>
                Por favor, <Link href="/sign-in" className="font-medium text-primary hover:underline">inicia sesión</Link> para ver tus cursos inscritos.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Results Counter */}
      {!error && user && myEnrolledCourses.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {inProgressCourses.length + completedCourses.length} de {myEnrolledCourses.length} cursos
          {hasActiveFilters && ' con los filtros aplicados'}
        </div>
      )}
    </div>
  );
}