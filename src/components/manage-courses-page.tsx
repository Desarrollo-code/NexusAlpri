// src/components/manage-courses-page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  PlusCircle, List, Grid, MoreVertical, Loader2, 
  Archive, ArchiveRestore, Trash2, BookOpen, Layers,
  Users, Edit, TrendingUp, Search, X, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import type { Course as AppCourseType, CourseStatus } from '@/types';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CourseCreationForm } from './course-creation-form';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';

// --- HELPER PARA LIMPIAR HTML ---
const stripHtml = (html: string) => {
  if (typeof window === 'undefined') return html; // Evitar error en SSR
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

function ManageCoursesPageComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<AppCourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CourseStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AppCourseType | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Error al cargar cursos');
      const data = await response.json();
      // Usamos el mapeador corregido que ya arregla los conteos
      const mappedCourses = data.map((c: any) => mapApiCourseToAppCourse(c));
      setCourses(mappedCourses);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesStatus = filterStatus === 'ALL' || course.status === filterStatus;
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [courses, filterStatus, searchQuery]);

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      const response = await fetch(`/api/courses/${courseToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      toast({ title: "Eliminado", description: "El curso ha sido eliminado correctamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el curso.", variant: "destructive" });
    } finally {
      setCourseToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Sincronizando contenidos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestionar Cursos</h1>
          <p className="text-muted-foreground text-lg">Crea, edita y monitorea el progreso de tus contenidos.</p>
        </div>
        <div className="flex items-center gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                        <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Curso
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Curso</DialogTitle>
                        <DialogDescription>Completa la información básica para comenzar.</DialogDescription>
                    </DialogHeader>
                    <CourseCreationForm onSuccess={() => {
                        setIsCreateDialogOpen(false);
                        fetchCourses();
                    }} />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Filtros y Controles */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center flex-1 max-w-md relative">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por título o descripción..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <TabsList>
              <TabsTrigger value="ALL">Todos</TabsTrigger>
              <TabsTrigger value="PUBLISHED">Publicados</TabsTrigger>
              <TabsTrigger value="DRAFT">Borradores</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex border rounded-lg p-1">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Listado de Cursos */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No se encontraron cursos</h3>
                <p className="text-muted-foreground">Prueba ajustando los filtros o crea uno nuevo.</p>
            </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} onDelete={setCourseToDelete} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
           {filteredCourses.map((course) => (
            <CourseRow key={course.id} course={course} onDelete={setCourseToDelete} />
          ))}
        </div>
      )}

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el curso <strong>{courseToDelete?.title}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground">
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// COMPONENTE TARJETA (GRID)
function CourseCard({ course, onDelete }: { course: AppCourseType, onDelete: (c: AppCourseType) => void }) {
    return (
        <Card className="overflow-hidden flex flex-col hover:shadow-lg transition-all border-t-4 border-t-primary">
            <div className="aspect-video relative overflow-hidden bg-muted">
                {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="object-cover w-full h-full" />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground font-medium">600 x 400</div>
                )}
                <Badge className="absolute top-2 right-2" variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {course.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                </Badge>
            </div>
            
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1 text-lg">{course.title}</CardTitle>
                    <CourseActions course={course} onDelete={onDelete} />
                </div>
                {/* CORRECCIÓN: Renderizado sin etiquetas HTML */}
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {stripHtml(course.description)}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-grow">
                <div className="grid grid-cols-2 gap-y-3 py-4 border-y text-sm">
                    <div className="flex items-center text-muted-foreground">
                        <Layers className="mr-2 h-4 w-4 text-primary" />
                        <span>{course.modulesCount || 0} Módulos</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <BookOpen className="mr-2 h-4 w-4 text-primary" />
                        <span>{course.lessonsCount || 0} Lecciones</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Users className="mr-2 h-4 w-4 text-primary" />
                        <span>{course.enrollmentsCount || 0} Alumnos</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                        <span>{Math.round(course.averageCompletion || 0)}% Progreso</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 bg-muted/30 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Por: {course.instructor.name}</span>
                <Link href={`/courses/${course.id}/edit`}>
                    <Button size="sm" variant="outline">Gestionar</Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

// COMPONENTE FILA (LIST)
function CourseRow({ course, onDelete }: { course: AppCourseType, onDelete: (c: AppCourseType) => void }) {
    return (
        <Card className="flex items-center p-4 hover:shadow-md transition-all">
            <div className="h-16 w-24 rounded bg-muted overflow-hidden flex-shrink-0 mr-4">
                {course.imageUrl && <img src={course.imageUrl} className="object-cover w-full h-full" />}
            </div>
            <div className="flex-grow min-w-0 mr-4">
                <h3 className="font-bold truncate text-base">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{stripHtml(course.description)}</p>
            </div>
            <div className="hidden lg:flex items-center gap-6 mr-8 text-sm text-muted-foreground">
                <div className="flex flex-col items-center">
                    <span className="font-bold text-foreground">{course.modulesCount}</span>
                    <span>Módulos</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-foreground">{course.lessonsCount}</span>
                    <span>Lecciones</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-foreground">{course.enrollmentsCount}</span>
                    <span>Alumnos</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>{course.status}</Badge>
                <CourseActions course={course} onDelete={onDelete} />
            </div>
        </Card>
    );
}

// MENÚ DE ACCIONES
function CourseActions({ course, onDelete }: { course: AppCourseType, onDelete: (c: AppCourseType) => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <Link href={`/courses/${course.id}/edit`}>
                    <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Editar Contenido</DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={() => window.open(`/courses/${course.id}`, '_blank')}>
                    <BookOpen className="mr-2 h-4 w-4" /> Ver como Estudiante
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(course)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Curso
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function ManageCoursesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
            <ManageCoursesPageComponent />
        </Suspense>
    );
}