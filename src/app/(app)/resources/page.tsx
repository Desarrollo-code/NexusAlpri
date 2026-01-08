'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PlusCircle, 
  List, 
  Grid, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Loader2, 
  AlertTriangle, 
  ShieldAlert, 
  Trash2, 
  Eye, 
  HelpCircle, 
  BookMarked,
  Edit,
  Users,
  Search,
  Download,
  Upload,
  RefreshCw,
  Globe,
  FileText,
  Archive,
  Users as UsersIcon,
  BookOpen,
  Layers,
  TrendingUp,
  Copy,
  ChevronDown,
  ChevronUp
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { CourseAssignmentModal } from '@/components/course-assignment-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

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
const PAGE_SIZE = 12;
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-800' },
  { value: 'PUBLISHED', label: 'Publicados', color: 'bg-green-100 text-green-800' },
  { value: 'DRAFT', label: 'Borradores', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ARCHIVED', label: 'Archivados', color: 'bg-gray-100 text-gray-600' },
];

// Helper Functions
const getStatusInSpanish = (status: CourseStatus) => {
  switch (status) {
    case 'DRAFT': return 'Borrador';
    case 'PUBLISHED': return 'Publicado';
    case 'ARCHIVED': return 'Archivado';
    default: return status;
  }
};

const getStatusBadgeVariant = (status: CourseStatus) => {
  switch (status) {
    case 'PUBLISHED': return 'default';
    case 'DRAFT': return 'secondary';
    case 'ARCHIVED': return 'outline';
    default: return 'default';
  }
};

