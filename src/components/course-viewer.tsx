// @ts-nocheck
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlayCircle, FileText as FileTextIcon, Layers, Clock, UserCircle2 as UserIcon, Download, ExternalLink, Loader2, AlertTriangle, Tv2, BookOpenText, Lightbulb, CheckCircle, Image as ImageIcon, File as FileGenericIcon, Award, PencilRuler, XCircle, Circle, Eye, Check, Search, PanelLeft, LineChart, Notebook, ScreenShare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, ContentBlock, LessonType, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption, CourseProgress, LessonCompletionRecord, UserNote } from '@/types';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { QuizViewer } from '@/components/quiz-viewer';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTitle } from '@/contexts/title-context';
import { useDebounce } from '@/hooks/use-debounce';
import { RichTextEditor } from './ui/rich-text-editor';


// --- Helper types and functions ---
function getYouTubeVideoId(url: string | null | undefined): string | null {
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

// --- Note Taking Component ---
const LessonNotesPanel = ({ lessonId, isOpen, onOpenChange }: { lessonId: string, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { user } = useAuth();
    const [noteContent, setNoteContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const debouncedContent = useDebounce(noteContent, 1000); // 1-second debounce
    const isInitialLoad = useRef(true);

    useEffect(() => {
        if (!isOpen) return;
        isInitialLoad.current = true; // Reset on open
        const fetchNote = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const res = await fetch(`/api/notes/${lessonId}`);
                const data: UserNote = res.ok ? await res.json() : { content: '' };
                setNoteContent(data.content);
            } catch (error) {
                 setNoteContent('');
            } finally {
                setIsLoading(false);
                setTimeout(() => { isInitialLoad.current = false; }, 500);
            }
        };
        fetchNote();
    }, [lessonId, user, isOpen]);

    const saveNote = useCallback(async (content: string) => {
        if (!user) return;
        setIsSaving(true);
        try {
            await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, content }),
            });
        } catch (error) {
            console.error("Failed to save note:", error);
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    }, [lessonId, user]);

    useEffect(() => {
        if (!isInitialLoad.current && !isLoading) {
            saveNote(debouncedContent);
        }
    }, [debouncedContent, saveNote, isLoading]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetContent className="w-[90vw] max-w-md flex flex-col p-0" side="right">
                <SheetHeader className="p-4 border-b flex flex-row items-center justify-between h-16">
                     <SheetTitle className="flex items-center gap-2">
                        <Notebook className="h-5 w-5" />
                        <span>Mis Apuntes</span>
                    </SheetTitle>
                    <div className="flex items-center gap-2">
                        {isSaving && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>Guardando...</p>}
                    </div>
                </SheetHeader>
                <div className="flex-1 min-h-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                       <RichTextEditor
                            value={noteContent}
                            onChange={setNoteContent}
                            placeholder="Escribe tus notas privadas para esta lección aquí. Se guardarán automáticamente..."
                            className="w-full h-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    )}
                </div>
          </SheetContent>
        </Sheet>
    );
};

