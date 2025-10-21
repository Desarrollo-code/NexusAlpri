// src/app/(app)/enrollments/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Course as AppCourse, User, CourseProgress, LessonCompletionRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, UsersRound, Filter, MoreVertical, BookOpen, LineChart, TrendingDown, Search, CheckCircle, Percent, HelpCircle, UserX, BarChartHorizontal, ArrowRight, Download, MessageSquare, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useTitle } from '@/contexts/title-context';
import { Identicon } from '@/components/ui/identicon';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SmartPagination } from '@/components/ui/pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTour } from '@/contexts/tour-context';
import { enrollmentsTour } from '@/lib/tour-steps';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar, TooltipProps, ComposedChart, Line } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { startOfDay, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

// --- TYPE DEFINITIONS ---
interface StudentEnrollmentDetails {
    user: {
      id: string;
      name: string | null;
      email: string;
      avatar: string | null;
    };
    enrolledAt: Date;
    progress: {
        progressPercentage: number | null;
        lastActivity: Date | null;
        completedAt: Date | null;
        completedLessons: {
            lessonId: string;
            type: string;
            completedAt: Date;
        }[];
        avgQuizScore: number | null;
    } | null;
}

interface CourseEnrollmentInfo extends AppCourse {
  _count: {
    enrollments: number;
    lessons: number;
  };
  enrollments: StudentEnrollmentDetails[];
  avgProgress: number | null;
  avgQuizScore: number | null;
  completionTrend: { date: string, count: number }[];
  lessonCompletions: { lessonId: string, title: string, completions: number }[];
  modules: {
      id: string;
      title: string;
      order: number;
      lessons: { id: string, title: string, order: number }[];
  }[];
}

const PAGE_SIZE = 10;

// --- REUSABLE COMPONENTS ---

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
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    <span className="truncate">{isLoading ? "Cargando cursos..." : selectedCourseTitle}</span>
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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/90 p-2 shadow-sm backdrop-blur-sm">
          <p className="font-bold">{label}</p>
          <p className="text-primary">{`${payload[0].value} estudiante(s)`}</p>
        </div>
      );
    }
    return null;
};

