
// @ts-nocheck
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlayCircle, FileText as FileTextIcon, Layers, Clock, UserCircle2 as UserIcon, Download, ExternalLink, Loader2, AlertTriangle, Tv2, BookOpenText, Lightbulb, CheckCircle, Image as ImageIcon, File as FileGenericIcon, Award, PencilRuler, XCircle, Circle, Eye, Check, Search, PanelLeft, LineChart } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, LessonType, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption, CourseProgress, LessonCompletionRecord } from '@/types';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Course as PrismaCourse, Module as PrismaModule, Lesson as PrismaLesson, User as PrismaUser } from '@prisma/client';
import { QuizViewer } from '@/components/quiz-viewer';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Helper types and functions
interface PrismaLessonWithQuiz extends PrismaLesson {
  quiz?: (AppQuiz & { questions: (AppQuestion & { options: AppAnswerOption[] })[] }) | null;
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
    instructorId: apiCourse.instructorId || undefined,
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
        quiz: less.quiz ? {
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


// --- MAIN COMPONENT ---
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
  const [isFinalProgressVisible, setIsFinalProgressVisible] = useState(false);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // New state for sidebar visibility

  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allLessons = useMemo(() => course?.modules.flatMap(m => m.lessons) || [], [course]);
  const totalLessonsCount = allLessons.length;
  
  // --- New Interaction Logic ---
  const recordInteraction = useCallback(async (lessonId: string, type: 'view' | 'quiz', score?: number) => {
    if (!user || !courseId || !isEnrolled || provisionalProgress[lessonId]) return;
    
    setProvisionalProgress(prev => ({ ...prev, [lessonId]: true }));
    
    let endpoint = `/api/progress/${user.id}/${courseId}/lesson`;
    let payload: any = { lessonId };
    if (type === 'quiz') {
        endpoint = `/api/progress/${user.id}/${courseId}/quiz`;
        payload.score = score;
    }
    
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(e => console.error("Failed to record interaction:", e));

  }, [user, courseId, isEnrolled, provisionalProgress]);

  const onScroll = useCallback((lessonId: string) => {
    const element = contentRefs.current[lessonId];
    if (element && !provisionalProgress[lessonId]) {
        const isScrolledToEnd = element.scrollHeight - element.scrollTop <= element.clientHeight + 1.5;
        if (isScrolledToEnd) {
            recordInteraction(lessonId, 'view');
        }
    }
  }, [provisionalProgress, recordInteraction]);


  // --- Data Fetching & State Management ---
  const fetchCourseAndProgress = useCallback(async () => {
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
      
      const firstLessonId = appCourseData.modules?.[0]?.lessons?.[0]?.id;
      if (firstLessonId) {
        setSelectedLessonId(firstLessonId);
      }

      const enrollmentData = enrollmentStatusResponse?.ok ? await enrollmentStatusResponse.json() : { isEnrolled: false };
      setIsEnrolled(enrollmentData.isEnrolled);
      
      if (user && enrollmentData.isEnrolled) {
        const progressResponse = await fetch(`/api/progress/${user.id}/${courseId}`, { cache: 'no-store' });
        if (progressResponse.ok) {
          const progressData: CourseProgress = await progressResponse.json();
          setCourseProgress(progressData);
          
          if (progressData.progressPercentage > 0) {
            setIsFinalProgressVisible(true);
          }
          
          const initialProvisional: Record<string, boolean> = {};
          (progressData.completedLessonIds || []).forEach(record => {
              initialProvisional[record.lessonId] = true;
          });
          setProvisionalProgress(initialProvisional);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    fetchCourseAndProgress();
  }, [fetchCourseAndProgress]);
  
  const handleQuizSubmitted = useCallback((lessonId: string, score: number) => {
    recordInteraction(lessonId, 'quiz', score);
  }, [recordInteraction]);

  const isCourseProvisionallyComplete = useMemo(() => {
    if (totalLessonsCount === 0) return false;
    return allLessons.every(lesson => provisionalProgress[lesson.id]);
  }, [provisionalProgress, allLessons, totalLessonsCount]);

  const handleConsolidateProgress = async () => {
      if (!user || !courseId) return;
      setIsConsolidating(true);
      try {
          const response = await fetch(`/api/progress/${user.id}/${courseId}/consolidate`, { method: 'POST' });
          if (!response.ok) throw new Error((await response.json()).message || "Failed to consolidate progress");
          
          const finalProgressData = await response.json();
          setCourseProgress(finalProgressData);
          setIsFinalProgressVisible(true);
          toast({ title: "Progreso Calculado", description: "Tu puntuación final ha sido guardada." });
      } catch (error) {
          toast({ title: "Error", description: `No se pudo calcular tu progreso: ${(error as Error).message}`, variant: "destructive"});
      } finally {
          setIsConsolidating(false);
      }
  };
  
  const selectedLesson = useMemo(() => {
    if (!selectedLessonId || !course) return null;
    return course.modules.flatMap(m => m.lessons).find(l => l.id === selectedLessonId);
  }, [selectedLessonId, course]);

  const filteredModules = useMemo(() => {
    if (!course) return [];
    if (!sidebarSearch.trim()) return course.modules;
    
    const searchTerm = sidebarSearch.toLowerCase();
    return course.modules.map(module => {
        const filteredLessons = module.lessons.filter(lesson =>
            lesson.title.toLowerCase().includes(searchTerm)
        );
        return { ...module, lessons: filteredLessons };
    }).filter(module => 
        module.title.toLowerCase().includes(searchTerm) || module.lessons.length > 0
    );
  }, [course, sidebarSearch]);


  const isCreatorViewingCourse = useMemo(() => {
    if (!user || !course) return false;
    return user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === course.instructorId);
  }, [user, course]);
  
  const handleLessonSelect = (lesson: AppLesson) => {
      setSelectedLessonId(lesson.id);
      if (lesson.type !== 'QUIZ' && !provisionalProgress[lesson.id]) {
        recordInteraction(lesson.id, 'view');
      }
  };

  const getLessonIcon = (type: LessonType | undefined) => {
    switch(type) {
      case 'VIDEO': return <Tv2 className="h-4 w-4 text-primary flex-shrink-0" />;
      case 'TEXT': return <BookOpenText className="h-4 w-4 text-primary flex-shrink-0" />;
      case 'QUIZ': return <Lightbulb className="h-4 w-4 text-primary flex-shrink-0" />;
      case 'FILE': return <FileGenericIcon className="h-4 w-4 text-primary flex-shrink-0" />;
      default: return <FileTextIcon className="h-4 w-4 text-primary flex-shrink-0" />;
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
      return (
        <div className="aspect-video w-full max-w-4xl mx-auto my-4 rounded-lg overflow-hidden shadow-md">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} title={`YouTube video: ${lesson.title}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div className="my-4 p-2 bg-muted/30 rounded-md" onScroll={() => onScroll(lesson.id)} ref={el => contentRefs.current[lesson.id] = el} style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <iframe src={lesson.content} className="w-full h-[600px] border rounded-md" title={`PDF Preview: ${lesson.title}`}/>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="my-4 p-2 bg-muted/30 rounded-md flex justify-center">
          <Image src={lesson.content} alt={`Preview: ${lesson.title}`} width={800} height={600} className="rounded-md object-contain max-h-[600px]" onError={(e) => { e.currentTarget.src="https://placehold.co/800x600.png"; }} data-ai-hint="lesson file" />
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
        <div className="prose dark:prose-invert prose-sm max-w-none my-4 p-3 border rounded-md bg-card whitespace-pre-wrap" onScroll={() => onScroll(lesson.id)} ref={el => contentRefs.current[lesson.id] = el} style={{ maxHeight: '500px', overflowY: 'auto' }}>
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
     return ( <div className="flex flex-col items-center justify-center min-h-screen text-destructive"><AlertTriangle className="h-10 w-10 mb-2" /><p className="text-lg font-semibold">Error al cargar el curso</p><p className="text-sm mb-4">{error}</p><Button onClick={() => router.back()} variant="outline" className="mr-2">Volver</Button><Button onClick={fetchCourseAndProgress}>Reintentar</Button></div> );
  }
  if (!course) {
    return ( <div className="flex flex-col items-center justify-center min-h-screen"><AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" /><p className="text-lg text-muted-foreground">Curso no encontrado.</p><Button onClick={() => router.back()} variant="outline" className="mt-4">Volver</Button></div> );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh_-_var(--header-height,64px))]">
       <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarVisible(!isSidebarVisible)}>
                    <PanelLeft />
                </Button>
                <h1 className="text-xl font-semibold font-headline truncate" title={course.title}>
                    {course.title}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                { !isCreatorViewingCourse && isEnrolled && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <LineChart className="mr-2 h-4 w-4" /> Ver Mi Progreso
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Tu Progreso</DialogTitle>
                                <DialogDescription>
                                    {isFinalProgressVisible ? "Este es tu resultado final para el curso." : "Completa todas las lecciones para calcular tu puntuación."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center space-y-4 py-6">
                                {isFinalProgressVisible && courseProgress ? (
                                    <div className="text-center p-4 space-y-3">
                                        <CircularProgress value={courseProgress.progressPercentage || 0} size={150} strokeWidth={12} />
                                        <h3 className="text-xl font-semibold text-foreground pt-4">Puntuación Final</h3>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 space-y-3">
                                        <p className="text-muted-foreground max-w-xs">Completa todas las lecciones y presiona el botón para calcular tu puntuación final.</p>
                                        <Button onClick={handleConsolidateProgress} disabled={!isCourseProvisionallyComplete || isConsolidating} className="w-full">
                                            {isConsolidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            {isConsolidating ? 'Calculando...' : 'Calcular Mi Puntuación Final'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                {isCreatorViewingCourse ? (
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                        <Link href={`/manage-courses/${course.id}/edit`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                )}
            </div>
        </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 min-h-0">
        
        {/* Sidebar */}
        <aside className={cn(
            "bg-card border rounded-lg flex-col transition-all duration-300",
            "md:col-span-1 lg:col-span-1",
            isSidebarVisible ? "flex" : "hidden"
        )}>
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar lección..." 
                        className="pl-9 h-9" 
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                 <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="w-full p-2">
                    {filteredModules.map((moduleItem) => (
                      <AccordionItem value={moduleItem.id} key={moduleItem.id} className="border-b-0 mb-1">
                        <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 px-2 hover:bg-muted/50 rounded-md">
                          <span className="truncate">{moduleItem.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-1 pr-0 pl-2">
                          {moduleItem.lessons.length > 0 ? (
                            <ul className="space-y-1 border-l-2 border-primary/20 ml-2 pl-4">
                              {moduleItem.lessons.map(lesson => {
                                const isCompleted = provisionalProgress[lesson.id];
                                return (
                                <li key={lesson.id} className="py-0.5">
                                    <button 
                                        onClick={() => handleLessonSelect(lesson)}
                                        className={cn(
                                            "w-full text-left text-sm flex items-center gap-2 p-2 rounded-md transition-colors",
                                            selectedLessonId === lesson.id 
                                                ? "bg-primary/10 text-primary font-medium" 
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        {getLessonIcon(lesson.type)}
                                        <span className="flex-grow truncate">{lesson.title}</span>
                                        {isCompleted && <CheckCircle className="h-4 w-4 text-green-500 shrink-0"/>}
                                    </button>
                                </li>
                              )})}
                            </ul>
                           ) : (
                            <p className="text-muted-foreground text-xs text-center py-2 italic">No hay lecciones en este módulo.</p>
                           )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                 </Accordion>
                 {filteredModules.length === 0 && (
                     <p className="text-muted-foreground text-xs text-center py-4 px-2">No se encontraron lecciones que coincidan con la búsqueda.</p>
                 )}
            </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className={cn(
            "bg-card rounded-lg border flex flex-col transition-all duration-300",
            isSidebarVisible ? "md:col-span-3 lg:col-span-4" : "col-span-full"
        )}>
            <ScrollArea className="flex-1">
                <div className="p-4 md:p-6 lg:p-8">
                {selectedLesson ? (
                    <div>
                        <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                            {getLessonIcon(selectedLesson.type)}
                            <h2>{selectedLesson.title}</h2>
                        </div>
                        {renderLessonContent(selectedLesson)}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <BookOpenText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Selecciona una lección</h3>
                        <p className="text-muted-foreground">Elige una lección de la barra lateral para comenzar a aprender.</p>
                    </div>
                )}
                </div>
            </ScrollArea>
        </main>
      </div>
    </div>
  );
}
