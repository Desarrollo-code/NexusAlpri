
// @ts-nocheck
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlayCircle, FileText as FileTextIcon, Layers, Clock, UserCircle2 as UserIcon, Download, ExternalLink, Loader2, AlertTriangle, Tv2, BookOpenText, Lightbulb, CheckCircle, Image as ImageIcon, File as FileGenericIcon, Award, PencilRuler, XCircle, Circle, Eye, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, LessonType, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption, CourseProgress, LessonCompletionRecord } from '@/types';
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
import { CircularProgress } from '@/components/ui/circular-progress';

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
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [provisionalProgress, setProvisionalProgress] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [isConsolidating, setIsConsolidating] = useState(false);
  
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allLessons = useMemo(() => course?.modules.flatMap(m => m.lessons) || [], [course]);
  const totalLessonsCount = allLessons.length;

  const handleViewInteraction = useCallback((lessonId: string) => {
    // Prevent duplicate API calls for the same interaction
    if (provisionalProgress[lessonId]) {
      return;
    }
    
    setProvisionalProgress(prev => ({...prev, [lessonId]: true }));
    
    if(user && courseId && isEnrolled) {
        // This is a "fire-and-forget" call to log the view
        fetch(`/api/progress/${user.id}/${courseId}/lesson`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId, type: 'view' }),
        }).catch(e => console.error("Failed to log view interaction:", e));
    }
  }, [user, courseId, isEnrolled, provisionalProgress]);

  const onScroll = (lessonId: string) => {
    const element = contentRefs.current[lessonId];
    if (element) {
        // Add a 1.5px buffer to ensure it triggers on most screens
        const isScrolledToEnd = element.scrollHeight - element.scrollTop <= element.clientHeight + 1.5;
        if (isScrolledToEnd) {
            handleViewInteraction(lessonId);
        }
    }
  };

  const isCourseProvisionallyComplete = useMemo(() => {
    if (totalLessonsCount === 0) return false;
    return allLessons.every(lesson => provisionalProgress[lesson.id]);
  }, [provisionalProgress, allLessons, totalLessonsCount]);


  const modulesForDisplay = useMemo(() => {
     return course?.modules.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(m => ({
        ...m,
        lessons: m.lessons.sort((la, lb) => (la.order ?? 0) - (lb.order ?? 0))
     })) || [];
  }, [course]);

  const isCreatorViewingCourse = useMemo(() => {
    if (!user || !course) return false;
    return user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === course.instructorId);
  }, [user, course]);


  const fetchProgress = useCallback(async () => {
      if (!user || !user.id || !courseId || !isEnrolled) return;
      try {
        const progressResponse = await fetch(`/api/progress/${user.id}/${courseId}`, { cache: 'no-store' });
        if (progressResponse.ok) {
          const progressData: CourseProgress = await progressResponse.json();
          setCourseProgress(progressData);
          // Pre-fill provisional progress based on what's already completed in the backend
          const initialProvisional: Record<string, boolean> = {};
          progressData.completedLessonIds.forEach(record => {
              initialProvisional[record.lessonId] = true;
          });
          setProvisionalProgress(initialProvisional);
        } else {
            setCourseProgress(null);
        }
      } catch (err) {
          console.error("Failed to fetch progress", err);
          setCourseProgress(null);
      }
  }, [courseId, user, isEnrolled]);

  const fetchCourseDetailsAndEnrollment = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [courseResponse, enrollmentStatusResponse] = await Promise.all([
        fetch(`/api/courses/${courseId}`, { cache: 'no-store' }),
        user ? fetch(`/api/enrollment/status/${user.id}/${courseId}`, { cache: 'no-store' }) : Promise.resolve(null)
      ]);

      if (!courseResponse.ok) throw new Error(courseResponse.status === 404 ? 'Curso no encontrado' : 'Failed to fetch course details');
      const apiCourseData: ApiDetailedCourse = await courseResponse.json();
      const appCourseData = mapApiDetailedCourseToAppCourse(apiCourseData);
      setCourse(appCourseData);

      if (appCourseData.modules?.[0]) setActiveAccordionItem(appCourseData.modules[0].id);
      
      const enrollmentData = enrollmentStatusResponse && enrollmentStatusResponse.ok ? await enrollmentStatusResponse.json() : { isEnrolled: false };
      setIsEnrolled(enrollmentData.isEnrolled);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      setCourse(null);
      setIsEnrolled(false);
      toast({ title: "Error al Cargar", description: err instanceof Error ? err.message : 'No se pudo cargar el curso.', variant: "destructive"});
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
  
  const handleQuizSubmitted = (lessonId: string, score: number) => {
    // The QuizViewer component already handles the API call.
    // This handler's job is just to update the local UI state to reflect completion.
    setProvisionalProgress(prev => ({...prev, [lessonId]: true }));
  };

  const handleConsolidateProgress = async () => {
      if (!user || !courseId) return;
      setIsConsolidating(true);
      try {
          await fetchProgress(); // Re-fetch the final, calculated progress
          toast({ title: "Progreso Consolidado", description: "Tu progreso final ha sido calculado y guardado." });
      } catch (error) {
          toast({ title: "Error", description: "No se pudo consolidar tu progreso.", variant: "destructive"});
      } finally {
          setIsConsolidating(false);
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
  
  const renderLessonContent = (lesson: AppLesson) => {
    if (lesson.type === 'QUIZ') {
        return (
            <QuizViewer 
                quiz={lesson.quiz}
                lessonId={lesson.id}
                courseId={courseId}
                isEnrolled={isEnrolled}
                onQuizCompleted={handleQuizSubmitted}
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
      // For YouTube, accurate tracking is complex. Mark as viewed on load as a compromise.
      return (
        <div className="aspect-video w-full max-w-2xl mx-auto my-4 rounded-lg overflow-hidden shadow-md">
          <iframe 
             className="w-full h-full"
             src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
             title={`YouTube video: ${lesson.title}`}
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
             onLoad={() => handleViewInteraction(lesson.id)}
           ></iframe>
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div className="my-4 p-2 bg-muted/30 rounded-md" onScroll={() => onScroll(lesson.id)} ref={el => contentRefs.current[lesson.id] = el} style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <iframe 
            src={lesson.content} 
            className="w-full h-[500px] border rounded-md" 
            title={`PDF Preview: ${lesson.title}`}
            onLoad={() => onScroll(lesson.id)}
          />
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="my-4 p-2 bg-muted/30 rounded-md flex justify-center" onLoad={() => handleViewInteraction(lesson.id)}>
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
        <div className="my-4 p-4 bg-muted/50 rounded-md text-center" onLoad={() => handleViewInteraction(lesson.id)}>
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
            <div className="my-4 p-4 bg-muted/50 rounded-md" onLoad={() => handleViewInteraction(lesson.id)}>
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
        <div className="prose dark:prose-invert prose-sm max-w-none my-4 p-3 border rounded-md bg-card whitespace-pre-wrap" onScroll={() => onScroll(lesson.id)} ref={el => contentRefs.current[lesson.id] = el} style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {lesson.content}
        </div>
       );
    }

    return <p className="text-sm text-muted-foreground my-4">Contenido de la lección no disponible.</p>;
  };


  if (isLoading || isEnrolled === null) { 
    return ( <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /><p className="text-lg">Cargando detalles del curso...</p></div> );
  }
  if (error && !course) {
     return ( <div className="flex flex-col items-center justify-center min-h-screen text-destructive"><AlertTriangle className="h-10 w-10 mb-2" /><p className="text-lg font-semibold">Error al cargar el curso</p><p className="text-sm mb-4">{error}</p><Button onClick={() => router.back()} variant="outline" className="mr-2">Volver</Button><Button onClick={fetchCourseDetailsAndEnrollment}>Reintentar</Button></div> );
  }
  if (!course) {
    return ( <div className="flex flex-col items-center justify-center min-h-screen"><AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" /><p className="text-lg text-muted-foreground">Curso no encontrado.</p><Button onClick={() => router.back()} variant="outline" className="mt-4">Volver</Button></div> );
  }
  
  return (
    <div className="space-y-8">
        {isCreatorViewingCourse ? (
            <Button asChild variant="outline" className="mb-6 print:hidden">
                <Link href={`/manage-courses/${course.id}/edit`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión
                </Link>
            </Button>
        ) : (
            <Button variant="outline" onClick={() => router.back()} className="mb-6 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
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
                        onClick={() => moduleItem.lessons.forEach(lesson => { if(lesson.type !== 'QUIZ') handleViewInteraction(lesson.id)})}
                    >
                      {moduleItem.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3 px-2">
                      {moduleItem.lessons.length > 0 ? (
                        <ul className="space-y-3">
                          {moduleItem.lessons.map(lesson => {
                            const isProvisionallyCompleted = provisionalProgress[lesson.id];
                            return (
                            <li key={lesson.id} className={`p-3 rounded-md border ${isProvisionallyCompleted ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-card'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getLessonIcon(lesson.type)}
                                            <span className={`font-medium ${isProvisionallyCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>{lesson.title}</span>
                                            {isProvisionallyCompleted && <CheckCircle className="h-4 w-4 text-green-600"/>}
                                        </div>
                                        {renderLessonContent(lesson)}
                                    </div>
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
               {modulesForDisplay.length === 0 && !isLoading && <p className="text-muted-foreground text-center py-4">El contenido de este curso aún no está disponible.</p>}
            </CardContent>
          </Card>
        </div>

        {!isCreatorViewingCourse && isEnrolled && (
            <div className="w-full max-w-md mx-auto pt-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="text-xl font-headline">Tu Progreso</CardTitle>
                {!user && <CardDescription className="text-xs">Inicia sesión para ver tu progreso.</CardDescription>}
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
                {courseProgress ? (
                    courseProgress.progressPercentage >= 100 ? (
                    <div className="text-center p-4 space-y-3">
                        <Award className="mx-auto h-16 w-16 text-green-500" />
                        <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">¡Felicidades, has completado el curso!</h3>
                        <p className="text-2xl font-bold text-muted-foreground">Puntuación Final: {Math.round(courseProgress.progressPercentage)}%</p>
                    </div>
                    ) : (
                    <>
                        <CircularProgress value={courseProgress.progressPercentage || 0} size={150} strokeWidth={12} />
                        <p className="text-sm text-center text-muted-foreground pt-2">Tu puntuación final.</p>
                    </>
                    )
                ) : (
                    <div className="text-center p-4 space-y-3">
                        <p className="text-muted-foreground max-w-xs">Completa todas las lecciones y presiona el botón para consolidar y ver tu progreso final.</p>
                         <Button onClick={handleConsolidateProgress} disabled={!isCourseProvisionallyComplete || isConsolidating} className="w-full">
                            {isConsolidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isConsolidating ? 'Calculando...' : 'Revisar Mi Progreso'}
                        </Button>
                    </div>
                )}
                </CardContent>
            </Card>
            </div>
        )}
    </div>
  );
}
