
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import type { Course as AppCourseType, CourseStatus, UserRole } from '@/types'; 
import { Search, PackageX, Loader2, AlertTriangle } from 'lucide-react'; 
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse } from '@prisma/client';
import { Card } from '@/components/ui/card';

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
  const [allApiCourses, setAllApiCourses] = useState<ApiCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  
  const [enrollmentUpdatedSignal, setEnrollmentUpdatedSignal] = useState(0);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/courses', { cache: 'no-store' }); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch courses: ${response.statusText}`);
      }
      const data: ApiCourse[] = await response.json();
      setAllApiCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar cursos');
      setAllApiCourses([]);
      toast({ title: "Error al cargar cursos", description: err instanceof Error ? err.message : 'No se pudieron cargar los cursos.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses, enrollmentUpdatedSignal]); 

  const allCoursesForDisplay = useMemo(() => allApiCourses.map(mapApiCourseToAppCourse), [allApiCourses]);
  
  const filteredCourses = useMemo(() => {
    return allCoursesForDisplay.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const isNotOwnCourse = !user || course.instructorId !== user.id;

      return matchesSearch && isNotOwnCourse && course.status === 'PUBLISHED';
    });
  }, [allCoursesForDisplay, searchTerm, user]);

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
    setEnrollmentUpdatedSignal(prev => prev + 1); 
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Catálogo de Cursos</h1>
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
          Mostrando {filteredCourses.length} de {allCoursesForDisplay.filter(c => (!user || c.instructorId !== user.id) && c.status === 'PUBLISHED').length} cursos publicados disponibles.
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Cargando catálogo de cursos...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error al cargar el catálogo</p>
          <p className="text-sm">{error}</p>
          <Button onClick={fetchCourses} variant="outline" className="mt-4">Reintentar</Button>
        </div>
      ) : Object.keys(groupedCourses).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedCourses).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, courses]) => (
                <section key={category}>
                    <h2 className="text-2xl font-semibold font-headline mb-4">{category}</h2>
                     <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {courses.map((course: AppCourseType) => (
                            <CourseCard 
                                key={course.id} 
                                course={course} 
                                userRole={user?.role || null}
                                onEnrollmentChange={handleEnrollmentChange}
                            />
                        ))}
                    </div>
                </section>
            ))}
          </div>
      ) : (
        <div className="text-center py-12">
          <PackageX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ningún curso encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'Prueba a cambiar el término de búsqueda.' 
              : 'Actualmente no hay cursos publicados disponibles.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
