'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, X, Replace, Pencil, Eye, FilePlus2, ChevronDown, BookOpenText, Video, FileText, File as FileGenericIcon, Layers3, Sparkles, Award, CheckCircle, Calendar as CalendarIcon, Info, Settings2, Globe as GlobeIcon, Target, Shield, Clock3, Layout, Sparkles as SparklesIcon, BookOpen, Zap, Target as TargetIcon, BarChart, Users, Tag, Hash, Lock, Unlock, Filter, Palette, EyeOff, ArrowRight, Check, Plus, Minus, Grid3x3, List, Eye as EyeIcon, Maximize2, Minimize2, FolderPlus, FolderOpen, Calendar, Timer, TrendingUp, BarChart2, PieChart, Download, Share2, Bell, Star, Edit, Copy, MoreHorizontal, ExternalLink, HelpCircle, AlertCircle, Info as InfoIcon } from 'lucide-react';
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

// === TIPOS E INTERFACES ===
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

// === COMPONENTES DE INTERFAZ ===

const ModuleItem = React.forwardRef<HTMLDivElement, { 
  module: AppModule; 
  moduleIndex: number;
  onUpdate: (field: keyof AppModule, value: any) => void; 
  onAddLesson: (type: 'blank' | 'template') => void; 
  onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void; 
  onLessonDelete: (lessonIndex: number) => void; 
  onSaveLessonAsTemplate: (lessonIndex: number) => void; 
  onAddBlock: (lessonIndex: number, type: LessonType) => void; 
  onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void; 
  onBlockDelete: (lessonIndex: number, blockIndex: number) => void; 
  onEditQuiz: (quiz: AppQuiz) => void; 
  isSaving: boolean; 
  onDelete: () => void; 
  provided: any 
}>(
  ({ module, moduleIndex, onUpdate, onAddLesson, onLessonUpdate, onLessonDelete, onSaveLessonAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, provided }, ref) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    return (
      <motion.div
        ref={ref}
        {...provided.draggableProps}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative group"
      >
        <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-2 hover:bg-primary/10 rounded-lg transition-all text-gray-400 hover:text-primary">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20"
                  >
                    M{moduleIndex + 1}
                  </Badge>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Layers3 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      MÓDULO
                    </span>
                  </div>
                  
                  <Input
                    value={module.title}
                    onChange={e => onUpdate('title', e.target.value)}
                    className="text-base font-semibold bg-transparent border-0 focus-visible:ring-0 p-0 h-auto placeholder:text-gray-400"
                    placeholder="Nombre del módulo..."
                    onClick={(e) => e.stopPropagation()}
                    disabled={isSaving}
                  />
                  
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {module.lessons.length} {module.lessons.length === 1 ? 'lección' : 'lecciones'}
                    </Badge>
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs text-gray-500 hover:text-primary transition-colors"
                    >
                      {isExpanded ? 'Ocultar lecciones' : 'Mostrar lecciones'}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10" 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="px-5 pb-5 pt-0">
                  <Droppable droppableId={module.id} type="LESSONS">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 mt-4">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                            {(provided) => (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <LessonItem
                                  lesson={lesson}
                                  lessonIndex={lessonIndex}
                                  onDelete={() => onLessonDelete(lessonIndex)}
                                  onUpdate={(field, value) => onLessonUpdate(lessonIndex, field, value)}
                                  onSaveAsTemplate={() => onSaveLessonAsTemplate(lessonIndex)}
                                  onAddBlock={(type) => onAddBlock(lessonIndex, type)}
                                  onBlockUpdate={(blockIndex, field, value) => onBlockUpdate(lessonIndex, blockIndex, field, value)}
                                  onBlockDelete={(blockIndex) => onBlockDelete(lessonIndex, blockIndex)}
                                  onEditQuiz={onEditQuiz}
                                  isSaving={isSaving}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                />
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Añadir lección
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onAddLesson('blank')} 
                          className="h-8 rounded-lg gap-1"
                        >
                          <FilePlus2 className="h-3.5 w-3.5" />
                          Nueva
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onAddLesson('template')} 
                          className="h-8 rounded-lg gap-1"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Plantilla
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  }
);
ModuleItem.displayName = 'ModuleItem';

