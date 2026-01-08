'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PlusCircle, List, Grid, Filter, UserPlus, MoreVertical, 
  Loader2, AlertTriangle, Trash2, Eye, Edit, Users, 
  Search, Download, Upload, RefreshCw, BookOpen, 
  TrendingUp, Copy, ChevronDown, ChevronUp, BookMarked,
  LayoutGrid, LayoutList, X, SlidersHorizontal, Archive,
  CheckCircle2, Clock, FolderArchive, Sparkles,
  Settings,
  BarChart3,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import type { Course as AppCourseType, CourseStatus, UserRole } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCreationForm } from '@/components/course-creation-form';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SmartPagination } from '@/components/ui/pagination';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCard } from '@/components/course-card';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { manageCoursesTour } from '@/lib/tour-steps';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { CourseAssignmentModal } from '@/components/course-assignment-modal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// Types
interface ApiCourseForManage {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  instructor: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: UserRole;
  } | null;
  status: CourseStatus;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number;
  tags: string[];
  _count: {
    modules: number;
    lessons: number;
    enrollments: number;
    completedEnrollments: number;
  };
  averageCompletion: number;
  averageRating: number | null;
}

// Constants
const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  all: { 
    label: 'Todos', 
    icon: LayoutGrid, 
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  PUBLISHED: { 
    label: 'Publicados', 
    icon: CheckCircle2, 
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  DRAFT: { 
    label: 'Borradores', 
    icon: Clock, 
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  ARCHIVED: { 
    label: 'Archivados', 
    icon: FolderArchive, 
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900',
    borderColor: 'border-slate-200 dark:border-slate-800'
  }
};

// Stats Card Component
const StatsCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  trend, 
  color = "blue" 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtitle?: string; 
  trend?: string;
  color?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
  };

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorClasses[color as keyof typeof colorClasses] || colorClasses.blue)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">{trend}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Course Card for Grid View
const EnhancedCourseCard = ({ 
  course, 
  onStatusChange, 
  onDelete, 
  onAssign,
  onDuplicate,
  onExport,
  isProcessing 
}: { 
  course: AppCourseType;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onDelete: (course: AppCourseType) => void;
  onAssign: (course: AppCourseType) => void;
  onDuplicate?: (courseId: string) => void;
  onExport?: (courseId: string) => void;
  isProcessing: boolean;
}) => {
  const statusConfig = STATUS_CONFIG[course.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border h-full flex flex-col">
      {/* Image Header */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {course.imageUrl ? (
          <img 
            src={course.imageUrl} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
            <BookOpen className="h-12 w-12 text-primary/70 dark:text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent dark:from-black/60" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={cn("font-medium shadow-sm", statusConfig.bgColor, statusConfig.color, "backdrop-blur-sm")}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Mandatory Badge */}
        {course.isMandatory && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-destructive text-destructive-foreground shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Obligatorio
            </Badge>
          </div>
        )}

        {/* Actions Menu */}
        <div className="absolute bottom-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="secondary"
                className="h-8 w-8 p-0 rounded-full shadow-md bg-background/90 hover:bg-background backdrop-blur-sm"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Acciones principales */}
              <DropdownMenuItem asChild>
                <Link href={`/manage-courses/${course.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar curso
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/courses/${course.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Vista previa
                </Link>
              </DropdownMenuItem>
              
              {/* Submenú para más acciones */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Settings className="h-4 w-4 mr-2" />
                  Más acciones
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href={`/manage-courses/${course.id}/enrollments`}>
                        <Users className="h-4 w-4 mr-2" />
                        Ver inscritos
                      </Link>
                    </DropdownMenuItem>
                    {course.isMandatory && (
                      <DropdownMenuItem onClick={() => onAssign(course)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar usuarios
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`/manage-courses/${course.id}/analytics`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analíticas
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(course.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                    )}
                    {onExport && (
                      <DropdownMenuItem onClick={() => onExport(course.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              
              {/* Cambiar estado */}
              <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
              <DropdownMenuRadioGroup 
                value={course.status}
                onValueChange={(value) => onStatusChange(course.id, value as CourseStatus)}
              >
                <DropdownMenuRadioItem value="DRAFT">
                  <Clock className="h-4 w-4 mr-2" />
                  Borrador
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PUBLISHED">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publicado
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ARCHIVED">
                  <FolderArchive className="h-4 w-4 mr-2" />
                  Archivado
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              
              <DropdownMenuSeparator />
              
              {/* Acción peligrosa */}
              <DropdownMenuItem 
                onClick={() => onDelete(course)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar curso
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Title and Category */}
        <div className="space-y-2 flex-1">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <Badge variant="outline" className="text-xs font-normal">
            {course.category}
          </Badge>
        </div>

        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
              {course.instructor.name.charAt(0)}
            </div>
            <span className="truncate">{course.instructor.name}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1 pt-3 border-t mt-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <p className="text-sm font-semibold">{course.modulesCount}</p>
                  <p className="text-xs text-muted-foreground">Módulos</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{course.lessonsCount || 0} lecciones en total</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center border-x">
                  <p className="text-sm font-semibold">{course.enrollmentsCount}</p>
                  <p className="text-xs text-muted-foreground">Inscritos</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de estudiantes inscritos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <p className="text-sm font-semibold">{Math.round(course.averageCompletion || 0)}%</p>
                  <p className="text-xs text-muted-foreground">Completo</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Promedio de completación</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Completion Progress */}
        <div className="space-y-1 pt-2">
          <Progress value={course.averageCompletion || 0} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
function ManageCoursesPageComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();
  const isMobile = useIsMobile();

  // State
  const [allCourses, setAllCourses] = useState<AppCourseType[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<AppCourseType[]>([]);
  const [paginatedCourses, setPaginatedCourses] = useState<AppCourseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AppCourseType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<AppCourseType | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'grid' : 'grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyMandatory, setShowOnlyMandatory] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const activeTab = searchParams.get('tab') || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);

  useEffect(() => {
    setPageTitle('Gestión de Cursos');
    startTour('manageCourses', manageCoursesTour);
  }, [setPageTitle, startTour]);

  const fetchCourses = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('manageView', 'true');
      params.set('userId', user.id);
      params.set('userRole', user.role);

      if (activeTab !== 'all') {
        params.set('status', activeTab);
      }

      if (showOnlyMine) {
        params.set('instructorId', user.id);
      }

      const response = await fetch(`/api/courses?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar cursos');
      }

      const data = await response.json();
      const appCourses = data.courses.map(mapApiCourseToAppCourse);

      const uniqueCategories = Array.from(
        new Set(appCourses.map((course: AppCourseType) => course.category))
      ).filter(Boolean).sort();

      setCategories(uniqueCategories as string[]);
      setAllCourses(appCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error al cargar cursos",
        description: err instanceof Error ? err.message : 'No se pudieron cargar los cursos.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab, showOnlyMine, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    let result = allCourses;

    if (activeTab !== 'all') {
      result = result.filter(course => course.status === activeTab);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(course => course.category === selectedCategory);
    }

    if (showOnlyMandatory) {
      result = result.filter(course => course.isMandatory);
    }

    result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredCourses(result);
  }, [allCourses, activeTab, searchQuery, selectedCategory, showOnlyMandatory]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedCourses(filteredCourses.slice(startIndex, endIndex));
  }, [filteredCourses, currentPage]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreationSuccess = (newCourseId: string) => {
    setShowCreateModal(false);
    toast({
      title: '¡Curso creado con éxito!',
      description: 'Serás redirigido a la página de edición.',
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

      if (!response.ok) throw new Error('Error al actualizar estado');

      toast({
        title: 'Estado actualizado',
        description: `El curso ha sido actualizado.`,
      });

      setAllCourses(prev =>
        prev.map(course =>
          course.id === courseId ? { ...course, status: newStatus } : course
        )
      );
    } catch (err) {
      toast({
        title: 'Error al cambiar estado',
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

      if (!response.ok) throw new Error('Error al eliminar curso');

      toast({
        title: 'Curso eliminado',
        description: `"${courseToDelete.title}" ha sido eliminado.`,
      });

      setAllCourses(prev => prev.filter(course => course.id !== courseToDelete.id));
    } catch (err) {
      toast({
        title: 'Error al eliminar',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setCourseToDelete(null);
    }
  };

  const stats = useMemo(() => {
    const publishedCount = allCourses.filter(c => c.status === 'PUBLISHED').length;
    const draftCount = allCourses.filter(c => c.status === 'DRAFT').length;
    const archivedCount = allCourses.filter(c => c.status === 'ARCHIVED').length;
    const totalEnrollments = allCourses.reduce((sum, course) => sum + course.enrollmentsCount, 0);
    const totalModules = allCourses.reduce((sum, course) => sum + course.modulesCount, 0);
    const averageCompletion = allCourses.length > 0
      ? allCourses.reduce((sum, course) => sum + (course.averageCompletion || 0), 0) / allCourses.length
      : 0;

    return {
      totalCourses: allCourses.length,
      publishedCount,
      draftCount,
      archivedCount,
      totalEnrollments,
      totalModules,
      averageCompletion
    };
  }, [allCourses]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowOnlyMandatory(false);
    setShowOnlyMine(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || showOnlyMandatory || showOnlyMine;

  if (!user || (user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Acceso restringido</h2>
            <p className="text-muted-foreground">
              Esta sección está disponible únicamente para administradores e instructores.
            </p>
            <Button asChild>
              <Link href="/dashboard">Volver al panel principal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section - Mejorada sin título duplicado */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-primary/20 dark:via-primary/10 dark:to-secondary/20 border border-border/50 p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xl font-medium text-foreground mb-2">Gestiona tu contenido educativo</p>
          <p className="text-base text-foreground/80 dark:text-foreground/90">
            Crea, organiza y gestiona todos los cursos de la plataforma y facilita el trabajo colaborativo en el mundo educativo.
          </p>
        </div>
        
        {/* Ilustración moderna - SVG 3D mejorado */}
        <div className="absolute bottom-0 right-0 opacity-15 dark:opacity-20">
          <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Fondo de gradiente */}
            <defs>
              <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="pageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.4" />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#6366f1" floodOpacity="0.3" />
              </filter>
            </defs>
            
            {/* Libro principal */}
            <g filter="url(#shadow)">
              <path d="M180 60C180 40 200 30 220 40L240 50C260 60 260 80 240 90L220 100C200 110 180 100 180 80V60Z" fill="url(#bookGradient)" />
              <path d="M180 60L220 40L240 50L200 70L180 60Z" fill="url(#bookGradient)" fillOpacity="0.8" />
              <path d="M180 80L200 90L240 70L220 60L180 80Z" fill="url(#bookGradient)" fillOpacity="0.6" />
            </g>
            
            {/* Páginas del libro */}
            <g>
              <path d="M185 65L225 45L235 50L195 70L185 65Z" fill="url(#pageGradient)" />
              <path d="M185 75L205 85L235 65L215 55L185 75Z" fill="url(#pageGradient)" fillOpacity="0.7" />
              <path d="M190 85L210 95L230 75L210 65L190 85Z" fill="url(#pageGradient)" fillOpacity="0.5" />
            </g>
            
            {/* Elementos decorativos */}
            <circle cx="195" cy="85" r="4" fill="#ffffff" opacity="0.8" />
            <circle cx="205" cy="95" r="3" fill="#ffffff" opacity="0.6" />
            <circle cx="215" cy="75" r="3" fill="#ffffff" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={BookOpen}
          label="Total de Cursos"
          value={stats.totalCourses}
          subtitle={`${stats.publishedCount} publicados, ${stats.draftCount} borradores`}
          color="blue"
        />
        <StatsCard
          icon={Users}
          label="Inscripciones"
          value={stats.totalEnrollments}
          subtitle="Total de estudiantes inscritos"
          color="green"
        />
        <StatsCard
          icon={LayoutGrid}
          label="Módulos Creados"
          value={stats.totalModules}
          subtitle="Contenido educativo disponible"
          color="purple"
        />
        <StatsCard
          icon={TrendingUp}
          label="Completación Promedio"
          value={`${Math.round(stats.averageCompletion)}%`}
          subtitle="Tasa de finalización de cursos"
          color="orange"
        />
      </div>

      {/* Controls Bar simplificada */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Top Row: Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos por título, descripción o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? (
                        <LayoutList className="h-4 w-4" />
                      ) : (
                        <LayoutGrid className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{viewMode === 'grid' ? 'Vista de lista' : 'Vista de cuadrícula'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo curso</span>
                <span className="sm:hidden">Crear</span>
              </Button>
            </div>
          </div>

          {/* Bottom Row: Tabs and Quick Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const count = key === 'all' 
                    ? allCourses.length 
                    : allCourses.filter(c => c.status === key).length;
                  
                  return (
                    <TabsTrigger key={key} value={key} className="gap-2 text-xs sm:text-sm">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{config.label}</span>
                      <span className="sm:hidden">{config.label.substring(0, 3)}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className={cn("gap-2", showFilters && "bg-accent")}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtros</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mostrar/Ocultar filtros</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2 text-xs"
                >
                  <X className="h-3 w-3" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mandatory"
                    checked={showOnlyMandatory}
                    onCheckedChange={setShowOnlyMandatory}
                  />
                  <label htmlFor="mandatory" className="text-sm font-medium cursor-pointer">
                    Solo obligatorios
                  </label>
                </div>
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mine"
                    checked={showOnlyMine}
                    onCheckedChange={setShowOnlyMine}
                  />
                  <label htmlFor="mine" className="text-sm font-medium cursor-pointer">
                    Solo mis cursos
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Búsqueda: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Categoría: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {showOnlyMandatory && (
                <Badge variant="secondary" className="gap-1">
                  Solo obligatorios
                  <button onClick={() => setShowOnlyMandatory(false)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {showOnlyMine && (
                <Badge variant="secondary" className="gap-1">
                  Solo mis cursos
                  <button onClick={() => setShowOnlyMine(false)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courses Display */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="overflow-hidden h-full">
                <div className="h-40 bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="grid grid-cols-3 gap-2 pt-3">
                    <div className="h-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
              <h3 className="text-lg font-semibold">Error al cargar cursos</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchCourses} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No se encontraron cursos</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {hasActiveFilters
                  ? 'No hay cursos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                  : 'Aún no hay cursos creados. Comienza creando tu primer curso.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              ) : (
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Crear primer curso
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {paginatedCourses.length} de {filteredCourses.length} cursos
              </p>
            </div>

            {/* Grid View - 5 cursos por fila en pantallas grandes */}
            {viewMode === 'grid' ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {paginatedCourses.map((course) => (
                  <EnhancedCourseCard
                    key={course.id}
                    course={course}
                    onStatusChange={handleChangeStatus}
                    onDelete={setCourseToDelete}
                    onAssign={setCourseToAssign}
                    isProcessing={isProcessing}
                    onDuplicate={(id) => {
                      toast({
                        title: 'Duplicar curso',
                        description: 'Esta función estará disponible próximamente.',
                      });
                    }}
                    onExport={(id) => {
                      toast({
                        title: 'Exportar curso',
                        description: 'Esta función estará disponible próximamente.',
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Módulos</TableHead>
                      <TableHead className="text-center">Inscritos</TableHead>
                      <TableHead className="text-center">Completación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCourses.map((course) => {
                      const statusConfig = STATUS_CONFIG[course.status];
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                                {course.imageUrl ? (
                                  <img
                                    src={course.imageUrl}
                                    alt={course.title}
                                    className="h-full w-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <BookOpen className="h-6 w-6 text-primary" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{course.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {course.category}
                                  </Badge>
                                  {course.isMandatory && (
                                    <Badge className="text-xs bg-destructive">
                                      Obligatorio
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {course.modulesCount}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {course.enrollmentsCount}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={course.averageCompletion || 0}
                                className="h-2 flex-1"
                              />
                              <span className="text-sm font-medium min-w-[3rem] text-right">
                                {Math.round(course.averageCompletion || 0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link href={`/manage-courses/${course.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/courses/${course.id}`} target="_blank">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Vista previa
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setCourseToDelete(course)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear nuevo curso</DialogTitle>
            <DialogDescription>
              Completa la información básica del curso. Podrás añadir contenido después.
            </DialogDescription>
          </DialogHeader>
          <CourseCreationForm onSuccess={handleCreationSuccess} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el curso "{courseToDelete?.title}" y todos
              sus datos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
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

// Main export with Suspense boundary
export default function ManageCoursesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando gestión de cursos...</p>
          </div>
        </div>
      }
    >
      <ManageCoursesPageComponent />
    </React.Suspense>
  );
}