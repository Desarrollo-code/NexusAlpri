'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, X, Replace, Pencil, Eye, FilePlus2, ChevronDown, BookOpenText, Video, FileText, File as FileGenericIcon, Layers3, Sparkles, Award, CheckCircle, Calendar as CalendarIcon, Info, Settings2, Globe as GlobeIcon, Target, Shield, Clock3, Layout, Sparkles as SparklesIcon, BookOpen, Zap, Target as TargetIcon, BarChart, Users, Tag, Hash, Lock, Unlock, Filter, Palette, EyeOff, ArrowRight, Check, Plus, Minus, Grid3x3, List, Eye as EyeIcon, Maximize2, Minimize2, FolderPlus, FolderOpen, Calendar, Timer, TrendingUp, BarChart2, PieChart, Download, Share2, Bell, Star, Edit, Copy, MoreHorizontal, ExternalLink, HelpCircle, AlertCircle, Info as InfoIcon, ChevronRight, ChevronLeft, FlipVertical, FlipHorizontal, SquareStack, PanelLeft, PanelRight, PanelsTopLeft, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, LessonType, CourseStatus, Quiz as AppQuiz, ContentBlock } from '@/types';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { CourseAssignmentModal } from '@/components/course-assignment-modal';
import { QuizEditorModal } from '@/components/quizz-it/quiz-editor-modal';
import { useTitle } from '@/contexts/title-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// === INTERFACES ===
interface InteractiveComponentData {
  type: 'accordion' | 'flipCards' | 'tabs';
  items: InteractiveItem[];
  settings?: {
    allowMultipleOpen?: boolean;
    flipDirection?: 'horizontal' | 'vertical';
    tabPosition?: 'top' | 'left' | 'right' | 'bottom';
  };
}

interface InteractiveItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imagePreview?: string;
}

interface ApiTemplate {
  id: string;
  name: string;
  description: string;
  templateBlocks: any[];
  creator: { name: string | null } | null;
}

interface PrismaCertificateTemplate {
  id: string;
  name: string;
}

