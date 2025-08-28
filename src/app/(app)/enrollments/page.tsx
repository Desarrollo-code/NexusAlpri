// src/app/(app)/enrollments/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Course as AppCourse, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, UsersRound, Filter, MoreVertical, BookOpen, LineChart, Target, FileText, Search, CheckCircle, Percent, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useTitle } from '@/contexts/title-context';
import { Identicon } from '@/components/ui/identicon';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useDebounce } from '@/hooks/use-debounce';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTour } from '@/contexts/tour-context';
import { enrollmentsTour } from '@/lib/tour-steps';


interface CourseEnrollmentInfo extends AppCourse {
  _count: {
    enrollments: number;
    lessons: number;
  };
  enrollments: {
    user: {
      id: string;
      name: string | null;
      email: string;
      avatar: string | null;
    };
    enrolledAt: Date;
    progress: {
      progressPercentage: number | null;
      avgQuizScore: number | null;
    } | null;
  }[];
  avgProgress: number | null;
  avgQuizScore: number | null;
}

const PAGE_SIZE = 10;

const StatCard = ({ icon: Icon, title, value, unit = '' }: { icon: React.ElementType, title: string, value: number, unit?: string }) => (
    <Card className="flex-1 bg-muted/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value.toFixed(0)}{unit}</div>
        </CardContent>
    </Card>
);

