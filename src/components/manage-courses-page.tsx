// src/components/manage-courses-page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  PlusCircle, List, Grid, Filter, UserPlus, MoreVertical, Loader2, 
  AlertTriangle, ShieldAlert, Archive, ArchiveRestore, Trash2, Eye, 
  HelpCircle, LineChart, BookOpen, Layers, Check, Award, BookMarked,
  Users, Edit, TrendingUp, Clock, Target, Search, X
} from 'lucide-react';
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
import { useRealtime } from '@/hooks/use-realtime';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | 'status' | 'prerequisite' | 'isMandatory'> {
  instructor: { id: string; name: string, avatar: string | null } | null;
  status: CourseStatus;
  _count: {
    modules: number;
    enrollments: number;
    lessons?: number;
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

const getStatusColor = (status: CourseStatus) => {
    switch (status) {
        case 'DRAFT': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
        case 'PUBLISHED': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
        case 'ARCHIVED': return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20';
        default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20';
    }
};

function ManageCoursesPageComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();
  const isMobile = useIsMobile();

  const [allCourses, setAllCourses] = useState<AppCourseType[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AppCourseType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [courseToAssign, setCourseToAssign] = useState<AppCourseType | null>(null);

  const activeTab = searchParams.get('tab') || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;

  // Filtrar cursos por búsqueda
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return allCourses;
    
    const query = searchQuery.toLowerCase();
    return allCourses.filter(course => 
      course.title.toLowerCase().includes(query) ||
      course.category?.toLowerCase().includes(query) ||
      course.instructor?.name.toLowerCase().includes(query)
    );
  }, [allCourses, searchQuery]);

  const totalPages = Math.ceil(totalCourses / PAGE_SIZE);

  // Estadísticas generales
  const stats = useMemo(() => {
    const published = allCourses.filter(c => c.status === 'PUBLISHED').length;
    const draft = allCourses.filter(c => c.status === 'DRAFT').length;
    const archived = allCourses.filter(c => c.status === 'ARCHIVED').length;
    const totalEnrollments = allCourses.reduce((acc, c) => acc + (c.enrollmentsCount || 0), 0);
    const avgCompletion = allCourses.length > 0 
      ? allCourses.reduce((acc, c) => acc + (c.averageCompletion || 0), 0) / allCourses.length 
      : 0;

    return { published, draft, archived, totalEnrollments, avgCompletion };
  }, [allCourses]);

  // --- Realtime Logic ---
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (payload.event === 'course_deleted') {
        setAllCourses(prev => prev.filter(c => c.id !== payload.payload.id));
        setTotalCourses(prev => Math.max(0, prev - 1));
        toast({
            title: "Curso eliminado",
            description: "Un curso fue eliminado por otro administrador.",
        });
    } else if (payload.event === 'course_updated') {
        setAllCourses(prev => prev.map(c => 
            c.id === payload.payload.id ? { ...c, ...payload.payload } : c
        ));
        toast({
            title: "Curso actualizado",
            description: "Un curso fue modificado por otro administrador.",
        });
    } else if (payload.event === 'course_created') {
        fetchCourses();
    }
  }, [toast]);
  
  useRealtime('courses', handleRealtimeEvent);
  // --------------------
  
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
        throw new Error(errorData.message || `Error al cargar cursos: ${response.statusText}`);
      }
      const data: { courses: ApiCourseForManage[], totalCourses: number } = await response.json();
      const appCourses = data.courses.map(mapApiCourseToAppCourse);
      setAllCourses(appCourses);
      setTotalCourses(data.totalCourses);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar cursos';
      setError(errorMessage);
      setAllCourses([]);
      toast({ 
        title: "Error al cargar cursos", 
        description: errorMessage, 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, searchParams]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleTabChange = (tab: string) => {
    setSearchQuery(''); // Limpiar búsqueda al cambiar de tab
    router.push(`${pathname}?${createQueryString({ tab, page: 1 })}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page })}`);
  };
  
  const handleCreationSuccess = (newCourseId: string) => {
    setShowCreateModal(false);
    toast({
        title: '¡Curso Creado Exitosamente!',
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
        throw new Error(errorData.message || 'Error al actualizar el estado del curso');
      }
      toast({
        title: '✓ Estado Actualizado',
        description: `El curso ahora está en estado: ${getStatusInSpanish(newStatus)}`,
      });
      await fetchCourses();
    } catch (err) {
      toast({ 
        title: 'Error al Cambiar Estado', 
        description: (err as Error).message, 
        variant: 'destructive' 
      });
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
            throw new Error(errorData.message || 'Error al eliminar el curso');
        }
        toast({
            title: '✓ Curso Eliminado',
            description: `El curso "${courseToDelete.title}" ha sido eliminado exitosamente.`,
        });
        await fetchCourses();
    } catch (err) {
        toast({ 
          title: 'Error al Eliminar', 
          description: (err as Error).message, 
          variant: 'destructive' 
        });
    } finally {
        setIsProcessing(false);
        setCourseToDelete(null);
    }
  };

  // Verificar permisos
  if (user && user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <div className="rounded-full bg-destructive/10 p-6 mb-6">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground max-w-md mb-6">
                Esta sección es para la gestión de cursos y está restringida a administradores e instructores.
            </p>
            <Button asChild size="lg">
                <Link href="/dashboard">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Volver al Panel Principal
                </Link>
            </Button>
        </div>
    );
  }

  const CourseListSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(PAGE_SIZE)].map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
        ))}
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={cn("rounded-full p-3", color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const ListView = () => (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[30%] font-semibold">Curso</TableHead>
                    <TableHead className="w-[20%] font-semibold">Instructor/a</TableHead>
                    <TableHead className="text-center font-semibold">Estadísticas</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {isLoading ? (
                    [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-16 rounded-md" />
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-48" />
                                  <Skeleton className="h-3 w-32" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-24 mx-auto" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-20 rounded-full" />
                            </TableCell>
                            <TableCell className="text-right">
                              <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                            </TableCell>
                        </TableRow>
                    ))
                 ) : filteredCourses.map(course => (
                     <TableRow key={course.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell>
                           <div className="flex items-center gap-4">
                                <div className="relative h-10 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  <Image 
                                    src={course.imageUrl || `https://placehold.co/64x36/e2e8f0/64748b?text=${course.title.charAt(0)}`} 
                                    alt={course.title} 
                                    fill
                                    className="object-cover" 
                                    quality={100}
                                  />
                                </div>
                                <div className="min-w-0">
                                    <Link 
                                      href={`/manage-courses/${course.id}/edit`} 
                                      className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                                    >
                                      {course.title}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">{course.category}</p>
                                </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={course.instructor?.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  <Identicon userId={course.instructor?.id || ''}/>
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{course.instructor?.name || 'Sin instructor'}</span>
                           </div>
                        </TableCell>
                         <TableCell>
                             <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                  <div className="font-bold text-lg">{course.enrollmentsCount || 0}</div>
                                  <div className="text-xs text-muted-foreground">Inscritos</div>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                  <div className="font-bold text-lg">{Math.round(course.averageCompletion || 0)}%</div>
                                  <div className="text-xs text-muted-foreground">Progreso</div>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                  <div className="font-bold text-lg">{course.modulesCount || 0}</div>
                                  <div className="text-xs text-muted-foreground">Módulos</div>
                                </div>
                             </div>
                         </TableCell>
                         <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn("font-medium", getStatusColor(course.status))}
                            >
                              {getStatusInSpanish(course.status)}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-right">
                             <ManagementDropdown 
                               course={course} 
                               onStatusChange={handleChangeStatus} 
                               onDelete={setCourseToDelete} 
                               onAssign={() => setCourseToAssign(course)} 
                               isProcessing={isProcessing} 
                             />
                         </TableCell>
                     </TableRow>
                 ))}
            </TableBody>
        </Table>
      </div>
      {!isLoading && filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron cursos</h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay cursos disponibles'}
          </p>
        </div>
      )}
    </Card>
  );

  const GridView = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="course-list-container">
        {filteredCourses.map(course => (
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
      {!isLoading && filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron cursos</h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay cursos disponibles'}
          </p>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">
              Administra, crea y organiza los cursos de la plataforma
            </p>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-2">
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => forceStartTour('manageCourses', manageCoursesTour)}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Ver Guía
              </Button>
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                      <Button id="create-course-btn" size="sm">
                          <PlusCircle className="mr-2 h-4 w-4" /> 
                          Crear Curso
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] flex flex-col">
                      <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Crear Nuevo Curso</DialogTitle>
                        <DialogDescription>
                          Completa la información básica para crear tu nuevo curso
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto px-6 py-4 thin-scrollbar">
                        <CourseCreationForm onSuccess={handleCreationSuccess} />
                      </div>
                  </DialogContent>
              </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        {!isLoading && allCourses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Total Cursos"
              value={totalCourses}
              color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icon={Check}
              label="Publicados"
              value={stats.published}
              color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={Users}
              label="Inscripciones"
              value={stats.totalEnrollments}
              color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />
            <StatCard
              icon={Target}
              label="Progreso Promedio"
              value={`${Math.round(stats.avgCompletion)}%`}
              color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, categoría o instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" id="course-status-tabs">
          <TabsList className="h-auto flex-wrap justify-start md:h-10 md:flex-nowrap w-full">
            <TabsTrigger value="all" className="flex-1 sm:flex-initial">
              Todos ({totalCourses})
            </TabsTrigger>
            <TabsTrigger value="PUBLISHED" className="flex-1 sm:flex-initial">
              Publicados ({stats.published})
            </TabsTrigger>
            <TabsTrigger value="DRAFT" className="flex-1 sm:flex-initial">
              Borradores ({stats.draft})
            </TabsTrigger>
            <TabsTrigger value="ARCHIVED" className="flex-1 sm:flex-initial">
              Archivados ({stats.archived})
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {isLoading ? (
               <CourseListSkeleton />
            ) : error ? (
              <Card className="border-destructive">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-destructive/10 p-4 mb-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Error al Cargar Cursos</h3>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => fetchCourses()} variant="outline">
                    <Loader2 className="mr-2 h-4 w-4" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            ) : allCourses.length > 0 ? (
                 viewMode === 'grid' ? <GridView /> : <ListView />
            ) : (
                <Card>
                  <CardContent className="text-center py-16">
                      <div className="rounded-full bg-primary/10 p-6 w-fit mx-auto mb-4">
                        <BookMarked className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No hay cursos disponibles</h3>
                      <p className="text-muted-foreground mb-6">
                        Comienza creando tu primer curso para empezar a gestionar el contenido educativo
                      </p>
                      <Button onClick={() => setShowCreateModal(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Primer Curso
                      </Button>
                  </CardContent>
                </Card>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader>
              <div className="rounded-full bg-destructive/10 p-3 w-fit mb-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Esta acción es <strong>irreversible</strong>. Se eliminará permanentemente:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>El curso "<strong>{courseToDelete?.title}</strong>"</li>
                  <li>Todos sus módulos y lecciones</li>
                  <li>Todas las inscripciones</li>
                  <li>El progreso de todos los estudiantes</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-0">
                <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteCourse} 
                  disabled={isProcessing} 
                  className={buttonVariants({ variant: "destructive" })}
                >
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</>
                  ) : (
                    <><Trash2 className="mr-2 h-4 w-4" />Sí, eliminar curso</>
                  )}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Course Assignment Modal */}
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

// Management Dropdown Component
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                    <MoreVertical className="h-4 w-4"/>
                    <span className="sr-only">Más opciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                <DropdownMenuItem asChild>
                  <Link href={`/manage-courses/${course.id}/edit`} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4"/> 
                    Editar Curso
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/courses/${course.id}`} target="_blank" className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4"/> 
                    Vista Previa
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/enrollments?courseId=${course.id}`} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4"/> 
                    Ver Inscritos ({course.enrollmentsCount || 0})
                  </Link>
                </DropdownMenuItem>
                {course.isMandatory && (
                  <DropdownMenuItem onSelect={(e) => handleAction(e, onAssign)}>
                    <UserPlus className="mr-2 h-4 w-4"/>
                    Asignar Curso
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'PUBLISHED'))} 
                  disabled={isProcessing || course.status === 'PUBLISHED'}
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="mr-2 h-4 w-4"/>
                  Publicar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'ARCHIVED'))} 
                  disabled={isProcessing || course.status === 'ARCHIVED'}
                >
                  <Archive className="mr-2 h-4 w-4"/>
                  Archivar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'DRAFT'))} 
                  disabled={isProcessing || course.status === 'DRAFT'}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4"/>
                  Mover a Borrador
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onSelect={(e) => handleAction(e, () => onDelete?.(course))} 
                  disabled={isProcessing} 
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4"/> 
                  Eliminar Permanentemente
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Main Export with Suspense
export default function ManageCoursesPage() {
    return (
        <Suspense fallback={
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Cargando cursos...</p>
            </div>
          </div>
        }>
            <ManageCoursesPageComponent />
        </Suspense>
    )
}