const LessonItem = React.forwardRef<HTMLDivElement, { 
  lesson: AppLesson; 
  lessonIndex: number;
  onUpdate: (field: keyof AppLesson, value: any) => void; 
  onSaveAsTemplate: () => void; 
  onAddBlock: (type: LessonType) => void; 
  onBlockUpdate: (blockIndex: number, field: string, value: any) => void; 
  onBlockDelete: (blockIndex: number) => void; 
  onEditQuiz: (quiz: AppQuiz) => void; 
  isSaving: boolean; 
  onDelete: () => void; 
}>(
  ({ lesson, lessonIndex, onUpdate, onSaveAsTemplate, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, isSaving, onDelete, ...rest }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <motion.div
        ref={ref}
        {...rest}
        className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-all duration-200 group/lesson"
      >
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <div {...rest.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing touch-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all">
              <GripVertical className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 bg-blue-500/10 rounded">
                  <BookOpenText className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                      L{lessonIndex + 1}
                    </Badge>
                    <Input
                      value={lesson.title}
                      onChange={e => onUpdate('title', e.target.value)}
                      placeholder="Título de la lección"
                      className="bg-transparent border-0 font-medium focus-visible:ring-0 p-0 h-auto text-sm flex-1 min-w-0"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {lesson.contentBlocks.length} bloques
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 
                    <ChevronDown className="h-3.5 w-3.5 rotate-180" /> : 
                    <ChevronDown className="h-3.5 w-3.5" />
                  }
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-400 hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Droppable droppableId={lesson.id} type="BLOCKS">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mt-3">
                        {lesson.contentBlocks.map((block, blockIndex) => (
                          <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                            {(provided) => (
                              <ContentBlockItem
                                block={block}
                                blockIndex={blockIndex}
                                onUpdate={(field, value) => onBlockUpdate(blockIndex, field, value)}
                                onDelete={() => onBlockDelete(blockIndex)}
                                onEditQuiz={() => block.type === 'QUIZ' && block.quiz && onEditQuiz(block.quiz)}
                                isSaving={isSaving}
                                dragHandleProps={provided.dragHandleProps}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <BlockTypeSelector onSelect={onAddBlock} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }
);
LessonItem.displayName = 'LessonItem';

// Componente ContentBlockItem CORREGIDO con editores específicos
const ContentBlockItem = React.forwardRef<HTMLDivElement, { 
  block: ContentBlock; 
  blockIndex: number;
  onUpdate: (field: string, value: any) => void; 
  onEditQuiz: () => void; 
  isSaving: boolean; 
  onDelete: () => void; 
  dragHandleProps: any; 
}>(
  ({ block, blockIndex, onUpdate, onEditQuiz, isSaving, onDelete, dragHandleProps, ...rest }, ref) => {
    const [isFileUploading, setIsFileUploading] = useState(false);
    const [fileUploadProgress, setFileUploadProgress] = useState(0);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
      return () => { if (localPreview) URL.revokeObjectURL(localPreview); };
    }, [localPreview]);

    const handleFileSelect = async (file: File | null) => {
      if (!file) return;

      if (file.type.startsWith('image/')) setLocalPreview(URL.createObjectURL(file));

      setIsFileUploading(true);
      setFileUploadProgress(0);

      try {
        const result = await uploadWithProgress('/api/upload/lesson-file', file, setFileUploadProgress);
        onUpdate('content', result.url);
        toast({ title: 'Archivo Subido', description: `El archivo ${file.name} se ha subido correctamente.` });
      } catch (err) {
        toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      } finally {
        setIsFileUploading(false);
      }
    };

    const renderBlockContent = () => {
      if (block.type === 'TEXT') return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contenido de Texto</Label>
          <RichTextEditor 
            value={block.content || ''} 
            onChange={value => onUpdate('content', value)} 
            placeholder="Escribe aquí el contenido de la lección..." 
            className="min-h-[150px] border rounded-lg p-2" 
            disabled={isSaving} 
          />
          <p className="text-xs text-gray-500">Usa el editor para añadir formato, imágenes, enlaces, etc.</p>
        </div>
      );
      
      if (block.type === 'VIDEO') return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">URL del Video</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Video className="h-4 w-4" />
            </div>
            <Input 
              value={block.content || ''} 
              onChange={e => onUpdate('content', e.target.value)} 
              placeholder="URL del video (YouTube, Vimeo, etc.)" 
              className="pl-10 h-10" 
              disabled={isSaving} 
            />
          </div>
          <p className="text-xs text-gray-500">Pega la URL completa del video. Ej: https://www.youtube.com/watch?v=...</p>
        </div>
      );
      
      if (block.type === 'FILE') {
        const displayUrl = localPreview || block.content;
        const isImage = displayUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || localPreview?.startsWith('blob:');

        if (displayUrl && !isFileUploading) {
          const fileName = block.content?.split('/').pop()?.split('-').slice(2).join('-') || 'Archivo adjunto';
          return (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Archivo Subido</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  {isImage ? (
                    <div className="w-10 h-10 relative rounded overflow-hidden">
                      <Image src={displayUrl} alt="Preview" fill className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <FileGenericIcon className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-gray-500">Haz clic en los botones para previsualizar o eliminar</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="h-8"
                    onClick={() => window.open(displayUrl, '_blank')}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => { onUpdate('content', ''); setLocalPreview(null); }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Subir Archivo</Label>
            <UploadArea 
              onFileSelect={handleFileSelect} 
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              disabled={isSaving || isFileUploading} 
              className="py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary transition-colors"
            >
              <div className="text-center">
                <UploadCloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium mb-1">Arrastra y suelta tu archivo aquí</p>
                <p className="text-sm text-gray-500">o haz clic para seleccionar</p>
              </div>
            </UploadArea>
            {isFileUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Subiendo...</span>
                  <span>{fileUploadProgress}%</span>
                </div>
                <Progress value={fileUploadProgress} className="h-2" />
              </div>
            )}
            <p className="text-xs text-gray-500">Formatos soportados: PDF, Word, Excel, PowerPoint, Imágenes</p>
          </div>
        );
      }
      
      if (block.type === 'QUIZ') return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Configuración del Quiz</Label>
              <p className="text-xs text-gray-500">Añade preguntas y configura las opciones del quiz</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onEditQuiz}
              className="h-8"
            >
              Configurar Preguntas
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Título del Quiz</Label>
            <Input 
              id="quiz-title"
              value={block.quiz?.title || ''} 
              onChange={e => onUpdate('quiz', { ...block.quiz, title: e.target.value })} 
              placeholder="Título del Quiz" 
              className="h-9" 
              disabled={isSaving} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-description">Descripción</Label>
            <Textarea 
              id="quiz-description"
              value={block.quiz?.description || ''} 
              onChange={e => onUpdate('quiz', { ...block.quiz, description: e.target.value })} 
              placeholder="Descripción del quiz..." 
              rows={2}
              className="text-sm"
              disabled={isSaving} 
            />
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
            <span className="text-sm">Preguntas configuradas:</span>
            <Badge variant="outline">
              {block.quiz?.questions?.length || 0} preguntas
            </Badge>
          </div>
        </div>
      );
      
      return null;
    };

    const getBlockIcon = () => {
      switch(block.type) {
        case 'TEXT': return <FileText className="h-4 w-4" />;
        case 'VIDEO': return <Video className="h-4 w-4" />;
        case 'FILE': return <FileGenericIcon className="h-4 w-4" />;
        case 'QUIZ': return <Pencil className="h-4 w-4" />;
        default: return <FileText className="h-4 w-4" />;
      }
    };

    const getBlockColor = () => {
      switch(block.type) {
        case 'TEXT': return 'bg-blue-500/10 text-blue-600';
        case 'VIDEO': return 'bg-red-500/10 text-red-600';
        case 'FILE': return 'bg-amber-500/10 text-amber-600';
        case 'QUIZ': return 'bg-purple-500/10 text-purple-600';
        default: return 'bg-primary/10 text-primary';
      }
    };

    return (
      <motion.div
        ref={ref}
        {...rest}
        className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-start gap-2">
          <div {...dragHandleProps} className="p-1.5 cursor-grab active:cursor-grabbing touch-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <GripVertical className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className={`p-2.5 rounded-lg ${getBlockColor()}`}>
            {getBlockIcon()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize font-medium">
                {block.type.toLowerCase()}
              </Badge>
              <span className="text-xs text-gray-500">Elemento #{blockIndex + 1}</span>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:text-destructive"
              onClick={onDelete} 
              disabled={isSaving}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {renderBlockContent()}
        </div>
      </motion.div>
    );
  }
);
ContentBlockItem.displayName = 'ContentBlockItem';

// === COMPONENTE PRINCIPAL DE LA PÁGINA (CourseEditor) ===
export function CourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, settings, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();

  const [course, setCourse] = useState<AppCourse | null>(null);
  const [allCoursesForPrereq, setAllCoursesForPrereq] = useState<AppCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');

  const [itemToDeleteDetails, setItemToDeleteDetails] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localCoverImagePreview, setLocalCoverImagePreview] = useState<string | null>(null);

  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<PrismaCertificateTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeModuleIndexForTemplate, setActiveModuleIndexForTemplate] = useState<number | null>(null);
  const [lessonToSaveAsTemplate, setLessonToSaveAsTemplate] = useState<AppLesson | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<{ quiz: AppQuiz; onSave: (updatedQuiz: AppQuiz) => void } | null>(null);

  // --- Data Fetching ---
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

  const handleMandatorySwitchChange = async (checked: boolean) => {
    if (!course) return;

    handleStateUpdate(prev => {
      prev.isMandatory = checked;
      return prev;
    });

    if (checked) {
      const savedCourse = await handleSaveCourse();
      if (savedCourse) {
        setTimeout(() => setIsAssignmentModalOpen(true), 300);
      }
    }
  };

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

  const handleEditQuiz = (quizToEdit: AppQuiz) => {
    const handleSave = (updatedQuiz: AppQuiz) => {
      handleStateUpdate(prev => {
        for (const mod of (prev.modules || [])) {
          for (const les of (mod.lessons || [])) {
            const blockIndex = (les.contentBlocks || []).findIndex(b => b.quiz?.id === quizToEdit.id);
            if (blockIndex !== -1) {
              les.contentBlocks[blockIndex].quiz = updatedQuiz;
              break;
            }
          }
        }
        return prev;
      });
      setQuizToEdit(null);
    };

    setQuizToEdit({ quiz: quizToEdit, onSave: handleSave });
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

  const handleAddLesson = useCallback((moduleIndex: number, template?: ApiTemplate) => {
    handleStateUpdate(prev => {
      let newBlocks: ContentBlock[] = [];
      if (template) {
        newBlocks = template.templateBlocks.map(tb => ({
          id: generateUniqueId('block'),
          type: tb.type as LessonType,
          content: '',
          order: tb.order,
          quiz: tb.type === 'QUIZ' ? {
            id: generateUniqueId('quiz'),
            title: 'Nuevo Quiz desde Plantilla',
            description: '',
            questions: [],
            maxAttempts: null,
          } : undefined
        }));
      }

      const newLesson: AppLesson = {
        id: generateUniqueId('lesson'),
        title: template ? `Lección de "${template.name}"` : 'Nueva Lección',
        order: (prev.modules?.[moduleIndex]?.lessons || []).length,
        contentBlocks: newBlocks,
      };

      if (!prev.modules[moduleIndex].lessons) prev.modules[moduleIndex].lessons = [];
      prev.modules[moduleIndex].lessons.push(newLesson);
      return prev;
    });
    setShowTemplateModal(false);
    setActiveModuleIndexForTemplate(null);
  }, [handleStateUpdate]);

  const handleRemoveModule = useCallback((moduleId: string) => {
    if (!course) return;
    
    const moduleToDelete = course.modules.find(m => m.id === moduleId);
    setItemToDeleteDetails({
      name: moduleToDelete?.title,
      onDelete: () => {
        handleStateUpdate(prev => {
          const index = prev.modules.findIndex(m => m.id === moduleId);
          if (index !== -1) {
            prev.modules.splice(index, 1);
          }
          return prev;
        });
      }
    });
  }, [course, handleStateUpdate]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination || !course) return;

    handleStateUpdate(prev => {
      if (type === 'MODULES') {
        const [reorderedItem] = prev.modules.splice(source.index, 1);
        prev.modules.splice(destination.index, 0, reorderedItem);
      }
      return prev;
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setLocalCoverImagePreview(previewUrl);

      setIsUploadingImage(true);
      setUploadProgress(0);

      try {
        const result = await uploadWithProgress('/api/upload/course-image', file, setUploadProgress);
        updateCourseField('imageUrl', result.url);
        toast({ 
          title: '✅ Imagen Subida', 
          description: 'La imagen de portada se ha actualizado correctamente.',
          duration: 3000
        });
      } catch (err) {
        toast({ 
          title: '❌ Error de Subida', 
          description: (err as Error).message, 
          variant: "destructive",
          duration: 5000
        });
        setLocalCoverImagePreview(null);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (localCoverImagePreview) {
        URL.revokeObjectURL(localCoverImagePreview);
      }
    };
  }, [localCoverImagePreview]);

  const handleSaveTemplate = async (templateName: string, templateDescription: string) => {
    if (!lessonToSaveAsTemplate) return;
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: templateName, 
          description: templateDescription, 
          lessonId: lessonToSaveAsTemplate.id 
        })
      });
      if (!res.ok) throw new Error('No se pudo guardar la plantilla');
      toast({ 
        title: '✅ Plantilla Guardada', 
        description: `La plantilla "${templateName}" se ha guardado correctamente.`,
        duration: 3000
      });
      const newTemplate = await res.json();
      setTemplates(prev => [...prev, newTemplate]);
      setLessonToSaveAsTemplate(null);
    } catch (err) {
      toast({ 
        title: "❌ Error", 
        description: (err as Error).message, 
        variant: "destructive",
        duration: 5000
      });
    }
  };

  if (isLoading || isAuthLoading || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
          <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
        </div>
        <p className="mt-4 text-lg font-medium text-muted-foreground animate-pulse">
          Cargando editor de cursos...
        </p>
      </div>
    );
  }

  if (courseId !== 'new' && !isAuthLoading && user?.role !== 'ADMINISTRATOR' && user?.id !== course.instructorId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <div className="bg-destructive/10 p-6 rounded-full mb-6">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          No tienes los permisos necesarios para editar este curso.
        </p>
        <Link href="/manage-courses" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a mis cursos
        </Link>
      </div>
    );
  }

  // Calcular estadísticas del curso
  const courseStats = {
    totalModules: course?.modules?.length || 0,
    totalLessons: course?.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0,
    totalBlocks: course?.modules?.reduce((acc, mod) => 
      acc + (mod.lessons?.reduce((lessonAcc, lesson) => 
        lessonAcc + (lesson.contentBlocks?.length || 0), 0) || 0), 0) || 0,
    hasCertificate: !!course?.certificateTemplateId,
    isMandatory: course?.isMandatory || false,
    hasPrerequisite: !!course?.prerequisiteId,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/manage-courses" 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold truncate max-w-md">
                  {course.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {courseId === 'new' ? 'Creando nuevo curso' : 'Editando curso'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <Link href={`/courses/${courseId === 'new' ? 'preview' : courseId}`} target="_blank">
                  <Eye className="h-4 w-4" />
                  Vista previa
                </Link>
              </Button>
              
              <Button
                onClick={handleSaveCourse}
                disabled={isSaving || !isDirty}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="basics" className="text-sm font-medium">
              <Layout className="h-4 w-4 mr-2" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="text-sm font-medium">
              <BookOpen className="h-4 w-4 mr-2" />
              Plan de Estudios
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-sm font-medium">
              <Settings2 className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="distribution" className="text-sm font-medium">
              <GlobeIcon className="h-4 w-4 mr-2" />
              Publicación
            </TabsTrigger>
          </TabsList>

          {/* Pestaña: Información Básica */}
          <TabsContent value="basics" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Columna Principal */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalles del Curso</CardTitle>
                      <CardDescription>
                        Información principal que identifica tu curso
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título del Curso *</Label>
                        <Input
                          id="title"
                          value={course.title}
                          onChange={e => updateCourseField('title', e.target.value)}
                          placeholder="Ej: Master en Desarrollo Web"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <RichTextEditor
                          value={course.description || ''}
                          onChange={v => updateCourseField('description', v)}
                          placeholder="Describe tu curso..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estadísticas */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen del Curso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Estado</div>
                          <Badge variant="outline" className="text-xs">
                            {course.status === 'PUBLISHED' ? 'Publicado' :
                             course.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Módulos</div>
                          <div className="text-xl font-bold">{courseStats.totalModules}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Lecciones</div>
                          <div className="text-xl font-bold">{courseStats.totalLessons}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Contenido</div>
                          <div className="text-xl font-bold">{courseStats.totalBlocks} bloques</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna Lateral - Imagen */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Imagen de Portada</CardTitle>
                      <CardDescription>
                        Imagen principal del curso
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden group relative">
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                              <p className="text-sm text-white">{uploadProgress}%</p>
                            </div>
                          </div>
                        )}
                        
                        {(localCoverImagePreview || course.imageUrl) ? (
                          <>
                            <Image
                              src={localCoverImagePreview || course.imageUrl!}
                              alt="Imagen del curso"
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => document.getElementById('cover-upload')?.click()}
                              >
                                <Replace className="h-4 w-4 mr-2" />
                                Cambiar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  updateCourseField('imageUrl', null);
                                  setLocalCoverImagePreview(null);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </Button>
                            </div>
                          </>
                        ) : (
                          <UploadArea
                            onFileSelect={(file) => {
                              if (file) handleFileChange({ target: { files: [file] } } as any);
                            }}
                            inputId="cover-upload"
                            className="h-full"
                          >
                            <div className="text-center p-6">
                              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                                <ImagePlus className="h-6 w-6 text-primary" />
                              </div>
                              <p className="font-medium mb-1">Sube una imagen</p>
                              <p className="text-sm text-gray-500">Arrastra o haz clic</p>
                            </div>
                          </UploadArea>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estado Rápido */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Estado Actual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Certificado</span>
                        {course.certificateTemplateId ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Obligatorio</span>
                        {course.isMandatory ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Prerrequisito</span>
                        {course.prerequisiteId ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Pestaña: Plan de Estudios - REDISEÑADA PROFESIONALMENTE */}
          <TabsContent value="curriculum" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Encabezado Premium */}
              <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-2xl p-6 border border-primary/20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <BookOpen className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          Plan de Estudios
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                          Diseña la estructura educativa de tu curso
                        </p>
                      </div>
                    </div>
                    
                    {/* Pills de Estadísticas */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{courseStats.totalModules} Módulos</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">{courseStats.totalLessons} Lecciones</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                        <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium">{courseStats.totalBlocks} Elementos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setShowTemplateModal(true)}
                            className="h-11 px-5 border-2 hover:border-primary/50 transition-all duration-300 group"
                          >
                            <Sparkles className="h-4 w-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                            <span className="font-semibold">Plantillas</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Usa plantillas predefinidas para acelerar tu trabajo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={handleAddModule}
                            className="h-11 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/25 transition-all duration-300"
                          >
                            <PlusCircle className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Nuevo Módulo</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Añadir un nuevo módulo al plan de estudios</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Panel de Vista General */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Izquierdo - Vista General y Estadísticas */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Tarjeta de Progreso */}
                  <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">Progreso del Plan</CardTitle>
                        <Badge variant="outline" className="font-semibold">
                          {((courseStats.totalLessons / (courseStats.totalLessons || 1)) * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Completitud</span>
                          <span className="text-primary font-bold">
                            {courseStats.totalLessons > 0 ? 'En progreso' : 'Por comenzar'}
                          </span>
                        </div>
                        <Progress 
                          value={((courseStats.totalLessons / (courseStats.totalLessons + 1)) * 100)} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {courseStats.totalModules}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Módulos</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {courseStats.totalLessons}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Lecciones</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tarjeta de Tipos de Contenido */}
                  <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Grid3x3 className="h-4 w-4" />
                        Distribución de Contenido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['TEXT', 'VIDEO', 'QUIZ', 'FILE'].map((type, index) => {
                          const colors = ['bg-blue-500', 'bg-red-500', 'bg-purple-500', 'bg-amber-500'];
                          const labels = ['Texto', 'Video', 'Quiz', 'Archivo'];
                          const icons = [FileText, Video, Pencil, FileGenericIcon];
                          const Icon = icons[index];
                          const count = courseStats.totalBlocks;
                          
                          return (
                            <div key={type} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${colors[index].replace('bg-', 'bg-').replace('500', '500/10')}`}>
                                  <Icon className={`h-4 w-4 ${colors[index].replace('bg-', 'text-')}`} />
                                </div>
                                <span className="font-medium">{labels[index]}</span>
                              </div>
                              <Badge variant="secondary" className="font-semibold">
                                {Math.floor(count * (index + 1) / 4)}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tarjeta de Acciones Rápidas */}
                  <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold">Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 hover:bg-primary/5 hover:text-primary"
                        onClick={() => setShowTemplateModal(true)}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Usar Plantilla Existente</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 hover:bg-primary/5 hover:text-primary"
                        onClick={handleAddModule}
                      >
                        <FolderPlus className="h-4 w-4" />
                        <span>Duplicar Módulo</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 hover:bg-primary/5 hover:text-primary"
                        onClick={() => {/* Exportar plan */}}
                      >
                        <Download className="h-4 w-4" />
                        <span>Exportar Plan</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Panel Principal - Estructura del Curso */}
                <div className="lg:col-span-2">
                  {/* Barra de Herramientas */}
                  <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg mb-6">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <Layers3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">Estructura del Curso</h3>
                            <p className="text-sm text-gray-500">Organiza módulos y lecciones</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => {/* Cambiar vista */}}
                                >
                                  <Grid3x3 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Vista de cuadrícula</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => {/* Cambiar vista */}}
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Vista de lista</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <Separator orientation="vertical" className="h-6" />
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => {/* Previsualizar */}}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Vista previa del curso</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Módulos - Diseño Mejorado */}
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="course-modules" type="MODULES">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          <AnimatePresence mode="popLayout">
                            {course.modules.length === 0 ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                              >
                                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-lg">
                                  <CardContent className="py-12 text-center">
                                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                      <FolderOpen className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Comienza tu viaje educativo</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                      Organiza tu conocimiento en módulos estructurados que guiarán a tus estudiantes paso a paso
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                      <Button 
                                        onClick={handleAddModule}
                                        className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                                      >
                                        <PlusCircle className="h-4 w-4" />
                                        Crear Primer Módulo
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => setShowTemplateModal(true)}
                                        className="gap-2"
                                      >
                                        <Sparkles className="h-4 w-4" />
                                        Explorar Plantillas
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ) : (
                              course.modules.map((moduleItem, moduleIndex) => (
                                <Draggable 
                                  key={moduleItem.id} 
                                  draggableId={moduleItem.id} 
                                  index={moduleIndex}
                                >
                                  {(provided) => (
                                    <motion.div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{ duration: 0.3 }}
                                      className="group"
                                    >
                                      {/* Tarjeta de Módulo Premium */}
                                      <Card className="border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                                        {/* Encabezado del Módulo */}
                                        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                              {/* Ícono de arrastre */}
                                              <div
                                                {...provided.dragHandleProps}
                                                className="cursor-grab active:cursor-grabbing p-2 hover:bg-primary/10 rounded-lg transition-all mt-1"
                                              >
                                                <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                              </div>
                                              
                                              {/* Contenido del Módulo */}
                                              <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                  <Badge 
                                                    variant="outline" 
                                                    className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1"
                                                  >
                                                    MÓDULO {moduleIndex + 1}
                                                  </Badge>
                                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <BookOpenText className="h-3.5 w-3.5" />
                                                    <span>{moduleItem.lessons.length} {moduleItem.lessons.length === 1 ? 'lección' : 'lecciones'}</span>
                                                  </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                  <Input
                                                    value={moduleItem.title}
                                                    onChange={(e) => {
                                                      const currentModuleIndex = course.modules.findIndex(
                                                        (m) => m.id === moduleItem.id
                                                      );
                                                      if (currentModuleIndex !== -1) {
                                                        handleStateUpdate((prev) => {
                                                          prev.modules[currentModuleIndex].title = e.target.value;
                                                          return prev;
                                                        });
                                                      }
                                                    }}
                                                    className="text-xl font-bold bg-transparent border-0 focus-visible:ring-0 p-0 h-auto placeholder:text-gray-400"
                                                    placeholder="Título del módulo..."
                                                  />
                                                  <TooltipProvider>
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <Button 
                                                          variant="ghost" 
                                                          size="icon" 
                                                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                          onClick={() => {/* Editar descripción */}}
                                                        >
                                                          <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                        <p>Editar descripción</p>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                                </div>
                                                
                                                {/* Progreso del Módulo */}
                                                {moduleItem.lessons.length > 0 && (
                                                  <div className="mt-3 space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                      <span className="text-gray-500">Progreso del módulo</span>
                                                      <span className="font-semibold">0%</span>
                                                    </div>
                                                    <Progress value={0} className="h-1.5" />
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {/* Acciones del Módulo */}
                                            <div className="flex items-center gap-1">
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="icon"
                                                      className="h-9 w-9 text-gray-400 hover:text-primary hover:bg-primary/10"
                                                      onClick={() => {/* Duplicar módulo */}}
                                                    >
                                                      <Copy className="h-4 w-4" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>Duplicar módulo</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                              
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="icon"
                                                      className="h-9 w-9 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                                                      onClick={() => handleRemoveModule(moduleItem.id)}
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>Eliminar módulo</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                              
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                  >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                  <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Vista previa
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicar
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem>
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Abrir en nueva pestaña
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          </div>
                                        </CardHeader>
                                        
                                        {/* Lecciones del Módulo */}
                                        <CardContent className="p-0">
                                          <Droppable droppableId={moduleItem.id} type="LESSONS">
                                            {(provided) => (
                                              <div 
                                                {...provided.droppableProps} 
                                                ref={provided.innerRef}
                                                className="space-y-1 p-4 bg-gray-50/50 dark:bg-gray-800/30"
                                              >
                                                {moduleItem.lessons.length === 0 ? (
                                                  <div className="text-center py-8">
                                                    <BookOpenText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-gray-500 mb-4">
                                                      Este módulo está vacío. Añade tu primera lección.
                                                    </p>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="gap-2"
                                                      onClick={() => {
                                                        const currentModuleIndex = course.modules.findIndex(
                                                          (m) => m.id === moduleItem.id
                                                        );
                                                        if (currentModuleIndex !== -1) {
                                                          handleAddLesson(currentModuleIndex);
                                                        }
                                                      }}
                                                    >
                                                      <PlusCircle className="h-3.5 w-3.5" />
                                                      Añadir primera lección
                                                    </Button>
                                                  </div>
                                                ) : (
                                                  <AnimatePresence>
                                                    {moduleItem.lessons.map((lesson, lessonIndex) => (
                                                      <Draggable
                                                        key={lesson.id}
                                                        draggableId={lesson.id}
                                                        index={lessonIndex}
                                                      >
                                                        {(provided) => (
                                                          <motion.div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -10 }}
                                                            transition={{ duration: 0.2 }}
                                                          >
                                                            <LessonCard
                                                              lesson={lesson}
                                                              lessonIndex={lessonIndex}
                                                              moduleItem={moduleItem}
                                                              onLessonUpdate={(lessonIndex, field, value) => {
                                                                const currentModuleIndex = course.modules.findIndex(
                                                                  (m) => m.id === moduleItem.id
                                                                );
                                                                if (currentModuleIndex !== -1) {
                                                                  handleStateUpdate((prev) => {
                                                                    prev.modules[currentModuleIndex].lessons[lessonIndex][field] = value;
                                                                    return prev;
                                                                  });
                                                                }
                                                              }}
                                                              onLessonDelete={(lessonIndex) => {
                                                                const currentModule = course.modules.find(m => m.id === moduleItem.id);
                                                                const lesson = currentModule?.lessons[lessonIndex];
                                                                
                                                                if (!lesson) return;
                                                                
                                                                setItemToDeleteDetails({
                                                                  name: lesson.title,
                                                                  onDelete: () => {
                                                                    handleStateUpdate((prev) => {
                                                                      const currentModuleIndex = prev.modules.findIndex(m => m.id === moduleItem.id);
                                                                      if (currentModuleIndex !== -1) {
                                                                        prev.modules[currentModuleIndex].lessons.splice(lessonIndex, 1);
                                                                      }
                                                                      return prev;
                                                                    });
                                                                  }
                                                                });
                                                              }}
                                                              onAddBlock={(lessonIndex, type) => {
                                                                handleStateUpdate((prev) => {
                                                                  const currentModuleIndex = prev.modules.findIndex(m => m.id === moduleItem.id);
                                                                  if (currentModuleIndex !== -1 && prev.modules[currentModuleIndex].lessons[lessonIndex]) {
                                                                    const newBlock: ContentBlock = {
                                                                      id: generateUniqueId('block'),
                                                                      type,
                                                                      content: '',
                                                                      order: prev.modules[currentModuleIndex].lessons[lessonIndex].contentBlocks.length,
                                                                      quiz: type === 'QUIZ' ? {
                                                                        id: generateUniqueId('quiz'),
                                                                        title: 'Nuevo Quiz',
                                                                        description: '',
                                                                        questions: [],
                                                                        maxAttempts: null,
                                                                      } : undefined
                                                                    };
                                                                    prev.modules[currentModuleIndex].lessons[lessonIndex].contentBlocks.push(newBlock);
                                                                  }
                                                                  return prev;
                                                                });
                                                              }}
                                                              onBlockUpdate={(lessonIndex, blockIndex, field, value) => {
                                                                handleStateUpdate((prev) => {
                                                                  const currentModuleIndex = prev.modules.findIndex(m => m.id === moduleItem.id);
                                                                  if (currentModuleIndex !== -1 && 
                                                                      prev.modules[currentModuleIndex].lessons[lessonIndex] &&
                                                                      prev.modules[currentModuleIndex].lessons[lessonIndex].contentBlocks[blockIndex]) {
                                                                    prev.modules[currentModuleIndex].lessons[lessonIndex].contentBlocks[blockIndex][field] = value;
                                                                  }
                                                                  return prev;
                                                                });
                                                              }}
                                                              onBlockDelete={(lessonIndex, blockIndex) => {
                                                                handleStateUpdate((prev) => {
                                                                  const currentModuleIndex = prev.modules.findIndex(m => m.id === moduleItem.id);
                                                                  if (currentModuleIndex !== -1 && 
                                                                      prev.modules[currentModuleIndex].lessons[lessonIndex]) {
                                                                    prev.modules[currentModuleIndex].lessons[lessonIndex].contentBlocks.splice(blockIndex, 1);
                                                                  }
                                                                  return prev;
                                                                });
                                                              }}
                                                              onEditQuiz={handleEditQuiz}
                                                              dragHandleProps={provided.dragHandleProps}
                                                              isSaving={isSaving}
                                                            />
                                                          </motion.div>
                                                        )}
                                                      </Draggable>
                                                    ))}
                                                  </AnimatePresence>
                                                )}
                                                {provided.placeholder}
                                              </div>
                                            )}
                                          </Droppable>
                                          
                                          {/* Pie de Módulo - Añadir Lección */}
                                          <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                                            <div className="flex items-center justify-between">
                                              <div className="text-sm text-gray-500">
                                                {moduleItem.lessons.length === 0 ? 'Comienza añadiendo lecciones' : 'Añadir nueva lección'}
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="gap-2"
                                                  onClick={() => {
                                                    const currentModuleIndex = course.modules.findIndex(
                                                      (m) => m.id === moduleItem.id
                                                    );
                                                    if (currentModuleIndex !== -1) {
                                                      handleAddLesson(currentModuleIndex);
                                                    }
                                                  }}
                                                >
                                                  <PlusCircle className="h-3.5 w-3.5" />
                                                  Lección en Blanco
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="gap-2"
                                                  onClick={() => {
                                                    setActiveModuleIndexForTemplate(moduleIndex);
                                                    setShowTemplateModal(true);
                                                  }}
                                                >
                                                  <Sparkles className="h-3.5 w-3.5" />
                                                  Desde Plantilla
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                  )}
                                </Draggable>
                              ))
                            )}
                          </AnimatePresence>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {/* Botón Flotante para Añadir Módulo */}
                  {course.modules.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="fixed bottom-6 right-6 z-40"
                    >
                      <Button
                        onClick={handleAddModule}
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80"
                      >
                        <PlusCircle className="h-6 w-6" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Alerta de Buenas Prácticas */}
              <Alert className="border-primary/20 bg-primary/5">
                <InfoIcon className="h-4 w-4 text-primary" />
                <AlertTitle>Consejo profesional</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>Para una mejor experiencia de aprendizaje, recomendamos:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Mantener los módulos entre 3-5 lecciones cada uno</li>
                    <li>Intercalar diferentes tipos de contenido (texto, video, quiz)</li>
                    <li>Incluir un quiz al final de cada módulo para reforzar el aprendizaje</li>
                    <li>Establecer una progresión lógica de conceptos simples a complejos</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </motion.div>
          </TabsContent>

          {/* Pestaña: Configuración */}
          <TabsContent value="advanced" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Certificado */}
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
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Plantilla de Certificado</Label>
                      <Select
                        value={course.certificateTemplateId || 'none'}
                        onValueChange={v => updateCourseField('certificateTemplateId', v === 'none' ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin certificado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin certificado</SelectItem>
                          {certificateTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Prerrequisitos */}
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
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Curso Prerrequisito</Label>
                      <Select
                        value={course.prerequisiteId || 'none'}
                        onValueChange={v => updateCourseField('prerequisiteId', v === 'none' ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin prerrequisito" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin prerrequisito</SelectItem>
                          {allCoursesForPrereq.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Asignación Obligatoria */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Control de Acceso
                    </CardTitle>
                    <CardDescription>
                      Configura quién puede acceder al curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Asignación Obligatoria</p>
                        <p className="text-sm text-muted-foreground">
                          Habilita para asignar a grupos específicos
                        </p>
                      </div>
                      <Switch
                        checked={course.isMandatory}
                        onCheckedChange={handleMandatorySwitchChange}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Pestaña: Publicación */}
          <TabsContent value="distribution" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Fechas */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      Disponibilidad
                    </CardTitle>
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

                {/* Estado y Categoría */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={course.status}
                        onValueChange={v => updateCourseField('status', v as CourseStatus)}
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
                          <SelectItem value="ARCHIVED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-500 rounded-full" />
                              Archivado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={course.category || ''}
                        onValueChange={v => updateCourseField('category', v)}
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
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Barra de Cambios Sin Guardar */}
      {isDirty && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Cambios sin guardar</p>
                    <p className="text-sm text-muted-foreground">
                      Guarda tus cambios antes de salir
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveCourse}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modales y Diálogos */}
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
                itemToDeleteDetails.onDelete();
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

      {/* Modal de Plantillas */}
      <TemplateSelectorModal
        isOpen={showTemplateModal}
        templates={templates}
        onClose={() => setShowTemplateModal(false)}
        onSelect={(template) => {
          if (activeModuleIndexForTemplate !== null) {
            handleAddLesson(activeModuleIndexForTemplate, template);
          }
        }}
      />

      {/* Modal para Guardar Plantilla */}
      {lessonToSaveAsTemplate && (
        <SaveTemplateModal
          isOpen={!!lessonToSaveAsTemplate}
          onClose={() => setLessonToSaveAsTemplate(null)}
          onSave={handleSaveTemplate}
        />
      )}

      {/* Modal de Asignación */}
      {isAssignmentModalOpen && (
        <CourseAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
        />
      )}

      {/* Editor de Quiz */}
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

// Componente LessonCard mejorado
const LessonCard = React.forwardRef<HTMLDivElement, {
  lesson: AppLesson;
  lessonIndex: number;
  moduleItem: AppModule;
  onLessonUpdate: (lessonIndex: number, field: keyof AppLesson, value: any) => void;
  onLessonDelete: (lessonIndex: number) => void;
  onAddBlock: (lessonIndex: number, type: LessonType) => void;
  onBlockUpdate: (lessonIndex: number, blockIndex: number, field: string, value: any) => void;
  onBlockDelete: (lessonIndex: number, blockIndex: number) => void;
  onEditQuiz: (quiz: AppQuiz) => void;
  dragHandleProps: any;
  isSaving: boolean;
}>(({ lesson, lessonIndex, moduleItem, onLessonUpdate, onLessonDelete, onAddBlock, onBlockUpdate, onBlockDelete, onEditQuiz, dragHandleProps, isSaving }, ref) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBlockSelector, setShowBlockSelector] = useState(false);

  return (
    <motion.div
      ref={ref}
      className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mb-3"
    >
      {/* Encabezado de Lección */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Handle de arrastre */}
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all mt-0.5"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            
            {/* Número y tipo de lección */}
            <div className="flex flex-col items-center gap-1">
              <Badge 
                variant="outline" 
                className="text-xs font-bold bg-blue-500/10 text-blue-600 border-blue-500/20"
              >
                {lessonIndex + 1}
              </Badge>
              <div className="text-[10px] text-gray-400 font-medium">LECCIÓN</div>
            </div>
            
            {/* Contenido principal */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  value={lesson.title}
                  onChange={e => onLessonUpdate(lessonIndex, 'title', e.target.value)}
                  placeholder="Título de la lección"
                  className="text-base font-semibold bg-transparent border-0 focus-visible:ring-0 p-0 h-auto placeholder:text-gray-400"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {/* Editar descripción */}}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editar descripción</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Estadísticas rápidas */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  <span>{lesson.contentBlocks.length} elementos</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Timer className="h-3 w-3" />
                  <span>~15 min</span>
                </div>
                {lesson.contentBlocks.some(b => b.type === 'QUIZ') && (
                  <Badge variant="secondary" className="text-xs">
                    <Pencil className="h-3 w-3 mr-1" />
                    Incluye quiz
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 
                      <ChevronDown className="h-4 w-4 rotate-180 transition-transform" /> : 
                      <ChevronDown className="h-4 w-4 transition-transform" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? 'Contraer' : 'Expandir'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-destructive"
                    onClick={() => onLessonDelete(lessonIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eliminar lección</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Contenido expandible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t pt-4">
              {/* Selector de tipo de bloque */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Elementos de la lección
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowBlockSelector(!showBlockSelector)}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Añadir elemento
                  </Button>
                </div>
                
                {showBlockSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <BlockTypeSelectorPremium onSelect={(type) => {
                      onAddBlock(lessonIndex, type);
                      setShowBlockSelector(false);
                    }} />
                  </motion.div>
                )}
                
                {/* Lista de bloques */}
                {lesson.contentBlocks.length > 0 ? (
                  <Droppable droppableId={lesson.id} type="BLOCKS">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {lesson.contentBlocks.map((block, blockIndex) => (
                          <Draggable
                            key={block.id}
                            draggableId={block.id}
                            index={blockIndex}
                          >
                            {(provided) => (
                              <ContentBlockItem
                                block={block}
                                blockIndex={blockIndex}
                                onUpdate={(field, value) => onBlockUpdate(lessonIndex, blockIndex, field, value)}
                                onDelete={() => onBlockDelete(lessonIndex, blockIndex)}
                                onEditQuiz={() => block.type === 'QUIZ' && block.quiz && onEditQuiz(block.quiz)}
                                isSaving={isSaving}
                                dragHandleProps={provided.dragHandleProps}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">
                      Esta lección está vacía. Añade contenido para comenzar.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowBlockSelector(true)}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Añadir primer elemento
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Métricas de la lección */}
              <div className="flex items-center justify-between pt-3 border-t text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    <span>0% completado</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span>0 estudiantes</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {/* Ver analytics */}}
                >
                  <BarChart2 className="h-3.5 w-3.5 mr-1" />
                  Ver analíticas
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
LessonCard.displayName = 'LessonCard';

// Componente Premium para Selector de Bloques
const BlockTypeSelectorPremium = ({ onSelect }: { onSelect: (type: LessonType) => void }) => {
  const blockTypes = [
    { 
      type: 'TEXT' as LessonType, 
      label: 'Texto', 
      icon: FileText, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-500/10',
      description: 'Contenido escrito con editor enriquecido',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      type: 'VIDEO' as LessonType, 
      label: 'Video', 
      icon: Video, 
      color: 'text-red-500', 
      bgColor: 'bg-red-500/10',
      description: 'Video educativo o tutorial',
      gradient: 'from-red-500 to-red-600'
    },
    { 
      type: 'FILE' as LessonType, 
      label: 'Archivo', 
      icon: FileGenericIcon, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-500/10',
      description: 'Documentos, presentaciones, recursos',
      gradient: 'from-amber-500 to-amber-600'
    },
    { 
      type: 'QUIZ' as LessonType, 
      label: 'Quiz', 
      icon: Pencil, 
      color: 'text-purple-500', 
      bgColor: 'bg-purple-500/10',
      description: 'Evaluación interactiva',
      gradient: 'from-purple-500 to-purple-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {blockTypes.map(({ type, label, icon: Icon, color, bgColor, description, gradient }) => (
        <motion.button
          key={type}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(type)}
          className="group text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/50 bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-lg ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{label}</h4>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

// Componente para Seleccionar Tipo de Bloque (Versión simple)
const BlockTypeSelector = ({ onSelect }: { onSelect: (type: LessonType) => void }) => {
  const blockTypes = [
    { type: 'TEXT' as LessonType, label: 'Texto', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { type: 'VIDEO' as LessonType, label: 'Video', icon: Video, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { type: 'FILE' as LessonType, label: 'Archivo', icon: FileGenericIcon, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { type: 'QUIZ' as LessonType, label: 'Quiz', icon: Pencil, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  ];

  return (
    <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <p className="text-sm font-medium mb-2">Añadir bloque de contenido</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {blockTypes.map(({ type, label, icon: Icon, color, bgColor }) => (
          <Button
            key={type}
            variant="outline"
            onClick={() => onSelect(type)}
            className="flex-col h-auto py-3 gap-2 hover:scale-[1.02] transition-transform"
          >
            <div className={`p-2 rounded-full ${bgColor}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

// Modal de Selección de Plantillas
const TemplateSelectorModal = ({ 
  isOpen, 
  onClose, 
  templates, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  templates: ApiTemplate[]; 
  onSelect: (template: ApiTemplate) => void; 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            Plantillas de Lección
          </DialogTitle>
          <DialogDescription>
            Elige una plantilla para crear una lección rápidamente
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="p-1">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <SparklesIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium mb-2">No hay plantillas</p>
                <p className="text-sm text-muted-foreground">
                  Crea plantillas guardando lecciones existentes
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className="text-left p-4 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.description || 'Sin descripción'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {template.templateBlocks.length} bloques
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Modal para Guardar Plantilla
const SaveTemplateModal = ({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (name: string, description: string) => Promise<void>; 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    await onSave(name, description);
    setIsSaving(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar como Plantilla</DialogTitle>
          <DialogDescription>
            Esta lección se guardará como plantilla para reutilizar
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre de la plantilla"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe esta plantilla..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};