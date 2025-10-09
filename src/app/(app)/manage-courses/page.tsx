
// src/app/(app)/manage-courses/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, List, Edit, Users, Grid, ListPlus, Loader2, AlertTriangle, ShieldAlert, MoreVertical, Archive, ArchiveRestore, Trash2, Eye, HelpCircle, LineChart, BookOpen, Layers, Check, Award } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import type { Course as AppCourseType, CourseStatus, UserRole, User } from '@/types';
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCreationForm } from '@/components/course-creation-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SmartPagination } from '@/components/ui/pagination';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCard } from '@/components/course-card';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { manageCoursesTour } from '@/lib/tour-steps';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRoleBadgeVariant, getRoleInSpanish } from '@/lib/security-log-utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { CourseAssignmentModal } from '@/components/course-assignment-modal';


interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | 'status' | 'prerequisite' | 'isMandatory'> {
  instructor: { id: string; name: string, avatar: string | null } | null;
  status: CourseStatus;
  _count: {
    modules: number;
    enrollments: number;
  };
  averageCompletion?: number;
  isMandatory: boolean;
}

const PAGE_SIZE = 8;

const getStatusInSpanish = (status: CourseStatus) => {
    switch (status) {
        case 'DRAFT': return 'Borrador';
        case 'PUBLISHED': return 'Publicado';
        case 'ARCHIVED': return 'Archivado';
        default: return status;
    }
};


export default function ManageCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();

  const [allCourses, setAllCourses] = useState<AppCourseType[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AppCourseType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [courseToAssign, setCourseToAssign] = useState<AppCourseType | null>(null);

  const activeTab = searchParams.get('tab') || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalCourses / PAGE_SIZE);
  
  useEffect(() => {
    setPageTitle('Gestionar Cursos');
    startTour('manageCourses', manageCoursesTour);
  }, [setPageTitle, startTour]);

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
  
  const fetchCourses = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set('manageView', 'true');
      params.set('userId', user.id);
      params.set('userRole', user.role);

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
  }, [user, toast, searchParams]);


  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?${createQueryString({ tab, page: 1 })}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page })}`);
  };
  
  const handleCreationSuccess = (newCourseId: string) => {
    setShowCreateModal(false);
    toast({
        title: '¡Curso Creado!',
        description: 'Serás redirigido a la página de edición para añadir contenido.',
    });
    router.push(`/manage-courses/${newCourseId}/edit`);
  };

  const handleChangeStatus = async (courseId: string, newStatus: CourseStatus) => {
    setIsProcessing(true);
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
      fetchCourses(); // Re-fetch
    } catch (err) {
      toast({ title: 'Error al Cambiar Estado', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsProcessing(true);
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
        fetchCourses();
    } catch (err) {
        toast({ title: 'Error al Eliminar', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsProcessing(false);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(PAGE_SIZE)].map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent>
            <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
            </Card>
        ))}
    </div>
  );
  
  const ListView = () => (
    <Card>
      <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[30%]">Curso</TableHead>
                    <TableHead className="w-[20%]">Instructor/a</TableHead>
                    <TableHead className="text-center">Estadísticas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {isLoading ? (
                    [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-16 rounded-md" /><div className="space-y-1"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                            <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
                            <TableCell><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                        </TableRow>
                    ))
                 ) : allCourses.map(course => (
                     <TableRow key={course.id}>
                        <TableCell>
                           <div className="flex items-center gap-4">
                                <Image src={course.imageUrl || `https://placehold.co/64x36.png`} alt={course.title} width={64} height={36} className="w-16 h-9 object-cover rounded-md bg-muted" quality={100} />
                                <div>
                                    <Link href={`/manage-courses/${course.id}/edit`} className="font-semibold text-foreground hover:underline">{course.title}</Link>
                                    <p className="text-xs text-muted-foreground">{course.category}</p>
                                </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={course.instructor?.avatar || undefined} />
                                <AvatarFallback className="text-xs"><Identicon userId={course.instructor?.id || ''}/></AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{course.instructor.name}</span>
                           </div>
                        </TableCell>
                         <TableCell>
                             <div className="flex items-center justify-center gap-6">
                                <div className="text-center"><div className="font-bold">{course.enrollmentsCount}</div><div className="text-xs text-muted-foreground">Inscritos</div></div>
                                <div className="text-center"><div className="font-bold">{Math.round(course.averageCompletion || 0)}%</div><div className="text-xs text-muted-foreground">Completado</div></div>
                                <div className="text-center"><div className="font-bold">{course.modulesCount}</div><div className="text-xs text-muted-foreground">Módulos</div></div>
                             </div>
                         </TableCell>
                         <TableCell>
                            <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>{getStatusInSpanish(course.status)}</Badge>
                         </TableCell>
                         <TableCell className="text-right">
                             <ManagementDropdown course={course} onStatusChange={handleChangeStatus} onDelete={setCourseToDelete} onAssign={() => setCourseToAssign(course)} isProcessing={isProcessing} />
                         </TableCell>
                     </TableRow>
                 ))}
            </TableBody>
        </Table>
      </div>
    </Card>
  );

  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="course-list-container">
      {allCourses.map(course => (
          <CourseCard 
              key={course.id}
              course={course}
              userRole={user?.role || null}
              viewMode="management"
              onStatusChange={handleChangeStatus}
              onDelete={setCourseToDelete}
              onAssign={() => setCourseToAssign(course)}
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
        <div className="flex flex-row flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4"/></Button>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => forceStartTour('manageCourses', manageCoursesTour)}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Ver Guía
            </Button>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                    <Button id="create-course-btn">
                        <PlusCircle className="mr-2 h-4 w-4" /> Crear Curso
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] flex flex-col">
                    <DialogHeader className="p-6 pb-0"><DialogTitle>Crear Nuevo Curso</DialogTitle><DialogDescription>Sigue los pasos para crear la base de tu nuevo curso.</DialogDescription></DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 thin-scrollbar"><CourseCreationForm onSuccess={handleCreationSuccess} /></div>
                </DialogContent>
            </Dialog>
         </div>
      </div>

       <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" id="course-status-tabs">
          <TabsList className="h-auto flex-wrap justify-start md:h-10 md:flex-nowrap">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Publicados</TabsTrigger>
            <TabsTrigger value="DRAFT">Borradores</TabsTrigger>
            <TabsTrigger value="ARCHIVED">Archivados</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            {isLoading ? (
               <CourseListSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-destructive text-center">
                <AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">Error al Cargar Cursos</p><p className="text-sm">{error}</p>
                <Button onClick={() => fetchCourses()} variant="outline" className="mt-4">Reintentar</Button>
              </div>
            ) : allCourses.length > 0 ? (
                 viewMode === 'grid' ? <GridView /> : <ListView />
            ) : (
                <div className="text-center py-12">
                    <ListPlus className="mx-auto h-12 w-12 text-primary mb-4" /><h3 className="text-xl font-semibold mb-2">No hay cursos en esta sección</h3><p className="text-muted-foreground">No se encontraron cursos que coincidan con este estado.</p>
                </div>
            )}
          </div>
       </Tabs>
      
        {totalPages > 1 && !isLoading && (
            <SmartPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
        )}

      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader><AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible. Se eliminará permanentemente el curso "<strong>{courseToDelete?.title}</strong>" y todos sus datos asociados, incluyendo módulos, lecciones, inscripciones y progreso de los estudiantes.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-0">
                <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCourse} disabled={isProcessing} className={buttonVariants({ variant: "destructive" })}>{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Sí, eliminar curso</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {courseToAssign && (
        <CourseAssignmentModal
            isOpen={!!courseToAssign}
            onClose={() => setCourseToAssign(null)}
            courseId={courseToAssign.id}
            courseTitle={courseToAssign.title}
        />
      )}
    </div>
  );
}