const CourseSelector = ({ courses, onSelect, selectedCourseId, isLoading }: { courses: AppCourse[], onSelect: (id: string) => void, selectedCourseId: string, isLoading: boolean }) => {
    const [open, setOpen] = useState(false);
    const selectedCourseTitle = courses.find(c => c.id === selectedCourseId)?.title || "Selecciona un curso";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full sm:w-[350px] justify-between"
                    disabled={isLoading || courses.length === 0}
                    id="enrollments-course-selector"
                >
                    <span className="truncate">{selectedCourseTitle}</span>
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar curso..." />
                    <CommandList>
                        <CommandEmpty>No se encontraron cursos.</CommandEmpty>
                        <CommandGroup>
                            {courses.map((course) => (
                                <CommandItem
                                    key={course.id}
                                    value={course.title}
                                    onSelect={() => {
                                        onSelect(course.id);
                                        setOpen(false);
                                    }}
                                >
                                    {course.title}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const EnrolledStudentList = ({ enrollments, onAction }: { enrollments: CourseEnrollmentInfo['enrollments'], onAction: (user: any) => void }) => {
    const isMobile = useIsMobile();
    
    if (isMobile) {
        return (
            <div className="space-y-4">
                {enrollments.map(enrollment => {
                    const progress = Math.round(enrollment.progress?.progressPercentage || 0);
                    const isCompleted = progress === 100;
                    return (
                        <Card key={enrollment.user.id} className="card-border-animated overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                <Avatar className="h-10 w-10"><AvatarImage src={enrollment.user.avatar || undefined} /><AvatarFallback><Identicon userId={enrollment.user.id}/></AvatarFallback></Avatar>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold truncate">{enrollment.user.name || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground truncate">{enrollment.user.email}</p>
                                </div>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent><DropdownMenuItem onClick={() => onAction(enrollment.user)}>Ver Detalles</DropdownMenuItem></DropdownMenuContent>
                                 </DropdownMenu>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                               <Separator/>
                               <div className="pt-2 space-y-3">
                                   <div>
                                       <Label className="text-xs text-muted-foreground">Progreso del Curso</Label>
                                       <div className="flex items-center gap-2 mt-1">
                                            <Progress value={progress} className="h-2 flex-grow"/>
                                            <span className="text-sm font-bold w-10 text-right">{progress}%</span>
                                       </div>
                                   </div>
                                    <div>
                                       <Label className="text-xs text-muted-foreground">Puntuación Quizzes</Label>
                                       <div className="flex items-center gap-2 mt-1">
                                            <Percent className="h-4 w-4 text-primary"/>
                                            <span className="text-base font-bold">{enrollment.progress?.avgQuizScore?.toFixed(0) || '0'}%</span>
                                       </div>
                                   </div>
                               </div>
                            </CardContent>
                             <CardFooter className="p-2 bg-muted/40">
                                <Badge variant={isCompleted ? "default" : "secondary"} className={cn(isCompleted && "bg-green-600 text-white")}>
                                   {isCompleted ? <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : null}
                                   {isCompleted ? 'Completado' : 'En Progreso'}
                                </Badge>
                             </CardFooter>
                        </Card>
                    )
                })}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[300px]">Estudiante</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Nota Quizzes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Inscrito el</TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {enrollments.map(enrollment => {
                    const progress = Math.round(enrollment.progress?.progressPercentage || 0);
                    const isCompleted = progress === 100;
                    return (
                        <TableRow key={enrollment.user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9"><AvatarImage src={enrollment.user.avatar || undefined} /><AvatarFallback><Identicon userId={enrollment.user.id}/></AvatarFallback></Avatar>
                                    <div>
                                        <div className="font-medium">{enrollment.user.name || 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground">{enrollment.user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <CircularProgress value={progress} size={36} strokeWidth={4} showValue={false} />
                                    <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
                                </div>
                            </TableCell>
                             <TableCell>
                                <span className="font-semibold">{enrollment.progress?.avgQuizScore?.toFixed(0) || 'N/A'}%</span>
                            </TableCell>
                             <TableCell>
                                <Badge variant={isCompleted ? "default" : "secondary"} className={cn(isCompleted && "bg-green-600 text-white")}>
                                   {isCompleted ? <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : null}
                                   {isCompleted ? 'Completado' : 'En Progreso'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                                {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent><DropdownMenuItem onClick={() => onAction(enrollment.user)}>Ver Detalles</DropdownMenuItem></DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};


export default function EnrollmentsPage() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startTour, forceStartTour } = useTour();

  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [selectedCourseInfo, setSelectedCourseInfo] = useState<CourseEnrollmentInfo | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCourseId = searchParams.get('courseId') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('search') || '';
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setPageTitle('Inscripciones');
    startTour('enrollments', enrollmentsTour);
  }, [setPageTitle, startTour]);

  const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([name, value]) => {
        if (value === null || value === '') {
            params.delete(name);
        } else {
            params.set(name, String(value));
        }
    });
    return params.toString();
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
        const fetchCoursesForRole = async () => {
            setIsLoadingCourses(true);
            setError(null);
            try {
                let url = `/api/courses?manageView=true&userId=${currentUser.id}&userRole=${currentUser.role}`;
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error('Failed to fetch courses');
                const data = await response.json();
                const coursesArray = data.courses || data;
                setCourses(coursesArray);
                if (!selectedCourseId && coursesArray.length > 0) {
                    router.replace(`${pathname}?${createQueryString({ courseId: coursesArray[0].id, page: 1, search: null })}`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error fetching courses');
                toast({ title: "Error", description: "Could not load courses.", variant: "destructive" });
            } finally {
                setIsLoadingCourses(false);
            }
        };
        fetchCoursesForRole();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isAuthLoading, toast]);


  const fetchCourseDetails = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setIsLoadingDetails(true);
    try {
        const response = await fetch(`/api/enrollments/course/${courseId}/details`, { cache: 'no-store' });
        if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch course details');
        const data: CourseEnrollmentInfo = await response.json();
        setSelectedCourseInfo(data);
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Unknown error fetching details');
        toast({ title: "Error", description: `Could not load details for course: ${err instanceof Error ? err.message : ''}`, variant: "destructive" });
        setSelectedCourseInfo(null);
    } finally {
        setIsLoadingDetails(false);
    }
  }, [toast]);

  useEffect(() => {
      if (selectedCourseId) {
          fetchCourseDetails(selectedCourseId);
      }
  }, [selectedCourseId, fetchCourseDetails]);

  const handleCourseSelection = (courseId: string) => {
      router.push(`${pathname}?${createQueryString({ courseId, page: 1, search: null })}`);
  };
  
  const handlePageChange = (page: number) => {
      router.push(`${pathname}?${createQueryString({ page })}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      router.push(`${pathname}?${createQueryString({ search: e.target.value, page: 1 })}`);
  }

  const handleStudentAction = (student: User) => {
      toast({
          title: "Próximamente",
          description: `La vista detallada para ${student.name} estará disponible pronto.`
      });
  }

  const filteredEnrollments = useMemo(() => {
    if (!selectedCourseInfo) return [];
    return selectedCourseInfo.enrollments.filter(e => 
      e.user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
      e.user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [selectedCourseInfo, debouncedSearchTerm]);

  const paginatedEnrollments = useMemo(() => {
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      return filteredEnrollments.slice(startIndex, endIndex);
  }, [filteredEnrollments, currentPage]);

  const totalPages = Math.ceil(filteredEnrollments.length / PAGE_SIZE);

  if (isAuthLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!currentUser || (currentUser.role !== 'ADMINISTRATOR' && currentUser.role !== 'INSTRUCTOR')) {
    return <div className="text-center py-10">Acceso denegado a esta sección.</div>;
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Gestión de Inscritos</h2>
                <p className="text-muted-foreground">Selecciona un curso para ver los estudiantes inscritos y su progreso.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => forceStartTour('enrollments', enrollmentsTour)}>
                <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
            </Button>
        </div>
      <Card className="card-border-animated">
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-grow">
                     <CardTitle className="text-2xl font-headline flex items-center gap-2"><UsersRound /> Seguimiento de Estudiantes</CardTitle>
                    <CardDescription>Aquí puedes ver el avance de tus estudiantes en los cursos que impartes.</CardDescription>
                </div>
                <div className="w-full sm:w-auto">
                    <CourseSelector courses={courses} onSelect={handleCourseSelection} selectedCourseId={selectedCourseId} isLoading={isLoadingCourses} />
                </div>
            </div>
        </CardHeader>

        {selectedCourseId && (
          <CardContent>
            {isLoadingDetails ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : selectedCourseInfo && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="enrollments-stats-cards">
                        <StatCard icon={UsersRound} title="Total Inscritos" value={selectedCourseInfo._count.enrollments} />
                        <StatCard icon={LineChart} title="Finalización" value={selectedCourseInfo.avgProgress || 0} unit="%" />
                        <StatCard icon={Target} title="Nota Quizzes" value={selectedCourseInfo.avgQuizScore || 0} unit="%" />
                        <StatCard icon={BookOpen} title="Lecciones" value={selectedCourseInfo._count.lessons} />
                    </div>

                    <Card className="bg-muted/20" id="enrollments-student-list">
                    <CardHeader>
                        <CardTitle className="text-xl">Estudiantes Inscritos en: {selectedCourseInfo.title}</CardTitle>
                        <div className="flex items-center pt-2">
                            <div className="relative w-full sm:max-w-xs">
                                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="search" placeholder="Buscar estudiante..." value={searchTerm} onChange={handleSearchChange} className="pl-10"/>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {paginatedEnrollments.length > 0 ? (
                           <EnrolledStudentList enrollments={paginatedEnrollments} onAction={handleStudentAction} />
                        ) : <p className="text-center text-muted-foreground py-6">{searchTerm ? "Ningún estudiante coincide con tu búsqueda." : "No hay estudiantes inscritos en este curso aún."}</p>}
                    </CardContent>
                    {totalPages > 1 && (
                        <CardFooter>
                           <Pagination>
                            <PaginationContent>
                                <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
                                {[...Array(totalPages)].map((_, i) => <PaginationItem key={i}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>{i + 1}</PaginationLink></PaginationItem>)}
                                <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
                            </PaginationContent>
                           </Pagination>
                        </CardFooter>
                    )}
                    </Card>
                </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
