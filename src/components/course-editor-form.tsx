'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

// Componentes UI optimizados - Importa solo lo necesario
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Iconos optimizados
import { 
  ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, 
  GripVertical, Loader2, Eye, Copy, ChevronDown,
  BookOpen, Settings2, Globe, Calendar, Award,
  CheckCircle, X, FileText, Video, File, Pencil,
  Grid3x3, List, Download, Layers, Sparkles,
  Info, FolderOpen, Maximize2, Minimize2
} from 'lucide-react';

// Componentes específicos
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { UploadArea } from '@/components/ui/upload-area';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';

// Types simplificados
interface Course {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  imageUrl: string | null;
  modules: Module[];
  category: string;
  isMandatory: boolean;
  certificateTemplateId: string | null;
  prerequisiteId: string | null;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  contentBlocks: ContentBlock[];
}

interface ContentBlock {
  id: string;
  type: 'TEXT' | 'VIDEO' | 'FILE' | 'QUIZ';
  content: string;
  order: number;
}

// Componente principal rediseñado
export function CourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Estados simplificados
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Fetch simplificado
  useEffect(() => {
    const loadCourse = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        if (courseId === 'new') {
          setCourse({
            id: 'new-course',
            title: 'Nuevo Curso',
            description: '',
            status: 'DRAFT',
            imageUrl: null,
            modules: [],
            category: '',
            isMandatory: false,
            certificateTemplateId: null,
            prerequisiteId: null
          });
        } else {
          const response = await fetch(`/api/courses/${courseId}`);
          if (!response.ok) throw new Error('Error al cargar el curso');
          const data = await response.json();
          setCourse(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el curso",
          variant: "destructive"
        });
        router.push('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, user, router, toast]);
  
  // Guardar curso
  const saveCourse = async () => {
    if (!course) return;
    
    setIsSaving(true);
    try {
      const method = courseId === 'new' ? 'POST' : 'PUT';
      const endpoint = courseId === 'new' ? '/api/courses' : `/api/courses/${courseId}`;
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      const savedCourse = await response.json();
      setCourse(savedCourse);
      
      toast({
        title: "✅ Curso guardado",
        description: "Los cambios se han guardado correctamente"
      });
      
      if (courseId === 'new') {
        router.push(`/editor/${savedCourse.id}`);
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el curso",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Manejo de módulos simplificado
  const addModule = () => {
    if (!course) return;
    
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: `Módulo ${course.modules.length + 1}`,
      order: course.modules.length,
      lessons: []
    };
    
    setCourse({
      ...course,
      modules: [...course.modules, newModule]
    });
  };
  
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };
  
  // Calcula estadísticas
  const stats = useMemo(() => {
    if (!course) return { modules: 0, lessons: 0, blocks: 0 };
    
    const lessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const blocks = course.modules.reduce((sum, mod) => 
      sum + mod.lessons.reduce((lsum, lesson) => lsum + lesson.contentBlocks.length, 0), 0);
    
    return {
      modules: course.modules.length,
      lessons,
      blocks
    };
  }, [course]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Curso no encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header unificado */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold truncate">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-500 truncate">
                  Editor de curso
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(`/preview/${courseId}`, '_blank')}
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Vista previa</span>
              </Button>
              
              <Button
                onClick={saveCourse}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main className="px-4 lg:px-8 py-6 max-w-[1920px] mx-auto">
        {/* Estadísticas rápidas */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {stats.modules}
                </div>
                <div className="text-sm text-gray-500">Módulos</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {stats.lessons}
                </div>
                <div className="text-sm text-gray-500">Lecciones</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.blocks}
                </div>
                <div className="text-sm text-gray-500">Elementos</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-600">
                  {course.status === 'PUBLISHED' ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500">
                  {course.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Panel izquierdo - Navegación */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === 'curriculum'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <BookOpen className="h-4 w-4" />
                    Plan de estudios
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === 'settings'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <Settings2 className="h-4 w-4" />
                    Configuración
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('publishing')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === 'publishing'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    Publicación
                  </button>
                </nav>
                
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={addModule}
                    className="w-full gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Nuevo módulo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Panel principal */}
          <div className="lg:col-span-3">
            {activeTab === 'curriculum' && (
              <div className="space-y-6">
                {/* Controles de vista */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Plan de estudios</h2>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={viewMode === 'grid' ? "default" : "outline"}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                          >
                            <Grid3x3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Vista de cuadrícula</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={viewMode === 'list' ? "default" : "outline"}
                            size="icon"
                            onClick={() => setViewMode('list')}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Vista de lista</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setExpandedModules(new Set(course.modules.map(m => m.id)))}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setExpandedModules(new Set())}
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Lista de módulos */}
                <DragDropContext onDragEnd={() => {}}>
                  <Droppable droppableId="modules">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-4"
                      >
                        {course.modules.length === 0 ? (
                          <Card>
                            <CardContent className="py-12 text-center">
                              <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                              <h3 className="text-lg font-semibold mb-2">
                                Comienza a crear contenido
                              </h3>
                              <p className="text-gray-500 mb-4">
                                Añade tu primer módulo para organizar las lecciones
                              </p>
                              <Button onClick={addModule} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Crear primer módulo
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          course.modules.map((module, index) => (
                            <Draggable
                              key={module.id}
                              draggableId={module.id}
                              index={index}
                            >
                              {(provided) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                >
                                  <ModuleCard
                                    module={module}
                                    index={index}
                                    isExpanded={expandedModules.has(module.id)}
                                    onToggle={() => toggleModule(module.id)}
                                    onUpdate={(field, value) => {
                                      setCourse(prev => ({
                                        ...prev!,
                                        modules: prev!.modules.map(m =>
                                          m.id === module.id ? { ...m, [field]: value } : m
                                        )
                                      }));
                                    }}
                                    onDelete={() => {
                                      setCourse(prev => ({
                                        ...prev!,
                                        modules: prev!.modules.filter(m => m.id !== module.id)
                                      }));
                                    }}
                                    dragHandleProps={provided.dragHandleProps}
                                  />
                                </motion.div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Configuración del curso</h2>
                
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Información básica */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Título del curso</Label>
                        <Input
                          id="title"
                          value={course.title}
                          onChange={(e) => setCourse({ ...course, title: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <RichTextEditor
                          value={course.description}
                          onChange={(value) => setCourse({ ...course, description: value })}
                          placeholder="Describe el contenido del curso..."
                        />
                      </div>
                    </div>
                    
                    {/* Imagen de portada */}
                    <div className="space-y-4">
                      <Label>Imagen de portada</Label>
                      <UploadArea
                        onFileSelect={async (file) => {
                          if (!file) return;
                          // Implementar subida
                        }}
                        className="aspect-video"
                      >
                        {course.imageUrl ? (
                          <div className="relative h-full w-full">
                            <img
                              src={course.imageUrl}
                              alt="Portada"
                              className="object-cover w-full h-full rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="text-center p-8">
                            <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">Haz clic o arrastra una imagen</p>
                          </div>
                        )}
                      </UploadArea>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'publishing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Publicación</h2>
                
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Estado de publicación</h3>
                          <p className="text-sm text-gray-500">
                            Controla la visibilidad del curso
                          </p>
                        </div>
                        <select
                          value={course.status}
                          onChange={(e) => setCourse({ 
                            ...course, 
                            status: e.target.value as Course['status'] 
                          })}
                          className="rounded-md border px-3 py-2"
                        >
                          <option value="DRAFT">Borrador</option>
                          <option value="PUBLISHED">Publicado</option>
                          <option value="ARCHIVED">Archivado</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Curso obligatorio</h3>
                          <p className="text-sm text-gray-500">
                            Marca como requerido para ciertos usuarios
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={course.isMandatory}
                          onChange={(e) => setCourse({ ...course, isMandatory: e.target.checked })}
                          className="h-5 w-5"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Barra flotante de acciones */}
      {course.modules.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={addModule}
            size="lg"
            className="rounded-full h-14 w-14 shadow-xl"
          >
            <PlusCircle className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Componente de módulo simplificado
const ModuleCard = ({ 
  module, 
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  dragHandleProps 
}: any) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Handle de arrastre */}
          <div {...dragHandleProps} className="cursor-move p-2">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* Contenido del módulo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">M{index + 1}</Badge>
                <Input
                  value={module.title}
                  onChange={(e) => onUpdate('title', e.target.value)}
                  className="border-0 text-lg font-semibold p-0 focus-visible:ring-0"
                  placeholder="Nombre del módulo"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {module.lessons.length} lecciones
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Lecciones expandidas */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    {module.lessons.map((lesson: any, idx: number) => (
                      <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        index={idx}
                        moduleId={module.id}
                      />
                    ))}
                    
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        // Agregar nueva lección
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Añadir lección
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Componente de lección simplificado
const LessonItem = ({ lesson, index, moduleId }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">L{index + 1}</span>
              <Input
                value={lesson.title}
                onChange={() => {}}
                className="border-0 p-0 h-auto text-sm font-medium"
                placeholder="Título de la lección"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {lesson.contentBlocks.length}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )} />
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
            <div className="mt-3 pt-3 border-t space-y-2">
              {lesson.contentBlocks.map((block: any, idx: number) => (
                <div key={block.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  {block.type === 'TEXT' && <FileText className="h-4 w-4" />}
                  {block.type === 'VIDEO' && <Video className="h-4 w-4" />}
                  {block.type === 'QUIZ' && <Pencil className="h-4 w-4" />}
                  <span className="text-sm capitalize">{block.type.toLowerCase()}</span>
                </div>
              ))}
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button size="sm" variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Texto
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  <File className="h-3 w-3 mr-1" />
                  Archivo
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  <Pencil className="h-3 w-3 mr-1" />
                  Quiz
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};