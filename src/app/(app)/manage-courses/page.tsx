'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  ArchiveRestore,
  Globe,
  Lock,
  User,
  Settings,
  FileText,
  BookOpen,
  Layers,
  Award,
  TrendingUp,
  Users as UsersIcon
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
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  { value: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-800', icon: Layers },
  { value: 'PUBLISHED', label: 'Publicados', color: 'bg-green-100 text-green-800', icon: Globe },
  { value: 'DRAFT', label: 'Borradores', color: 'bg-yellow-100 text-yellow-800', icon: FileText },
  { value: 'ARCHIVED', label: 'Archivados', color: 'bg-gray-100 text-gray-600', icon: Archive },
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'Todas', color: 'bg-gray-100' },
  { value: 'BEGINNER', label: 'Principiante', color: 'bg-blue-100 text-blue-800' },
  { value: 'INTERMEDIATE', label: 'Intermedio', color: 'bg-purple-100 text-purple-800' },
  { value: 'ADVANCED', label: 'Avanzado', color: 'bg-red-100 text-red-800' },
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

const getDifficultyInSpanish = (difficulty: string) => {
  switch (difficulty) {
    case 'BEGINNER': return 'Principiante';
    case 'INTERMEDIATE': return 'Intermedio';
    case 'ADVANCED': return 'Avanzado';
    default: return difficulty;
  }
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Components
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
          <DropdownMenuLabel>Acciones para {course.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/manage-courses/${course.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar curso
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href={`/manage-courses/${course.id}/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Análisis
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
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings className="mr-2 h-4 w-4" />
              Cambiar estado
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
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
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(course);
                setIsDeleteDialogOpen(false);
              }}
              className={buttonVariants({ variant: "destructive" })}
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
        {[...Array(5)].map((_, i) => (
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Curso</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead className="text-center">Módulos</TableHead>
              <TableHead className="text-center">Lecciones</TableHead>
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(course.duration || 0)}
                        <span className="mx-1">•</span>
                        <Badge variant="outline" className="text-xs">
                          {getDifficultyInSpanish(course.difficulty || 'BEGINNER')}
                        </Badge>
                      </div>
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
                  <div className="font-medium">{course.lessonsCount || 0}</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <div className="font-medium">{course.enrollmentsCount}</div>
                    <div className="text-xs text-muted-foreground">
                      {course.completedEnrollmentsCount || 0} completados
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-24 bg-secondary rounded-full h-2 overflow-hidden">
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
      </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

const FiltersPanel = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedDifficulty,
  onDifficultyChange,
  showOnlyMandatory,
  onToggleMandatory,
  showOnlyMine,
  onToggleMine,
  sortBy,
  onSortChange,
  dateRange,
  onDateRangeChange
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  showOnlyMandatory: boolean;
  onToggleMandatory: () => void;
  showOnlyMine: boolean;
  onToggleMine: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="h-auto flex-wrap">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <TabsTrigger key={option.value} value={option.value} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
                <DropdownMenuRadioItem value="title-asc">Título (A-Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title-desc">Título (Z-A)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created-desc">Más recientes</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created-asc">Más antiguos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="enrollments-desc">Más inscritos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completion-desc">Mayor completación</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>
      
      {isFiltersOpen && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-filter">Categoría</Label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger id="category-filter">
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
                <Label htmlFor="difficulty-filter">Dificultad</Label>
                <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
                  <SelectTrigger id="difficulty-filter">
                    <SelectValue placeholder="Todas las dificultades" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Filtros adicionales</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mandatory-filter"
                      checked={showOnlyMandatory}
                      onCheckedChange={onToggleMandatory}
                    />
                    <Label htmlFor="mandatory-filter" className="cursor-pointer">
                      Solo obligatorios
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mine-filter"
                      checked={showOnlyMine}
                      onCheckedChange={onToggleMine}
                    />
                    <Label htmlFor="mine-filter" className="cursor-pointer">
                      Solo mis cursos
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Rango de fechas</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                    className="h-9"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchChange('');
                  onCategoryChange('all');
                  onDifficultyChange('all');
                  onDateRangeChange({ start: '', end: '' });
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
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
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cursos</p>
              <p className="text-2xl font-bold">{totalCourses}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default" className="text-xs">
              {publishedCount} Publicados
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {draftCount} Borradores
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Inscripciones</p>
              <p className="text-2xl font-bold">{totalEnrollments}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {totalStudents} estudiantes únicos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contenido</p>
              <p className="text-2xl font-bold">{totalModules}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {totalLessons} lecciones
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completación</p>
              <p className="text-2xl font-bold">{Math.round(averageCompletion)}%</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <Progress value={averageCompletion} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BulkActionsBar = ({
  selectedCourses,
  onBulkStatusChange,
  onBulkDelete,
  onBulkAssign,
  onClearSelection,
  isProcessing
}: {
  selectedCourses: string[];
  onBulkStatusChange: (status: CourseStatus) => void;
  onBulkDelete: () => void;
  onBulkAssign: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}) => {
  if (selectedCourses.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-medium">{selectedCourses.length}</span>
            </div>
            <div>
              <p className="font-medium">{selectedCourses.length} cursos seleccionados</p>
              <p className="text-sm text-muted-foreground">
                Aplica acciones en masa a todos los cursos seleccionados
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing}>
                  <Settings className="mr-2 h-4 w-4" />
                  Cambiar estado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onBulkStatusChange('PUBLISHED')}>
                  Publicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkStatusChange('DRAFT')}>
                  Mover a borrador
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkStatusChange('ARCHIVED')}>
                  Archivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkAssign}
              disabled={isProcessing}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Asignar
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isProcessing}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar cursos seleccionados?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente {selectedCourses.length} cursos.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onBulkDelete} className={buttonVariants({ variant: "destructive" })}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickActions = ({
  onCreateCourse,
  onImportCourses,
  onExportAll,
  onStartTour
}: {
  onCreateCourse: () => void;
  onImportCourses: () => void;
  onExportAll: () => void;
  onStartTour: () => void;
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={onCreateCourse}
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <PlusCircle className="h-8 w-8" />
            <span className="text-sm font-medium">Crear curso</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={onImportCourses}
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <Download className="h-8 w-8" />
            <span className="text-sm font-medium">Importar</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={onExportAll}
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Exportar todo</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={onStartTour}
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <HelpCircle className="h-8 w-8" />
            <span className="text-sm font-medium">Guía rápida</span>
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
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'grid' : 'list');
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showOnlyMandatory, setShowOnlyMandatory] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [sortBy, setSortBy] = useState('created-desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Pagination
  const activeTab = searchParams.get('tab') || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);

  // Set page title and start tour
  useEffect(() => {
    setPageTitle('Gestión de Cursos');
    startTour('manageCourses', manageCoursesTour);
  }, [setPageTitle, startTour]);

  // Create query string utility
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        if (value === null || value === '') {
          params.delete(name);
        } else {
          params.set(name, String(value));
        }
      });
      return params.toString();
    },
    [searchParams]
  );

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
        course.category.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(course => course.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      result = result.filter(course => course.difficulty === selectedDifficulty);
    }

    // Filter by mandatory
    if (showOnlyMandatory) {
      result = result.filter(course => course.isMandatory);
    }

    // Filter by date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter(course => new Date(course.createdAt) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(course => new Date(course.createdAt) <= endDate);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'enrollments-desc':
          return b.enrollmentsCount - a.enrollmentsCount;
        case 'completion-desc':
          return (b.averageCompletion || 0) - (a.averageCompletion || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(result);
    setSelectedCourses([]); // Clear selection when filters change
  }, [allCourses, activeTab, searchQuery, selectedCategory, selectedDifficulty, showOnlyMandatory, dateRange, sortBy]);

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

  const handleBulkStatusChange = async (status: CourseStatus) => {
    if (selectedCourses.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/courses/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseIds: selectedCourses, 
          status 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar estados');
      }
      
      toast({
        title: 'Estados actualizados',
        description: `${selectedCourses.length} cursos han sido actualizados.`,
      });
      
      // Optimistic update
      setAllCourses(prev => prev.map(course =>
        selectedCourses.includes(course.id) ? { ...course, status } : course
      ));
      
      setSelectedCourses([]);
      
    } catch (err) {
      toast({
        title: 'Error al actualizar estados',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/courses/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: selectedCourses }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar cursos');
      }
      
      toast({
        title: 'Cursos eliminados',
        description: `${selectedCourses.length} cursos han sido eliminados.`,
      });
      
      // Optimistic update
      setAllCourses(prev => prev.filter(course => !selectedCourses.includes(course.id)));
      
      setSelectedCourses([]);
      
    } catch (err) {
      toast({
        title: 'Error al eliminar cursos',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
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
      
      const { newCourse } = await response.json();
      
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
      const response = await fetch('/api/courses/export-all');
      
      if (!response.ok) {
        throw new Error('Error al exportar cursos');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cursos-${format(new Date(), 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Exportación completada',
        description: 'Todos los cursos han sido exportados.',
      });
      
    } catch (err) {
      toast({
        title: 'Error al exportar',
        description: (err as Error).message,
        variant: 'destructive'
      });
    }
  };

  const handleImportCourses = () => {
    // TODO: Implement import functionality
    toast({
      title: 'Función en desarrollo',
      description: 'La importación de cursos estará disponible próximamente.',
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cursos</h1>
          <p className="text-muted-foreground mt-2">
            Crea, organiza y gestiona todos los cursos de la plataforma
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
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
          
          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCourses()}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Actualizar cursos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Tour Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => forceStartTour('manageCourses', manageCoursesTour)}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Guía
          </Button>
          
          {/* Create Course Button */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button id="create-course-btn">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo curso
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
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions
        onCreateCourse={() => setShowCreateModal(true)}
        onImportCourses={handleImportCourses}
        onExportAll={handleExportAll}
        onStartTour={() => forceStartTour('manageCourses', manageCoursesTour)}
      />

      {/* Statistics Dashboard */}
      <StatsDashboard {...stats} />

      {/* Filters Panel */}
      <FiltersPanel
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        showOnlyMandatory={showOnlyMandatory}
        onToggleMandatory={() => setShowOnlyMandatory(!showOnlyMandatory)}
        showOnlyMine={showOnlyMine}
        onToggleMine={() => setShowOnlyMine(!showOnlyMine)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCourses={selectedCourses}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
        onBulkAssign={() => {
          if (selectedCourses.length === 1) {
            const course = allCourses.find(c => c.id === selectedCourses[0]);
            if (course) setCourseToAssign(course);
          } else {
            toast({
              title: 'Asignación múltiple',
              description: 'Selecciona un solo curso para asignar usuarios.',
              variant: 'destructive'
            });
          }
        }}
        onClearSelection={() => setSelectedCourses([])}
        isProcessing={isProcessing}
      />

      {/* Courses List/Grid */}
      <div className="mt-6">
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
                  {searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all' || showOnlyMandatory || showOnlyMine || dateRange.start || dateRange.end
                    ? 'No hay cursos que coincidan con los filtros aplicados.'
                    : 'No hay cursos en esta sección.'}
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setShowOnlyMandatory(false);
                  setShowOnlyMine(false);
                  setDateRange({ start: '', end: '' });
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
        <div className="mt-8">
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

// Missing icon components
const Copy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);