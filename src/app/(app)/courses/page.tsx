'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import type { Course as AppCourseType, EnrolledCourse, CourseStatus, UserRole } from '@/types'; 
import { 
  PackageX, Loader2, AlertTriangle, Filter, Search, HelpCircle, 
  X, BookOpen, TrendingUp, Clock, Award, Grid, List, Sparkles,
  GraduationCap, Target, Users
} from 'lucide-react'; 
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCarousel } from '@/components/course-carousel';
import { useTitle } from '@/contexts/title-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { EmptyState } from '@/components/empty-state';
import { useTour } from '@/contexts/tour-context';
import { coursesTour } from '@/lib/tour-steps';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiCourse extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor: { id: string; name: string } | null;
  _count: { 
    modules: number;
    enrollments?: number;
  };
  modulesCount?: number; 
  status: CourseStatus;
  prerequisiteCompleted?: boolean;
  isMandatory?: boolean;
  averageCompletion?: number;
}

type SortOption = 'newest' | 'popular' | 'title' | 'modules';
type ViewMode = 'grid' | 'list';

export default function CoursesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();
  
  const [allApiCourses, setAllApiCourses] = useState<ApiCourse[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMandatoryOnly, setShowMandatoryOnly] = useState(false);
  
  useEffect(() => {
    setPageTitle('Catálogo de Cursos');
    startTour('courses', coursesTour);
  }, [setPageTitle, startTour]);

  const fetchCoursesAndEnrollments = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const courseParams = new URLSearchParams({ userId: user.id });
      
      const coursePromise = fetch(`/api/courses?${courseParams.toString()}`, { cache: 'no-store' });
      const enrollmentPromise = fetch(`/api/enrollment/${user.id}`, { cache: 'no-store' });
        
      const [courseResponse, enrollmentResponse] = await Promise.all([coursePromise, enrollmentPromise]);

      if (!courseResponse.ok) {
        const errorData = await courseResponse.json();
        throw new Error(errorData.message || 'Error al cargar los cursos');
      }
      const courseData = await courseResponse.json();
      
      const coursesArray = Array.isArray(courseData?.courses) ? courseData.courses : [];
      setAllApiCourses(coursesArray);

      if (enrollmentResponse?.ok) {
        const enrollmentData: EnrolledCourse[] = await enrollmentResponse.json();
        const validEnrollmentIds = Array.isArray(enrollmentData)
            ? enrollmentData.map(c => c?.id).filter(Boolean)
            : [];
        setEnrolledCourseIds(validEnrollmentIds);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar cursos';
      setError(errorMessage);
      setAllApiCourses([]);
      toast({ 
        title: "Error al cargar cursos", 
        description: errorMessage, 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    if (!isAuthLoading) {
      fetchCoursesAndEnrollments();
    }
  }, [isAuthLoading, user, fetchCoursesAndEnrollments]); 

  const allCoursesForDisplay = useMemo(() => allApiCourses.map(mapApiCourseToAppCourse), [allApiCourses]);
  
  // Estadísticas generales
  const stats = useMemo(() => {
    const available = allCoursesForDisplay.filter(c => 
      c.status === 'PUBLISHED' && !enrolledCourseIds.includes(c.id)
    ).length;
    const mandatory = allCoursesForDisplay.filter(c => 
      c.isMandatory && c.status === 'PUBLISHED' && !enrolledCourseIds.includes(c.id)
    ).length;
    const totalCategories = new Set(allCoursesForDisplay.map(c => c.category)).size;

    return { available, mandatory, totalCategories };
  }, [allCoursesForDisplay, enrolledCourseIds]);

  const filteredCourses = useMemo(() => {
    let courses = allCoursesForDisplay.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (course.instructor?.name && course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const isPublished = course.status === 'PUBLISHED';
      const isNotEnrolled = !enrolledCourseIds.includes(course?.id);
      const matchesCategory = activeCategory === 'all' || course.category === activeCategory;
      const matchesMandatory = !showMandatoryOnly || course.isMandatory;

      return matchesSearch && isPublished && isNotEnrolled && matchesCategory && matchesMandatory;
    });

    // Ordenar cursos
    courses.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.enrollmentsCount || 0) - (a.enrollmentsCount || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'modules':
          return (b.modulesCount || 0) - (a.modulesCount || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return courses;
  }, [allCoursesForDisplay, searchTerm, enrolledCourseIds, activeCategory, sortBy, showMandatoryOnly]);

  const groupedCourses = useMemo(() => {
    return filteredCourses.reduce((acc, course) => {
      const category = course.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(course);
      return acc;
    }, {} as Record<string, AppCourseType[]>);
  }, [filteredCourses]);

  const handleEnrollmentChange = (courseId: string, newStatus: boolean) => {
    if (newStatus) {
        setEnrolledCourseIds(prev => [...prev, courseId]);
        toast({
          title: "¡Inscrito exitosamente!",
          description: "Ya puedes comenzar a aprender",
        });
    } else {
        setEnrolledCourseIds(prev => prev.filter(id => id !== courseId));
    }
  };
  
  const allCategories = useMemo(() => ['all', ...(settings?.resourceCategories || [])], [settings]);

  const CourseCardSkeleton = () => (
    <Card className="flex flex-col overflow-hidden">
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
  );

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={cn("rounded-full p-3", color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setShowMandatoryOnly(false);
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm !== '' || activeCategory !== 'all' || showMandatoryOnly;

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
          </div>
        </Card>
        <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <p className="text-muted-foreground">
              Explora nuestra oferta formativa y encuentra el curso perfecto para ti
            </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4"/>
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4"/>
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => forceStartTour('courses', coursesTour)}>
              <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={BookOpen}
            label="Cursos Disponibles"
            value={stats.available}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={Award}
            label="Cursos Obligatorios"
            value={stats.mandatory}
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={Target}
            label="Categorías"
            value={stats.totalCategories}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {/* Filters Card */}
      <Card className="p-6 space-y-4 shadow-sm" id="courses-filters">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por título, descripción o instructor..."
              className="pl-10 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Select value={activeCategory} onValueChange={setActiveCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'Todas las Categorías' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más Recientes</SelectItem>
                <SelectItem value="popular">Más Populares</SelectItem>
                <SelectItem value="title">Nombre (A-Z)</SelectItem>
                <SelectItem value="modules">Más Módulos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showMandatoryOnly ? "default" : "outline"}
              onClick={() => setShowMandatoryOnly(!showMandatoryOnly)}
              className="w-full sm:w-auto"
            >
              <Award className="mr-2 h-4 w-4" />
              Solo Obligatorios
            </Button>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Búsqueda: {searchTerm}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchTerm('')}
                    />
                  </Badge>
                )}
                {activeCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {activeCategory}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setActiveCategory('all')}
                    />
                  </Badge>
                )}
                {showMandatoryOnly && (
                  <Badge variant="secondary" className="gap-1">
                    Obligatorios
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setShowMandatoryOnly(false)}
                    />
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Limpiar todo
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Courses Display */}
      {error ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Error al Cargar Cursos</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCoursesAndEnrollments} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : Object.keys(groupedCourses).length > 0 ? (
          <div className="space-y-10">
            {Object.entries(groupedCourses)
              .sort(([catA], [catB]) => catA.localeCompare(catB))
              .map(([category, courses]) => (
                <section key={category} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold font-headline">{category}</h2>
                        <Badge variant="secondary" className="text-xs">
                          {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
                        </Badge>
                      </div>
                    </div>
                    
                    {isMobile ? (
                        <CourseCarousel 
                          courses={courses} 
                          userRole={user?.role || null} 
                          onEnrollmentChange={handleEnrollmentChange} 
                        />
                    ) : (
                        <div className={cn(
                          "grid gap-6",
                          viewMode === 'grid' 
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "grid-cols-1"
                        )}>
                            {courses.map((course: AppCourseType, index: number) => (
                                <CourseCard 
                                    key={course.id} 
                                    course={course}
                                    userRole={user?.role || null}
                                    onEnrollmentChange={handleEnrollmentChange}
                                    priority={index < 4}
                                    viewMode={viewMode === 'list' ? 'horizontal' : 'vertical'}
                                />
                            ))}
                        </div>
                    )}
                </section>
            ))}
          </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <EmptyState
                icon={hasActiveFilters ? Search : PackageX}
                title={hasActiveFilters ? "No se encontraron cursos" : "Ningún curso disponible"}
                description={
                    hasActiveFilters
                    ? 'No hay cursos que coincidan con tus filtros actuales. Intenta ajustar tu búsqueda.' 
                    : 'Actualmente no hay cursos publicados disponibles para inscripción.'
                }
                imageUrl={settings?.emptyStateCoursesUrl}
            >
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="mt-4">
                  <X className="mr-2 h-4 w-4" />
                  Limpiar Filtros
                </Button>
              )}
            </EmptyState>
          </CardContent>
        </Card>
      )}

      {/* Results Counter */}
      {!error && filteredCourses.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
          {hasActiveFilters && ' con los filtros aplicados'}
        </div>
      )}
    </div>
  );
}