'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { 
  PlusCircle, 
  Trash2, 
  Check, 
  Image as ImageIcon, 
  CheckSquare, 
  BrainCircuit, 
  Eye, 
  Save, 
  Settings2, 
  HelpCircle,
  FileText,
  ArrowLeft,
  GripVertical,
  Copy,
  Smartphone,
  Monitor,
  Tablet,
  Link,
  ListOrdered,
  PenLine,
  Circle,
  Flame,
  Target,
  TrendingUp,
  Crown,
  Zap,
  Type,
  AlignLeft,
  ArrowUpDown,
  MessageSquare,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Quiz as AppQuiz, Question as AppQuestion, QuestionType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const VIEWPORT_SIZES = [
  { id: 'mobile', label: 'Móvil', icon: Smartphone, width: '375px', height: '667px', scale: 0.8 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px', height: '1024px', scale: 0.7 },
  { id: 'desktop', label: 'Escritorio', icon: Monitor, width: '1024px', height: '768px', scale: 1 },
] as const;

const QUESTION_TYPES = [
  { value: 'SINGLE_CHOICE', label: 'Opción Única', icon: Circle, color: 'bg-blue-500' },
  { value: 'MULTIPLE_CHOICE', label: 'Opción Múltiple', icon: CheckSquare, color: 'bg-green-500' },
  { value: 'TRUE_FALSE', label: 'Verdadero/Falso', icon: BrainCircuit, color: 'bg-purple-500' },
  { value: 'SHORT_ANSWER', label: 'Respuesta Corta', icon: Type, color: 'bg-orange-500' },
  { value: 'LONG_ANSWER', label: 'Respuesta Larga', icon: AlignLeft, color: 'bg-red-500' },
  { value: 'MATCHING', label: 'Emparejamiento', icon: Link, color: 'bg-indigo-500' },
  { value: 'ORDERING', label: 'Ordenamiento', icon: ListOrdered, color: 'bg-pink-500' },
] as const;

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Fácil', color: 'bg-green-500', icon: TrendingUp, points: 10 },
  { value: 'medium', label: 'Medio', color: 'bg-yellow-500', icon: Target, points: 20 },
  { value: 'hard', label: 'Difícil', color: 'bg-red-500', icon: Flame, points: 30 },
  { value: 'expert', label: 'Experto', color: 'bg-purple-500', icon: Crown, points: 50 },
] as const;

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const stripHtml = (html?: string): string => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// ============================================================================
// COMPONENT: SortableQuestionItem
// ============================================================================

