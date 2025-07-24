
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import type { Course as AppCourseType, EnrolledCourse, CourseStatus, UserRole } from '@/types'; 
import { Search, PackageX, Loader2, AlertTriangle } from 'lucide-react'; 
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCarousel } from '@/components/course-carousel';

interface ApiCourse extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor: { id: string; name: string } | null;
  _count: { modules: number };
  modulesCount?: number; 
  status: CourseStatus;
}

function mapApiCourseToAppCourse(apiCourse: ApiCourse): AppCourseType {
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description || '',
    category: apiCourse.category || undefined,
    instructor: apiCourse.instructor?.name || 'N/A',
    instructorId: apiCourse.instructorId || undefined,
    imageUrl: apiCourse.imageUrl || undefined,
    modulesCount: apiCourse._count?.modules ?? apiCourse.modulesCount ?? 0,
    status: apiCourse.status,
    modules: [], 
    isEnrolled: undefined, 
  };
}


export default function CoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [allApiCourses, setAllApiCourses] = useState<ApiCourse[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [enrollmentUpdatedSignal, setEnrollmentUpdatedSignal] = useState(0);

  const fetchCoursesAndEnrollments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const coursePromise = fetch('/api/courses', { cache: 'no-store' });
      
      const enrollmentPromise = user?.id 
        ? fetch(`/api/enrollment/${user.id}`, { cache: 'no-store' })
        : Promise.resolve(null);
        
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
    fetchCoursesAndEnrollments();
  }, [fetchCoursesAndEnrollments, enrollmentUpdatedSignal]); 

  const allCoursesForDisplay = useMemo(() => allApiCourses.map(mapApiCourseToAppCourse), [allApiCourses]);
  
  const filteredCourses = useMemo(() => {
    return allCoursesForDisplay.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const isPublished = course.status === 'PUBLISHED';
      const isNotEnrolled = !enrolledCourseIds.includes(course.id);
      
      const isNotOwnCourse = !( (user?.role === 'INSTRUCTOR' || user?.role === 'ADMINISTRATOR') && course.instructorId === user?.id );

      return matchesSearch && isPublished && isNotEnrolled && isNotOwnCourse;
    });
  }, [allCoursesForDisplay, searchTerm, enrolledCourseIds, user]);


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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground">Explora nuestra oferta formativa y encuentra el curso perfecto para ti.</p>
      </div>

      <Card className="p-4 space-y-4 shadow">
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
        <div className="text-sm text-muted-foreground pt-2 border-t">
           {isLoading ? (
             <Skeleton className="h-4 w-40" />
           ) : (
            `Mostrando ${filteredCourses.length} cursos disponibles.`
           )}
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <CourseCardSkeleton key={i} />)}
                </div>
            </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error al cargar el catálogo</p>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {courses.map((course: AppCourseType, index: number) => (
                                <CourseCard 
                                    key={course.id} 
                                    course={{...course, isEnrolled: enrolledCourseIds.includes(course.id)}}
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
        <div className="text-center py-12">
          <PackageX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ningún curso disponible</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'No hay cursos que coincidan con tu búsqueda.' 
              : 'Actualmente no hay cursos publicados que cumplan con los criterios de visualización.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