const generateUniqueId = (prefix: string): string => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${randomPart}`;
};

// === NUEVO LAYOUT PRINCIPAL ===
export function CourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, settings, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();

  const [course, setCourse] = useState<AppCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Estados para modales
  const [itemToDeleteDetails, setItemToDeleteDetails] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<{ quiz: AppQuiz; onSave: (updatedQuiz: AppQuiz) => void } | null>(null);

  // Estados para navegación
  const [activeSection, setActiveSection] = useState<'basics' | 'modules' | 'settings'>('basics');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Calcular estadísticas
  const courseStats = course ? {
    modules: course.modules?.length || 0,
    lessons: course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0,
    blocks: course.modules?.reduce((acc, mod) => 
      acc + (mod.lessons?.reduce((lessonAcc, lesson) => 
        lessonAcc + (lesson.contentBlocks?.length || 0), 0) || 0), 0) || 0,
    hasCertificate: !!course.certificateTemplateId
  } : { modules: 0, lessons: 0, blocks: 0, hasCertificate: false };

  // Data Fetching
  useEffect(() => {
    const fetchCourse = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        if (courseId === 'new') {
          setCourse({
            id: generateUniqueId('course'),
            title: 'Nuevo Curso sin Título',
            description: 'Añade una descripción aquí.',
            instructor: user as any,
            instructorId: user?.id,
            status: 'DRAFT',
            category: '',
            modules: [],
            modulesCount: 0,
            prerequisiteId: null,
            isMandatory: false,
            certificateTemplateId: null,
            imageUrl: null,
          });
          setPageTitle('Crear Nuevo Curso');
          return;
        }

        const courseRes = await fetch(`/api/courses/${courseId}`);
        if (!courseRes.ok) throw new Error("Curso no encontrado");
        
        const courseData: AppCourse = await courseRes.json();
        setCourse(courseData);

      } catch (err) {
        toast({
          title: "Error",
          description: "No se pudo cargar el curso para editar.",
          variant: "destructive"
        });
        router.push('/manage-courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, user, router, toast, setPageTitle]);

  const handleSaveCourse = useCallback(async () => {
    if (!course) return;
    setIsSaving(true);

    const payload = { ...course };
    
    try {
      const endpoint = courseId === 'new' ? '/api/courses' : `/api/courses/${courseId}`;
      const method = courseId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error al guardar el curso.');

      const savedCourse = await response.json();

      toast({
        title: "✅ Curso Guardado",
        description: "La información del curso se ha guardado correctamente.",
        duration: 3000
      });

      setCourse(savedCourse);
      setIsDirty(false);

      if (courseId === 'new') {
        router.replace(`/manage-courses/${savedCourse.id}/edit`, { scroll: false });
      }

    } catch (error: any) {
      toast({
        title: "❌ Error al Guardar",
        description: error.message || "No se pudo guardar. Intenta nuevamente.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  }, [course, courseId, router, toast]);

  const handleStateUpdate = useCallback((updater: (prev: AppCourse) => AppCourse) => {
    setCourse(prev => {
      if (!prev) return null;
      const newCourse = JSON.parse(JSON.stringify(prev));
      return updater(newCourse);
    });
    setIsDirty(true);
  }, []);

  const handleAddModule = () => {
    handleStateUpdate(prev => {
      const newModule: AppModule = {
        id: generateUniqueId('module'),
        title: 'Nuevo Módulo',
        order: (prev.modules || []).length,
        lessons: [],
      };
      if (!prev.modules) prev.modules = [];
      prev.modules.push(newModule);
      setExpandedModule(newModule.id);
      return prev;
    });
  };

  if (isLoading || isAuthLoading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-muted-foreground">
            {courseId === 'new' ? 'Preparando editor...' : 'Cargando curso...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header Principal */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/manage-courses"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold truncate max-w-md">{course.title}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {course.status === 'DRAFT' ? 'Borrador' : course.status === 'PUBLISHED' ? 'Publicado' : 'Archivado'}
                    </Badge>
                    <span>•</span>
                    <span>ID: {course.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/courses/${courseId}?preview=true`, '_blank')}
                disabled={courseId === 'new'}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              
              <Button
                onClick={handleSaveCourse}
                disabled={isSaving || !isDirty}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isDirty ? 'Guardar Cambios' : 'Guardado'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de Secciones */}
      <div className="sticky top-[64px] z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1">
              {[
                { id: 'basics', label: 'Información', icon: Info },
                { id: 'modules', label: 'Módulos', icon: Layers3, badge: courseStats.modules },
                { id: 'settings', label: 'Configuración', icon: Settings2 }
              ].map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSection(section.id as any)}
                  className="relative px-4 py-2 rounded-lg transition-all"
                >
                  <section.icon className="h-4 w-4 mr-2" />
                  {section.label}
                  {section.badge !== undefined && (
                    <Badge className="ml-2 h-5 min-w-5 flex items-center justify-center">
                      {section.badge}
                    </Badge>
                  )}
                  {activeSection === section.id && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {isDirty && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Cambios sin guardar</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Sección: Información Básica */}
            {activeSection === 'basics' && (
              <div className="space-y-6">
                {/* Tarjeta de Título y Descripción */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Información del Curso
                    </CardTitle>
                    <CardDescription>
                      Define los detalles principales de tu programa educativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Título del Curso</Label>
                      <Input
                        value={course.title}
                        onChange={e => handleStateUpdate(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ej: Master en Desarrollo Web Moderno"
                        className="text-lg h-12"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Descripción</Label>
                      <RichTextEditor
                        value={course.description || ''}
                        onChange={v => handleStateUpdate(prev => ({ ...prev, description: v }))}
                        placeholder="Describe qué aprenderán tus estudiantes..."
                        className="min-h-[200px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Estado</Label>
                        <Select
                          value={course.status}
                          onValueChange={v => handleStateUpdate(prev => ({ ...prev, status: v as CourseStatus }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Borrador</SelectItem>
                            <SelectItem value="PUBLISHED">Publicado</SelectItem>
                            <SelectItem value="ARCHIVED">Archivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Categoría</Label>
                        <Select
                          value={course.category || ''}
                          onValueChange={v => handleStateUpdate(prev => ({ ...prev, category: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {(settings?.resourceCategories || []).map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tarjeta de Imagen de Portada */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-primary" />
                      Imagen de Portada
                    </CardTitle>
                    <CardDescription>
                      Añade una imagen atractiva para tu curso (recomendado 1600x1200px)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[16/9] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden group relative bg-gray-50 dark:bg-gray-800/50">
                      {course.imageUrl ? (
                        <>
                          <Image
                            src={course.imageUrl}
                            alt="Imagen del curso"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => document.getElementById('cover-upload')?.click()}
                            >
                              <Replace className="h-3.5 w-3.5 mr-1" />
                              Cambiar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStateUpdate(prev => ({ ...prev, imageUrl: null }))}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </>
                      ) : (
                        <UploadArea
                          onFileSelect={async (file) => {
                            if (!file) return;
                            setIsUploadingImage(true);
                            try {
                              const result = await uploadWithProgress('/api/upload/course-image', file, () => {});
                              handleStateUpdate(prev => ({ ...prev, imageUrl: result.url }));
                              toast({
                                title: '✅ Imagen Subida',
                                description: 'La imagen de portada se ha actualizado.',
                                duration: 3000
                              });
                            } catch (err) {
                              toast({
                                title: '❌ Error',
                                description: (err as Error).message,
                                variant: "destructive"
                              });
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                          inputId="cover-upload"
                          className="h-full flex flex-col items-center justify-center p-8 cursor-pointer"
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p>Subiendo imagen...</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="font-medium mb-1">Haz clic para subir una imagen</p>
                              <p className="text-sm text-gray-500">o arrastra y suelta</p>
                            </div>
                          )}
                        </UploadArea>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sección: Módulos */}
            {activeSection === 'modules' && (
              <div className="space-y-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Plan de Estudios</h2>
                    <p className="text-muted-foreground">Organiza el contenido en módulos y lecciones</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateModal(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Plantillas
                    </Button>
                    <Button onClick={handleAddModule}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Módulo
                    </Button>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Módulos</p>
                          <p className="text-2xl font-bold">{courseStats.modules}</p>
                        </div>
                        <Layers3 className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400">Lecciones</p>
                          <p className="text-2xl font-bold">{courseStats.lessons}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-400">Elementos</p>
                          <p className="text-2xl font-bold">{courseStats.blocks}</p>
                        </div>
                        <FileText className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-amber-600 dark:text-amber-400">Certificado</p>
                          <p className="text-2xl font-bold">
                            {courseStats.hasCertificate ? 'Sí' : 'No'}
                          </p>
                        </div>
                        <Award className="h-8 w-8 text-amber-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Módulos */}
                <div className="space-y-4">
                  {course.modules.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <CardContent className="py-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <FolderPlus className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Comienza tu plan de estudios</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          Organiza tu conocimiento en módulos estructurados
                        </p>
                        <Button onClick={handleAddModule} size="lg">
                          <PlusCircle className="h-5 w-5 mr-2" />
                          Crear Primer Módulo
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination || !course) return;
                      handleStateUpdate(prev => {
                        const modules = [...prev.modules];
                        const [removed] = modules.splice(result.source.index, 1);
                        modules.splice(result.destination!.index, 0, removed);
                        return { ...prev, modules };
                      });
                    }}>
                      <Droppable droppableId="modules">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {course.modules.map((module, moduleIndex) => (
                              <Draggable key={module.id} draggableId={module.id} index={moduleIndex}>
                                {(provided) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="group"
                                  >
                                    <Card className="border hover:border-primary/30 transition-all">
                                      <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-start gap-3 flex-1">
                                            <div {...provided.dragHandleProps} className="cursor-grab p-2">
                                              <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                                            </div>
                                            
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                  M{moduleIndex + 1}
                                                </Badge>
                                                <Input
                                                  value={module.title}
                                                  onChange={e => handleStateUpdate(prev => {
                                                    const newModules = [...prev.modules];
                                                    newModules[moduleIndex].title = e.target.value;
                                                    return { ...prev, modules: newModules };
                                                  })}
                                                  className="border-0 font-bold text-lg p-0 h-auto"
                                                  placeholder="Nombre del módulo"
                                                />
                                              </div>
                                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span>{module.lessons?.length || 0} lecciones</span>
                                                <span>•</span>
                                                <Button
                                                  variant="link"
                                                  size="sm"
                                                  className="p-0 h-auto"
                                                  onClick={() => setExpandedModule(
                                                    expandedModule === module.id ? null : module.id
                                                  )}
                                                >
                                                  {expandedModule === module.id ? 'Ocultar' : 'Mostrar'} detalles
                                                </Button>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                handleStateUpdate(prev => {
                                                  const newModules = [...prev.modules];
                                                  const duplicated = { ...newModules[moduleIndex] };
                                                  duplicated.id = generateUniqueId('module');
                                                  duplicated.title = `${duplicated.title} (Copia)`;
                                                  newModules.splice(moduleIndex + 1, 0, duplicated);
                                                  return { ...prev, modules: newModules };
                                                });
                                              }}
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                setItemToDeleteDetails({
                                                  name: module.title,
                                                  onDelete: () => {
                                                    handleStateUpdate(prev => ({
                                                      ...prev,
                                                      modules: prev.modules.filter(m => m.id !== module.id)
                                                    }));
                                                  }
                                                });
                                              }}
                                              className="text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardHeader>

                                      <AnimatePresence>
                                        {expandedModule === module.id && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                          >
                                            <CardContent className="pt-0">
                                              {/* Aquí iría el contenido detallado del módulo */}
                                              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-sm text-muted-foreground">
                                                  Aquí se mostrarían las lecciones de este módulo...
                                                </p>
                                              </div>
                                            </CardContent>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </Card>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </div>
            )}

            {/* Sección: Configuración */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Certificado */}
                  <Card className="border-none shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Certificación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Plantilla de Certificado</Label>
                        <Select
                          value={course.certificateTemplateId || 'none'}
                          onValueChange={v => handleStateUpdate(prev => ({ 
                            ...prev, 
                            certificateTemplateId: v === 'none' ? null : v 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sin certificado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin certificado</SelectItem>
                            {/* Aquí irían las plantillas reales */}
                            <SelectItem value="template1">Plantilla Básica</SelectItem>
                            <SelectItem value="template2">Plantilla Profesional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disponibilidad */}
                  <Card className="border-none shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Disponibilidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DateRangePicker
                        date={{
                          from: course.startDate ? new Date(course.startDate) : undefined,
                          to: course.endDate ? new Date(course.endDate) : undefined
                        }}
                        onDateChange={(range) => {
                          handleStateUpdate(prev => ({
                            ...prev,
                            startDate: range?.from?.toISOString(),
                            endDate: range?.to?.toISOString()
                          }));
                        }}
                      />
                    </CardContent>
                  </Card>

                  {/* Asignación Obligatoria */}
                  <Card className="border-none shadow-lg lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Control de Acceso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Asignación Obligatoria</p>
                          <p className="text-sm text-muted-foreground">
                            Habilita para asignar este curso a grupos específicos
                          </p>
                        </div>
                        <Switch
                          checked={course.isMandatory}
                          onCheckedChange={(checked) => {
                            handleStateUpdate(prev => ({ ...prev, isMandatory: checked }));
                            if (checked) {
                              setTimeout(() => setIsAssignmentModalOpen(true), 300);
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de Estado Flotante */}
      {isDirty && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <Card className="shadow-2xl border-2 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Cambios sin guardar</p>
                    <p className="text-sm text-muted-foreground">
                      Guarda tu trabajo antes de salir
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveCourse}
                  disabled={isSaving}
                  className="ml-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Diálogos y Modales */}
      <AlertDialog open={!!itemToDeleteDetails} onOpenChange={(open) => !open && setItemToDeleteDetails(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará "{itemToDeleteDetails?.name}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                itemToDeleteDetails?.onDelete?.();
                setItemToDeleteDetails(null);
                toast({
                  title: "Elemento eliminado",
                  description: "Se ha eliminado correctamente.",
                });
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAssignmentModalOpen && (
        <CourseAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
        />
      )}
    </div>
  );
}

// Componente simplificado para Selector de Tipo de Bloque
const BlockTypeSelector = ({ onSelect }: { onSelect: (type: LessonType) => void }) => {
  const types = [
    { type: 'TEXT' as LessonType, label: 'Texto', icon: FileText, color: 'text-blue-500' },
    { type: 'VIDEO' as LessonType, label: 'Video', icon: Video, color: 'text-red-500' },
    { type: 'FILE' as LessonType, label: 'Archivo', icon: FileGenericIcon, color: 'text-amber-500' },
    { type: 'QUIZ' as LessonType, label: 'Quiz', icon: Pencil, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {types.map(({ type, label, icon: Icon, color }) => (
        <Button
          key={type}
          variant="outline"
          className="h-auto py-3 flex-col gap-2"
          onClick={() => onSelect(type)}
        >
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
};