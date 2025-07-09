
// @ts-nocheck
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlayCircle, FileText as FileTextIcon, Layers, Clock, UserCircle2 as UserIcon, Download, ExternalLink, Loader2, AlertTriangle, Tv2, BookOpenText, Lightbulb, CheckCircle, Image as ImageIcon, File as FileGenericIcon, Award, PencilRuler, XCircle, Circle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, LessonType, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption, CourseProgress } from '@/types';
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse, Module as PrismaModule, Lesson as PrismaLesson, User as PrismaUser } from '@prisma/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { QuizViewer } from '@/components/quiz-viewer';

// Extend Prisma types to include nested relations for type safety
interface PrismaLessonWithQuiz extends PrismaLesson {
  quiz?: (PrismaQuiz & {
    questions: (PrismaQuestion & {
      options: PrismaAnswerOption[];
    })[];
  }) | null;
}
interface PrismaModuleWithLessons extends Omit<PrismaModule, 'lessons'> {
  lessons: PrismaLessonWithQuiz[];
}
interface ApiDetailedCourse extends Omit<PrismaCourse, 'instructor' | 'modules'> {
  instructor: { id: string; name: string } | null;
  modules: PrismaModuleWithLessons[];
  modulesCount?: number;
}

function mapApiDetailedCourseToAppCourse(apiCourse: ApiDetailedCourse): AppCourse {
  return {
    id: apiCourse.id,
    title: apiCourse.title || '',
    description: apiCourse.description || '',
    instructor: apiCourse.instructor?.name || 'N/A',
    instructorId: apiCourse.instructorId || undefined, // Keep instructorId
    imageUrl: apiCourse.imageUrl || undefined,
    modulesCount: apiCourse.modules?.length ?? apiCourse.modulesCount ?? 0,
    modules: (apiCourse.modules || []).map(mod => ({
      id: mod.id,
      title: mod.title || '',
      order: mod.order ?? 0,
      lessons: (mod.lessons || []).map(less => ({
        id: less.id,
        title: less.title || '',
        type: less.type as AppLesson['type'],
        content: less.content || '',
        order: less.order ?? 0,
        quiz: less.quiz ? { // Map Quiz data if it exists
            id: less.quiz.id,
            title: less.quiz.title,
            description: less.quiz.description,
            questions: less.quiz.questions.map(q => ({
                id: q.id,
                text: q.text,
                type: q.type,
                order: q.order,
                options: q.options.map(o => ({
                    id: o.id,
                    text: o.text,
                    isCorrect: o.isCorrect,
                    feedback: o.feedback,
                })).sort((a,b) => a.id.localeCompare(b.id)),
            })).sort((a,b) => a.order - b.order),
        } : undefined,
      })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  };
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      videoId = urlObj.searchParams.get('v');
    } else if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1);
    }
  } catch (e) {
    // Fallback for cases where URL might be just the ID string
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  return videoId;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [course, setCourse] = useState<AppCourse | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  
  const [lessonCompletion, setLessonCompletion] = useState<Record<string, boolean>>({});
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);
  
  const hasQuizzes = useMemo(() => {
    return course?.modules.some(m => m.lessons.some(l => l.type === 'QUIZ')) ?? false;
  }, [course]);

  const modulesForDisplay = useMemo(() => {
     return course?.modules.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(m => ({
        ...m,
        lessons: m.lessons.sort((la, lb) => (la.order ?? 0) - (lb.order ?? 0))
     })) || [];
  }, [course]);

  const isCreatorViewingCourse = useMemo(() => {
    if (!user || !course) return false;
    // An Admin or the assigned Instructor are considered creators/editors
    return user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === course.instructorId);
  }, [user, course]);


  const fetchProgress = useCallback(async () => {
      if (!user || !user.id || !courseId || !isEnrolled) return;
      try {
        const progressResponse = await fetch(`/api/progress/${user.id}/${courseId}`, { cache: 'no-store' });
        if (progressResponse.ok) {
          const progressData: CourseProgress = await progressResponse.json();
          const initialCompletion: Record<string, boolean> = {};
          if (progressData && progressData.completedLessonIds) {
            progressData.completedLessonIds.forEach(id => {
              initialCompletion[id] = true;
            });
          }
          setLessonCompletion(initialCompletion);
          setOverallProgress(progressData.progressPercentage || 0);
          setCompletedLessonsCount(progressData.completedLessonsCount || 0);
          setTotalLessons(progressData.totalLessons || modulesForDisplay.flatMap(m => m.lessons).length);
        } else {
            setLessonCompletion({});
            setOverallProgress(0);
            setCompletedLessonsCount(0);
            setTotalLessons(modulesForDisplay.flatMap(m => m.lessons).length);
        }
      } catch (err) {
          console.error("Failed to fetch progress", err);
      }
  }, [courseId, user, isEnrolled, modulesForDisplay]);

  const fetchCourseDetailsAndEnrollment = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchPromises: [Promise<Response>, Promise<Response | null>] = [
        fetch(`/api/courses/${courseId}`, { cache: 'no-store' }),
        user && user.id ? fetch(`/api/enrollment/status/${user.id}/${courseId}`, { cache: 'no-store' }) : Promise.resolve(null)
      ];
      
      const [courseResponse, enrollmentStatusResponseOpt] = await Promise.all(fetchPromises);

      if (!courseResponse.ok) {
        if (courseResponse.status === 404) throw new Error('Curso no encontrado');
        const errorData = await courseResponse.json();
        throw new Error(errorData.message || `Failed to fetch course details: ${courseResponse.statusText}`);
      }
      const apiCourseData: ApiDetailedCourse = await courseResponse.json();
      const appCourseData = mapApiDetailedCourseToAppCourse(apiCourseData);
      setCourse(appCourseData);

      if (appCourseData.modules && appCourseData.modules.length > 0 && appCourseData.modules[0]) {
        setActiveAccordionItem(appCourseData.modules[0].id);
      }
      
      let isActuallyEnrolled = false;
      if (enrollmentStatusResponseOpt) {
        if (enrollmentStatusResponseOpt.ok) {
            const enrollmentData: { isEnrolled: boolean } = await enrollmentStatusResponseOpt.json();
            setIsEnrolled(enrollmentData.isEnrolled);
            isActuallyEnrolled = enrollmentData.isEnrolled;
        } else {
            setIsEnrolled(false);
        }
      } else {
          setIsEnrolled(false);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar el curso y su progreso');
      setCourse(null);
      setLessonCompletion({});
      setIsEnrolled(false);
      toast({ title: "Error al cargar", description: err instanceof Error ? err.message : 'No se pudo cargar el curso o su progreso.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [courseId, user, toast]);

  useEffect(() => {
    fetchCourseDetailsAndEnrollment();
  }, [fetchCourseDetailsAndEnrollment]);

  useEffect(() => {
      if (!isLoading && isEnrolled) {
          fetchProgress();
      }
  }, [isLoading, isEnrolled, fetchProgress]);


  const handleToggleComplete = async (lessonId: string, currentState: boolean) => {
    if (!user || !user.id || !courseId || !isEnrolled) {
      toast({ title: "Acción no permitida", description: "Debes estar inscrito en el curso para marcar el progreso.", variant: "destructive" });
      return;
    }

    const newCompletedStatus = !currentState;

    // Optimistic UI update
    const oldCompletionState = {...lessonCompletion};
    setLessonCompletion(prev => ({ ...prev, [lessonId]: newCompletedStatus }));
    setIsSavingProgress(true);

    try {
      const response = await fetch(`/api/progress/${user.id}/${courseId}/lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, completed: newCompletedStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update progress');
      }
      
      // Re-fetch progress to get the updated percentage and state
      await fetchProgress();

      toast({ title: newCompletedStatus ? "Lección Completada" : "Progreso Actualizado", description: `Has ${newCompletedStatus ? 'completado' : 'desmarcado'} la lección.` });
    } catch (err) {
      // Rollback on error
      setLessonCompletion(oldCompletionState); 
      toast({ title: "Error al guardar progreso", description: err instanceof Error ? err.message : 'No se pudo guardar el progreso.', variant: "destructive" });
    } finally {
      setIsSavingProgress(false);
    }
  };
  
  const getLessonIcon = (type: LessonType | undefined) => {
    switch(type) {
      case 'VIDEO': return <Tv2 className="h-5 w-5 text-primary flex-shrink-0" />;
      case 'TEXT': return <BookOpenText className="h-5 w-5 text-primary flex-shrink-0" />;
      case 'QUIZ': return <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />;
      case 'FILE': return <FileGenericIcon className="h-5 w-5 text-primary flex-shrink-0" />;
      default: return <FileTextIcon className="h-5 w-5 text-primary flex-shrink-0" />;
    }
  };
  
  const handleQuizCompleted = async (lessonId: string, score: number) => {
    // This callback is now primarily for re-fetching the progress state from the server
    // after the QuizViewer has submitted the score to the backend.
    await fetchProgress();
  };

  const renderLessonContent = (lesson: AppLesson) => {
    if (lesson.type === 'QUIZ') {
        return (
            <QuizViewer 
                quiz={lesson.quiz}
                lessonId={lesson.id}
                courseId={courseId}
                isEnrolled={isEnrolled}
                onQuizCompleted={handleQuizCompleted}
            />
        );
    }
      
    if (!lesson.content) {
      return <p className="text-sm text-muted-foreground my-4">Contenido de la lección no disponible.</p>;
    }

    const videoId = lesson.type === 'VIDEO' ? getYouTubeVideoId(lesson.content) : null;
    const isPdf = lesson.type === 'FILE' && lesson.content?.toLowerCase().endsWith('.pdf');
    const isImage = lesson.type === 'FILE' && lesson.content?.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/);
    
    if (videoId) {
      return (
        <div className="aspect-video w-full max-w-2xl mx-auto my-4 rounded-lg overflow-hidden shadow-md">
          <iframe 
             className="w-full h-full"
             src={`https://www.youtube.com/embed/${videoId}`}
             title={`YouTube video: ${lesson.title}`}
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
           ></iframe>
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div className="my-4 p-2 bg-muted/30 rounded-md">
          <iframe 
            src={lesson.content} 
            className="w-full h-[500px] border rounded-md" 
            title={`PDF Preview: ${lesson.title}`}
          />
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="my-4 p-2 bg-muted/30 rounded-md flex justify-center">
          <Image 
            src={lesson.content} 
            alt={`Preview: ${lesson.title}`} 
            width={600} 
            height={400} 
            className="rounded-md object-contain max-h-[500px]"
            onError={(e) => { e.currentTarget.src="https://placehold.co/600x400.png"; }}
            data-ai-hint="lesson file"
          />
        </div>
      );
    }
    
    if (lesson.type === 'FILE') { 
      return (
        <div className="my-4 p-4 bg-muted/50 rounded-md text-center">
          <p className="text-sm text-muted-foreground mb-2">Este recurso es un archivo descargable:</p>
          <Button asChild size="sm">
            <Link href={lesson.content} target="_blank" rel="noopener noreferrer" download>
              <Download className="mr-2 h-4 w-4" /> Descargar {lesson.title}
            </Link>
          </Button>
        </div>
      );
    }

    if (lesson.type === 'TEXT') {
       const isExternalLink = lesson.content.startsWith('http://') || lesson.content.startsWith('https://');
       if (isExternalLink) {
         return (
            <div className="my-4 p-4 bg-muted/50 rounded-md">
             <p className="text-sm text-muted-foreground mb-2">Esta lección es un enlace externo:</p>
             <Button variant="link" asChild className="p-0 h-auto">
                <Link href={lesson.content} target="_blank" rel="noopener noreferrer">
                    {lesson.title} <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
             </Button>
           </div>
         );
       }
       return (
        <div className="prose dark:prose-invert prose-sm max-w-none my-4 p-3 border rounded-md bg-card whitespace-pre-wrap">{lesson.content}</div>
       );
    }

    return <p className="text-sm text-muted-foreground my-4">Contenido de la lección no disponible.</p>;
  };


  if (isLoading && !course && (isEnrolled === null && user)) { 
    return ( <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /><p className="text-lg">Cargando detalles del curso...</p></div> );
  }
  if (isLoading && !course && !user) {
      return ( <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /><p className="text-lg">Cargando...</p></div> );
  }
  if (error && !course) {
     return ( <div className="flex flex-col items-center justify-center min-h-screen text-destructive"><AlertTriangle className="h-10 w-10 mb-2" /><p className="text-lg font-semibold">Error al cargar el curso</p><p className="text-sm mb-4">{error}</p><Button onClick={() => router.back()} variant="outline" className="mr-2">Volver al catálogo</Button><Button onClick={fetchCourseDetailsAndEnrollment}>Reintentar</Button></div> );
  }
  if (!course && !isLoading) {
    return ( <div className="flex flex-col items-center justify-center min-h-screen"><AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" /><p className="text-lg text-muted-foreground">Curso no encontrado.</p><Button onClick={() => router.back()} variant="outline" className="mt-4">Volver al catálogo</Button></div> );
  }
  if (!course) {
     return ( <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /><p className="text-lg">Cargando...</p></div> );
  }
  
  const handleAccordionInteraction = (lessonId: string) => {
    // Implicit completion for content-only courses on interaction
    if (!hasQuizzes && isEnrolled && lessonId && !lessonCompletion[lessonId]) {
      handleToggleComplete(lessonId, false);
    }
  };

  return (
    <div className="space-y-8">
        {isCreatorViewingCourse ? (
            <Button asChild variant="outline" className="mb-6 print:hidden">
                <Link href={`/manage-courses/${course.id}/edit`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión de Contenido
                </Link>
            </Button>
        ) : (
            <Button variant="outline" onClick={() => router.back()} className="mb-6 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Catálogo
            </Button>
        )}

        <div className="space-y-6">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="p-0 relative h-[300px] md:h-[400px] bg-card text-primary-foreground">
              <Image
                src={course.imageUrl || "https://placehold.co/1200x400.png"}
                alt={course.title || "Course image"}
                fill
                className="object-cover"
                data-ai-hint="online learning education"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <h1 className="text-4xl font-bold font-headline drop-shadow-lg">{course.title}</h1>
                <CardDescription className="text-lg text-primary-foreground/90 drop-shadow-md line-clamp-2">{course.description}</CardDescription>
                <div className="flex items-center gap-x-6 gap-y-2 pt-2 text-sm flex-wrap">
                    <div className="flex items-center gap-2"><UserIcon className="h-4 w-4" />{course.instructor}</div>
                    <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> {course.modulesCount} Módulos</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold font-headline mb-4">Contenido del Curso</h2>
              {isLoading && modulesForDisplay.length === 0 && <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Cargando contenido...</div>}

              <Accordion type="single" collapsible className="w-full" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                {modulesForDisplay.map((moduleItem) => (
                  <AccordionItem value={moduleItem.id} key={moduleItem.id} className="border-b border-border last:border-b-0">
                    <AccordionTrigger 
                        className="text-md font-semibold hover:no-underline py-4 px-2 hover:bg-muted/50 rounded-md data-[state=open]:bg-muted/80"
                        onClick={() => handleAccordionInteraction(moduleItem.lessons[0]?.id)}
                    >
                      {moduleItem.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3 px-2">
                      {moduleItem.lessons.length > 0 ? (
                        <ul className="space-y-3">
                          {moduleItem.lessons.map(lesson => {
                            const isCompletedByUser = isEnrolled && lessonCompletion[lesson.id];
                            return (
                            <li key={lesson.id} className={`p-3 rounded-md border ${isCompletedByUser ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-card'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getLessonIcon(lesson.type)}
                                            <span className={`font-medium ${isCompletedByUser ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{lesson.title}</span>
                                        </div>
                                        {renderLessonContent(lesson)}
                                    </div>
                                    
                                    {isEnrolled && hasQuizzes && lesson.type !== 'QUIZ' && (
                                        <Button
                                            variant={isCompletedByUser ? 'secondary' : 'outline'}
                                            size="sm"
                                            onClick={() => handleToggleComplete(lesson.id, !!isCompletedByUser)}
                                            disabled={isSavingProgress}
                                            className="shrink-0"
                                            aria-label={isCompletedByUser ? 'Marcar como no completada' : 'Marcar como completada'}
                                        >
                                            {isSavingProgress ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isCompletedByUser ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Circle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="ml-2 hidden sm:inline">{isCompletedByUser ? 'Completada' : 'Completar'}</span>
                                        </Button>
                                    )}

                                    {isEnrolled && lesson.type === 'QUIZ' && isCompletedByUser && (
                                        <div className="flex flex-col items-center gap-1 text-green-600">
                                            <CheckCircle className="h-5 w-5" />
                                            <span className="text-xs font-medium hidden sm:inline">Aprobado</span>
                                        </div>
                                    )}
                                </div>
                            </li>
                          )})}
                        </ul>
                       ) : (
                        <p className="text-muted-foreground text-sm text-center py-2">Este módulo aún no tiene lecciones.</p>
                       )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
               {modulesForDisplay.length === 0 && !isLoading && <p className="text-muted-foreground text-center py-4">El contenido detallado de este curso (módulos y lecciones) aún no está disponible.</p>}
            </CardContent>
          </Card>
        </div>

        {!isCreatorViewingCourse && (
            <div className="w-full max-w-md mx-auto pt-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="text-xl font-headline">Tu Progreso</CardTitle>
                {!user && <CardDescription className="text-xs">Inicia sesión para ver tu progreso.</CardDescription>}
                {user && isEnrolled === false && <CardDescription className="text-xs">Inscríbete para hacer seguimiento de tu progreso.</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                {user && isEnrolled ? ( 
                    overallProgress >= 100 ? (
                    <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 space-y-3">
                        <Award className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">¡Felicidades, has completado el curso!</h3>
                    </div>
                    ) : (
                    <>
                        <Progress value={overallProgress} className="w-full h-3" />
                        <p className="text-sm text-center text-muted-foreground">{Math.round(overallProgress)}% completado</p>
                        {overallProgress > 0 ? (
                        <Button className="w-full mt-2 bg-primary hover:bg-primary/90">
                            Continuar Aprendiendo
                        </Button>
                        ) : (
                        <Button className="w-full mt-2 bg-primary hover:bg-primary/90">
                            Comenzar Curso
                        </Button>
                        )}
                    </>
                    )
                ) : (
                    <p className="text-sm text-muted-foreground text-center">
                    {user && isEnrolled === null ? "Cargando estado de inscripción..." : user ? "Inscríbete en el curso para ver tu progreso." : "Inicia sesión para ver tu progreso."}
                    </p>
                )}
                </CardContent>
            </Card>
            </div>
        )}
    </div>
  );
}
