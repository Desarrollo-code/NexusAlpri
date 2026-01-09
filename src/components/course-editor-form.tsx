'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { motion, AnimatePresence } from 'framer-motion';

// Componentes UI - Importados individualmente desde sus rutas específicas
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

// Iconos esenciales - Solo los necesarios
import { 
  ArrowLeft, 
  Save, 
  PlusCircle, 
  Trash2, 
  UploadCloud, 
  GripVertical, 
  Loader2, 
  AlertTriangle, 
  ImagePlus, 
  X, 
  Copy, 
  Eye, 
  FilePlus2, 
  ChevronDown, 
  BookOpenText, 
  Video, 
  FileText, 
  Layers3, 
  Sparkles, 
  Award, 
  CheckCircle, 
  Calendar as CalendarIcon, 
  Settings2, 
  Globe, 
  Target, 
  Shield,
  Layout, 
  BookOpen, 
  Download, 
  Info, 
  Check, 
  Plus, 
  Grid3x3, 
  List,
  FolderOpen, 
  File as FileIcon,
  Zap, 
  Users, 
  Tag, 
  Lock, 
  Filter, 
  Palette, 
  MoreHorizontal, 
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  EyeOff,
  Maximize2,
  Minimize2,
  Bell,
  Star,
  Edit,
  ExternalLink,
  PieChart,
  BarChart2,
  TrendingUp,
  Timer,
  Calendar,
  Share2,
  Hash,
  Unlock,
  PanelLeft,
  PanelRight,
  PanelsTopLeft,
  FlipVertical,
  FlipHorizontal,
  SquareStack,
  Layers
} from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { QuizEditorModal } from '@/components/quizz-it/quiz-editor-modal';
import { CourseAssignmentModal } from '@/components/course-assignment-modal';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';
import type { Course, Module, Lesson, LessonType, CourseStatus, Quiz, ContentBlock } from '@/types';

// === UTILIDADES ===
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const safeFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    throw new Error(`API returned non-JSON: ${text.substring(0, 100)}`);
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// === COMPONENTES SIMPLIFICADOS ===

interface InteractiveComponent {
  type: 'accordion' | 'flipCards' | 'tabs';
  items: Array<{ id: string; title: string; content: string; imageUrl?: string }>;
}