const VideoPlayer = ({ videoUrl, lessonTitle }: { videoUrl: string, lessonTitle?: string }) => {
    const videoId = getYouTubeVideoId(videoUrl);
    const [showRotateHint, setShowRotateHint] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < window.innerHeight && window.innerWidth < 768) { // Portrait mode on mobile
                setShowRotateHint(true);
                const timer = setTimeout(() => setShowRotateHint(false), 3000);
                return () => clearTimeout(timer);
            } else {
                setShowRotateHint(false);
            }
        };

        if (containerRef.current) {
            handleResize(); // Initial check
            window.addEventListener('resize', handleResize);
        }
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!videoId) return null;

    return (
        <div ref={containerRef} className="aspect-video w-full max-w-4xl mx-auto my-4 rounded-lg overflow-hidden shadow-md relative group">
            <iframe 
                className="w-full h-full" 
                src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&modestbranding=1`} 
                title={`YouTube video: ${lessonTitle}`} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            ></iframe>
            {showRotateHint && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white pointer-events-none transition-opacity duration-300 opacity-100 group-hover:opacity-0">
                    <ScreenShare className="h-12 w-12 mb-2 animate-pulse" />
                    <p className="font-semibold">Gira tu dispositivo</p>
                    <p className="text-sm">para una mejor experiencia</p>
                </div>
            )}
        </div>
    );
}

// --- MAIN COMPONENT ---
interface CourseViewerProps {
    courseId: string;
}

export function CourseViewer({ courseId }: CourseViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();

  const [course, setCourse] = useState<AppCourse | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [provisionalProgress, setProvisionalProgress] = useState<Record<string, boolean>>({});
  
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const lessonIdFromQuery = searchParams.get('lesson');
  const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id;

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessonIdFromQuery || null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);

  const allLessons = useMemo(() => course?.modules.flatMap(m => m.lessons) || [], [course]);
  const totalLessonsCount = allLessons.length;

  const isCreatorViewingCourse = useMemo(() => {
    if (!user || !course) return false;
    return user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === course.instructorId);
  }, [user, course]);
  
  const handleConsolidateProgress = useCallback(async () => {
      if (!user || !courseId || isConsolidating) return;
      setIsConsolidating(true);
      try {
          const response = await fetch(`/api/progress/${user.id}/${courseId}/consolidate`, { method: 'POST' });
          if (!response.ok) throw new Error((await response.json()).message || "Failed to consolidate progress");
          
          const finalProgressData = await response.json();
          setCourseProgress(finalProgressData);
          toast({ title: "¡Curso Finalizado!", description: "Tu puntuación final ha sido calculada y guardada." });
      } catch (error) {
          toast({ title: "Error", description: `No se pudo calcular tu progreso: ${(error as Error).message}`, variant: "destructive"});
      } finally {
          setIsConsolidating(false);
      }
  }, [user, courseId, toast, isConsolidating]);

  const recordInteraction = useCallback(async (lessonId: string, type: 'view' | 'quiz', score?: number) => {
    if (isCreatorViewingCourse || !user || !courseId || !isEnrolled || provisionalProgress[lessonId]) return;
    
    // Optimistic update
    const nextProvisionalProgress = { ...provisionalProgress, [lessonId]: true };
    setProvisionalProgress(nextProvisionalProgress);
    
    // Check if this was the last lesson
    const allLessonsAreCompleted = allLessons.every(lesson => nextProvisionalProgress[lesson.id]);

    if (allLessonsAreCompleted) {
        // Automatically trigger final calculation
        handleConsolidateProgress();
    }
    
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

  }, [user, courseId, isEnrolled, provisionalProgress, isCreatorViewingCourse, allLessons, handleConsolidateProgress]);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const courseRes = await fetch(`/api/courses/${courseId}`);
            if (!courseRes.ok) throw new Error("Course not found");
            const courseData = await courseRes.json();
            setCourse(courseData);
            setPageTitle(courseData.title);

            if (user) {
                const enrollmentRes = await fetch(`/api/enrollment/status/${user.id}/${courseId}`);
                if (enrollmentRes.ok) {
                    const { isEnrolled: enrolledStatus } = await enrollmentRes.json();
                    setIsEnrolled(enrolledStatus);

                    if (enrolledStatus) {
                        const progressRes = await fetch(`/api/progress/${user.id}/${courseId}`);
                        if (progressRes.ok) {
                            const progressData = await progressRes.json();
                            setCourseProgress(progressData);
                            const initialProgress: Record<string, boolean> = {};
                            if (progressData?.completedLessons) {
                                progressData.completedLessons.forEach((record: LessonCompletionRecord) => {
                                    initialProgress[record.lessonId] = true;
                                });
                            }
                            setProvisionalProgress(initialProgress);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch course data", error);
            toast({ title: 'Error', description: 'No se pudo cargar el curso.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [courseId, user, toast, setPageTitle]);
  
  useEffect(() => {
    if (isLoading) return;
    const lessonToSelect = lessonIdFromQuery || firstLessonId;
    if (lessonToSelect) {
      if(selectedLessonId !== lessonToSelect) {
        setSelectedLessonId(lessonToSelect);
      }
      if (user && isEnrolled && !isCreatorViewingCourse) {
        recordInteraction(lessonToSelect, 'view');
      }
    } else if (!selectedLessonId && firstLessonId) {
        setSelectedLessonId(firstLessonId);
    }
  }, [isLoading, course, lessonIdFromQuery, firstLessonId, user, isEnrolled, recordInteraction, isCreatorViewingCourse, selectedLessonId]);
  
  const handleQuizSubmitted = useCallback((lessonId: string, score: number) => {
    recordInteraction(lessonId, 'quiz', score);
  }, [recordInteraction]);

  const selectedLesson = useMemo(() => {
    if (!selectedLessonId || !course) return null;
    let foundModule: AppModule | undefined;
    const lesson = course.modules.flatMap(m => {
        const found = m.lessons.find(l => l.id === selectedLessonId);
        if (found) foundModule = m;
        return found ? [found] : [];
    })[0];
    
    if (lesson && foundModule) {
        return { ...lesson, moduleTitle: foundModule.title };
    }
    return null;
  }, [selectedLessonId, course]);

  useEffect(() => {
      if (selectedLesson) {
          setPageTitle(selectedLesson.title);
      } else if (course) {
          setPageTitle(course.title);
      }
  }, [selectedLesson, course, setPageTitle]);

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

  const handleLessonSelect = (lesson: AppLesson) => {
      setSelectedLessonId(lesson.id);
      if (isMobile) {
        setIsMobileSheetOpen(false);
      }
      recordInteraction(lesson.id, 'view');
      router.push(`/courses/${courseId}?lesson=${lesson.id}`, { scroll: false });
  };
  
  const renderContentBlock = (block: ContentBlock) => {
    if (block.type === 'VIDEO') {
        return <VideoPlayer key={block.id} videoUrl={block.content || ''} lessonTitle={selectedLesson?.title} />
    }
    
    if (block.type === 'QUIZ') {
        return (
            <QuizViewer 
                key={block.id}
                quiz={block.quiz}
                lessonId={selectedLessonId!}
                courseId={courseId}
                isEnrolled={isEnrolled}
                isCreatorPreview={isCreatorViewingCourse}
                onQuizCompleted={handleQuizSubmitted}
            />
        );
    }
      
    if (!block.content) {
      return <p key={block.id} className="text-sm text-muted-foreground my-4">Contenido no disponible.</p>;
    }

    if (block.type === 'TEXT') {
        const isUrl = /^(https?:\/\/)/.test(block.content);
        if (isUrl) {
            return (
                <Card key={block.id} className="my-4 bg-muted/50 text-center">
                    <CardContent className="p-6">
                        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <ExternalLink className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{selectedLesson?.title}</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                            Esta lección te redirigirá a un recurso externo. Haz clic en el botón para continuar.
                        </p>
                        <Button asChild>
                            <Link href={block.content} target="_blank" rel="noopener noreferrer">
                                Visitar Sitio
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            );
        }
        return <div key={block.id} className="prose dark:prose-invert prose-sm max-w-none my-4 p-3 border rounded-md bg-card" style={{ maxHeight: '500px', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: block.content }} />;
    }
    
    if (block.type === 'FILE') {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(block.content);
        const isPdf = /\.pdf$/i.test(block.content);
        
        if (isImage) {
            return (
                <div key={block.id} className="my-4 p-2 bg-muted/30 rounded-md flex justify-center">
                    <div className="relative aspect-video w-full max-w-4xl p-2">
                        <Image src={block.content} alt={`Preview: ${selectedLesson?.title}`} fill className="object-contain" onError={(e) => { e.currentTarget.src="https://placehold.co/800x600.png"; }} data-ai-hint="lesson file" />
                    </div>
                </div>
            );
        }
        if (isPdf) {
            return (
                <div key={block.id} className="my-4 p-2 bg-muted/30 rounded-md" style={{ height: '70vh', minHeight: '500px' }}>
                    <iframe src={block.content} className="w-full h-full border rounded-md" title={`PDF Preview: ${selectedLesson?.title}`}/>
                </div>
            );
        }
        return (
            <div key={block.id} className="my-4 p-4 bg-muted/50 rounded-md text-center">
                <p className="text-sm text-muted-foreground mb-2">Este recurso es un archivo descargable:</p>
                <Button asChild size="sm">
                    <Link href={block.content} target="_blank" rel="noopener noreferrer" download>
                        <Download className="mr-2 h-4 w-4" /> Descargar Archivo
                    </Link>
                </Button>
            </div>
        );
    }

    return <p key={block.id} className="text-sm text-muted-foreground my-4">Contenido no disponible.</p>;
  };
  
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
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
             <Accordion type="multiple" defaultValue={course?.modules.map(m => m.id)} className="w-full p-2">
                {filteredModules.map((moduleItem) => (
                  <AccordionItem value={moduleItem.id} key={moduleItem.id} className="border-b-0 mb-1">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 px-2 hover:bg-muted/50 rounded-md">
                      <span className="text-left">{moduleItem.title}</span>
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
                                        "w-full text-left text-sm flex items-start gap-2 p-2 rounded-md transition-colors",
                                        selectedLessonId === lesson.id 
                                            ? "bg-primary/10 text-primary font-medium" 
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {isCompleted ? <CheckCircle className="h-4 w-4 text-green-500"/> : <BookOpenText className="h-4 w-4 text-primary/70" />}
                                    </div>
                                    <span className="flex-grow">{lesson.title}</span>
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
        { !isCreatorViewingCourse && isEnrolled && (
            <div className="p-4 border-t">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                            <LineChart className="mr-2 h-4 w-4" /> Ver Mi Progreso
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm text-center p-6">
                        <DialogHeader>
                            <DialogTitle>Tu Progreso en {course.title}</DialogTitle>
                            <DialogDescription>
                                {courseProgress && courseProgress.progressPercentage > 0 ? "Este es tu resultado final para el curso." : "Completa todas las lecciones para ver tu puntuación."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                            <CircularProgress value={courseProgress?.progressPercentage || 0} size={150} strokeWidth={12} />
                             {courseProgress?.progressPercentage === 0 && (
                                <p className="text-sm text-muted-foreground">Aún no has completado ninguna lección.</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )}
    </div>
  );
  
  if (isLoading || !course) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold">Cargando curso...</h3>
        </div>
    );
  }

  return (
    <div className="flex h-full">
        {/* --- Sidebar (desktop) --- */}
        {!isMobile && (
            <aside className={cn(
                "bg-card border-r flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out",
                isSidebarVisible ? "w-80" : "w-0"
            )}>
                <SidebarContent />
            </aside>
        )}
        
        {/* --- Sidebar (mobile) --- */}
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="left" className="p-0 w-full max-w-sm">
            <SheetHeader className="p-4 border-b">
                <SheetTitle>Contenido del Curso</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        {/* --- Main Content --- */}
        <div className="flex-1 flex flex-col min-w-0">
             <header className="flex-shrink-0 h-16 bg-card border-b flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => (isMobile ? setIsMobileSheetOpen(true) : setIsSidebarVisible(!isSidebarVisible))}>
                        <PanelLeft className="h-5 w-5" />
                    </Button>
                     <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2"/> Volver
                    </Button>
                </div>
                {isEnrolled && !isCreatorViewingCourse && (
                   <Button variant="outline" size="sm" onClick={() => setIsNotesPanelOpen(!isNotesPanelOpen)}>
                        <Notebook className="h-4 w-4 mr-2"/>
                        Mis Apuntes
                    </Button>
                )}
            </header>
            <main className="flex-1 overflow-hidden flex">
                <ScrollArea className="flex-1">
                    <div className="p-4 md:p-6 lg:p-8">
                    {selectedLesson ? (
                        <div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
                                <span>{course.title}</span>
                                <ChevronRight className="h-4 w-4"/>
                                <span className="font-semibold text-foreground">{selectedLesson.moduleTitle}</span>
                             </div>
                            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                                <BookOpenText className="h-5 w-5 text-primary" />
                                <h2>{selectedLesson.title}</h2>
                            </div>
                            {(selectedLesson.contentBlocks || []).map(block => renderContentBlock(block))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <BookOpenText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">Selecciona una lección</h3>
                            <p className="text-muted-foreground">Elige una lección del menú para comenzar a aprender.</p>
                        </div>
                    )}
                    </div>
                </ScrollArea>
                 {selectedLessonId && isEnrolled && !isCreatorViewingCourse && (
                    <LessonNotesPanel 
                        lessonId={selectedLessonId} 
                        isOpen={isNotesPanelOpen} 
                        onOpenChange={setIsNotesPanelOpen} 
                    />
                )}
            </main>
        </div>
    </div>
  );
}
