

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListPlus, Edit, Users, Zap, CircleOff, Loader2, AlertTriangle, ShieldAlert, MoreVertical, Archive, ArchiveRestore, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import type { Course as AppCourseType, CourseStatus, UserRole } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCreationForm } from '@/components/course-creation-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCard } from '@/components/course-card';
import { useTitle } from '@/contexts/title-context';

interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor: { id: string; name: string } | null;
  modulesCount: number;
  lessonsCount: number;
  status: CourseStatus;
}

const PAGE_SIZE = 6;

function mapApiCourseToAppCourse(apiCourse: ApiCourseForManage): AppCourseType {
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description || '',
    category: apiCourse.category || undefined,
    instructor: apiCourse.instructor?.name || 'N/A',
    instructorId: apiCourse.instructorId || undefined,
    imageUrl: apiCourse.imageUrl || undefined,
    modulesCount: apiCourse.modulesCount ?? 0,
    status: apiCourse.status,
    modules: [],
  };
}


export default function ManageCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();

  const [allCourses, setAllCourses] = useState<AppCourseType[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [courseUpdateSignal, setCourseUpdateSignal] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AppCourseType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const activeTab = searchParams.get('tab') || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalCourses / PAGE_SIZE);
  
  useEffect(() => {
    setPageTitle('Gestionar Cursos');
  }, [setPageTitle]);

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        params.set(name, String(value));
      });
      return params.toString();
    },
    [searchParams]
  );
  
  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?${createQueryString({ tab, page: 1 })}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page })}`);
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ 
          manageView: 'true',
          page: String(currentPage),
          pageSize: String(PAGE_SIZE),
          tab: activeTab
        });
        
        if (user.role === 'ADMINISTRATOR' || user.role === 'INSTRUCTOR') {
          params.append('userId', user.id);
          params.append('userRole', user.role as string);
        } else {
          setIsLoading(false);
          setError("Acceso no autorizado para gestionar cursos.");
          setAllCourses([]);
          return;
        }
        
        const response = await fetch(`/api/courses?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch courses: ${response.statusText}`);
        }
        const data: { courses: ApiCourseForManage[], totalCourses: number } = await response.json();
        const appCourses = data.courses.map(mapApiCourseToAppCourse);
        setAllCourses(appCourses);
        setTotalCourses(data.totalCourses);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar cursos');
        setAllCourses([]);
        toast({ title: "Error al cargar cursos", description: err instanceof Error ? err.message : 'No se pudieron cargar los cursos.', variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user.role === 'ADMINISTRATOR' || user.role === 'INSTRUCTOR') {
      fetchCourses();
    } else {
      setIsLoading(false);
      setError("Solo Administradores e Instructores pueden gestionar cursos desde esta sección.");
      setAllCourses([]);
    }
  }, [user, toast, currentPage, activeTab, courseUpdateSignal]);

  const handleCreationSuccess = (newCourseId: string) => {
    setShowCreateModal(false);
    toast({
        title: '¡Curso Creado!',
        description: 'Serás redirigido a la página de edición para añadir contenido.',
    });
    router.push(`/manage-courses/${newCourseId}/edit`);
  };

  const handleChangeStatus = async (courseId: string, newStatus: CourseStatus) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update course status');
      }
      toast({
        title: 'Estado Actualizado',
        description: `El estado del curso ha sido actualizado.`,
      });
      setCourseUpdateSignal(prev => prev + 1);
    } catch (err) {
      toast({ title: 'Error al Cambiar Estado', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
        const response = await fetch(`/api/courses/${courseToDelete.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete course');
        }
        toast({
            title: 'Curso Eliminado',
            description: `El curso "${courseToDelete.title}" ha sido eliminado exitosamente.`,
        });
        setCourseUpdateSignal(prev => prev + 1);
    } catch (err) {
        toast({ title: 'Error al Eliminar', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setCourseToDelete(null);
    }
  };

  if (user && user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR' && !isLoading && allCourses.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground max-w-md">
                Esta sección es para la gestión de cursos y está restringida a administradores e instructores.
            </p>
            <Button asChild className="mt-6">
                <Link href="/dashboard">Volver al Panel Principal</Link>
            </Button>
        </div>
    );
  }

  const CourseListSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(PAGE_SIZE)].map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-9 w-full" />
            </CardFooter>
            </Card>
        ))}
    </div>
  );
  
  const MobileManagementList = () => (
      <div className="space-y-4">
          {allCourses.map(course => (
              <CourseCard 
                  key={course.id}
                  course={course}
                  userRole={user?.role || null}
                  viewMode="management"
                  onStatusChange={handleChangeStatus}
                  onDelete={setCourseToDelete}
              />
          ))}
      </div>
  );
  
   const DesktopManagementGrid = () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCourses.map(course => (
              <CourseCard 
                  key={course.id}
                  course={course}
                  userRole={user?.role || null}
                  viewMode="management"
                  onStatusChange={handleChangeStatus}
                  onDelete={setCourseToDelete}
              />
          ))}
      </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <p className="text-muted-foreground">Administradores e Instructores: Creen, editen y organicen los cursos.</p>
        </div>
        {(user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') && (
         <div className="flex flex-row flex-wrap items-center gap-2">
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Curso
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle>Crear Nuevo Curso</DialogTitle>
                    <DialogDescription>
                      Sigue los pasos para crear la base de tu nuevo curso. Serás redirigido para añadir contenido al finalizar.
                    </DialogDescription>
                    </DialogHeader>
                    <CourseCreationForm onSuccess={handleCreationSuccess} />
                </DialogContent>
            </Dialog>
         </div>
        )}
      </div>

       <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="h-auto flex-wrap justify-start md:h-10 md:flex-nowrap">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Publicados</TabsTrigger>
            <TabsTrigger value="DRAFT">Borradores</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Programados</TabsTrigger>
            <TabsTrigger value="ARCHIVED">Archivados</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            {isLoading ? (
               <CourseListSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-destructive text-center">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Error al Cargar Cursos</p>
                <p className="text-sm">{error}</p>
                <Button onClick={() => setCourseUpdateSignal(s => s + 1)} variant="outline" className="mt-4">Reintentar</Button>
              </div>
            ) : allCourses.length > 0 ? (
                 isMobile ? <MobileManagementList /> : <DesktopManagementGrid />
            ) : (
                <div className="text-center py-12">
                    <ListPlus className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay cursos en esta sección</h3>
                    <p className="text-muted-foreground">No se encontraron cursos que coincidan con este estado.</p>
                </div>
            )}
          </div>
       </Tabs>
      
        {totalPages > 1 && !isLoading && (
            <Pagination className="mt-8">
                <PaginationContent>
                    <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>
                            {i + 1}
                        </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        )}

      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción es irreversible. Se eliminará permanentemente el curso "<strong>{courseToDelete?.title}</strong>" 
                    y todos sus datos asociados, incluyendo módulos, lecciones, inscripciones y progreso de los estudiantes.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-0">
                <AlertDialogCancel onClick={() => setCourseToDelete(null)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteCourse}
                    disabled={isDeleting}
                    className={buttonVariants({ variant: "destructive" })}
                >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Sí, eliminar curso
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