const BlockTypeSelector = ({ onSelect }: { onSelect: (type: LessonType) => void }) => {
  const types = [
    { value: 'TEXT', label: 'Texto', icon: FileText, color: 'text-blue-600' },
    { value: 'VIDEO', label: 'Video', icon: Video, color: 'text-red-600' },
    { value: 'FILE', label: 'Archivo', icon: FileIcon, color: 'text-amber-600' },
    { value: 'QUIZ', label: 'Quiz', icon: Zap, color: 'text-purple-600' },
  ] as const;

  return (
    <div className="p-3 border rounded-lg bg-background/50">
      <p className="text-sm font-medium mb-3">Tipo de contenido</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {types.map(({ value, label, icon: Icon, color }) => (
          <Button
            key={value}
            variant="outline"
            onClick={() => onSelect(value as LessonType)}
            className="h-auto py-3 flex-col gap-2 hover:scale-[1.02] transition-all"
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

const ContentBlockItem = ({ 
  block, 
  onUpdate, 
  onDelete,
  onEditQuiz,
  dragHandleProps,
  isSaving = false 
}: { 
  block: ContentBlock;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onEditQuiz?: () => void;
  dragHandleProps: any;
  isSaving?: boolean;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadWithProgress('/api/upload/lesson-file', file, setUploadProgress);
      onUpdate('content', result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderContent = () => {
    switch (block.type) {
      case 'TEXT':
        return (
          <RichTextEditor
            value={block.content || ''}
            onChange={(value) => onUpdate('content', value)}
            placeholder="Escribe el contenido..."
            disabled={isSaving}
          />
        );
      
      case 'VIDEO':
        return (
          <div className="space-y-2">
            <Label>URL del video</Label>
            <Input
              value={block.content || ''}
              onChange={(e) => onUpdate('content', e.target.value)}
              placeholder="https://..."
              disabled={isSaving}
            />
          </div>
        );
      
      case 'FILE':
        return (
          <div className="space-y-3">
            <Label>Archivo adjunto</Label>
            {block.content ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium truncate">
                    {block.content.split('/').pop()}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => window.open(block.content, '_blank')}
                  >
                    Ver archivo
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdate('content', '')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <UploadArea
                onFileSelect={handleFileUpload}
                accept="*/*"
                disabled={isSaving || isUploading}
              >
                {isUploading ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <Progress value={uploadProgress} className="mt-2" />
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="h-8 w-8 mx-auto mb-2" />
                    <p>Arrastra o haz clic para subir</p>
                  </div>
                )}
              </UploadArea>
            )}
          </div>
        );
      
      case 'QUIZ':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Configuración del quiz</Label>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onEditQuiz}
              >
                Editar preguntas
              </Button>
            </div>
            <Input
              value={block.quiz?.title || ''}
              onChange={(e) => onUpdate('quiz', { ...block.quiz, title: e.target.value })}
              placeholder="Título del quiz"
              disabled={isSaving}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-3 p-3 border rounded-lg bg-card">
      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {block.type.toLowerCase()}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isSaving}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

const LessonItem = ({ 
  lesson, 
  index,
  onUpdate,
  onDelete,
  onAddBlock,
  onBlockUpdate,
  onBlockDelete,
  onEditQuiz,
  dragHandleProps
}: {
  lesson: Lesson;
  index: number;
  onUpdate: (field: keyof Lesson, value: any) => void;
  onDelete: () => void;
  onAddBlock: (type: LessonType) => void;
  onBlockUpdate: (blockIndex: number, field: string, value: any) => void;
  onBlockDelete: (blockIndex: number) => void;
  onEditQuiz: (quiz: Quiz) => void;
  dragHandleProps: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg">
      <div className="p-3 flex items-center gap-3">
        <div {...dragHandleProps} className="cursor-grab">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">L{index + 1}</Badge>
            <Input
              value={lesson.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              placeholder="Título de la lección"
              className="border-0 px-0"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-t space-y-3">
              <Droppable droppableId={lesson.id} type="BLOCKS">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {lesson.contentBlocks.map((block, blockIndex) => (
                      <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <ContentBlockItem
                              block={block}
                              onUpdate={(field, value) => onBlockUpdate(blockIndex, field, value)}
                              onDelete={() => onBlockDelete(blockIndex)}
                              onEditQuiz={() => block.type === 'QUIZ' && block.quiz && onEditQuiz(block.quiz)}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              <BlockTypeSelector onSelect={onAddBlock} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModuleItem = ({
  module,
  index,
  onUpdate,
  onDelete,
  onAddLesson,
  onLessonUpdate,
  onLessonDelete,
  onAddBlock,
  onBlockUpdate,
  onBlockDelete,
  onEditQuiz,
  dragHandleProps
}: {
  module: Module;
  index: number;
  onUpdate: (field: keyof Module, value: any) => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onLessonUpdate: (lessonIndex: number, field: keyof Lesson, value: any) => void;
  onLessonDelete: (lessonIndex: number) => void;
  onAddBlock: (lessonIndex: number, type: LessonType) => void;
  onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void;
  onBlockDelete: (lessonIndex: number, blockIndex: number) => void;
  onEditQuiz: (quiz: Quiz) => void;
  dragHandleProps: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-xl overflow-hidden"
    >
      <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...dragHandleProps} className="cursor-grab">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Layers3 className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">MÓDULO {index + 1}</span>
            </div>
            <Input
              value={module.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              placeholder="Nombre del módulo"
              className="text-lg font-semibold border-0 bg-transparent p-0"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <Droppable droppableId={module.id} type="LESSONS">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <LessonItem
                              lesson={lesson}
                              index={lessonIndex}
                              onUpdate={(field, value) => onLessonUpdate(lessonIndex, field, value)}
                              onDelete={() => onLessonDelete(lessonIndex)}
                              onAddBlock={(type) => onAddBlock(lessonIndex, type)}
                              onBlockUpdate={(blockIndex, field, value) => onBlockUpdate(lessonIndex, blockIndex, field, value)}
                              onBlockDelete={(blockIndex) => onBlockDelete(lessonIndex, blockIndex)}
                              onEditQuiz={onEditQuiz}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              <Button onClick={onAddLesson} variant="outline" className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Añadir lección
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// === COMPONENTE PRINCIPAL REDISEÑADO ===
export function CourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setPageTitle } = useTitle();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<{ quiz: Quiz; onSave: (quiz: Quiz) => void } | null>(null);

  // Cargar datos del curso
  useEffect(() => {
    const loadCourse = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        if (courseId === 'new') {
          setCourse({
            id: generateUniqueId('course'),
            title: 'Nuevo curso sin título',
            description: '',
            instructorId: user.id,
            instructor: user as any,
            status: 'DRAFT',
            category: '',
            modules: [],
            modulesCount: 0,
            prerequisiteId: null,
            isMandatory: false,
            certificateTemplateId: null,
            imageUrl: null,
          });
          setPageTitle('Crear nuevo curso');
          return;
        }

        const courseData = await safeFetch(`/api/courses/${courseId}`);
        setCourse(courseData);
        setPageTitle(`Editando: ${courseData.title}`);
        
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo cargar el curso',
          variant: 'destructive'
        });
        router.push('/manage-courses');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId, user, router, toast, setPageTitle]);

  // Manejar guardado
  const handleSave = async () => {
    if (!course) return;
    
    setIsSaving(true);
    try {
      const endpoint = courseId === 'new' ? '/api/courses' : `/api/courses/${courseId}`;
      const method = courseId === 'new' ? 'POST' : 'PUT';
      
      const savedCourse = await safeFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
      
      setCourse(savedCourse);
      toast({ title: '✅ Curso guardado', duration: 3000 });
      
      if (courseId === 'new') {
        router.push(`/manage-courses/${savedCourse.id}/edit`);
      }
    } catch (error: any) {
      toast({
        title: '❌ Error',
        description: error.message || 'No se pudo guardar',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Actualizar campo del curso
  const updateCourse = (updates: Partial<Course>) => {
    setCourse(prev => prev ? { ...prev, ...updates } : null);
  };

  // Manejar drag & drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !course) return;

    const { source, destination, type } = result;
    
    if (type === 'MODULES') {
      const modules = [...course.modules];
      const [moved] = modules.splice(source.index, 1);
      modules.splice(destination.index, 0, moved);
      updateCourse({ modules });
    }
  };

  // Operaciones con módulos
  const addModule = () => {
    const newModule: Module = {
      id: generateUniqueId('module'),
      title: 'Nuevo módulo',
      order: course?.modules.length || 0,
      lessons: []
    };
    updateCourse({ modules: [...(course?.modules || []), newModule] });
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    const modules = course?.modules.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ) || [];
    updateCourse({ modules });
  };

  const deleteModule = (moduleId: string) => {
    const modules = course?.modules.filter(m => m.id !== moduleId) || [];
    updateCourse({ modules });
  };

  // Operaciones con lecciones
  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: generateUniqueId('lesson'),
      title: 'Nueva lección',
      order: 0,
      contentBlocks: []
    };
    
    const modules = course?.modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: [...module.lessons, newLesson]
        };
      }
      return module;
    }) || [];
    
    updateCourse({ modules });
  };

  // Si está cargando
  if (isLoading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando editor...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos
  if (courseId !== 'new' && user?.role !== 'ADMINISTRATOR' && user?.id !== course.instructorId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
            <p className="text-muted-foreground mb-4">
              No tienes permiso para editar este curso
            </p>
            <Button asChild>
              <Link href="/manage-courses">
                Volver a mis cursos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header unificado */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="shrink-0"
            >
              <Link href="/manage-courses">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold truncate">
                {course.title || 'Nuevo curso'}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {courseId === 'new' ? 'Creando nuevo curso' : 'Editor de curso'}
              </p>
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
              Vista previa
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal - FULL WIDTH */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
        {/* Pestañas de navegación */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b">
            <TabsList className="h-12 w-full justify-start overflow-x-auto">
              <TabsTrigger value="basics" className="flex-1 min-w-0">
                <Layout className="h-4 w-4 mr-2" />
                <span className="truncate">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="flex-1 min-w-0">
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="truncate">Plan de estudios</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 min-w-0">
                <Settings2 className="h-4 w-4 mr-2" />
                <span className="truncate">Configuración</span>
              </TabsTrigger>
              <TabsTrigger value="publish" className="flex-1 min-w-0">
                <Globe className="h-4 w-4 mr-2" />
                <span className="truncate">Publicación</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Pestaña: Básico */}
          <TabsContent value="basics" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Información principal */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información del curso</CardTitle>
                    <CardDescription>
                      Detalles principales que identifican tu curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título del curso</Label>
                      <Input
                        value={course.title}
                        onChange={(e) => updateCourse({ title: e.target.value })}
                        placeholder="Ej: Fundamentos de React"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <RichTextEditor
                        value={course.description || ''}
                        onChange={(value) => updateCourse({ description: value })}
                        placeholder="Describe tu curso..."
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Estadísticas rápidas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del curso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold">{course.modules.length}</div>
                        <div className="text-sm text-muted-foreground">Módulos</div>
                      </div>
                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold">
                          {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Lecciones</div>
                      </div>
                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold">
                          {course.modules.reduce((acc, m) => 
                            acc + m.lessons.reduce((lAcc, l) => lAcc + l.contentBlocks.length, 0), 0)
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">Contenidos</div>
                      </div>
                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold">
                          {course.status === 'PUBLISHED' ? '✓' : '—'}
                        </div>
                        <div className="text-sm text-muted-foreground">Estado</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Imagen de portada */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Imagen de portada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video rounded-lg border-2 border-dashed overflow-hidden relative group">
                      {course.imageUrl ? (
                        <>
                          <Image
                            src={course.imageUrl}
                            alt="Portada del curso"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => document.getElementById('cover-upload')?.click()}
                            >
                              Cambiar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateCourse({ imageUrl: null })}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </>
                      ) : (
                        <UploadArea
                          onFileSelect={async (file) => {
                            if (!file) return;
                            const result = await uploadWithProgress('/api/upload/course-image', file);
                            updateCourse({ imageUrl: result.url });
                          }}
                          className="h-full"
                        >
                          <div className="text-center p-6">
                            <ImagePlus className="h-8 w-8 mx-auto mb-2" />
                            <p>Subir imagen</p>
                          </div>
                        </UploadArea>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Estado rápido */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estado actual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Certificado', value: !!course.certificateTemplateId },
                      { label: 'Obligatorio', value: course.isMandatory },
                      { label: 'Prerrequisito', value: !!course.prerequisiteId },
                      { label: 'Publicado', value: course.status === 'PUBLISHED' }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm">{item.label}</span>
                        {item.value ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Pestaña: Plan de estudios */}
          <TabsContent value="curriculum" className="space-y-6">
            {/* Barra de herramientas */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Plan de estudios</h2>
                    <p className="text-sm text-muted-foreground">
                      Organiza los módulos y lecciones de tu curso
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    >
                      {viewMode === 'list' ? (
                        <Grid3x3 className="h-4 w-4 mr-2" />
                      ) : (
                        <List className="h-4 w-4 mr-2" />
                      )}
                      {viewMode === 'list' ? 'Vista cuadrícula' : 'Vista lista'}
                    </Button>
                    <Button onClick={addModule} size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nuevo módulo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contenido del plan */}
            {course.modules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FolderOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Comienza tu curso</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Añade tu primer módulo para comenzar a estructurar el contenido
                  </p>
                  <Button onClick={addModule} size="lg">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Crear primer módulo
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              // Vista cuadrícula
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.modules.map((module, index) => (
                  <Card key={module.id} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers3 className="h-5 w-5 text-primary" />
                        {module.title}
                      </CardTitle>
                      <CardDescription>
                        {module.lessons.length} lecciones
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {module.lessons.slice(0, 3).map(lesson => (
                          <div key={lesson.id} className="flex items-center gap-2 p-2 rounded bg-muted">
                            <BookOpenText className="h-4 w-4" />
                            <span className="text-sm truncate">{lesson.title}</span>
                          </div>
                        ))}
                        {module.lessons.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground">
                            +{module.lessons.length - 3} más
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => addLesson(module.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Lección
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => deleteModule(module.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              // Vista lista con drag & drop
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="modules" type="MODULES">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {course.modules.map((module, index) => (
                        <Draggable key={module.id} draggableId={module.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps}>
                              <ModuleItem
                                module={module}
                                index={index}
                                onUpdate={(field, value) => updateModule(module.id, { [field]: value })}
                                onDelete={() => deleteModule(module.id)}
                                onAddLesson={() => addLesson(module.id)}
                                onLessonUpdate={(lessonIndex, field, value) => {
                                  const modules = course.modules.map(m => {
                                    if (m.id === module.id) {
                                      const lessons = [...m.lessons];
                                      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
                                      return { ...m, lessons };
                                    }
                                    return m;
                                  });
                                  updateCourse({ modules });
                                }}
                                onLessonDelete={(lessonIndex) => {
                                  const modules = course.modules.map(m => {
                                    if (m.id === module.id) {
                                      const lessons = m.lessons.filter((_, i) => i !== lessonIndex);
                                      return { ...m, lessons };
                                    }
                                    return m;
                                  });
                                  updateCourse({ modules });
                                }}
                                onAddBlock={(lessonIndex, type) => {
                                  const newBlock: ContentBlock = {
                                    id: generateUniqueId('block'),
                                    type,
                                    content: '',
                                    order: 0
                                  };
                                  
                                  const modules = course.modules.map(m => {
                                    if (m.id === module.id) {
                                      const lessons = [...m.lessons];
                                      lessons[lessonIndex].contentBlocks.push(newBlock);
                                      return { ...m, lessons };
                                    }
                                    return m;
                                  });
                                  
                                  updateCourse({ modules });
                                }}
                                onBlockUpdate={(lessonIndex, blockIndex, field, value) => {
                                  const modules = course.modules.map(m => {
                                    if (m.id === module.id) {
                                      const lessons = [...m.lessons];
                                      const blocks = [...lessons[lessonIndex].contentBlocks];
                                      blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
                                      lessons[lessonIndex].contentBlocks = blocks;
                                      return { ...m, lessons };
                                    }
                                    return m;
                                  });
                                  updateCourse({ modules });
                                }}
                                onBlockDelete={(lessonIndex, blockIndex) => {
                                  const modules = course.modules.map(m => {
                                    if (m.id === module.id) {
                                      const lessons = [...m.lessons];
                                      const blocks = lessons[lessonIndex].contentBlocks.filter((_, i) => i !== blockIndex);
                                      lessons[lessonIndex].contentBlocks = blocks;
                                      return { ...m, lessons };
                                    }
                                    return m;
                                  });
                                  updateCourse({ modules });
                                }}
                                onEditQuiz={(quiz) => {
                                  setQuizToEdit({
                                    quiz,
                                    onSave: (updatedQuiz) => {
                                      // Actualizar el quiz en el estado
                                      const modules = course.modules.map(m => {
                                        const updatedLessons = m.lessons.map(l => {
                                          const updatedBlocks = l.contentBlocks.map(b => {
                                            if (b.quiz?.id === quiz.id) {
                                              return { ...b, quiz: updatedQuiz };
                                            }
                                            return b;
                                          });
                                          return { ...l, contentBlocks: updatedBlocks };
                                        });
                                        return { ...m, lessons: updatedLessons };
                                      });
                                      updateCourse({ modules });
                                    }
                                  });
                                }}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            
            {/* Botón flotante para añadir módulo */}
            {course.modules.length > 0 && (
              <Button
                onClick={addModule}
                size="lg"
                className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </TabsContent>

          {/* Pestaña: Configuración */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Certificado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Plantilla de certificado</Label>
                    <Select
                      value={course.certificateTemplateId || 'none'}
                      onValueChange={(value) => 
                        updateCourse({ certificateTemplateId: value === 'none' ? null : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin certificado</SelectItem>
                        {/* Las plantillas se cargarían aquí */}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Prerrequisitos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Prerrequisitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Curso prerrequisito</Label>
                    <Select
                      value={course.prerequisiteId || 'none'}
                      onValueChange={(value) => 
                        updateCourse({ prerequisiteId: value === 'none' ? null : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin prerrequisito</SelectItem>
                        {/* Los cursos se cargarían aquí */}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Obligatorio */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Configuración de acceso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Curso obligatorio</p>
                      <p className="text-sm text-muted-foreground">
                        Los estudiantes deben completar este curso
                      </p>
                    </div>
                    <Switch
                      checked={course.isMandatory}
                      onCheckedChange={(checked) => updateCourse({ isMandatory: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña: Publicación */}
          <TabsContent value="publish" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Disponibilidad */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Disponibilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <DateRangePicker
                    date={{
                      from: course.startDate ? new Date(course.startDate) : undefined,
                      to: course.endDate ? new Date(course.endDate) : undefined
                    }}
                    onDateChange={(range) => {
                      updateCourse({
                        startDate: range?.from?.toISOString(),
                        endDate: range?.to?.toISOString()
                      });
                    }}
                  />
                </CardContent>
              </Card>

              {/* Estado y categoría */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={course.status}
                      onValueChange={(value) => updateCourse({ status: value as CourseStatus })}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={course.category || ''}
                      onChange={(e) => updateCourse({ category: e.target.value })}
                      placeholder="Categoría del curso"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de confirmación */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de quiz */}
      {quizToEdit && (
        <QuizEditorModal
          isOpen={true}
          onClose={() => setQuizToEdit(null)}
          quiz={quizToEdit.quiz}
          onSave={quizToEdit.onSave}
        />
      )}
    </div>
  );
}