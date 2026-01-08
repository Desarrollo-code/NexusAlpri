'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import type { Course as AppCourseType, EnrolledCourse, CourseStatus, UserRole } from '@/types'; 
import { 
  PackageX, Loader2, AlertTriangle, Filter, Search, HelpCircle, 
  X, BookOpen, TrendingUp, Clock, Award, Grid, List, Sparkles,
  GraduationCap, Target, Users, ChevronRight, PlayCircle,
  BarChart3, Shield, Globe, Zap
} from 'lucide-react'; 
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseCarousel } from '@/components/course-carousel';
import { useTitle } from '@/contexts/title-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { EmptyState } from '@/components/empty-state';
import { useTour } from '@/contexts/tour-context';
import { coursesTour } from '@/lib/tour-steps';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

interface ApiCourse extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor: { id: string; name: string } | null;
  _count: { 
    modules: number;
    enrollments?: number;
  };
  modulesCount?: number; 
  status: CourseStatus;
  prerequisiteCompleted?: boolean;
  isMandatory?: boolean;
  averageCompletion?: number;
}

type SortOption = 'newest' | 'popular' | 'title' | 'modules' | 'completion';
type ViewMode = 'grid' | 'list';

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
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
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

export default function CoursesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();
  
  const [allApiCourses, setAllApiCourses] = useState<ApiCourse[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMandatoryOnly, setShowMandatoryOnly] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [tourInitialized, setTourInitialized] = useState(false);
  
  useEffect(() => {
    setPageTitle('Catálogo de Cursos');
  }, [setPageTitle]);

  // Inicializar el tour después de que la página se haya cargado
  useEffect(() => {
    if (!isLoading && !tourInitialized) {
      try {
        startTour('courses', coursesTour);
        setTourInitialized(true);
      } catch (err) {
        console.error('Error al iniciar la guía:', err);
      }
    }
  }, [isLoading, tourInitialized, startTour]);

  const fetchCoursesAndEnrollments = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const courseParams = new URLSearchParams({ userId: user.id });
      
      // CORREGIDO: Variables correctamente nombradas
      const coursesPromise = fetch(`/api/courses?${courseParams.toString()}`, { 
        cache: 'no-store' 
      });
      
      const enrollmentsPromise = fetch(`/api/enrollment/${user.id}`, { 
        cache: 'no-store' 
      });
      
      const [coursesResponse, enrollmentsResponse] = await Promise.all([
        coursesPromise, 
        enrollmentsPromise
      ]);

      if (!coursesResponse.ok) {
        const errorData = await coursesResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar los cursos');
      }
      
      const courseData = await coursesResponse.json();
      const coursesArray = Array.isArray(courseData?.courses) ? courseData.courses : [];
      setAllApiCourses(coursesArray);

      if (enrollmentsResponse.ok) {
        const enrollmentData = await enrollmentsResponse.json();
        const validEnrollmentIds = Array.isArray(enrollmentData)
          ? enrollmentData
              .filter((course: EnrolledCourse | null) => course?.id)
              .map((course: EnrolledCourse) => course.id)
          : [];
        setEnrolledCourseIds(validEnrollmentIds);
      } else {
        console.warn('No se pudieron cargar las inscripciones');
        setEnrolledCourseIds([]);
      }

    } catch (err) {
      console.error('Error fetching courses:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar cursos';
      setError(errorMessage);
      setAllApiCourses([]);
      setEnrolledCourseIds([]);
      toast({ 
        title: "Error al cargar cursos", 
        description: errorMessage, 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    if (!isAuthLoading) {
      fetchCoursesAndEnrollments();
    }
  }, [isAuthLoading, user, fetchCoursesAndEnrollments]); 

  const allCoursesForDisplay = useMemo(() => {
    try {
      return allApiCourses.map(mapApiCourseToAppCourse);
    } catch (err) {
      console.error('Error mapping courses:', err);
      return [];
    }
  }, [allApiCourses]);
  
  // Estadísticas generales
  const stats = useMemo(() => {
    try {
      const available = allCoursesForDisplay.filter(c => 
        c.status === 'PUBLISHED' && !enrolledCourseIds.includes(c.id)
      ).length;
      const mandatory = allCoursesForDisplay.filter(c => 
        c.isMandatory && c.status === 'PUBLISHED' && !enrolledCourseIds.includes(c.id)
      ).length;
      const totalCategories = new Set(
        allCoursesForDisplay.map(c => c.category).filter(Boolean)
      ).size;
      const inProgress = enrolledCourseIds.length;
      const completed = allCoursesForDisplay.filter(c => 
        c.averageCompletion && c.averageCompletion >= 100
      ).length;

      return { available, mandatory, totalCategories, inProgress, completed };
    } catch (err) {
      console.error('Error calculating stats:', err);
      return { available: 0, mandatory: 0, totalCategories: 0, inProgress: 0, completed: 0 };
    }
  }, [allCoursesForDisplay, enrolledCourseIds]);

  const filteredCourses = useMemo(() => {
    try {
      let courses = allCoursesForDisplay.filter(course => {
        const matchesSearch = searchTerm === '' || 
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (course.instructor?.name && course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const isPublished = course.status === 'PUBLISHED';
        const isNotEnrolled = !enrolledCourseIds.includes(course?.id);
        const matchesCategory = activeCategory === 'all' || course.category === activeCategory;
        const matchesMandatory = !showMandatoryOnly || course.isMandatory;
        const matchesAvailability = !showOnlyAvailable || isNotEnrolled;
        const matchesDifficulty = difficultyFilter === 'all' || 
          (course.difficulty?.toLowerCase() === difficultyFilter.toLowerCase());

        return matchesSearch && isPublished && matchesCategory && matchesMandatory && matchesAvailability && matchesDifficulty;
      });

      // Ordenar cursos
      courses.sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            return (b.enrollmentsCount || 0) - (a.enrollmentsCount || 0);
          case 'title':
            return a.title.localeCompare(b.title);
          case 'modules':
            return (b.modulesCount || 0) - (a.modulesCount || 0);
          case 'completion':
            return (b.averageCompletion || 0) - (a.averageCompletion || 0);
          case 'newest':
          default:
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }
      });

      return courses;
    } catch (err) {
      console.error('Error filtering courses:', err);
      return [];
    }
  }, [allCoursesForDisplay, searchTerm, enrolledCourseIds, activeCategory, sortBy, showMandatoryOnly, showOnlyAvailable, difficultyFilter]);

  const groupedCourses = useMemo(() => {
    try {
      return filteredCourses.reduce((acc, course) => {
        const category = course.category || 'General';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(course);
        return acc;
      }, {} as Record<string, AppCourseType[]>);
    } catch (err) {
      console.error('Error grouping courses:', err);
      return {};
    }
  }, [filteredCourses]);

  const handleEnrollmentChange = (courseId: string, newStatus: boolean) => {
    if (newStatus) {
        setEnrolledCourseIds(prev => [...prev, courseId]);
        toast({
          title: "¡Inscrito exitosamente!",
          description: "Ya puedes comenzar a aprender",
        });
    } else {
        setEnrolledCourseIds(prev => prev.filter(id => id !== courseId));
    }
  };
  
  const allCategories = useMemo(() => {
    try {
      const categories = ['all'];
      if (settings?.resourceCategories && Array.isArray(settings.resourceCategories)) {
        categories.push(...settings.resourceCategories);
      }
      return [...new Set(categories)];
    } catch (err) {
      console.error('Error getting categories:', err);
      return ['all'];
    }
  }, [settings]);

  const CourseCardSkeleton = () => (
    <Card className="flex flex-col overflow-hidden h-full">
        <Skeleton className="aspect-video w-full" />
        <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
        </CardHeader>
        <CardContent className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
  );

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setShowMandatoryOnly(false);
    setSortBy('newest');
    setShowOnlyAvailable(true);
    setDifficultyFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || activeCategory !== 'all' || showMandatoryOnly || !showOnlyAvailable || difficultyFilter !== 'all';

  const handleStartTour = () => {
    try {
      forceStartTour('courses', coursesTour);
      toast({
        title: "Guía iniciada",
        description: "Sigue los pasos para aprender a usar el catálogo",
        variant: "default"
      });
    } catch (err) {
      console.error('Error starting tour:', err);
      toast({
        title: "Error al iniciar la guía",
        description: "Por favor, recarga la página e intenta nuevamente",
        variant: "destructive"
      });
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-8 pb-12">
        {/* Banner Skeleton */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-border/50 p-6 sm:p-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>
        
        {/* Courses Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(10)].map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-primary/20 dark:via-primary/10 dark:to-secondary/20 border border-border/50 p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xl font-medium text-foreground mb-2">Explora nuestro catálogo formativo</p>
          <p className="text-base text-foreground/80 dark:text-foreground/90">
            Descubre cursos diseñados para impulsar tu crecimiento profesional y adquirir nuevas habilidades.
          </p>
        </div>
        
        {/* Ilustración SVG */}
        <div className="absolute bottom-0 right-0 opacity-15 dark:opacity-20">
          <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="catalogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="catalogPageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.4" />
              </linearGradient>
              <filter id="catalogShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#6366f1" floodOpacity="0.3" />
              </filter>
            </defs>
            
            {/* Libro abierto */}
            <g filter="url(#catalogShadow)">
              <path d="M160 70C160 50 180 40 200 50L220 60C240 70 240 90 220 100L200 110C180 120 160 110 160 90V70Z" fill="url(#catalogGradient)" />
              <path d="M160 70L200 50L220 60L180 80L160 70Z" fill="url(#catalogGradient)" fillOpacity="0.8" />
              <path d="M160 90L180 100L220 80L200 70L160 90Z" fill="url(#catalogGradient)" fillOpacity="0.6" />
            </g>
            
            {/* Páginas */}
            <g>
              <path d="M165 75L205 55L215 60L175 80L165 75Z" fill="url(#catalogPageGradient)" />
              <path d="M165 85L185 95L215 75L195 65L165 85Z" fill="url(#catalogPageGradient)" fillOpacity="0.7" />
              <path d="M170 95L190 105L210 85L190 75L170 95Z" fill="url(#catalogPageGradient)" fillOpacity="0.5" />
            </g>
            
            {/* Elementos decorativos */}
            <circle cx="175" cy="95" r="4" fill="#ffffff" opacity="0.8" />
            <circle cx="185" cy="105" r="3" fill="#ffffff" opacity="0.6" />
            <circle cx="195" cy="85" r="3" fill="#ffffff" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={BookOpen}
          label="Cursos Disponibles"
          value={stats.available}
          subtitle={`${stats.mandatory} obligatorios pendientes`}
          color="blue"
        />
        <StatsCard
          icon={TrendingUp}
          label="En Progreso"
          value={stats.inProgress}
          subtitle="Cursos activos"
          color="green"
        />
        <StatsCard
          icon={Award}
          label="Completados"
          value={stats.completed}
          subtitle="Logros obtenidos"
          color="purple"
        />
        <StatsCard
          icon={Target}
          label="Categorías"
          value={stats.totalCategories}
          subtitle="Áreas de conocimiento"
          color="orange"
        />
      </div>

      {/* Controls Bar */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Top Row: Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos por título, descripción o instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
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
                        <List className="h-4 w-4" />
                      ) : (
                        <Grid className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{viewMode === 'grid' ? 'Vista de lista' : 'Vista de cuadrícula'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button 
                onClick={handleStartTour} 
                variant="outline" 
                className="gap-2 bg-primary/10 hover:bg-primary/20"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Guía Interactiva</span>
              </Button>
            </div>
          </div>

          {/* Bottom Row: Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center space-x-2">
                <Select value={activeCategory} onValueChange={setActiveCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'Todas las categorías' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={showOnlyAvailable}
                  onCheckedChange={setShowOnlyAvailable}
                />
                <label htmlFor="available" className="text-sm font-medium cursor-pointer">
                  Solo disponibles
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="mandatory"
                  checked={showMandatoryOnly}
                  onCheckedChange={setShowMandatoryOnly}
                />
                <label htmlFor="mandatory" className="text-sm font-medium cursor-pointer">
                  Solo obligatorios
                </label>
              </div>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más Recientes</SelectItem>
                  <SelectItem value="popular">Más Populares</SelectItem>
                  <SelectItem value="title">Nombre (A-Z)</SelectItem>
                  <SelectItem value="completion">Completación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Búsqueda: {searchTerm}
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Categoría: {activeCategory}
                  <button 
                    onClick={() => setActiveCategory('all')} 
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {showMandatoryOnly && (
                <Badge variant="secondary" className="gap-1">
                  Solo obligatorios
                  <button 
                    onClick={() => setShowMandatoryOnly(false)} 
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {!showOnlyAvailable && (
                <Badge variant="secondary" className="gap-1">
                  Mostrar inscritos
                  <button 
                    onClick={() => setShowOnlyAvailable(true)} 
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {difficultyFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Dificultad: {difficultyFilter}
                  <button 
                    onClick={() => setDifficultyFilter('all')} 
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 text-xs"
              >
                <X className="h-3 w-3" />
                Limpiar todo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courses Display */}
      {error ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Error al Cargar Cursos</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCoursesAndEnrollments} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : Object.keys(groupedCourses).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedCourses)
            .sort(([catA], [catB]) => catA.localeCompare(catB))
            .map(([category, courses]) => (
              <section key={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-foreground">{category}</h2>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                
                {isMobile ? (
                  <CourseCarousel 
                    courses={courses} 
                    userRole={user?.role || null} 
                    onEnrollmentChange={handleEnrollmentChange} 
                  />
                ) : (
                  <div className={cn(
                    "grid gap-4 sm:gap-6",
                    viewMode === 'grid' 
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                      : "grid-cols-1"
                  )}>
                    {courses.map((course: AppCourseType, index: number) => (
                      <CourseCard 
                        key={course.id} 
                        course={course}
                        userRole={user?.role || null}
                        onEnrollmentChange={handleEnrollmentChange}
                        priority={index < 4}
                        viewMode={viewMode === 'list' ? 'horizontal' : 'vertical'}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={hasActiveFilters ? Search : PackageX}
              title={hasActiveFilters ? "No se encontraron cursos" : "Ningún curso disponible"}
              description={
                hasActiveFilters
                ? 'No hay cursos que coincidan con tus filtros actuales. Intenta ajustar tu búsqueda.' 
                : 'Actualmente no hay cursos publicados disponibles para inscripción.'
              }
              imageUrl={settings?.emptyStateCoursesUrl}
            >
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="mt-4">
                  <X className="mr-2 h-4 w-4" />
                  Limpiar Filtros
                </Button>
              )}
            </EmptyState>
          </CardContent>
        </Card>
      )}

      {/* Results Counter */}
      {!error && filteredCourses.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
          {hasActiveFilters && ' con los filtros aplicados'}
        </div>
      )}
    </div>
  );
}