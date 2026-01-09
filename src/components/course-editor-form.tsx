"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, X, Replace, Pencil, Eye, FilePlus2, ChevronDown, BookOpenText, Video, FileText, File as FileGenericIcon, Layers3, Sparkles, Award, CheckCircle, Calendar as CalendarIcon, Info, Settings2, Globe as GlobeIcon, Target, Shield, Clock3, Layout, Sparkles as SparklesIcon, BookOpen, Zap, Target as TargetIcon, BarChart, Users, Tag, Hash, Lock, Unlock, Filter, Palette, EyeOff, ArrowRight, Check, Plus, Minus, Grid3x3, List, Eye as EyeIcon, Maximize2, Minimize2, FolderPlus, FolderOpen, Calendar, Timer, TrendingUp, BarChart2, PieChart, Download, Share2, Bell, Star, Edit, Copy, MoreHorizontal, ExternalLink, HelpCircle, AlertCircle, Info as InfoIcon, ChevronRight, ChevronLeft, FlipVertical, FlipHorizontal, SquareStack, PanelLeft, PanelRight, PanelsTopLeft, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, ChangeEvent, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Toggle } from '@/components/ui/toggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// === INTERFACES Y UTILIDADES ===
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

const generateUniqueId = (prefix: string): string => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${randomPart}`;
};

// === COMPONENTES REUTILIZABLES ===

const StatusBadge = ({ status }: { status: CourseStatus }) => {
  const statusConfig = {
    DRAFT: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    PUBLISHED: { label: 'Publicado', color: 'bg-green-100 text-green-800 border-green-200' },
    ARCHIVED: { label: 'Archivado', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  };

  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <Badge variant="outline" className={`font-medium ${config.color}`}>
      {config.label}
    </Badge>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

// === COMPONENTE PARA MENÚ DE CONTENIDO ===
const ContentTypeMenu = ({ 
  onSelect, 
  onClose 
}: { 
  onSelect: (type: 'TEXT' | 'VIDEO' | 'FILE' | 'IMAGE' | 'QUIZ') => void;
  onClose: () => void;
}) => {
  const contentTypes = [
    { type: 'TEXT' as const, label: 'Texto', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { type: 'VIDEO' as const, label: 'Video', icon: Video, color: 'text-red-600', bg: 'bg-red-100' },
    { type: 'FILE' as const, label: 'Archivo', icon: FileGenericIcon, color: 'text-amber-600', bg: 'bg-amber-100' },
    { type: 'IMAGE' as const, label: 'Imagen', icon: ImagePlus, color: 'text-green-600', bg: 'bg-green-100' },
    { type: 'QUIZ' as const, label: 'Quiz', icon: Pencil, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-lg w-64">
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Añadir contenido</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">Selecciona el tipo de contenido</p>
      </div>
      <div className="space-y-1">
        {contentTypes.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.type}
              variant="ghost"
              className="w-full justify-start px-3 py-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onSelect(item.type);
                onClose();
              }}
            >
              <div className={`p-2 rounded-md ${item.bg} mr-3`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

// === COMPONENTES PRINCIPALES ===

const ModuleCard = React.forwardRef<HTMLDivElement, {
  module: AppModule;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddLesson: () => void;
  onUpdateTitle: (title: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  dragHandleProps: any;
}>(({ module, index, onEdit, onDelete, onDuplicate, onAddLesson, onUpdateTitle, isExpanded, onToggle, dragHandleProps }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(module.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = () => {
    setIsEditing(true);
    setEditingTitle(module.title);
    // Enfocar el input después de un pequeño delay para asegurar que se renderice
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  };

  const handleTitleSave = () => {
    if (editingTitle.trim() !== '' && editingTitle !== module.title) {
      onUpdateTitle(editingTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingTitle(module.title);
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-primary/60" />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex flex-col items-center">
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <Badge variant="secondary" className="mt-2 text-xs font-bold">
                  MÓDULO {index + 1}
                </Badge>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Layers3 className="h-4 w-4 text-primary" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Input
                        ref={inputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleKeyDown}
                        className="text-lg font-semibold h-9 px-3"
                        placeholder="Nombre del módulo"
                      />
                    </div>
                  ) : (
                    <h3 
                      className="text-lg font-semibold text-gray-800 dark:text-white truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={handleTitleClick}
                      title="Haz clic para editar"
                    >
                      {module.title}
                    </h3>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {module.lessons.length} {module.lessons.length === 1 ? 'lección' : 'lecciones'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {module.lessons.reduce((acc, lesson) => acc + lesson.contentBlocks.length, 0)} elementos
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="h-8 w-8"
              >
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4 rotate-180" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3 mt-4">
              {module.lessons.map((lesson, lessonIndex) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={lessonIndex}
                  moduleId={module.id}
                />
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAddLesson();
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Añadir lección
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
});

ModuleCard.displayName = 'ModuleCard';

const LessonCard = ({ lesson, index, moduleId }: { lesson: AppLesson; index: number; moduleId: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(lesson.title);
  const [showContentMenu, setShowContentMenu] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingTitle(lesson.title);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  };

  const handleTitleSave = () => {
    if (editingTitle.trim() !== '' && editingTitle !== lesson.title) {
      // Aquí deberías llamar a una función para actualizar el título de la lección
      console.log('Actualizar título de lección:', editingTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingTitle(lesson.title);
    }
  };

  const handleAddContent = (type: 'TEXT' | 'VIDEO' | 'FILE' | 'IMAGE' | 'QUIZ') => {
    console.log('Añadir contenido tipo:', type, 'a lección:', lesson.id);
    // Aquí deberías llamar a una función para añadir el contenido
    setShowContentMenu(false);
    setShowAddContent(false);
  };

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowContentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
            <BookOpenText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Lección {index + 1}
              </Badge>
              {isEditing ? (
                <div className="flex-1 max-w-md">
                  <Input
                    ref={inputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleKeyDown}
                    className="h-7 text-sm px-2"
                    placeholder="Nombre de la lección"
                  />
                </div>
              ) : (
                <h4 
                  className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={handleTitleClick}
                  title="Haz clic para editar"
                >
                  {lesson.title}
                </h4>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lesson.contentBlocks.length} elementos
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Popover open={showContentMenu} onOpenChange={setShowContentMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContentMenu(!showContentMenu);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Contenido
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <ContentTypeMenu 
                onSelect={handleAddContent} 
                onClose={() => setShowContentMenu(false)} 
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="h-7 w-7"
          >
            {isExpanded ? 
              <ChevronDown className="h-3.5 w-3.5 rotate-180" /> : 
              <ChevronDown className="h-3.5 w-3.5" />
            }
          </Button>
        </div>
      </div>
      
      {showAddContent && !showContentMenu && (
        <div className="mt-3 pl-11" ref={menuRef}>
          <ContentTypeMenu 
            onSelect={handleAddContent} 
            onClose={() => setShowAddContent(false)} 
          />
        </div>
      )}
      
      {isExpanded && lesson.contentBlocks.length > 0 && (
        <div className="mt-3 space-y-2 pl-11">
          {lesson.contentBlocks.map((block, blockIndex) => (
            <ContentBlockPreview key={block.id} block={block} index={blockIndex} />
          ))}
        </div>
      )}
      
      {isExpanded && lesson.contentBlocks.length === 0 && (
        <div className="mt-3 pl-11">
          <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
            <FilePlus2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Esta lección no tiene contenido aún
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddContent(true)}
            >
              <Plus className="h-3 w-3 mr-2" />
              Añadir primer elemento
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ContentBlockPreview = ({ block, index }: { block: ContentBlock; index: number }) => {
  const getBlockInfo = () => {
    switch(block.type) {
      case 'TEXT': return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'VIDEO': return { icon: Video, color: 'text-red-600', bg: 'bg-red-100' };
      case 'FILE': return { icon: FileGenericIcon, color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'IMAGE': return { icon: ImagePlus, color: 'text-green-600', bg: 'bg-green-100' };
      case 'QUIZ': return { icon: Pencil, color: 'text-purple-600', bg: 'bg-purple-100' };
      default: return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const info = getBlockInfo();
  const Icon = info.icon;

  return (
    <div className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className={`p-1.5 rounded ${info.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${info.color}`} />
      </div>
      <span className="text-sm font-medium flex-1">
        {block.type === 'QUIZ' ? block.quiz?.title || 'Quiz' : `${block.type}`}
      </span>
      <Badge variant="outline" className="text-xs">
        #{index + 1}
      </Badge>
    </div>
  );
};

// === COMPONENTE PRINCIPAL REDISEÑADO ===

export function CourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, settings, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<AppCourse | null>(null);
  const [allCoursesForPrereq, setAllCoursesForPrereq] = useState<AppCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');

  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<PrismaCertificateTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<{ quiz: AppQuiz; onSave: (updatedQuiz: AppQuiz) => void } | null>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Data fetching
  useEffect(() => {
    const fetchAllData = async () => {
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

        const [courseRes, templatesRes, certificatesRes, coursesRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch('/api/templates'),
          fetch('/api/certificates/templates'),
          fetch('/api/courses?simple=true')
        ]);

        if (!courseRes.ok) throw new Error("Curso no encontrado");

        const courseData: AppCourse = await courseRes.json();
        setCourse(courseData);

        if (templatesRes.ok) setTemplates(await templatesRes.json());
        if (certificatesRes.ok) setCertificateTemplates(await certificatesRes.json());
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setAllCoursesForPrereq((data.courses || []).filter((c: AppCourse) => c.id !== courseId));
        }

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

    fetchAllData();
  }, [courseId, user, router, toast, setPageTitle]);

  const handleSaveCourse = useCallback(async () => {
    if (!course) return;
    setIsSaving(true);

    const payload = { ...course };
    (payload.modules || []).forEach((mod, mIdx) => {
      mod.order = mIdx;
      (mod.lessons || []).forEach((les, lIdx) => {
        les.order = lIdx;
        (les.contentBlocks || []).forEach((block, bIdx) => {
          block.order = bIdx;
        });
      });
    });

    try {
      const endpoint = courseId === 'new' ? '/api/courses' : `/api/courses/${courseId}`;
      const method = courseId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error((await response.json()).message || 'Error al guardar el curso.');

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

      return savedCourse;

    } catch (error: any) {
      console.error('Error al guardar el curso:', error);
      toast({ 
        title: "❌ Error al Guardar", 
        description: error.message || "No se pudo guardar. Intenta nuevamente.", 
        variant: "destructive",
        duration: 5000
      });
      return null;
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

  const updateCourseField = (field: keyof AppCourse, value: any) => {
    handleStateUpdate(prev => {
      prev[field] = value;
      return prev;
    });
  };

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
      return prev;
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    const module = course?.modules.find(m => m.id === moduleId);
    setItemToDelete({
      type: 'module',
      name: module?.title,
      onConfirm: () => {
        handleStateUpdate(prev => {
          // Filtrar el módulo eliminado
          const updatedModules = prev.modules.filter(m => m.id !== moduleId);
          
          // Re-indexar los módulos restantes (actualizar order y títulos si es necesario)
          updatedModules.forEach((mod, index) => {
            mod.order = index; // Actualizar el orden numérico
          });
          
          prev.modules = updatedModules;
          return prev;
        });
        
        // Limpiar del estado de módulos expandidos si existe
        setExpandedModules(prev => {
          const next = new Set(prev);
          next.delete(moduleId);
          return next;
        });
        
        toast({ 
          title: "Módulo eliminado", 
          description: "El módulo se ha eliminado y el resto ha sido re-indexado." 
        });
      }
    });
  };

  const handleDuplicateModule = (moduleId: string) => {
    const module = course?.modules.find(m => m.id === moduleId);
    if (!module) return;

    const duplicate = JSON.parse(JSON.stringify(module));
    duplicate.id = generateUniqueId('module');
    duplicate.title = `${module.title} (Copia)`;
    duplicate.order = course.modules.length; // Asignar al final

    handleStateUpdate(prev => {
      const index = prev.modules.findIndex(m => m.id === moduleId);
      prev.modules.splice(index + 1, 0, duplicate);
      
      // Re-indexar después de insertar
      prev.modules.forEach((mod, idx) => {
        mod.order = idx;
      });
      
      return prev;
    });

    toast({ 
      title: "✅ Módulo duplicado", 
      description: "El módulo se ha duplicado correctamente." 
    });
  };

  const handleUpdateModuleTitle = (moduleId: string, newTitle: string) => {
    handleStateUpdate(prev => {
      const moduleIndex = prev.modules.findIndex(m => m.id === moduleId);
      if (moduleIndex !== -1) {
        prev.modules[moduleIndex].title = newTitle;
      }
      return prev;
    });
  };

  const handleAddLesson = (moduleId: string) => {
    handleStateUpdate(prev => {
      const moduleIndex = prev.modules.findIndex(m => m.id === moduleId);
      if (moduleIndex === -1) return prev;

      const newLesson: AppLesson = {
        id: generateUniqueId('lesson'),
        title: 'Nueva Lección',
        description: '',
        order: prev.modules[moduleIndex].lessons.length,
        contentBlocks: [],
      };

      prev.modules[moduleIndex].lessons.push(newLesson);
      return prev;
    });

    // Expandir el módulo automáticamente
    setExpandedModules(prev => new Set(prev).add(moduleId));

    toast({
      title: "Lección añadida",
      description: "Se ha añadido una nueva lección al módulo.",
    });
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: '❌ Error', 
        description: 'Por favor selecciona un archivo de imagen válido.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: '❌ Error', 
        description: 'La imagen no debe superar los 5MB.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const result = await uploadWithProgress('/api/upload/course-image', file, () => {});
      
      if (result?.url) {
        updateCourseField('imageUrl', result.url);
        toast({ 
          title: '✅ Imagen actualizada', 
          description: 'La imagen de portada se ha actualizado correctamente.' 
        });
      } else {
        throw new Error('No se recibió URL de la imagen');
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      toast({ 
        title: '❌ Error', 
        description: (err as Error).message || 'No se pudo subir la imagen. Intenta nuevamente.', 
        variant: 'destructive' 
      });
    } finally {
      setIsUploadingImage(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const calculateStats = () => {
    if (!course) return null;
    
    return {
      modules: course.modules?.length || 0,
      lessons: course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0,
      blocks: course.modules?.reduce((acc, mod) => 
        acc + mod.lessons?.reduce((acc2, les) => acc2 + (les.contentBlocks?.length || 0), 0), 0) || 0,
      hasCertificate: !!course.certificateTemplateId,
      isMandatory: course.isMandatory,
      hasPrerequisite: !!course.prerequisiteId,
    };
  };

  const stats = calculateStats();

  if (isLoading || isAuthLoading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
          </div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            {courseId === 'new' ? 'Creando curso...' : 'Cargando editor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-3 sm:px-4 lg:px-4">
          <div className="flex flex-col py-4">
            {/* Fila superior: Título y acciones */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/manage-courses">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div className="max-w-2xl">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {course.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={course.status} />
                    <span className="text-sm text-muted-foreground">
                      {courseId === 'new' ? 'Nuevo curso' : 'Editando'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/courses/${courseId}?preview=true`, '_blank')}
                  disabled={courseId === 'new'}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Vista previa
                </Button>
                
                <Button
                  onClick={handleSaveCourse}
                  disabled={isSaving || !isDirty}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>

            {/* Barra de contadores unificada */}
            {stats && (
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Layers3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.modules}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Módulos
                      </div>
                    </div>
                  </div>

                  <Separator orientation="vertical" className="h-8" />

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.lessons}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Lecciones
                      </div>
                    </div>
                  </div>

                  <Separator orientation="vertical" className="h-8" />

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.blocks}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Elementos
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {stats.hasCertificate && (
                    <Badge variant="outline" className="gap-1">
                      <Award className="h-3 w-3" />
                      Certificado
                    </Badge>
                  )}
                  {stats.isMandatory && (
                    <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Obligatorio
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - ESPACIO OPTIMIZADO */}
      <main className="w-full max-w-[98rem] mx-auto px-2 sm:px-3 lg:px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Course Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <ImagePlus className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploadingImage}
                    />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Replace className="h-4 w-4" />
                      )}
                      Cambiar imagen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button
                    variant={activeTab === 'basics' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('basics')}
                  >
                    <Layout className="h-4 w-4 mr-3" />
                    Información básica
                  </Button>
                  <Button
                    variant={activeTab === 'curriculum' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('curriculum')}
                  >
                    <BookOpen className="h-4 w-4 mr-3" />
                    Plan de estudios
                  </Button>
                  <Button
                    variant={activeTab === 'settings' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings2 className="h-4 w-4 mr-3" />
                    Configuración
                  </Button>
                  <Button
                    variant={activeTab === 'publish' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('publish')}
                  >
                    <GlobeIcon className="h-4 w-4 mr-3" />
                    Publicación
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area - ESPACIO EXPANDIDO */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab Content */}
            {activeTab === 'basics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Información del curso</CardTitle>
                    <CardDescription>
                      Configura los detalles principales de tu curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título del curso *</Label>
                      <Input
                        id="title"
                        value={course.title}
                        onChange={(e) => updateCourseField('title', e.target.value)}
                        placeholder="Ej: Introducción al Desarrollo Web"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <RichTextEditor
                        value={course.description || ''}
                        onChange={(value) => updateCourseField('description', value)}
                        placeholder="Describe qué aprenderán los estudiantes..."
                        className="min-h-[200px]"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select
                          value={course.category || ''}
                          onValueChange={(value) => updateCourseField('category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {(settings?.resourceCategories || []).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select
                          value={course.status}
                          onValueChange={(value) => updateCourseField('status', value as CourseStatus)}
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
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'curriculum' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header - CON ESPACIO OPTIMIZADO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Plan de estudios
                    </h2>
                    <p className="text-muted-foreground">
                      Organiza los módulos y lecciones de tu curso
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateModal(true)}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Plantillas
                    </Button>
                    <Button
                      onClick={handleAddModule}
                      className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Nuevo módulo
                    </Button>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit px-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    Cuadrícula
                  </Button>
                </div>

                {/* Modules List - CON TARJETAS EXPANDIDAS */}
                {course.modules.length === 0 ? (
                  <Card className="border-dashed mx-1">
                    <CardContent className="py-12 text-center">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <FolderOpen className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Comienza a estructurar tu curso</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Crea módulos para organizar el contenido de manera lógica y progresiva
                      </p>
                      <Button onClick={handleAddModule} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Crear primer módulo
                      </Button>
                    </CardContent>
                  </Card>
                ) : viewMode === 'grid' ? (
                  <div className="grid md:grid-cols-2 gap-6 px-1">
                    {course.modules.map((module, index) => (
                      <Card key={module.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Módulo {index + 1}</Badge>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleDuplicateModule(module.id)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleDeleteModule(module.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <CardTitle className="mt-2 text-lg">{module.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Lecciones:</span>
                              <span className="font-semibold">{module.lessons.length}</span>
                            </div>
                            {module.lessons.slice(0, 2).map((lesson) => (
                              <div key={lesson.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                                <BookOpenText className="h-4 w-4 text-blue-500" />
                                <span className="text-sm truncate">{lesson.title}</span>
                              </div>
                            ))}
                            {module.lessons.length > 2 && (
                              <div className="text-center text-sm text-muted-foreground">
                                +{module.lessons.length - 2} más
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // CONTENEDOR DE MÓDULOS CON ANCHO COMPLETO
                  <div className="w-full px-1">
                    <DragDropContext onDragEnd={() => {}}>
                      <Droppable droppableId="modules" type="MODULES">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-4"
                          >
                            {course.modules.map((module, index) => (
                              <Draggable key={module.id} draggableId={module.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="w-full"
                                  >
                                    <ModuleCard
                                      module={module}
                                      index={index}
                                      isExpanded={expandedModules.has(module.id)}
                                      onToggle={() => toggleModuleExpansion(module.id)}
                                      onAddLesson={() => handleAddLesson(module.id)}
                                      onUpdateTitle={(title) => handleUpdateModuleTitle(module.id, title)}
                                      onDelete={() => handleDeleteModule(module.id)}
                                      onDuplicate={() => handleDuplicateModule(module.id)}
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
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Certificate */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Certificado
                      </CardTitle>
                      <CardDescription>
                        Configura el certificado del curso
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={course.certificateTemplateId || 'none'}
                        onValueChange={(value) => updateCourseField('certificateTemplateId', value === 'none' ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin certificado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin certificado</SelectItem>
                          {certificateTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Prerequisites */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Prerrequisitos
                      </CardTitle>
                      <CardDescription>
                        Establece cursos previos requeridos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={course.prerequisiteId || 'none'}
                        onValueChange={(value) => updateCourseField('prerequisiteId', value === 'none' ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin prerrequisito" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin prerrequisito</SelectItem>
                          {allCoursesForPrereq.map((courseItem) => (
                            <SelectItem key={courseItem.id} value={courseItem.id}>
                              {courseItem.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración avanzada</CardTitle>
                    <CardDescription>
                      Opciones adicionales para el curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Curso obligatorio</p>
                        <p className="text-sm text-muted-foreground">
                          Los estudiantes deben completar este curso
                        </p>
                      </div>
                      <Switch
                        checked={course.isMandatory}
                        onCheckedChange={(checked) => {
                          updateCourseField('isMandatory', checked);
                          if (checked) {
                            setTimeout(() => setIsAssignmentModalOpen(true), 300);
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'publish' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Disponibilidad</CardTitle>
                    <CardDescription>
                      Define cuándo estará disponible el curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DateRangePicker
                      date={{
                        from: course.startDate ? new Date(course.startDate) : undefined,
                        to: course.endDate ? new Date(course.endDate) : undefined
                      }}
                      onDateChange={(range) => {
                        updateCourseField('startDate', range?.from?.toISOString());
                        updateCourseField('endDate', range?.to?.toISOString());
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Publishing Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publicación</CardTitle>
                    <CardDescription>
                      Configura cómo se publicará el curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Visibilidad</Label>
                      <Select
                        value={course.status}
                        onValueChange={(value) => updateCourseField('status', value as CourseStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                              Borrador
                            </div>
                          </SelectItem>
                          <SelectItem value="PUBLISHED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              Publicado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Listo para publicar</AlertTitle>
                      <AlertDescription>
                        Una vez publicado, el curso estará disponible para los estudiantes asignados.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Save Indicator */}
      {isDirty && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="shadow-2xl border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Cambios sin guardar</p>
                    <p className="text-sm text-muted-foreground">Guarda tu progreso</p>
                  </div>
                </div>
                <Button onClick={handleSaveCourse} disabled={isSaving} size="sm">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dialogs */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {itemToDelete?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará "{itemToDelete?.name}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                itemToDelete?.onConfirm();
                setItemToDelete(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plantillas de lección</DialogTitle>
            <DialogDescription>
              Selecciona una plantilla para crear una lección rápidamente
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            <div className="grid gap-3 p-1">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay plantillas disponibles</p>
                </div>
              ) : (
                templates.map((template) => (
                  <Card key={template.id} className="hover:border-primary cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {template.templateBlocks.slice(0, 3).map((block, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {block.type.toLowerCase()}
                              </Badge>
                            ))}
                            {template.templateBlocks.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.templateBlocks.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Usar plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <CourseAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
        />
      )}

      {/* Quiz Editor Modal */}
      {quizToEdit && (
        <QuizEditorModal
          isOpen={!!quizToEdit}
          onClose={() => setQuizToEdit(null)}
          quiz={quizToEdit.quiz}
          onSave={quizToEdit.onSave}
        />
      )}
    </div>
  );
}