interface SortableQuestionItemProps {
  question: AppQuestion;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableQuestionItem({ 
  question, 
  index, 
  isActive, 
  onSelect, 
  onDelete, 
  onDuplicate 
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const difficulty = DIFFICULTY_LEVELS.find(d => d.value === question.difficulty) || DIFFICULTY_LEVELS[1];
  const questionType = QUESTION_TYPES.find(t => t.value === question.type) || QUESTION_TYPES[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group mb-2 transition-all duration-200",
        isActive && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div
        onClick={onSelect}
        className={cn(
          "relative p-3 rounded-lg border transition-all duration-200 cursor-pointer",
          "hover:shadow-md",
          isActive 
            ? "border-primary bg-gradient-to-r from-primary/5 to-primary/10" 
            : "border-border bg-card hover:border-primary/30"
        )}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="ml-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate">
                    {stripHtml(question.text) || `Pregunta ${index + 1}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs px-1.5 py-0",
                      difficulty.value === 'easy' && "border-green-500/30 text-green-600",
                      difficulty.value === 'medium' && "border-yellow-500/30 text-yellow-600",
                      difficulty.value === 'hard' && "border-red-500/30 text-red-600",
                      difficulty.value === 'expert' && "border-purple-500/30 text-purple-600"
                    )}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mr-1 ${difficulty.color}`} />
                    {difficulty.label}
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className="text-xs px-1.5 py-0"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mr-1 ${questionType.color}`} />
                    {questionType.label}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{question.options?.length || 0} opciones</span>
                <span>•</span>
                <span className="font-semibold text-primary">{question.basePoints || 10} pts</span>
                {question.imageUrl && (
                  <>
                    <span>•</span>
                    <ImageIcon className="h-3 w-3" />
                  </>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate();
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duplicar pregunta</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar pregunta</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: QuestionList
// ============================================================================

interface QuestionListProps {
  questions: AppQuestion[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDuplicate: (index: number) => void;
}

function QuestionList({
  questions,
  activeIndex,
  onSelect,
  onDelete,
  onAdd,
  onReorder,
  onDuplicate,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <div className="h-full flex flex-col border-r border-border">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Preguntas</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Nueva
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-primary">{questions.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-emerald-500">
              {questions.filter(q => q.difficulty === 'easy').length}
            </div>
            <div className="text-xs text-muted-foreground">Fáciles</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-red-500">
              {questions.filter(q => q.difficulty === 'hard' || q.difficulty === 'expert').length}
            </div>
            <div className="text-xs text-muted-foreground">Difíciles</div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  isActive={index === activeIndex}
                  onSelect={() => onSelect(index)}
                  onDelete={() => onDelete(index)}
                  onDuplicate={() => onDuplicate(index)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {questions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No hay preguntas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza creando tu primera pregunta
              </p>
              <Button onClick={onAdd}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Crear primera pregunta
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Puntos totales: <span className="font-bold text-primary">
              {questions.reduce((sum, q) => sum + (q.basePoints || 0), 0)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Tiempo estimado: <span className="font-bold text-primary">
              {Math.ceil(questions.length * 1.5)} min
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: OptionRenderer
// ============================================================================

interface OptionRendererProps {
  option: any;
  index: number;
  questionType: QuestionType;
  isEditing: boolean;
  onStartEdit: () => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onToggleCorrect: () => void;
  isCorrect: boolean;
  showCorrectIndicator?: boolean;
}

function OptionRenderer({
  option,
  index,
  questionType,
  isEditing,
  onStartEdit,
  onTextChange,
  onDelete,
  onToggleCorrect,
  isCorrect,
  showCorrectIndicator = true,
}: OptionRendererProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
      textAreaRef.current.focus();
    }
  }, [isEditing]);

  const getOptionPrefix = () => {
    switch (questionType) {
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE':
        return String.fromCharCode(65 + index);
      case 'ORDERING':
        return `${index + 1}.`;
      case 'MATCHING':
        return `A${index + 1} →`;
      default:
        return `${index + 1}.`;
    }
  };

  return (
    <div
      className={cn(
        "relative group p-4 rounded-lg border transition-all duration-200",
        "hover:shadow-sm",
        isCorrect && showCorrectIndicator
          ? "border-emerald-500 bg-emerald-500/5" 
          : "border-border bg-card"
      )}
    >
      {/* Option prefix */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          isCorrect && showCorrectIndicator
            ? "bg-emerald-500 text-white" 
            : "bg-muted text-muted-foreground"
        )}>
          {getOptionPrefix()}
        </div>
      </div>

      {/* Option content */}
      <div className="ml-4">
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            value={option.text}
            onChange={(e) => onTextChange(e.target.value)}
            onBlur={() => {}}
            className="w-full bg-transparent border-none outline-none resize-none"
            rows={2}
          />
        ) : (
          <div
            onClick={onStartEdit}
            className="cursor-text hover:bg-muted/50 transition-colors rounded p-2 -m-2"
          >
            <p className="text-lg">{option.text || 'Haz clic para editar esta opción'}</p>
          </div>
        )}
      </div>

      {/* Option actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {showCorrectIndicator && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onToggleCorrect}
                >
                  <Check className={cn(
                    "h-4 w-4",
                    isCorrect ? "text-emerald-500" : "text-muted-foreground"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como correcta</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar opción</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: QuestionCanvas
// ============================================================================

interface QuestionCanvasProps {
  question: AppQuestion;
  viewport: typeof VIEWPORT_SIZES[number];
  onQuestionChange: (updates: Partial<AppQuestion>) => void;
  onOptionChange: (optionId: string, updates: Partial<any>) => void;
  onAddOption: () => void;
  onDeleteOption: (optionId: string) => void;
  onSetCorrectOption: (optionId: string) => void;
  onAddMatchingPair?: () => void;
}

function QuestionCanvas({
  question,
  viewport,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onDeleteOption,
  onSetCorrectOption,
}: QuestionCanvasProps) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [question.text, editingOptionId]);

  const handleTextBlur = () => {
    setIsEditingText(false);
  };

  const handleOptionTextBlur = () => {
    setEditingOptionId(null);
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    onOptionChange(optionId, { text });
  };

  const handleAddDefaultOptions = useCallback(() => {
    if (question.type === 'TRUE_FALSE' && (!question.options || question.options.length === 0)) {
      const trueOption = { id: generateId(), text: 'Verdadero', isCorrect: false, points: 0 };
      const falseOption = { id: generateId(), text: 'Falso', isCorrect: false, points: 0 };
      
      onQuestionChange({ 
        options: [trueOption, falseOption] 
      });
    } else {
      onAddOption();
    }
  }, [question.type, question.options, onQuestionChange, onAddOption]);

  const renderQuestionContent = () => {
    const questionType = QUESTION_TYPES.find(t => t.value === question.type) || QUESTION_TYPES[0];

    switch (question.type) {
      case 'SHORT_ANSWER':
      case 'LONG_ANSWER':
        return (
          <div className="space-y-6">
            {/* Question Text */}
            <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none"
                  autoFocus
                  rows={3}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className="text-2xl font-bold min-h-[60px]">
                    {question.text || 'Haz clic para editar la pregunta'}
                  </h2>
                </div>
              )}
            </div>

            {/* Answer Field */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Campo de respuesta</h3>
              <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20">
                <p className="text-muted-foreground">
                  {question.type === 'SHORT_ANSWER' 
                    ? 'Los estudiantes escribirán una respuesta corta aquí' 
                    : 'Los estudiantes escribirán una respuesta extensa aquí'}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Explicación</h3>
              <Textarea
                value={question.explanation || ''}
                onChange={(e) => onQuestionChange({ explanation: e.target.value })}
                placeholder="Explica la respuesta correcta (opcional)"
                rows={3}
              />
            </div>
          </div>
        );

      case 'MATCHING':
        return (
          <div className="space-y-6">
            {/* Question Text */}
            <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none"
                  autoFocus
                  rows={3}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className="text-2xl font-bold min-h-[60px]">
                    {question.text || 'Haz clic para editar la pregunta'}
                  </h2>
                </div>
              )}
            </div>

            {/* Matching Pairs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pares de emparejamiento</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddDefaultOptions}
                  className="gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Añadir par
                </Button>
              </div>

              <div className="space-y-4">
                {question.options?.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        value={option.left || ''}
                        onChange={(e) => onOptionChange(option.id, { left: e.target.value })}
                        placeholder="Elemento izquierdo"
                        className="h-12"
                      />
                    </div>
                    <div className="text-muted-foreground">
                      <ArrowUpDown className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={option.right || ''}
                        onChange={(e) => onOptionChange(option.id, { right: e.target.value })}
                        placeholder="Elemento derecho"
                        className="h-12"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => onDeleteOption(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Explicación</h3>
              <Textarea
                value={question.explanation || ''}
                onChange={(e) => onQuestionChange({ explanation: e.target.value })}
                placeholder="Explica por qué la respuesta es correcta (opcional)"
                rows={3}
              />
            </div>
          </div>
        );

      case 'ORDERING':
        return (
          <div className="space-y-6">
            {/* Question Text */}
            <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none"
                  autoFocus
                  rows={3}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className="text-2xl font-bold min-h-[60px]">
                    {question.text || 'Haz clic para editar la pregunta'}
                  </h2>
                </div>
              )}
            </div>

            {/* Ordering Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Elementos a ordenar</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddOption}
                  className="gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Añadir elemento
                </Button>
              </div>

              <div className="space-y-2">
                {question.options?.map((option, index) => (
                  <OptionRenderer
                    key={option.id}
                    option={option}
                    index={index}
                    questionType={question.type}
                    isEditing={editingOptionId === option.id}
                    onStartEdit={() => setEditingOptionId(option.id)}
                    onTextChange={(text) => handleOptionTextChange(option.id, text)}
                    onDelete={() => onDeleteOption(option.id)}
                    onToggleCorrect={() => onSetCorrectOption(option.id)}
                    isCorrect={option.isCorrect}
                    showCorrectIndicator={false}
                  />
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Explicación</h3>
              <Textarea
                value={question.explanation || ''}
                onChange={(e) => onQuestionChange({ explanation: e.target.value })}
                placeholder="Explica el orden correcto (opcional)"
                rows={3}
              />
            </div>
          </div>
        );

      default: // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE
        return (
          <div className="space-y-6">
            {/* Question Text */}
            <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none"
                  autoFocus
                  rows={3}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className="text-2xl font-bold min-h-[60px]">
                    {question.text || 'Haz clic para editar la pregunta'}
                  </h2>
                </div>
              )}
              
              <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsEditingText(true)}
                >
                  <PenLine className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Question Image */}
            {question.imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <div className="w-full h-48 bg-muted relative">
                  <Image
                    src={question.imageUrl}
                    alt="Question image"
                    fill
                    className="object-cover"
                    unoptimized={question.imageUrl.startsWith('blob:')}
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                    onClick={() => onQuestionChange({ imageUrl: null })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {question.type === 'MULTIPLE_CHOICE' ? 'Opciones (selección múltiple)' : 
                   question.type === 'TRUE_FALSE' ? 'Opciones (Verdadero/Falso)' : 
                   'Opciones de respuesta'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddDefaultOptions}
                  className="gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  {question.type === 'TRUE_FALSE' ? 'Restablecer opciones' : 'Añadir opción'}
                </Button>
              </div>

              <div className="space-y-2">
                {question.options?.map((option, index) => (
                  <OptionRenderer
                    key={option.id}
                    option={option}
                    index={index}
                    questionType={question.type}
                    isEditing={editingOptionId === option.id}
                    onStartEdit={() => setEditingOptionId(option.id)}
                    onTextChange={(text) => handleOptionTextChange(option.id, text)}
                    onDelete={() => onDeleteOption(option.id)}
                    onToggleCorrect={() => onSetCorrectOption(option.id)}
                    isCorrect={option.isCorrect}
                  />
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Explicación</h3>
              <Textarea
                value={question.explanation || ''}
                onChange={(e) => onQuestionChange({ explanation: e.target.value })}
                placeholder="Explica por qué la respuesta es correcta (opcional)"
                rows={3}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Viewport Selector */}
      <div className="shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {VIEWPORT_SIZES.map((vp) => (
              <TooltipProvider key={vp.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewport.id === vp.id ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setViewport(vp)}
                    >
                      <vp.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{vp.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{question.basePoints || 10} puntos</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{question.difficulty || 'medium'}</span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div 
            className="mx-auto bg-background rounded-2xl border-2 border-border shadow-xl transition-all duration-300"
            style={{
              width: viewport.width,
              height: viewport.height,
              transform: `scale(${viewport.scale})`,
              transformOrigin: 'top center',
            }}
          >
            <div className="p-8 h-full overflow-auto">
              {renderQuestionContent()}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// COMPONENT: PropertiesPanel
// ============================================================================

interface PropertiesPanelProps {
  selectedElement: 'question' | 'option' | 'quiz';
  question?: AppQuestion;
  option?: any;
  quiz?: AppQuiz;
  onQuestionUpdate: (updates: Partial<AppQuestion>) => void;
  onOptionUpdate: (updates: Partial<any>) => void;
  onQuizUpdate: (updates: Partial<AppQuiz>) => void;
}

function PropertiesPanel({
  selectedElement,
  question,
  option,
  quiz,
  onQuestionUpdate,
  onOptionUpdate,
  onQuizUpdate,
}: PropertiesPanelProps) {
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>('SINGLE_CHOICE');

  useEffect(() => {
    if (question?.type) {
      setSelectedQuestionType(question.type);
    }
  }, [question]);

  const handleQuestionTypeChange = (value: string) => {
    const newType = value as QuestionType;
    setSelectedQuestionType(newType);
    
    // Reset options based on question type
    let newOptions = [];
    switch (newType) {
      case 'TRUE_FALSE':
        newOptions = [
          { id: generateId(), text: 'Verdadero', isCorrect: false, points: 0 },
          { id: generateId(), text: 'Falso', isCorrect: false, points: 0 },
        ];
        break;
      case 'SINGLE_CHOICE':
        newOptions = [
          { id: generateId(), text: 'Opción 1', isCorrect: true, points: 10 },
          { id: generateId(), text: 'Opción 2', isCorrect: false, points: 0 },
          { id: generateId(), text: 'Opción 3', isCorrect: false, points: 0 },
        ];
        break;
      case 'MULTIPLE_CHOICE':
        newOptions = [
          { id: generateId(), text: 'Opción 1', isCorrect: true, points: 5 },
          { id: generateId(), text: 'Opción 2', isCorrect: true, points: 5 },
          { id: generateId(), text: 'Opción 3', isCorrect: false, points: 0 },
        ];
        break;
      case 'SHORT_ANSWER':
      case 'LONG_ANSWER':
        newOptions = [];
        break;
      case 'MATCHING':
        newOptions = [
          { id: generateId(), left: 'Capital de Francia', right: 'París', isCorrect: true, points: 10 },
          { id: generateId(), left: 'Capital de España', right: 'Madrid', isCorrect: true, points: 10 },
        ];
        break;
      case 'ORDERING':
        newOptions = [
          { id: generateId(), text: 'Primer paso', isCorrect: false, points: 0 },
          { id: generateId(), text: 'Segundo paso', isCorrect: false, points: 0 },
          { id: generateId(), text: 'Tercer paso', isCorrect: false, points: 0 },
        ];
        break;
    }

    onQuestionUpdate({ 
      type: newType,
      options: newOptions 
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'question' | 'quiz') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, sube solo archivos de imagen');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);

    if (type === 'question') {
      onQuestionUpdate({ imageUrl: objectUrl });
    } else {
      onQuizUpdate({ coverImage: objectUrl });
    }
  };

  const renderQuestionProperties = () => {
    if (!question) return null;

    return (
      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Configuración básica</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="question-type">Tipo de pregunta</Label>
              <Select
                value={question.type}
                onValueChange={handleQuestionTypeChange}
              >
                <SelectTrigger id="question-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question-difficulty">Dificultad</Label>
              <Select
                value={question.difficulty}
                onValueChange={(value) => onQuestionUpdate({ difficulty: value as any })}
              >
                <SelectTrigger id="question-difficulty" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${level.color}`} />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question-points">Puntos base</Label>
              <div className="flex items-center gap-3 mt-2">
                <Slider
                  id="question-points"
                  value={[question.basePoints || 10]}
                  onValueChange={([value]) => onQuestionUpdate({ basePoints: value })}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <div className="w-16 text-right">
                  <Input
                    type="number"
                    value={question.basePoints || 10}
                    onChange={(e) => onQuestionUpdate({ basePoints: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    className="h-8 w-16 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Configuración de tiempo</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="time-limit">Límite de tiempo</Label>
              <Switch
                id="time-limit"
                checked={!!question.timeLimit}
                onCheckedChange={(checked) => 
                  onQuestionUpdate({ timeLimit: checked ? 60 : undefined })
                }
              />
            </div>

            {question.timeLimit && (
              <div>
                <Label htmlFor="time-seconds">Segundos</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Slider
                    id="time-seconds"
                    value={[question.timeLimit]}
                    onValueChange={([value]) => onQuestionUpdate({ timeLimit: value })}
                    min={5}
                    max={300}
                    step={5}
                    className="flex-1"
                  />
                  <div className="w-16 text-right">
                    <Input
                      type="number"
                      value={question.timeLimit}
                      onChange={(e) => onQuestionUpdate({ timeLimit: parseInt(e.target.value) || 30 })}
                      min={5}
                      max={300}
                      className="h-8 w-16 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Multimedia</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="question-image">Imagen de pregunta</Label>
              <div className="mt-2">
                <label
                  htmlFor="question-image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    id="question-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'question')}
                  />
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium mt-2">Subir imagen</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizProperties = () => {
    if (!quiz) return null;

    return (
      <div className="space-y-6">
        {/* Quiz Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Configuración general</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="quiz-title">Título del quiz</Label>
              <Input
                id="quiz-title"
                value={quiz.title}
                onChange={(e) => onQuizUpdate({ title: e.target.value })}
                placeholder="Escribe el título del quiz"
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="quiz-description">Descripción</Label>
              <Textarea
                id="quiz-description"
                value={quiz.description || ''}
                onChange={(e) => onQuizUpdate({ description: e.target.value })}
                placeholder="Describe el propósito de este quiz"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="quiz-published">Estado</Label>
              <div className="flex items-center gap-2">
                <Badge variant={quiz.published ? "default" : "outline"}>
                  {quiz.published ? "Publicado" : "Borrador"}
                </Badge>
                <Switch
                  id="quiz-published"
                  checked={quiz.published}
                  onCheckedChange={(checked) => onQuizUpdate({ published: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Apariencia</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="quiz-theme">Tema de color</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { color: 'blue', name: 'Azul' },
                  { color: 'green', name: 'Verde' },
                  { color: 'purple', name: 'Morado' },
                  { color: 'orange', name: 'Naranja' },
                  { color: 'pink', name: 'Rosa' },
                ].map((theme) => (
                  <TooltipProvider key={theme.color}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onQuizUpdate({ theme: theme.color })}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            quiz.theme === theme.color 
                              ? "border-primary scale-110" 
                              : "border-border hover:scale-105"
                          )}
                          style={{ 
                            backgroundColor: `var(--${theme.color}-500)` 
                          }}
                          aria-label={theme.name}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{theme.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="quiz-cover">Imagen de portada</Label>
              <div className="mt-2">
                <label
                  htmlFor="quiz-cover-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    id="quiz-cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'quiz')}
                  />
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium mt-2">Subir portada</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: 1200×600px
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Comportamiento</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-answers">Mostrar respuestas</Label>
                <p className="text-xs text-muted-foreground">
                  Mostrar respuestas correctas al finalizar
                </p>
              </div>
              <Switch
                id="show-answers"
                checked={quiz.showAnswers ?? true}
                onCheckedChange={(checked) => onQuizUpdate({ showAnswers: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-score">Mostrar puntuación</Label>
                <p className="text-xs text-muted-foreground">
                  Mostrar puntuación inmediatamente
                </p>
              </div>
              <Switch
                id="show-score"
                checked={quiz.showScore ?? true}
                onCheckedChange={(checked) => onQuizUpdate({ showScore: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-retry">Permitir reintentar</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir volver a intentar el quiz
                </p>
              </div>
              <Switch
                id="allow-retry"
                checked={quiz.allowRetry ?? false}
                onCheckedChange={(checked) => onQuizUpdate({ allowRetry: checked })}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="shrink-0 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Propiedades</h2>
          <Badge variant="outline" className="ml-auto">
            {selectedElement === 'question' && 'Pregunta'}
            {selectedElement === 'option' && 'Opción'}
            {selectedElement === 'quiz' && 'Quiz'}
          </Badge>
        </div>
      </div>

      {/* Panel Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {selectedElement === 'question' && renderQuestionProperties()}
          {selectedElement === 'quiz' && renderQuizProperties()}
          {selectedElement === 'option' && option && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="option-text">Texto de la opción</Label>
                <Textarea
                  id="option-text"
                  value={option.text}
                  onChange={(e) => onOptionUpdate({ text: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="option-correct">Respuesta correcta</Label>
                <Switch
                  id="option-correct"
                  checked={option.isCorrect}
                  onCheckedChange={(checked) => onOptionUpdate({ isCorrect: checked })}
                />
              </div>

              <div>
                <Label htmlFor="option-points">Puntos</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Slider
                    id="option-points"
                    value={[option.points || 0]}
                    onValueChange={([value]) => onOptionUpdate({ points: value })}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <div className="w-16 text-right">
                    <Input
                      type="number"
                      value={option.points || 0}
                      onChange={(e) => onOptionUpdate({ points: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={50}
                      className="h-8 w-16 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: QuizEditorModal
// ============================================================================

interface QuizEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: AppQuiz;
  onSave: (updatedQuiz: AppQuiz) => void;
  onPreview?: () => void;
}

export function QuizEditorModal({ 
  isOpen, 
  onClose, 
  quiz, 
  onSave,
  onPreview 
}: QuizEditorModalProps) {
  const [localQuiz, setLocalQuiz] = useState<AppQuiz>(quiz);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [viewport, setViewport] = useState<typeof VIEWPORT_SIZES[number]>(VIEWPORT_SIZES[2]); // Default desktop
  const [selectedElement, setSelectedElement] = useState<'question' | 'option' | 'quiz'>('question');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize with quiz data
  useEffect(() => {
    if (quiz && isOpen) {
      const clonedQuiz = {
        ...quiz,
        questions: quiz.questions.map((q, index) => ({
          ...q,
          order: index,
          options: q.options?.map(opt => ({ 
            ...opt,
            left: (opt as any).left || '',
            right: (opt as any).right || ''
          })) || []
        }))
      };
      setLocalQuiz(clonedQuiz);
      setActiveQuestionIndex(0);
      setSelectedElement('question');
    }
  }, [quiz, isOpen]);

  const activeQuestion = localQuiz.questions[activeQuestionIndex];
  const selectedOption = activeQuestion?.options?.find(opt => opt.id === selectedOptionId);

  // Handlers
  const handleQuestionUpdate = (updates: Partial<AppQuestion>) => {
    const newQuestions = [...localQuiz.questions];
    newQuestions[activeQuestionIndex] = {
      ...newQuestions[activeQuestionIndex],
      ...updates,
    };
    setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionUpdate = (optionId: string, updates: Partial<any>) => {
    const newQuestions = [...localQuiz.questions];
    const question = newQuestions[activeQuestionIndex];
    const optionIndex = question.options?.findIndex(opt => opt.id === optionId);
    
    if (optionIndex !== undefined && optionIndex !== -1 && question.options) {
      question.options[optionIndex] = {
        ...question.options[optionIndex],
        ...updates,
      };
      setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    }
  };

  const handleQuizUpdate = (updates: Partial<AppQuiz>) => {
    setLocalQuiz(prev => ({ ...prev, ...updates }));
  };

  const handleAddQuestion = () => {
    const newQuestion: AppQuestion = {
      id: generateId(),
      text: 'Nueva pregunta',
      order: localQuiz.questions.length,
      type: 'SINGLE_CHOICE',
      difficulty: 'medium',
      basePoints: 10,
      options: [
        { id: generateId(), text: 'Opción correcta', isCorrect: true, points: 10 },
        { id: generateId(), text: 'Opción incorrecta', isCorrect: false, points: 0 },
        { id: generateId(), text: 'Otra opción incorrecta', isCorrect: false, points: 0 },
      ],
    };
    
    setLocalQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setActiveQuestionIndex(localQuiz.questions.length);
  };

  const handleDeleteQuestion = (index: number) => {
    if (localQuiz.questions.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos una pregunta",
        variant: "destructive"
      });
      return;
    }
    
    const newQuestions = localQuiz.questions.filter((_, i) => i !== index);
    setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    
    if (activeQuestionIndex >= index && activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  const handleDuplicateQuestion = (index: number) => {
    const questionToDuplicate = { ...localQuiz.questions[index] };
    const newQuestion = {
      ...questionToDuplicate,
      id: generateId(),
      text: `${questionToDuplicate.text} (Copia)`,
      order: localQuiz.questions.length,
      options: questionToDuplicate.options?.map(opt => ({
        ...opt,
        id: generateId()
      })) || []
    };
    
    setLocalQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const handleAddOption = () => {
    const newOption = {
      id: generateId(),
      text: 'Nueva opción',
      isCorrect: false,
      points: 0,
      left: '',
      right: ''
    };
    
    const newQuestions = [...localQuiz.questions];
    if (!newQuestions[activeQuestionIndex].options) {
      newQuestions[activeQuestionIndex].options = [];
    }
    newQuestions[activeQuestionIndex].options!.push(newOption);
    
    setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleDeleteOption = (optionId: string) => {
    const newQuestions = [...localQuiz.questions];
    const question = newQuestions[activeQuestionIndex];
    question.options = question.options?.filter(opt => opt.id !== optionId) || [];
    setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSetCorrectOption = (optionId: string) => {
    const newQuestions = [...localQuiz.questions];
    const question = newQuestions[activeQuestionIndex];
    
    // For single choice, only one option can be correct
    if (question.type === 'SINGLE_CHOICE') {
      question.options = question.options?.map(opt => ({
        ...opt,
        isCorrect: opt.id === optionId
      })) || [];
    } else if (question.type === 'MULTIPLE_CHOICE') {
      // For multiple choice, toggle the option
      question.options = question.options?.map(opt => 
        opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      ) || [];
    } else {
      // For other types, just set it
      question.options = question.options?.map(opt => ({
        ...opt,
        isCorrect: opt.id === optionId
      })) || [];
    }
    
    setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleReorderQuestions = (fromIndex: number, toIndex: number) => {
    const newQuestions = arrayMove(localQuiz.questions, fromIndex, toIndex);
    newQuestions.forEach((q, idx) => {
      q.order = idx;
    });
    setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    setActiveQuestionIndex(toIndex);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate quiz
      if (!localQuiz.title?.trim()) {
        toast({
          title: "Error de validación",
          description: "El título del quiz es requerido",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      if (localQuiz.questions.length === 0) {
        toast({
          title: "Error de validación",
          description: "Debe haber al menos una pregunta",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      // Validate each question
      const invalidQuestions: number[] = [];
      localQuiz.questions.forEach((q, index) => {
        const hasText = q.text?.trim().length > 0;
        
        // For question types that require correct options
        if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(q.type)) {
          const hasCorrectOption = q.options?.some(opt => opt.isCorrect) ?? false;
          if (!hasText || !hasCorrectOption) {
            invalidQuestions.push(index + 1);
          }
        } else if (['MATCHING', 'ORDERING'].includes(q.type)) {
          const hasOptions = (q.options?.length ?? 0) >= 2;
          if (!hasText || !hasOptions) {
            invalidQuestions.push(index + 1);
          }
        } else if (['SHORT_ANSWER', 'LONG_ANSWER'].includes(q.type)) {
          if (!hasText) {
            invalidQuestions.push(index + 1);
          }
        }
      });

      if (invalidQuestions.length > 0) {
        toast({
          title: "Error de validación",
          description: `Preguntas ${invalidQuestions.join(', ')} no están completas`,
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      // Clean up blob URLs before saving
      const cleanedQuiz = {
        ...localQuiz,
        questions: localQuiz.questions.map(q => ({
          ...q,
          // Remove blob URLs for production
          imageUrl: q.imageUrl?.startsWith('blob:') ? null : q.imageUrl
        })),
        coverImage: localQuiz.coverImage?.startsWith('blob:') ? null : localQuiz.coverImage
      };

      await onSave(cleanedQuiz);
      
      toast({
        title: "✅ Quiz guardado",
        description: "Los cambios se han guardado exitosamente",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "❌ Error al guardar",
        description: "Ha ocurrido un error al guardar el quiz",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else {
      toast({
        title: "Vista previa",
        description: "Esta funcionalidad está en desarrollo",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1800px] h-[90vh] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="shrink-0 border-b border-border bg-gradient-to-r from-card via-card/95 to-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow">
                    <CheckSquare className="h-5 w-5 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold">
                        {localQuiz.title || 'Editor de Quiz'}
                      </h1>
                      <Badge variant={localQuiz.published ? "default" : "outline"}>
                        {localQuiz.published ? "Publicado" : "Borrador"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {localQuiz.questions.length} preguntas • {localQuiz.questions.reduce((sum, q) => sum + (q.basePoints || 0), 0)} puntos totales
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Vista previa
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Content - 3 Column Layout */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-12">
              {/* Left Column - Question List (25%) */}
              <div className="col-span-3 h-full overflow-hidden border-r border-border">
                <QuestionList
                  questions={localQuiz.questions}
                  activeIndex={activeQuestionIndex}
                  onSelect={setActiveQuestionIndex}
                  onDelete={handleDeleteQuestion}
                  onAdd={handleAddQuestion}
                  onReorder={handleReorderQuestions}
                  onDuplicate={handleDuplicateQuestion}
                />
              </div>
              
              {/* Middle Column - Canvas (50%) */}
              <div className="col-span-6 h-full overflow-hidden">
                {activeQuestion ? (
                  <QuestionCanvas
                    question={activeQuestion}
                    viewport={viewport}
                    onQuestionChange={handleQuestionUpdate}
                    onOptionChange={handleOptionUpdate}
                    onAddOption={handleAddOption}
                    onDeleteOption={handleDeleteOption}
                    onSetCorrectOption={handleSetCorrectOption}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <HelpCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Selecciona una pregunta</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Elige una pregunta de la lista para comenzar a editar
                      </p>
                      <Button 
                        onClick={handleAddQuestion}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Crear primera pregunta
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right Column - Properties (25%) */}
              <div className="col-span-3 h-full overflow-hidden border-l border-border">
                <PropertiesPanel
                  selectedElement={selectedElement}
                  question={activeQuestion}
                  option={selectedOption}
                  quiz={localQuiz}
                  onQuestionUpdate={handleQuestionUpdate}
                  onOptionUpdate={(updates) => {
                    if (selectedOptionId) {
                      handleOptionUpdate(selectedOptionId, updates);
                    }
                  }}
                  onQuizUpdate={handleQuizUpdate}
                />
              </div>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="shrink-0 border-t border-border px-4 py-2 bg-muted/20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    localQuiz.published ? "bg-emerald-500" : "bg-yellow-500"
                  )} />
                  <span className="text-muted-foreground">
                    {localQuiz.published ? "Publicado" : "Borrador"}
                  </span>
                </div>
                
                <div className="text-muted-foreground">
                  <span className="font-semibold">{localQuiz.questions.length}</span> preguntas
                </div>
                
                <div className="text-muted-foreground">
                  <span className="font-semibold">
                    {localQuiz.questions.reduce((sum, q) => sum + (q.basePoints || 0), 0)}
                  </span> puntos totales
                </div>
              </div>
              
              <div className="text-muted-foreground">
                Editando: <span className="font-semibold">Pregunta {activeQuestionIndex + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}