const EnrolledStudentList = ({ enrollments, onAction }: { 
    enrollments: StudentEnrollmentDetails[], 
    onAction: (action: 'details' | 'unenroll' | 'message', user: StudentEnrollmentDetails) => void 
}) => {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Estudiante</TableHead>
                        <TableHead>Progreso</TableHead>
                        <TableHead>Calificación Quizzes</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[50px] text-right"><span className="sr-only">Acciones</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {enrollments.map(enrollment => {
                        const progress = Math.round(enrollment.progress?.progressPercentage || 0);
                        const isCompleted = progress === 100;
                        const avgQuizScore = enrollment.progress?.avgQuizScore;
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
                                    <div className="flex items-center gap-2">
                                        <Progress value={progress} className="h-2 w-24"/>
                                        <span className="text-sm font-medium text-muted-foreground w-10 text-right">{progress}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {avgQuizScore !== null && avgQuizScore !== undefined ? (
                                        <Badge variant={avgQuizScore >= 80 ? 'default' : 'secondary'} className={cn(avgQuizScore >= 80 ? 'bg-green-600' : 'bg-amber-500')}>
                                            {avgQuizScore.toFixed(0)}%
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">N/A</span>
                                    )}
                                </TableCell>
                                 <TableCell>
                                    <Badge variant={isCompleted ? "default" : "secondary"} className={cn(isCompleted && "bg-green-600 text-white")}>
                                       {isCompleted ? <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : null}
                                       {isCompleted ? `Completado` : 'En Progreso'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => onAction('details', enrollment)}><ArrowRight className="mr-2 h-4 w-4"/>Ver Detalles</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onAction('message', enrollment)}><MessageSquare className="mr-2 h-4 w-4"/>Enviar Mensaje</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => onAction('unenroll', enrollment)} className="text-destructive focus:text-destructive"><UserX className="mr-2 h-4 w-4"/>Cancelar Inscripción</DropdownMenuItem>
                                        </DropdownMenuContent>
                                     </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

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

  const [studentToView, setStudentToView] = useState<StudentEnrollmentDetails | null>(null);
  const [studentToUnenroll, setStudentToUnenroll] = useState<StudentEnrollmentDetails | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const selectedCourseId = searchParams.get('courseId') || '';
  const searchTerm = searchParams.get('search') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

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

  const fetchCourseList = useCallback(async () => {
    if (isAuthLoading || !currentUser) return;
    setIsLoadingCourses(true);
    try {
        let url = `/api/courses?manageView=true&userId=${currentUser.id}&userRole=${currentUser.role}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudieron cargar los cursos');
        const data = await response.json();
        const coursesArray = data.courses || data;
        setCourses(coursesArray);
        if (!selectedCourseId && coursesArray.length > 0) {
            router.replace(`${pathname}?${createQueryString({ courseId: coursesArray[0].id, page: 1, search: null })}`);
        }
    } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudieron cargar los cursos.", variant: "destructive" });
    } finally {
        setIsLoadingCourses(false);
    }
  }, [currentUser, isAuthLoading, toast, router, pathname, createQueryString, selectedCourseId]);

  const fetchCourseDetails = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setIsLoadingDetails(true);
    try {
        const params = new URLSearchParams();
        if (dateRange.from) params.set('startDate', dateRange.from.toISOString());
        if (dateRange.to) params.set('endDate', dateRange.to.toISOString());

        const response = await fetch(`/api/enrollments/course/${courseId}/details?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error((await response.json()).message || 'No se pudieron cargar los detalles del curso');
        const data: CourseEnrollmentInfo = await response.json();
        setSelectedCourseInfo(data);
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        toast({ title: "Error", description: err instanceof Error ? err.message : 'No se pudieron cargar los detalles del curso.', variant: "destructive" });
        setSelectedCourseInfo(null);
    } finally {
        setIsLoadingDetails(false);
    }
  }, [toast, dateRange]);
  
  useEffect(() => {
    fetchCourseList();
  }, [fetchCourseList]);
  
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
  
  const handleAction = (action: 'details' | 'unenroll' | 'message', enrollment: StudentEnrollmentDetails) => {
      if(action === 'details') setStudentToView(enrollment);
      if(action === 'unenroll') setStudentToUnenroll(enrollment);
      if(action === 'message') router.push(`/messages?new=${enrollment.user.id}`);
  }

  const handleUnenrollStudent = async () => {
    if (!studentToUnenroll || !selectedCourseId) return;
    setIsUnenrolling(true);
    try {
        const params = new URLSearchParams({ courseId: selectedCourseId, userId: studentToUnenroll.user.id });
        const response = await fetch(`/api/enrollments?${params.toString()}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).message || 'No se pudo cancelar la inscripción');
        toast({ title: 'Inscripción Cancelada', description: `Se ha cancelado la inscripción de ${studentToUnenroll.user.name}.` });
        setStudentToView(null);
        setStudentToUnenroll(null);
        fetchCourseDetails(selectedCourseId);
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsUnenrolling(false);
    }
  }

  const handleExport = () => {
    if (!selectedCourseInfo || !selectedCourseInfo.enrollments) return;
    const headers = "Nombre,Email,Progreso (%),Calificación Quizzes (%),Estado,Fecha Inscripción,Fecha Completado\n";
    const rows = selectedCourseInfo.enrollments.map(e => {
        const name = `"${e.user.name || ''}"`; const email = e.user.email;
        const progress = e.progress?.progressPercentage?.toFixed(0) || 0;
        const quizScore = e.progress?.avgQuizScore?.toFixed(0) || 'N/A';
        const isCompleted = Number(progress) === 100; const status = isCompleted ? 'Completado' : 'En Progreso';
        const enrolledDate = new Date(e.enrolledAt).toLocaleDateString('es-CO');
        const completedDate = e.progress?.completedAt ? new Date(e.progress.completedAt).toLocaleDateString('es-CO') : 'N/A';
        return [name, email, progress, quizScore, status, enrolledDate, completedDate].join(',');
    }).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a");
    link.setAttribute("href", encodedUri); link.setAttribute("download", `progreso_${selectedCourseInfo.title.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({title: "Exportación Iniciada", description: "La descarga de tu reporte ha comenzado."})
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
  
  const mostDifficultLessons = selectedCourseInfo 
    ? [...selectedCourseInfo.lessonCompletions].sort((a,b) => a.completions - b.completions).slice(0,3)
    : [];

  return (
    <>
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
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
                </div>
                <div className="w-full sm:w-auto flex items-center gap-2">
                    <CourseSelector courses={courses} onSelect={handleCourseSelection} selectedCourseId={selectedCourseId} isLoading={isLoadingCourses} />
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={!selectedCourseInfo || selectedCourseInfo.enrollments.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Reporte
                    </Button>
                </div>
            </div>
        </CardHeader>

        {selectedCourseId && (
          <CardContent>
            {isLoadingDetails ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : selectedCourseInfo ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="enrollments-stats-cards">
                       <StatCard icon={UsersRound} title="Total Inscritos" value={selectedCourseInfo._count.enrollments} />
                       <StatCard icon={Percent} title="Finalización Promedio" value={selectedCourseInfo.avgProgress || 0} unit="%" />
                       <StatCard icon={CheckCircle} title="Nota Quizzes Promedio" value={selectedCourseInfo.avgQuizScore || 0} unit="%" />
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                         <Card className="xl:col-span-2">
                             <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2"><LineChart/> Tendencia de Finalización</CardTitle>
                             </CardHeader>
                              <CardContent className="h-[250px] pr-4 -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={selectedCourseInfo.completionTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'd MMM', {locale: es})} fontSize={12} />
                                        <YAxis allowDecimals={false} width={30}/>
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" barSize={20} radius={[4, 4, 0, 0]} name="Finalizados"/>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                         </Card>
                         <Card>
                             <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2"><TrendingDown/> Puntos de Fricción</CardTitle>
                                <CardDescription className="text-xs">Lecciones con menos finalizaciones.</CardDescription>
                             </CardHeader>
                             <CardContent>
                                <div className="space-y-2">
                                {mostDifficultLessons.length > 0 ? mostDifficultLessons.map(l => (
                                    <div key={l.lessonId} className="text-sm">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium truncate pr-2">{l.title}</p>
                                            <p className="font-bold shrink-0">{l.completions} <span className="font-normal text-muted-foreground">de {selectedCourseInfo._count.enrollments}</span></p>
                                        </div>
                                         <Progress value={(l.completions / selectedCourseInfo._count.enrollments) * 100} className="h-1.5 mt-1"/>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground text-center py-4">No hay suficientes datos de progreso.</p>}
                                </div>
                             </CardContent>
                         </Card>
                    </div>

                    <Card className="bg-muted/20" id="enrollments-student-list">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                            <CardTitle className="text-xl">Estudiantes Inscritos en: {selectedCourseInfo.title}</CardTitle>
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="search" placeholder="Buscar estudiante..." value={searchTerm} onChange={handleSearchChange} className="pl-10"/>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {paginatedEnrollments.length > 0 ? (
                           <EnrolledStudentList enrollments={paginatedEnrollments} onAction={handleAction} />
                        ) : <p className="text-center text-muted-foreground py-6">{searchTerm ? "Ningún estudiante coincide con tu búsqueda." : "No hay estudiantes inscritos en este curso aún."}</p>}
                    </CardContent>
                    {totalPages > 1 && (
                        <CardFooter>
                           <SmartPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                           />
                        </CardFooter>
                    )}
                    </Card>
                </div>
            ) : <div className="text-center py-10"><AlertTriangle className="mx-auto mb-2 h-8 w-8 text-destructive" /><p className="font-semibold">Error al cargar datos</p><p className="text-sm text-muted-foreground">{error}</p></div>}
          </CardContent>
        )}
      </Card>
    </div>

    <Dialog open={!!studentToView} onOpenChange={(open) => !open && setStudentToView(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalle de Progreso</DialogTitle>
                <DialogDescription>Progreso de {studentToView?.user.name} en el curso "{selectedCourseInfo?.title}".</DialogDescription>
            </DialogHeader>
            {studentToView && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Avatar className="h-16 w-16"><AvatarImage src={studentToView.user.avatar || ''} /><AvatarFallback><Identicon userId={studentToView.user.id}/></AvatarFallback></Avatar>
                        <div>
                            <p className="font-bold text-lg">{studentToView.user.name}</p>
                            <p className="text-sm text-muted-foreground">{studentToView.user.email}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm p-4 border rounded-lg">
                        <div className="font-semibold text-muted-foreground">Progreso:</div>
                        <div className="font-bold">{studentToView.progress?.progressPercentage?.toFixed(0) || 0}%</div>
                        
                        <div className="font-semibold text-muted-foreground">Calificación Quizzes:</div>
                        <div className="font-bold">{studentToView.progress?.avgQuizScore?.toFixed(0) || 'N/A'}%</div>

                        <div className="font-semibold text-muted-foreground">Inscrito:</div>
                        <div>{new Date(studentToView.enrolledAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

                        <div className="font-semibold text-muted-foreground">Última Actividad:</div>
                        <div>{studentToView.progress?.lastActivity ? new Date(studentToView.progress.lastActivity).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</div>
                    </div>
                    
                    <Separator/>
                    
                    <ScrollArea className="h-64 border rounded-lg">
                       <div className="space-y-4 p-4">
                        {selectedCourseInfo?.modules.map(module => (
                            <div key={module.id}>
                                <h4 className="font-semibold text-base">{module.title}</h4>
                                <ul className="mt-2 space-y-1.5 text-sm ml-2">
                                    {module.lessons.map(lesson => {
                                        const isCompleted = studentToView.progress?.completedLessons?.some(cl => cl.lessonId === lesson.id);
                                        return (
                                            <li key={lesson.id} className="flex items-center gap-2">
                                                {isCompleted ? <CheckCircle className="h-4 w-4 text-green-500"/> : <div className="h-4 w-4 flex-shrink-0" />}
                                                <span className={cn(isCompleted ? 'text-muted-foreground line-through' : 'text-foreground')}>{lesson.title}</span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))}
                       </div>
                    </ScrollArea>
                </div>
            )}
        </DialogContent>
    </Dialog>
     <AlertDialog open={!!studentToUnenroll} onOpenChange={open => !open && setStudentToUnenroll(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar inscripción?</AlertDialogTitle>
                <AlertDialogDescription>Se eliminará a "{studentToUnenroll?.user.name}" de este curso y se borrará todo su progreso. Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>No, mantener</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnenrollStudent} disabled={isUnenrolling} className={cn(buttonVariants({ variant: 'destructive'}))}>
                    {isUnenrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Sí, cancelar inscripción
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