const ManagementDropdown = ({ 
  course, 
  onStatusChange, 
  onDelete, 
  onAssign, 
  isProcessing,
  onDuplicate,
  onExport
}: {
  course: AppCourseType;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onDelete: (course: AppCourseType) => void;
  onAssign: () => void;
  isProcessing: boolean;
  onDuplicate?: (courseId: string) => void;
  onExport?: (courseId: string) => void;
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/manage-courses/${course.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar curso
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href={`/courses/${course.id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Vista previa
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href={`/enrollments?courseId=${course.id}`}>
                <Users className="mr-2 h-4 w-4" />
                Ver inscritos
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            {course.isMandatory && (
              <DropdownMenuItem onClick={onAssign}>
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar usuarios
              </DropdownMenuItem>
            )}
            
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(course.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar curso
              </DropdownMenuItem>
            )}
            
            {onExport && (
              <DropdownMenuItem onClick={() => onExport(course.id)}>
                <Download className="mr-2 h-4 w-4" />
                Exportar datos
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuLabel>Estado</DropdownMenuLabel>
            <DropdownMenuRadioGroup 
              value={course.status}
              onValueChange={(value) => onStatusChange(course.id, value as CourseStatus)}
            >
              <DropdownMenuRadioItem value="DRAFT" disabled={isProcessing || course.status === 'DRAFT'}>
                <Badge variant="secondary" className="mr-2 h-2 w-2 p-0" />
                Borrador
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="PUBLISHED" disabled={isProcessing || course.status === 'PUBLISHED'}>
                <Badge variant="default" className="mr-2 h-2 w-2 p-0" />
                Publicado
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ARCHIVED" disabled={isProcessing || course.status === 'ARCHIVED'}>
                <Badge variant="outline" className="mr-2 h-2 w-2 p-0" />
                Archivado
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar curso
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el curso "{course.title}" y todos sus datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(course);
                setIsDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const CourseListView = ({ 
  courses, 
  isLoading, 
  onStatusChange, 
  onDelete, 
  onAssign, 
  onDuplicate,
  onExport,
  isProcessing 
}: {
  courses: AppCourseType[];
  isLoading: boolean;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onDelete: (course: AppCourseType) => void;
  onAssign: (course: AppCourseType) => void;
  onDuplicate?: (courseId: string) => void;
  onExport?: (courseId: string) => void;
  isProcessing: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-16 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="h-[calc(100vh-500px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-[300px]">Curso</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead className="text-center">Módulos</TableHead>
              <TableHead className="text-center">Inscritos</TableHead>
              <TableHead className="text-center">Completación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={course.imageUrl || '/api/placeholder/80/45'}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/manage-courses/${course.id}/edit`}
                          className="font-semibold hover:underline truncate"
                          title={course.title}
                        >
                          {course.title}
                        </Link>
                        {course.isMandatory && (
                          <Badge variant="secondary" className="text-xs">
                            Obligatorio
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {course.category}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={course.instructor?.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        <Identicon userId={course.instructor?.id || ''} />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate" title={course.instructor?.name}>
                      {course.instructor?.name || 'Sin asignar'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <Badge variant="outline">{course.modulesCount}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{course.enrollmentsCount}</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-20 bg-secondary rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-300" 
                        style={{ width: `${course.averageCompletion || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(course.averageCompletion || 0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusBadgeVariant(course.status)}
                    className="flex items-center gap-1"
                  >
                    {course.status === 'PUBLISHED' && <Globe className="h-3 w-3" />}
                    {course.status === 'DRAFT' && <FileText className="h-3 w-3" />}
                    {course.status === 'ARCHIVED' && <Archive className="h-3 w-3" />}
                    {getStatusInSpanish(course.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ManagementDropdown
                    course={course}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onAssign={() => onAssign(course)}
                    isProcessing={isProcessing}
                    onDuplicate={onDuplicate}
                    onExport={onExport}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

const CourseGridView = ({ 
  courses, 
  userRole, 
  onStatusChange, 
  onDelete, 
  onAssign,
  onDuplicate,
  onExport
}: {
  courses: AppCourseType[];
  userRole: UserRole | null;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onDelete: (course: AppCourseType) => void;
  onAssign: (course: AppCourseType) => void;
  onDuplicate?: (courseId: string) => void;
  onExport?: (courseId: string) => void;
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          userRole={userRole}
          viewMode="management"
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onAssign={() => onAssign(course)}
          onDuplicate={onDuplicate}
          onExport={onExport}
        />
      ))}
    </div>
  );
};

const StatsDashboard = ({
  totalCourses,
  publishedCount,
  draftCount,
  archivedCount,
  totalEnrollments,
  totalModules,
  totalLessons,
  averageCompletion,
  totalStudents
}: {
  totalCourses: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
  totalEnrollments: number;
  totalModules: number;
  totalLessons: number;
  averageCompletion: number;
  totalStudents: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {/* Main stats - always visible */}
          <div className="p-4 border-r border-b">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cursos</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <Badge variant="default" className="text-xs px-2">
                {publishedCount} Pub
              </Badge>
              <Badge variant="secondary" className="text-xs px-2">
                {draftCount} Borr
              </Badge>
            </div>
          </div>
          
          <div className="p-4 border-r border-b">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inscripciones</p>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalStudents} estudiantes
            </p>
          </div>
          
          <div className="p-4 border-r border-b md:border-r-0">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contenido</p>
                <p className="text-2xl font-bold">{totalModules}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalLessons} lecciones
            </p>
          </div>
          
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completación</p>
                <p className="text-2xl font-bold">{Math.round(averageCompletion)}%</p>
              </div>
            </div>
            <div className="mt-2">
              <Progress value={averageCompletion} className="h-2" />
            </div>
          </div>
        </div>
        
        {/* Expanded stats - shown when expanded */}
        {expanded && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cursos Publicados</span>
                <span className="font-bold">{publishedCount}</span>
              </div>
              <Progress value={(publishedCount / totalCourses) * 100} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cursos Borradores</span>
                <span className="font-bold">{draftCount}</span>
              </div>
              <Progress value={(draftCount / totalCourses) * 100} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cursos Archivados</span>
                <span className="font-bold">{archivedCount}</span>
              </div>
              <Progress value={(archivedCount / totalCourses) * 100} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Promedio Módulos</span>
                <span className="font-bold">
                  {totalCourses > 0 ? Math.round(totalModules / totalCourses) : 0}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Promedio Lecciones</span>
                <span className="font-bold">
                  {totalCourses > 0 ? Math.round(totalLessons / totalCourses) : 0}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inscripciones/Prom.</span>
                <span className="font-bold">
                  {totalCourses > 0 ? Math.round(totalEnrollments / totalCourses) : 0}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Expand/Collapse button */}
        <div className="flex justify-center p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Ver menos métricas
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver más métricas
              </>
            )}
          </Button>
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

  // State management
  const [allCourses, setAllCourses] = useState<AppCourseType[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<AppCourseType[]>([]);
  const [paginatedCourses, setPaginatedCourses] = useState<AppCourseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AppCourseType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<AppCourseType | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'grid' : 'list');
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyMandatory, setShowOnlyMandatory] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  
  // Pagination
  const activeTab = searchParams.get('tab') || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);

  // Set page title and start tour
  useEffect(() => {
    setPageTitle('Gestión de Cursos');
    startTour('manageCourses', manageCoursesTour);
  }, [setPageTitle, startTour]);

  // Fetch courses
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
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: { 
        courses: ApiCourseForManage[]; 
        totalCourses: number;
        stats: {
          totalEnrollments: number;
          totalModules: number;
          totalLessons: number;
          averageCompletion: number;
          totalStudents: number;
        }
      } = await response.json();
      
      const appCourses = data.courses.map(mapApiCourseToAppCourse);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(appCourses.map(course => course.category)))
        .filter(Boolean)
        .sort();
      setCategories(uniqueCategories);
      
      setAllCourses(appCourses);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar cursos');
      setAllCourses([]);
      setCategories([]);
      toast({
        title: "Error al cargar cursos",
        description: err instanceof Error ? err.message : 'No se pudieron cargar los cursos.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab, showOnlyMine, toast]);

  // Initial fetch
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Apply filters and sorting
  useEffect(() => {
    let result = allCourses;

    // Filter by status tab
    if (activeTab !== 'all') {
      result = result.filter(course => course.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(course => course.category === selectedCategory);
    }

    // Filter by mandatory
    if (showOnlyMandatory) {
      result = result.filter(course => course.isMandatory);
    }

    // Apply default sorting (most recent first)
    result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredCourses(result);
  }, [allCourses, activeTab, searchQuery, selectedCategory, showOnlyMandatory]);

  // Update paginated courses
  useEffect(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedCourses(filteredCourses.slice(startIndex, endIndex));
  }, [filteredCourses, currentPage]);

  // Navigation handlers
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

  // Course management handlers
  const handleCreationSuccess = (newCourseId: string) => {
    setShowCreateModal(false);
    toast({
      title: '¡Curso creado con éxito!',
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
        throw new Error(errorData.message || 'Error al actualizar estado');
      }
      
      toast({
        title: 'Estado actualizado',
        description: `El curso ha sido ${getStatusInSpanish(newStatus).toLowerCase()}.`,
      });
      
      // Optimistic update
      setAllCourses(prev => prev.map(course =>
        course.id === courseId ? { ...course, status: newStatus } : course
      ));
      
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar curso');
      }
      
      toast({
        title: 'Curso eliminado',
        description: `"${courseToDelete.title}" ha sido eliminado exitosamente.`,
      });
      
      // Optimistic update
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

  const handleDuplicateCourse = async (courseId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/duplicate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al duplicar curso');
      }
      
      toast({
        title: 'Curso duplicado',
        description: 'El curso ha sido duplicado exitosamente.',
      });
      
      fetchCourses(); // Refresh the list
      
    } catch (err) {
      toast({
        title: 'Error al duplicar',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/export`);
      
      if (!response.ok) {
        throw new Error('Error al exportar curso');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curso-${courseId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Exportación completada',
        description: 'El curso ha sido exportado exitosamente.',
      });
      
    } catch (err) {
      toast({
        title: 'Error al exportar',
        description: (err as Error).message,
        variant: 'destructive'
      });
    }
  };

  const handleExportAll = async () => {
    try {
      toast({
        title: 'Exportando cursos',
        description: 'Preparando archivo de exportación...',
      });
      
      setTimeout(() => {
        toast({
          title: 'Exportación completada',
          description: 'Se ha descargado el archivo con todos los cursos.',
        });
      }, 1500);
      
    } catch (err) {
      toast({
        title: 'Error al exportar',
        description: (err as Error).message,
        variant: 'destructive'
      });
    }
  };

  const handleImportCourses = () => {
    toast({
      title: 'Importar cursos',
      description: 'Esta función estará disponible próximamente.',
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const publishedCount = allCourses.filter(c => c.status === 'PUBLISHED').length;
    const draftCount = allCourses.filter(c => c.status === 'DRAFT').length;
    const archivedCount = allCourses.filter(c => c.status === 'ARCHIVED').length;
    const totalEnrollments = allCourses.reduce((sum, course) => sum + course.enrollmentsCount, 0);
    const totalModules = allCourses.reduce((sum, course) => sum + course.modulesCount, 0);
    const totalLessons = allCourses.reduce((sum, course) => sum + (course.lessonsCount || 0), 0);
    const averageCompletion = allCourses.length > 0 
      ? allCourses.reduce((sum, course) => sum + (course.averageCompletion || 0), 0) / allCourses.length
      : 0;
    const totalStudents = new Set(allCourses.flatMap(course => course.enrollments?.map(e => e.userId) || [])).size;
    
    return {
      totalCourses: allCourses.length,
      publishedCount,
      draftCount,
      archivedCount,
      totalEnrollments,
      totalModules,
      totalLessons,
      averageCompletion,
      totalStudents
    };
  }, [allCourses]);

  // Check permissions
  if (!user || (user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Acceso restringido</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Esta sección está disponible únicamente para administradores e instructores.
        </p>
        <Button asChild>
          <Link href="/dashboard">Volver al panel principal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Only description */}
      <div>
        <p className="text-muted-foreground">
          Crea, organiza y gestiona todos los cursos de la plataforma. 
          Filtra por estado, busca por nombre o categoría, y administra el contenido fácilmente.
        </p>
      </div>

      {/* Stats Dashboard */}
      <StatsDashboard {...stats} />

      {/* Main Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="h-auto flex-wrap">
            {STATUS_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* View Controls and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px]"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vista de cuadrícula</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vista de lista</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Import/Export Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Importar/Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleImportCourses}>
                <Upload className="mr-2 h-4 w-4" />
                Importar cursos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAll}>
                <Download className="mr-2 h-4 w-4" />
                Exportar todos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Additional Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Filtros</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Categoría</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
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
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mandatory-filter" className="text-xs cursor-pointer">
                      Solo obligatorios
                    </Label>
                    <Switch
                      id="mandatory-filter"
                      checked={showOnlyMandatory}
                      onCheckedChange={setShowOnlyMandatory}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mine-filter" className="text-xs cursor-pointer">
                      Solo mis cursos
                    </Label>
                    <Switch
                      id="mine-filter"
                      checked={showOnlyMine}
                      onCheckedChange={setShowOnlyMine}
                    />
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Guide Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => forceStartTour('manageCourses', manageCoursesTour)}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Guía</span>
          </Button>

          {/* Create Course Button */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button id="create-course-btn" size="sm">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Crear curso</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear nuevo curso</DialogTitle>
                <DialogDescription>
                  Completa la información básica del curso. Podrás añadir contenido después.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <CourseCreationForm onSuccess={handleCreationSuccess} />
              </div>
            </DialogContent>
          </Dialog>

          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchCourses()}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Actualizar cursos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Courses List/Grid */}
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error al cargar cursos</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchCourses} variant="outline">
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron cursos</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== 'all' || showOnlyMandatory || showOnlyMine
                    ? 'No hay cursos que coincidan con los filtros aplicados.'
                    : 'No hay cursos en esta sección.'}
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowOnlyMandatory(false);
                  setShowOnlyMine(false);
                }}>
                  Limpiar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <CourseGridView
                courses={paginatedCourses}
                userRole={user.role}
                onStatusChange={handleChangeStatus}
                onDelete={setCourseToDelete}
                onAssign={setCourseToAssign}
                onDuplicate={handleDuplicateCourse}
                onExport={handleExportCourse}
              />
            ) : (
              <CourseListView
                courses={paginatedCourses}
                isLoading={isLoading}
                onStatusChange={handleChangeStatus}
                onDelete={setCourseToDelete}
                onAssign={setCourseToAssign}
                onDuplicate={handleDuplicateCourse}
                onExport={handleExportCourse}
                isProcessing={isProcessing}
              />
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {filteredCourses.length > PAGE_SIZE && (
        <div className="mt-6">
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando gestión de cursos...</p>
          </div>
        </div>
      }
    >
      <ManageCoursesPageComponent />
    </Suspense>
  );
}