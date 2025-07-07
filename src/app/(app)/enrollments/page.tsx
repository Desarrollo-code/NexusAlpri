
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Course as AppCourse, User, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, UsersRound, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { Course as PrismaCourse } from '@prisma/client';

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

  const [courses, setCourses] = useState<ApiCourseForEnrollments[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ApiCourseForEnrollments | null>(null);
  const [enrollments, setEnrollments] = useState<ApiEnrollment[]>([]);
  const [progressData, setProgressData] = useState<Record<string, StudentProgress>>({});
  
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchCoursesForRole = useCallback(async () => {
    if (!currentUser) return;
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
  }, [currentUser, toast]);

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
    if (!isAuthLoading && currentUser) {
      fetchCoursesForRole();
    }
  }, [currentUser, isAuthLoading, fetchCoursesForRole]);

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
  
  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length -1]) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    if (names.length === 1 && names[0]) return names[0].substring(0, 2).toUpperCase();
    return name.substring(0, 2).toUpperCase();
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
  
  const pageTitle = currentUser.role === 'ADMINISTRATOR' ? "Gestión Global de Inscritos y Progreso" : "Inscritos y Progreso de Mis Cursos";
  const pageDescription = currentUser.role === 'ADMINISTRATOR' 
    ? "Selecciona un curso para ver los estudiantes inscritos y su progreso."
    : "Selecciona uno de tus cursos para ver los estudiantes inscritos y su progreso.";


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2"><UsersRound /> {pageTitle}</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert"><AlertTriangle className="inline h-4 w-4 mr-2" />{error}</div>}
          
          <div className="mb-6">
            <Label htmlFor="course-selector" className="text-lg font-semibold">Seleccionar Curso:</Label>
            {isLoadingCourses ? <Loader2 className="animate-spin my-2"/> : courses.length > 0 ? (
              <Select onValueChange={handleCourseSelection} value={selectedCourse?.id || ""}>
                <SelectTrigger id="course-selector" className="mt-1">
                  <SelectValue placeholder="Elige un curso para ver detalles" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} (Instructor: {course.instructor?.name || 'N/A'}, Lecciones: {course.lessonsCount ?? 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground mt-1">
                {currentUser.role === 'INSTRUCTOR' ? 'No tienes cursos asignados.' : 'No hay cursos disponibles en la plataforma.'}
              </p>
            )}
          </div>

          {selectedCourse && (
            <Card className="mt-6 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Estudiantes Inscritos en: {selectedCourse.title}</CardTitle>
                 <div className="flex justify-between items-center pt-2">
                    <CardDescription>Total de lecciones en el curso: {selectedCourse.lessonsCount ?? 'Calculando...'}</CardDescription>
                    <div className="relative w-full max-w-xs">
                        <Input 
                            type="search"
                            placeholder="Buscar estudiante por nombre o email..."
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
                        const studentProg = progressData[`${enrollment.user.id}-${selectedCourse.id}`];
                        return (
                          <TableRow key={enrollment.user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={enrollment.user.avatar || undefined} alt={enrollment.user.name || 'User'} />
                                  <AvatarFallback>{getInitials(enrollment.user.name)}</AvatarFallback>
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
                                <span className="text-xs text-muted-foreground">Cargando progreso...</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right hidden md:table-cell text-xs text-muted-foreground">
                                {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', { timeZone: 'America/Bogota' })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    {searchTerm ? "Ningún estudiante coincide con tu búsqueda." : "No hay estudiantes inscritos en este curso aún."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
           {currentUser.role === 'ADMINISTRATOR' && !selectedCourse && enrollments.length > 0 && (
                <Card className="mt-6">
                    <CardHeader><CardTitle>Todas las Inscripciones (Vista Admin)</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Selecciona un curso para ver detalles o implementa una vista general aquí.</p>
                    </CardContent>
                </Card>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
