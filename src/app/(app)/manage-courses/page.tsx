
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor: { id: string; name: string } | null;
  modulesCount: number;
  lessonsCount: number;
  status: CourseStatus;
}

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

const CourseListItemImage = ({ src, alt, defaultSrc }: { src?: string | null; alt: string; defaultSrc: string }) => {
  const [currentSrc, setCurrentSrc] = useState(src || defaultSrc);

  useEffect(() => {
    setCurrentSrc(src || defaultSrc);
  }, [src, defaultSrc]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={600}
      height={300}
      className="aspect-video object-cover"
      data-ai-hint="course online learning"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={() => {
        if (currentSrc !== defaultSrc) { 
          setCurrentSrc(defaultSrc);
        }
      }}
    />
  );
};


export default function ManageCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [courses, setCourses] = useState<AppCourseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);
  
  const [courseUpdateSignal, setCourseUpdateSignal] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AppCourseType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchCourses = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({ manageView: 'true' });
      
      if (user.role === 'ADMINISTRATOR' || user.role === 'INSTRUCTOR') {
        queryParams.append('userId', user.id);
        queryParams.append('userRole', user.role as string);
      } else {
        setIsLoading(false);
        setError("Acceso no autorizado para gestionar cursos.");
        setCourses([]);
        return;
      }
      
      const response = await fetch(`/api/courses?${queryParams.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch courses: ${response.statusText}`);
      }
      const data: ApiCourseForManage[] = await response.json();
      const appCourses = data.map(mapApiCourseToAppCourse);
      setCourses(appCourses);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar cursos');
      setCourses([]);
      toast({ title: "Error al cargar cursos", description: err instanceof Error ? err.message : 'No se pudieron cargar los cursos.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
      fetchCourses();
    } else if (user) {
      setIsLoading(false);
      setError("Solo Administradores e Instructores pueden gestionar cursos desde esta sección.");
      setCourses([]);
    } else {
        setIsLoading(false);
    }
  }, [fetchCourses, user, courseUpdateSignal]);

  const handleCreationSuccess = () => {
    setShowCreateModal(false);
    setCourseUpdateSignal(prev => prev + 1);
  };

  const handleChangeStatus = async (courseId: string, newStatus: CourseStatus) => {
    setIsChangingStatus(courseId);
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
    } finally {
      setIsChangingStatus(null);
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
        setCourseUpdateSignal(prev => prev + 1); // This will trigger a re-fetch
    } catch (err) {
        toast({ title: 'Error al Eliminar', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setCourseToDelete(null);
    }
  };

  const getStatusBadgeVariant = (status: CourseStatus) => {
    switch (status) {
      case 'PUBLISHED': return 'default';
      case 'DRAFT': return 'secondary';
      case 'ARCHIVED': return 'outline';
      case 'SCHEDULED': return 'default';
      default: return 'outline';
    }
  };
  const getStatusBadgeText = (status: CourseStatus) => {
    switch (status) {
      case 'PUBLISHED': return 'Publicado';
      case 'DRAFT': return 'Borrador';
      case 'ARCHIVED': return 'Archivado';
      case 'SCHEDULED': return 'Programado';
      default: return status;
    }
  };


  if (user && user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR' && !isLoading && courses.length === 0) {
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

  const CourseList = ({ courseList }: { courseList: AppCourseType[] }) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {[...Array(4)].map((_, i) => (
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
                 <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (courseList.length === 0) {
      return (
        <div className="text-center py-12">
          <ListPlus className="mx-auto h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay cursos en esta sección</h3>
          <p className="text-muted-foreground">No se encontraron cursos que coincidan con este estado.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {courseList.map(course => (
          <Card key={course.id} className="flex flex-col overflow-hidden shadow-md">
            <CourseListItemImage
              src={course.imageUrl}
              alt={course.title}
              defaultSrc="https://placehold.co/600x300.png"
            />
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                  <CardTitle className="line-clamp-2 flex-grow pr-2">{course.title}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(course.status)} className="ml-2 shrink-0 capitalize">
                      {getStatusBadgeText(course.status)}
                  </Badge>
              </div>
              <CardDescription>Instructor: {course.instructor}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
               <div className="text-xs text-muted-foreground mt-2">Módulos: {course.modulesCount}</div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Más opciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/manage-courses/${course.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4 text-blue-500" /> Editar Contenido
                    </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <Link href={`/courses/${course.id}`} target="_blank">
                      <Eye className="mr-2 h-4 w-4 text-sky-500" /> Vista Previa
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/enrollments?courseId=${course.id}`}>
                      <Users className="mr-2 h-4 w-4 text-green-500" /> Ver Inscritos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {course.status !== 'ARCHIVED' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleChangeStatus(course.id, course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                        disabled={isChangingStatus === course.id}
                      >
                        {isChangingStatus === course.id && (course.status === 'PUBLISHED' || course.status === 'DRAFT') ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : course.status === 'PUBLISHED' ? (
                          <CircleOff className="mr-2 h-4 w-4 text-gray-500" />
                        ) : (
                          <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                        )}
                        <span>{course.status === 'PUBLISHED' ? 'Pasar a Borrador' : 'Publicar'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleChangeStatus(course.id, 'ARCHIVED')}
                        disabled={isChangingStatus === course.id}
                        className="text-amber-600 focus:bg-amber-100 focus:text-amber-800 dark:text-amber-400 dark:focus:bg-amber-900/40 dark:focus:text-amber-300"
                      >
                         {isChangingStatus === course.id && (course.status !== 'ARCHIVED') ? null : <Archive className="mr-2 h-4 w-4" />}
                         Archivar
                      </DropdownMenuItem>
                    </>
                  )}
                  {course.status === 'ARCHIVED' && (
                    <DropdownMenuItem
                      onClick={() => handleChangeStatus(course.id, 'DRAFT')}
                      disabled={isChangingStatus === course.id}
                    >
                      {isChangingStatus === course.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArchiveRestore className="mr-2 h-4 w-4 text-emerald-600" />
                      )}
                      <span>Restaurar (a Borrador)</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                      onClick={() => setCourseToDelete(course)}
                      disabled={isChangingStatus === course.id}
                      className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground"
                  >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2">Gestión de Cursos</h1>
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

       {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {[...Array(4)].map((_, i) => (
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
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive text-center">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Error al Cargar Cursos</p>
              <p className="text-sm">{error}</p>
              <Button onClick={fetchCourses} variant="outline" className="mt-4">Reintentar</Button>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="h-auto flex-wrap justify-start md:h-10 md:flex-nowrap">
                <TabsTrigger value="all">Todos ({courses.length})</TabsTrigger>
                <TabsTrigger value="PUBLISHED">Publicados ({courses.filter(c => c.status === 'PUBLISHED').length})</TabsTrigger>
                <TabsTrigger value="DRAFT">Borradores ({courses.filter(c => c.status === 'DRAFT').length})</TabsTrigger>
                <TabsTrigger value="SCHEDULED">Programados ({courses.filter(c => c.status === 'SCHEDULED').length})</TabsTrigger>
                <TabsTrigger value="ARCHIVED">Archivados ({courses.filter(c => c.status === 'ARCHIVED').length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <CourseList courseList={courses} />
              </TabsContent>
              <TabsContent value="PUBLISHED">
                <CourseList courseList={courses.filter(c => c.status === 'PUBLISHED')} />
              </TabsContent>
              <TabsContent value="DRAFT">
                <CourseList courseList={courses.filter(c => c.status === 'DRAFT')} />
              </TabsContent>
              <TabsContent value="SCHEDULED">
                <CourseList courseList={courses.filter(c => c.status === 'SCHEDULED')} />
              </TabsContent>
               <TabsContent value="ARCHIVED">
                <CourseList courseList={courses.filter(c => c.status === 'ARCHIVED')} />
              </TabsContent>
            </Tabs>
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
