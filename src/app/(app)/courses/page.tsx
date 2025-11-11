// src/app/(app)/courses/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import type { Course as AppCourseType, EnrolledCourse, CourseStatus, UserRole } from '@/types'; 
import { PackageX, Loader2, AlertTriangle, Filter, Search } from 'lucide-react'; 
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCarousel } from '@/components/course-carousel';
import { useTitle } from '@/contexts/title-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { EmptyState } from '@/components/empty-state';

interface ApiCourse extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor: { id: string; name: string } | null;
  _count: { modules: number };
  modulesCount?: number; 
  status: CourseStatus;
  prerequisiteCompleted?: boolean;
}

export default function CoursesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();
  
  const [allApiCourses, setAllApiCourses] = useState<ApiCourse[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  useEffect(() => {
    setPageTitle('Catálogo de Cursos');
  }, [setPageTitle]);

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
        throw new Error(errorData.message || 'Failed to fetch courses');
      }
      const courseData = await courseResponse.json();
      
      const coursesArray = Array.isArray(courseData) ? courseData : courseData.courses;
      setAllApiCourses(coursesArray || []);

      if (enrollmentResponse && enrollmentResponse.ok) {
        const enrollmentData: EnrolledCourse[] = await enrollmentResponse.json();
        setEnrolledCourseIds(enrollmentData.map(c => c.id));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar cursos');
      setAllApiCourses([]);
      toast({ title: "Error al cargar cursos", description: err instanceof Error ? err.message : 'No se pudieron cargar los cursos.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  

  useEffect(() => {
    if (!isAuthLoading && user) {
        fetchCoursesAndEnrollments();
    } else if (!isAuthLoading && !user) {
        setIsLoading(false);
    }
  }, [isAuthLoading, user, fetchCoursesAndEnrollments]); 

  const allCoursesForDisplay = useMemo(() => allApiCourses.map(mapApiCourseToAppCourse), [allApiCourses]);
  
  const filteredCourses = useMemo(() => {
    return allCoursesForDisplay.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const isPublished = course.status === 'PUBLISHED';
      const isNotEnrolled = !enrolledCourseIds.includes(course.id);
      const matchesCategory = activeCategory === 'all' || course.category === activeCategory;

      return matchesSearch && isPublished && isNotEnrolled && matchesCategory;
    });
  }, [allCoursesForDisplay, searchTerm, enrolledCourseIds, activeCategory]);


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
    } else {
        setEnrolledCourseIds(prev => prev.filter(id => id !== courseId));
    }
  };
  
  const allCategories = useMemo(() => ['all', ...(settings?.resourceCategories || [])], [settings]);

  const CourseCardSkeleton = () => (
    <Card className="flex flex-col overflow-hidden">
        <Skeleton className="aspect-video w-full" />
        <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-5/6 mt-2" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
  );

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-6 w-3/4" />
        </div>
        <Card className="p-4 space-y-4 shadow">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-40" />
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
      <div>
        <p className="text-muted-foreground">Explora nuestra oferta formativa y encuentra el curso perfecto para ti.</p>
      </div>

      <Card className="p-4 space-y-4 shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar en todos los cursos..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat === 'all' ? 'Todas las Categorías' : cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
      </Card>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error al Cargar Cursos</p>
          <p className="text-sm">{error}</p>
          <Button onClick={fetchCoursesAndEnrollments} variant="outline" className="mt-4">Reintentar</Button>
        </div>
      ) : Object.keys(groupedCourses).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedCourses).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, courses]) => (
                <section key={category}>
                    <h2 className="text-2xl font-semibold font-headline mb-4">{category}</h2>
                     {isMobile ? (
                        <CourseCarousel courses={courses} userRole={user?.role || null} onEnrollmentChange={handleEnrollmentChange} />
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {courses.map((course: AppCourseType, index: number) => (
                                <CourseCard 
                                    key={course.id} 
                                    course={course}
                                    userRole={user?.role || null}
                                    onEnrollmentChange={handleEnrollmentChange}
                                    priority={index < 4}
                                />
                            ))}
                        </div>
                     )}
                </section>
            ))}
          </div>
      ) : (
        <EmptyState
            icon={PackageX}
            title="Ningún curso disponible"
            description={
                searchTerm || activeCategory !== 'all'
                ? 'No hay cursos que coincidan con tu búsqueda o filtro.' 
                : 'Actualmente no hay cursos publicados que cumplan con los criterios de visualización.'
            }
            imageUrl={settings?.emptyStateCoursesUrl}
        />
      )}
    </div>
  );
}