const ManagementDropdown = ({ course, onStatusChange, onDelete, onAssign, isProcessing }: {
    course: AppCourseType,
    onStatusChange?: (courseId: string, newStatus: CourseStatus) => void,
    onDelete?: (course: AppCourseType) => void,
    onAssign?: () => void,
    isProcessing: boolean,
}) => {
    const handleAction = (e: React.MouseEvent, action?: () => void) => {
        e.stopPropagation();
        e.preventDefault();
        action?.();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                    <MoreVertical className="h-4 w-4"/>
                    <span className="sr-only">Más opciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                <DropdownMenuItem asChild><Link href={`/manage-courses/${course.id}/edit`}><Edit className="mr-2 h-4 w-4"/> Editar</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href={`/courses/${course.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/> Vista Previa</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href={`/enrollments?courseId=${course.id}`}><Users className="mr-2 h-4 w-4"/> Ver Inscritos</Link></DropdownMenuItem>
                {course.isMandatory && <DropdownMenuItem onSelect={(e) => handleAction(e, onAssign)}><Users className="mr-2 h-4 w-4"/>Asignar Curso</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'PUBLISHED'))} disabled={isProcessing || course.status === 'PUBLISHED'}>Publicar</DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'ARCHIVED'))} disabled={isProcessing || course.status === 'ARCHIVED'}>Archivar</DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'DRAFT'))} disabled={isProcessing || course.status === 'DRAFT'}>Mover a Borrador</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onDelete?.(course))} disabled={isProcessing} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/> Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

