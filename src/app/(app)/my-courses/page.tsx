'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { CourseCard } from '@/components/course-card';
import type { EnrolledCourse, UserRole, Course as AppCourseType } from '@/types'; 
import { GraduationCap, Loader2, AlertTriangle, Info, Search } from 'lucide-react';
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

type FilterStatus = 'all' | 'in-progress' | 'completed';

export default function MyCoursesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();
  
  const [myEnrolledCourses, setMyEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isFetchingPageData, setIsFetchingPageData] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setPageTitle('Mis Cursos');
  }, [setPageTitle]);

  const fetchMyEnrollments = useCallback(async () => {
    // CORRECCIÓN: Guarda estricta para asegurar que 'user' existe antes de continuar.
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
      // CORRECCIÓN: Mapeo seguro, verificando que 'item' y 'item.course' existan.
      const mappedCourses: EnrolledCourse[] = data
        .filter(item => item && item.course) // Solo procesar elementos válidos
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
      }));
      setMyEnrolledCourses(mappedCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar tus cursos inscritos');
      setMyEnrolledCourses([]);
      toast({ title: "Error al cargar cursos", description: err instanceof Error ? err.message : 'No se pudieron cargar tus cursos inscritos.', variant: "destructive"});
    } finally {
      setIsFetchingPageData(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    // Lógica simplificada: fetch solo cuando el usuario está definido.
    if (user) {
      fetchMyEnrollments();
    } else if (!isAuthLoading) {
      setIsFetchingPageData(false);
      setMyEnrolledCourses([]);
    }
}, [user, isAuthLoading, fetchMyEnrollments]);

  const { completedCourses, inProgressCourses } = useMemo(() => {
      const completed = myEnrolledCourses
        .filter(c => c.progressPercentage === 100)
        .filter(c => c.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const inProgress = myEnrolledCourses
        .filter(c => c.progressPercentage < 100)
        .filter(c => c.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      
      if (filterStatus === 'completed') return { completedCourses: completed, inProgressCourses: [] };
      if (filterStatus === 'in-progress') return { completedCourses: [], inProgressCourses: inProgress };

      return { completedCourses: completed, inProgressCourses: inProgress };

  }, [myEnrolledCourses, filterStatus, debouncedSearchTerm]);


  const handleEnrollmentChangeOnPage = (courseId: string, newStatus: boolean) => {
    if (!newStatus) {
        setMyEnrolledCourses(prev => prev.filter(c => c.id !== courseId));
    } else {
        fetchMyEnrollments();
    }
  };

  if (isAuthLoading || isFetchingPageData) {
    return (
      <div className="space-y-8">
          <div>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {[...Array(4)].map((_, i) => (
                <Card key={i} className="flex flex-col overflow-hidden">
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
             ))}
          </div>
      </div>
    );
  }

  const pageDescription = "Continúa tu aprendizaje y revisa tu progreso en los cursos a los que te has unido.";


  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

       <Card className="p-4 space-y-4 shadow">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar en mis cursos..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button 
                    variant={filterStatus === 'all' ? 'secondary' : 'ghost'} 
                    onClick={() => setFilterStatus('all')}
                    className="flex-1 md:flex-none"
                >
                    Todos
                </Button>
                 <Button 
                    variant={filterStatus === 'in-progress' ? 'secondary' : 'ghost'} 
                    onClick={() => setFilterStatus('in-progress')}
                    className="flex-1 md:flex-none"
                >
                    En Progreso
                </Button>
                 <Button 
                    variant={filterStatus === 'completed' ? 'secondary' : 'ghost'} 
                    onClick={() => setFilterStatus('completed')}
                    className="flex-1 md:flex-none"
                >
                    Completados
                </Button>
            </div>
        </div>
      </Card>


      {error && (
         <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Error al Cargar Cursos</p>
            <p className="text-sm">{error}</p>
            <Button onClick={fetchMyEnrollments} variant="outline" className="mt-4">Reintentar</Button>
        </div>
      )}

      {!isFetchingPageData && !error && user && (
        <div className="space-y-12">
            {inProgressCourses.length > 0 && (
                <section>
                    <h2 className="text-2xl font-semibold font-headline mb-4">Continuar Aprendiendo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

            {completedCourses.length > 0 && (
                <section>
                    <h2 className="text-2xl font-semibold font-headline mb-4">Cursos Completados</h2>
                    <div className="space-y-4">
                        {completedCourses.map((course, index) => (
                            <CourseCard 
                                key={course.id} 
                                course={course} 
                                userRole={user.role} 
                                onEnrollmentChange={handleEnrollmentChangeOnPage}
                                priority={index < 2}
                            />
                        ))}
                    </div>
                </section>
            )}

            {myEnrolledCourses.length === 0 ? (
                <EmptyState
                    icon={GraduationCap}
                    title="Aún no estás inscrito en ningún curso"
                    description={<>Visita el <Link href="/courses" className="font-medium text-primary hover:underline">catálogo de cursos</Link> para encontrar tu próxima aventura de aprendizaje.</>}
                    imageUrl={settings?.emptyStateMyCoursesUrl}
                />
            ) : inProgressCourses.length === 0 && completedCourses.length === 0 ? (
                 <EmptyState
                    icon={Search}
                    title="No se encontraron cursos"
                    description="Ninguno de tus cursos coincide con los filtros de búsqueda actuales."
                    imageUrl={settings?.emptyStateMyCoursesUrl}
                />
            ) : null}
        </div>
      )}
      
      {!user && !isAuthLoading && !isFetchingPageData && (
         <Alert variant="default" className="mt-8">
            <Info className="h-4 w-4" />
            <AlertTitle>Usuario no autenticado</AlertTitle>
            <AlertDescription>
              Por favor, <Link href="/sign-in" className="font-medium text-primary hover:underline">inicia sesión</Link> para ver tus cursos inscritos.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
