// src/app/(app)/enrollments/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Course as AppCourse, User, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, UsersRound, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { Course as PrismaCourse } from '@prisma/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { useTitle } from '@/contexts/title-context';
import { Identicon } from '@/components/ui/identicon';

interface ApiCourseForEnrollments extends Omit<PrismaCourse, 'instructor' | 'modules' | 'enrollments' | 'progress' | 'createdAt' | 'updatedAt' | '_count'> {
  instructor: { id: string; name: string | null; } | null;
  modulesCount: number; 
  lessonsCount: number;
}

interface ApiEnrollment {
  userId: string;
  courseId: string;
  enrolledAt: string;
  user: { id: string; name: string | null; email: string; avatar: string | null; };
  course?: { id: string; title: string; instructor?: { id: string; name: string | null } | null }; 
}

interface StudentProgress {
  userId: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
}

export default function EnrollmentsPage() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();

  const [courses, setCourses] = useState<ApiCourseForEnrollments[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ApiCourseForEnrollments | null>(null);
  const [enrollments, setEnrollments] = useState<ApiEnrollment[]>([]);
  const [progressData, setProgressData] = useState<Record<string, StudentProgress>>({});
  
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setPageTitle('Inscripciones');
  }, [setPageTitle]);

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
        const fetchCoursesForRole = async () => {
            setIsLoadingCourses(true);
            setError(null);
            try {
              let url = '/api/courses';
              const queryParams = new URLSearchParams();
              if (currentUser.id) queryParams.append('userId', currentUser.id);
              if (currentUser.role) queryParams.append('userRole', currentUser.role as string);
              queryParams.append('manageView', 'true');
              
              url = `/api/courses?${queryParams.toString()}`;

              const response = await fetch(url, { cache: 'no-store' });
              if (!response.ok) throw new Error('Failed to fetch courses');
              const data: ApiCourseForEnrollments[] = await response.json();
              setCourses(data);

            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unknown error fetching courses');
              toast({ title: "Error", description: "Could not load courses.", variant: "destructive" });
            } finally {
              setIsLoadingCourses(false);
            }
        };
        fetchCoursesForRole();
    }
  }, [currentUser, isAuthLoading, toast]);


  const fetchEnrollmentsForCourse = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setIsLoadingEnrollments(true);
    setEnrollments([]); 
    setProgressData({}); 
    try {
      const response = await fetch(`/api/enrollments/course/${courseId}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch enrollments for this course');
      const data: ApiEnrollment[] = await response.json();
      setEnrollments(data);
      if (data.length > 0) {
        const courseDetail = courses.find(c => c.id === courseId);
        if (courseDetail) {
            fetchProgressForEnrollments(data, courseDetail);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching enrollments');
      toast({ title: "Error", description: "Could not load enrollments for the selected course.", variant: "destructive" });
    } finally {
      setIsLoadingEnrollments(false);
    }
  }, [toast, courses]);
  
  const fetchAllEnrollmentsForAdmin = useCallback(async () => {
     if (!currentUser || currentUser.role !== 'ADMINISTRATOR') return;
    setIsLoadingEnrollments(true);
    setEnrollments([]);
    setProgressData({});
    try {
        const response = await fetch('/api/enrollments/all', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch all enrollments');
        const data: ApiEnrollment[] = await response.json();
        setEnrollments(data);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error fetching all enrollments');
        toast({ title: "Error", description: "Could not load all enrollments.", variant: "destructive" });
    } finally {
        setIsLoadingEnrollments(false);
    }
  }, [currentUser, toast]);


  const fetchProgressForEnrollments = useCallback(async (currentEnrollments: ApiEnrollment[], courseDetail: ApiCourseForEnrollments) => {
    setIsLoadingProgress(true);
    const totalLessonsForCourse = courseDetail.lessonsCount ?? 0;

    const newProgressData: Record<string, StudentProgress> = {};
    for (const enrollment of currentEnrollments) {
      try {
        const response = await fetch(`/api/progress/${enrollment.userId}/${courseDetail.id}`, { cache: 'no-store' });
        const progressKey = `${enrollment.userId}-${courseDetail.id}`;
        if (response.ok) {
          const progress: { completedLessonIds: string[] } = await response.json();
          const completedCount = progress.completedLessonIds.length;
          newProgressData[progressKey] = {
            userId: enrollment.userId,
            courseId: courseDetail.id,
            completedLessons: completedCount,
            totalLessons: totalLessonsForCourse,
            progressPercentage: totalLessonsForCourse > 0 ? (completedCount / totalLessonsForCourse) * 100 : 0,
          };
        } else {
            newProgressData[progressKey] = { userId: enrollment.userId, courseId: courseDetail.id, completedLessons: 0, totalLessons: totalLessonsForCourse, progressPercentage: 0 };
        }
      } catch (e) {
        console.error(`Failed to fetch progress for user ${enrollment.userId} in course ${courseDetail.id}`, e);
        const progressKeyOnError = `${enrollment.userId}-${courseDetail.id}`;
        newProgressData[progressKeyOnError] = { userId: enrollment.userId, courseId: courseDetail.id, completedLessons: 0, totalLessons: totalLessonsForCourse, progressPercentage: 0 };
      }
    }
    setProgressData(prev => ({ ...prev, ...newProgressData }));
    setIsLoadingProgress(false);
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollmentsForCourse(selectedCourse.id);
    } else {
      setEnrollments([]);
      setProgressData({});
    }
  }, [selectedCourse, fetchEnrollmentsForCourse]);
  
  const handleCourseSelection = (courseIdValue: string) => {
    const course = courses.find(c => c.id === courseIdValue);
    setSelectedCourse(course || null);
  };
  
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enrollment => 
      enrollment.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [enrollments, searchTerm]);


  if (isAuthLoading || (isLoadingCourses && courses.length === 0 && !currentUser)) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Cargando datos...</p></div>;
  }

  if (!currentUser || (currentUser.role !== 'ADMINISTRATOR' && currentUser.role !== 'INSTRUCTOR')) {
    return <div className="text-center py-10">Acceso denegado a esta sección.</div>;
  }
  
  const pageTitleText = currentUser.role === 'ADMINISTRATOR' ? "Gestión Global de Inscritos" : "Progreso de Mis Cursos";
  const pageDescription = currentUser.role === 'ADMINISTRATOR' 
    ? "Selecciona un curso para ver los estudiantes inscritos y su progreso."
    : "Selecciona uno de tus cursos para ver el progreso de tus estudiantes.";

  const DesktopTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Estudiante</TableHead>
          <TableHead className="hidden sm:table-cell">Email</TableHead>
          <TableHead>Progreso</TableHead>
          <TableHead className="text-right hidden md:table-cell">Inscrito el</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredEnrollments.map(enrollment => {
          const studentProg = progressData[`${enrollment.user.id}-${selectedCourse!.id}`];
          return (
            <TableRow key={enrollment.user.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {enrollment.user.avatar ? <AvatarImage src={enrollment.user.avatar} alt={enrollment.user.name || 'User'} /> : null}
                    <AvatarFallback>
                        <Identicon userId={enrollment.user.id}/>
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{enrollment.user.name || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{enrollment.user.email}</TableCell>
              <TableCell>
                {studentProg ? (
                  <div className="flex items-center gap-2">
                    <Progress value={studentProg.progressPercentage} className="w-24 h-2.5" />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(studentProg.progressPercentage)}% 
                      ({studentProg.completedLessons}/{studentProg.totalLessons})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Cargando...</span>
                )}
              </TableCell>
              <TableCell className="text-right hidden md:table-cell text-xs text-muted-foreground">
                  {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
  
  const MobileCardList = () => (
    <div className="space-y-4">
      {filteredEnrollments.map(enrollment => {
        const studentProg = progressData[`${enrollment.user.id}-${selectedCourse!.id}`];
        return (
          <Card key={enrollment.user.id} className="card-border-animated">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
               <Avatar className="h-10 w-10">
                  {enrollment.user.avatar ? <AvatarImage src={enrollment.user.avatar} alt={enrollment.user.name || 'User'} /> : null}
                  <AvatarFallback>
                    <Identicon userId={enrollment.user.id}/>
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden">
                    <p className="font-semibold truncate">{enrollment.user.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground truncate">{enrollment.user.email}</p>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
               <Separator/>
               <div className="pt-2">
                 <Label className="text-xs text-muted-foreground">Progreso</Label>
                 {studentProg ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={studentProg.progressPercentage} className="flex-grow h-2.5" />
                    <span className="text-sm font-medium">
                      {Math.round(studentProg.progressPercentage)}%
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Cargando...</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );


  return (
    <div className="space-y-8">
      <Card className="card-border-animated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-grow">
              <CardTitle className="text-2xl font-headline flex items-center gap-2"><UsersRound /> {pageTitleText}</CardTitle>
              <CardDescription>{pageDescription}</CardDescription>
            </div>
            <div className="w-full sm:w-auto">
              {isLoadingCourses ? <Loader2 className="animate-spin my-2"/> : courses.length > 0 ? (
                <Select onValueChange={handleCourseSelection} value={selectedCourse?.id || ""}>
                  <SelectTrigger id="course-selector" className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Elige un curso para ver detalles" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">
                  {currentUser.role === 'INSTRUCTOR' ? 'No tienes cursos asignados.' : 'No hay cursos en la plataforma.'}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        {selectedCourse && (
          <CardContent>
            <Card className="mt-6 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Estudiantes Inscritos en: {selectedCourse.title}</CardTitle>
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-4">
                    <CardDescription>Total de lecciones en el curso: {selectedCourse.lessonsCount ?? 'Calculando...'}</CardDescription>
                    <div className="relative w-full sm:max-w-xs">
                        <Input 
                            type="search"
                            placeholder="Buscar estudiante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                        <Filter className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEnrollments || isLoadingProgress ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /> <p className="ml-2">Cargando estudiantes y su progreso...</p></div>
                ) : filteredEnrollments.length > 0 ? (
                  isMobile ? <MobileCardList /> : <DesktopTable />
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    {searchTerm ? "Ningún estudiante coincide con tu búsqueda." : "No hay estudiantes inscritos en este curso aún."}
                  </p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
