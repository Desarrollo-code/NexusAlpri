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
  { id: 'mobile', label: 'Móvil', icon: Smartphone, width: 375, height: 667, scale: 0.85 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 768, height: 1024, scale: 0.65 },
  { id: 'desktop', label: 'Escritorio', icon: Monitor, width: 1024, height: 768, scale: 0.8 },
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

// Helper to get localized difficulty label
const getDifficultyLabel = (val?: string) => {
  const diff = DIFFICULTY_LEVELS.find(d => d.value === val);
  return diff ? diff.label : 'Medio';
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
        isActive && "ring-2 ring-primary ring-offset-2 z-10"
      )}
    >
      <div
        onClick={onSelect}
        className={cn(
          "relative p-3 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden",
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
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="ml-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate block max-w-full">
                    {stripHtml(question.text) || `Pregunta ${index + 1}`}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5",
                      difficulty.value === 'easy' && "border-green-500/30 text-green-600",
                      difficulty.value === 'medium' && "border-yellow-500/30 text-yellow-600",
                      difficulty.value === 'hard' && "border-red-500/30 text-red-600",
                      difficulty.value === 'expert' && "border-purple-500/30 text-purple-600"
                    )}
                  >
                    <div className={`w-1 h-1 rounded-full mr-1 shrink-0 ${difficulty.color}`} />
                    {difficulty.label}
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-1.5 py-0 h-5"
                  >
                    <div className={`w-1 h-1 rounded-full mr-1 shrink-0 ${questionType.color}`} />
                    {questionType.label}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                <span className="truncate">{question.options?.length || 0} opciones</span>
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
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border/50">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-sm hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate();
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duplicar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-sm hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar</p>
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drags
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
    <div className="h-full flex flex-col border-r border-border bg-muted/10">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Estructura</h2>
          <Button
            variant="default"
            size="sm"
            onClick={onAdd}
            className="gap-1 h-8"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Nueva
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center p-2 rounded-lg bg-background border shadow-sm">
            <div className="text-lg font-bold text-primary leading-none">{questions.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background border shadow-sm">
            <div className="text-lg font-bold text-emerald-500 leading-none">
              {questions.filter(q => q.difficulty === 'easy').length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Fáciles</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background border shadow-sm">
            <div className="text-lg font-bold text-red-500 leading-none">
              {questions.filter(q => q.difficulty === 'hard' || q.difficulty === 'expert').length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Difíciles</div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <ScrollArea className="flex-1 bg-background/50">
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
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Sin preguntas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tu quiz necesita contenido para brillar.
              </p>
              <Button variant="outline" onClick={onAdd} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Añadir primera pregunta
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
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
        return `A${index + 1}`;
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
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shadow-sm",
          isCorrect && showCorrectIndicator
            ? "bg-emerald-500 text-white border-emerald-600" 
            : "bg-background text-muted-foreground border-border"
        )}>
          {getOptionPrefix()}
        </div>
      </div>

      {/* Option content */}
      <div className="ml-4 w-full">
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            value={option.text}
            onChange={(e) => onTextChange(e.target.value)}
            onBlur={() => {}}
            className="w-full bg-transparent border-none outline-none resize-none min-h-[1.5em] overflow-hidden"
            rows={1}
            style={{ minHeight: '24px' }}
          />
        ) : (
          <div
            onClick={onStartEdit}
            className="cursor-text hover:bg-muted/50 transition-colors rounded p-1 -m-1 break-words whitespace-pre-wrap"
          >
            <p className={cn("text-base", !option.text && "text-muted-foreground italic")}>
              {option.text || 'Haz clic para editar esta opción'}
            </p>
          </div>
        )}
      </div>

      {/* Option actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-md shadow-sm border border-border/50 p-0.5">
        {showCorrectIndicator && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", isCorrect && "text-emerald-500")}
                  onClick={(e) => { e.stopPropagation(); onToggleCorrect(); }}
                >
                  <Check className="h-4 w-4" />
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
                className="h-7 w-7 hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
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
    // We re-verify type here to ensure render is in sync
    const renderType = question.type;

    switch (renderType) {
      case 'SHORT_ANSWER':
      case 'LONG_ANSWER':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Question Text */}
            <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden"
                  autoFocus
                  rows={2}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className={cn("text-2xl font-bold min-h-[60px] break-words whitespace-pre-wrap", !question.text && "text-muted-foreground opacity-50")}>
                    {question.text || 'Escribe tu pregunta aquí...'}
                  </h2>
                </div>
              )}
            </div>

            {/* Answer Field */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Type className="h-4 w-4" />
                Campo de respuesta
              </h3>
              <div className="p-6 rounded-lg border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center min-h-[120px]">
                <Input disabled placeholder="Espacio para la respuesta del estudiante" className="max-w-md cursor-not-allowed bg-background/50" />
                <p className="text-sm text-muted-foreground mt-2">
                  {question.type === 'SHORT_ANSWER' 
                    ? 'Respuesta corta (una línea)' 
                    : 'Respuesta extensa (párrafo)'}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground">Explicación (Opcional)</h3>
              <Textarea
                value={question.explanation || ''}
                onChange={(e) => onQuestionChange({ explanation: e.target.value })}
                placeholder="Explica la respuesta correcta para el feedback..."
                rows={2}
                className="bg-muted/30"
              />
            </div>
          </div>
        );

      case 'MATCHING':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Question Text */}
            <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden"
                  autoFocus
                  rows={2}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className={cn("text-2xl font-bold min-h-[60px] break-words whitespace-pre-wrap", !question.text && "text-muted-foreground opacity-50")}>
                    {question.text || 'Escribe tu pregunta de emparejamiento...'}
                  </h2>
                </div>
              )}
            </div>

            {/* Matching Pairs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Pares
                </h3>
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
                  <div key={option.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg border bg-card/50">
                     <div className="flex-1 w-full">
                       <Label className="text-xs mb-1.5 block text-muted-foreground">Concepto A</Label>
                       <Input
                        value={option.left || ''}
                        onChange={(e) => onOptionChange(option.id, { left: e.target.value })}
                        placeholder="Elemento izquierdo"
                      />
                    </div>
                    <div className="text-muted-foreground shrink-0 mt-4">
                      <ArrowUpDown className="h-5 w-5 sm:rotate-90" />
                    </div>
                    <div className="flex-1 w-full">
                      <Label className="text-xs mb-1.5 block text-muted-foreground">Concepto B</Label>
                      <Input
                        value={option.right || ''}
                        onChange={(e) => onOptionChange(option.id, { right: e.target.value })}
                        placeholder="Elemento derecho"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-destructive sm:mt-6"
                      onClick={() => onDeleteOption(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ORDERING':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* Question Text */}
             <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden"
                  autoFocus
                  rows={2}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className={cn("text-2xl font-bold min-h-[60px] break-words whitespace-pre-wrap", !question.text && "text-muted-foreground opacity-50")}>
                    {question.text || 'Escribe la instrucción de ordenamiento...'}
                  </h2>
                </div>
              )}
            </div>

            {/* Ordering Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Secuencia Correcta
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddOption}
                  className="gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Añadir paso
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
          </div>
        );

      default: // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Question Text */}
            <div className="relative group">
              {isEditingText ? (
                <textarea
                  ref={textAreaRef}
                  value={question.text || ''}
                  onChange={(e) => onQuestionChange({ text: e.target.value })}
                  onBlur={handleTextBlur}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden"
                  autoFocus
                  rows={2}
                />
              ) : (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="cursor-text hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                >
                  <h2 className={cn("text-2xl font-bold min-h-[60px] break-words whitespace-pre-wrap", !question.text && "text-muted-foreground opacity-50")}>
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
              <div className="relative rounded-xl overflow-hidden border border-border group/image">
                <div className="w-full h-64 bg-muted relative">
                  <Image
                    src={question.imageUrl}
                    alt="Question image"
                    fill
                    className="object-contain"
                    unoptimized={question.imageUrl.startsWith('blob:')}
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 shadow-sm"
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
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {question.type === 'MULTIPLE_CHOICE' ? 'Selección Múltiple' : 
                   question.type === 'TRUE_FALSE' ? 'Opciones' : 
                   'Respuestas'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddDefaultOptions}
                  className="gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  {question.type === 'TRUE_FALSE' ? 'Restablecer' : 'Añadir'}
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
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground">Explicación (Feedback)</h3>
              <Textarea
                value={question.explanation || ''}
                onChange={(e) => onQuestionChange({ explanation: e.target.value })}
                placeholder="Texto que verá el alumno tras responder..."
                rows={2}
                className="resize-none bg-muted/30"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/5">
      {/* Viewport Selector */}
      <div className="shrink-0 p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            {VIEWPORT_SIZES.map((vp) => (
              <TooltipProvider key={vp.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewport.id === vp.id ? "secondary" : "ghost"}
                      size="icon"
                      className={cn("h-8 w-8 rounded-md transition-all", viewport.id === vp.id && "bg-white shadow-sm")}
                      onClick={() => setViewport(vp)}
                    >
                      <vp.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{vp.label} ({vp.width}x{vp.height})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-3">
            <span className="font-semibold text-primary">{question.basePoints || 10} pts</span>
            <span className="h-4 w-px bg-border" />
            <span className="capitalize">{getDifficultyLabel(question.difficulty)}</span>
          </div>
        </div>
      </div>

      {/* Canvas Area with Responsive Scaling */}
      <div className="flex-1 overflow-hidden relative w-full h-full flex items-center justify-center bg-dot-pattern">
        <div className="absolute inset-0 bg-muted/10 pointer-events-none" />
        
        {/* Helper text */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-50 z-0">
          Vista previa del dispositivo: {viewport.label}
        </div>

        <div 
          className="relative transition-all duration-300 ease-in-out shadow-2xl rounded-[2rem] overflow-hidden bg-background border-[8px] border-zinc-800"
          style={{
            width: `${viewport.width}px`,
            height: `${viewport.height}px`,
            transform: `scale(${viewport.scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Status Bar Mockup */}
          <div className="h-6 bg-zinc-800 w-full flex items-center justify-between px-6">
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
          </div>

          <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin">
            <div className="p-8 pb-20">
               {/* Key added to force re-render on type change */}
              <div key={question.type}>
                {renderQuestionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
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

  const handleQuestionTypeChange = (value: string) => {
    const newType = value as QuestionType;
    
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
      case 'MULTIPLE_CHOICE':
        newOptions = [
          { id: generateId(), text: 'Opción 1', isCorrect: true, points: 10 },
          { id: generateId(), text: 'Opción 2', isCorrect: false, points: 0 },
        ];
        break;
      case 'MATCHING':
        newOptions = [
          { id: generateId(), left: 'Concepto A', right: 'Definición A', isCorrect: true, points: 10 },
          { id: generateId(), left: 'Concepto B', right: 'Definición B', isCorrect: true, points: 10 },
        ];
        break;
      case 'ORDERING':
        newOptions = [
          { id: generateId(), text: 'Paso 1', isCorrect: false, points: 0 },
          { id: generateId(), text: 'Paso 2', isCorrect: false, points: 0 },
        ];
        break;
      default:
        newOptions = [];
    }

    onQuestionUpdate({ 
      type: newType,
      options: newOptions 
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'question' | 'quiz') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, sube solo archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

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
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Configuración</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="question-type" className="mb-2 block">Tipo de pregunta</Label>
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
              <Label htmlFor="question-difficulty" className="mb-2 block">Dificultad</Label>
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
              <div className="flex items-center justify-between mb-2">
                 <Label htmlFor="question-points">Puntos</Label>
                 <span className="text-xs font-mono text-muted-foreground">{question.basePoints || 10} pts</span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  id="question-points"
                  value={[question.basePoints || 10]}
                  onValueChange={([value]) => onQuestionUpdate({ basePoints: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Time Settings */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tiempo</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="time-limit">Límite de tiempo</Label>
              <Switch
                id="time-limit"
                checked={!!question.timeLimit}
                onCheckedChange={(checked) => 
                  onQuestionUpdate({ timeLimit: checked ? 30 : undefined })
                }
              />
            </div>

            {question.timeLimit && (
              <div className="animate-in slide-in-from-top-2 fade-in">
                <div className="flex justify-between mb-2">
                   <Label htmlFor="time-seconds" className="text-xs">Duración</Label>
                   <span className="text-xs font-mono">{question.timeLimit}s</span>
                </div>
                <Slider
                  id="time-seconds"
                  value={[question.timeLimit]}
                  onValueChange={([value]) => onQuestionUpdate({ timeLimit: value })}
                  min={5}
                  max={300}
                  step={5}
                  className="flex-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Media Settings */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Multimedia</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="question-image">Imagen de apoyo</Label>
              <div className="mt-2">
                <label
                  htmlFor="question-image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
                >
                  <input
                    id="question-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'question')}
                  />
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-sm font-medium mt-2">Subir imagen</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 5MB (JPG, PNG)
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
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">General</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="quiz-title" className="mb-1.5 block">Título</Label>
              <Input
                id="quiz-title"
                value={quiz.title}
                onChange={(e) => onQuizUpdate({ title: e.target.value })}
                placeholder="Nombre del quiz"
              />
            </div>

            <div>
              <Label htmlFor="quiz-description" className="mb-1.5 block">Descripción</Label>
              <Textarea
                id="quiz-description"
                value={quiz.description || ''}
                onChange={(e) => onQuizUpdate({ description: e.target.value })}
                placeholder="¿De qué trata este quiz?"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <Label htmlFor="quiz-published">Estado Público</Label>
              <div className="flex items-center gap-2">
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
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Diseño</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="quiz-theme">Tema de color</Label>
              <div className="flex gap-3 mt-2">
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
                            "w-6 h-6 rounded-full ring-2 ring-offset-2 transition-all",
                            quiz.theme === theme.color 
                              ? "ring-primary scale-110" 
                              : "ring-transparent hover:scale-105"
                          )}
                          style={{ 
                            backgroundColor: `var(--${theme.color}-500, ${theme.color})` 
                          }}
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
              <Label htmlFor="quiz-cover">Portada</Label>
              <div className="mt-2">
                <label
                  htmlFor="quiz-cover-upload"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    id="quiz-cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'quiz')}
                  />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-xs">Cambiar portada</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Header */}
      <div className="shrink-0 p-4 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Propiedades</h2>
          <Badge variant="secondary" className="ml-auto text-xs font-normal">
            {selectedElement === 'question' && 'Pregunta'}
            {selectedElement === 'option' && 'Opción'}
            {selectedElement === 'quiz' && 'Quiz Global'}
          </Badge>
        </div>
      </div>

      {/* Panel Content */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          {selectedElement === 'question' && renderQuestionProperties()}
          {selectedElement === 'quiz' && renderQuizProperties()}
          {selectedElement === 'option' && option && (
            <div className="space-y-6">
               <div className="space-y-4">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Opción</h3>
                <div>
                  <Label htmlFor="option-text" className="mb-2 block">Texto</Label>
                  <Textarea
                    id="option-text"
                    value={option.text}
                    onChange={(e) => onOptionUpdate({ text: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="option-correct">Es correcta</Label>
                  <Switch
                    id="option-correct"
                    checked={option.isCorrect}
                    onCheckedChange={(checked) => onOptionUpdate({ isCorrect: checked })}
                  />
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
      text: '',
      order: localQuiz.questions.length,
      type: 'SINGLE_CHOICE',
      difficulty: 'medium',
      basePoints: 10,
      options: [
        { id: generateId(), text: 'Opción 1', isCorrect: true, points: 10 },
        { id: generateId(), text: 'Opción 2', isCorrect: false, points: 0 },
      ],
    };
    
    setLocalQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setActiveQuestionIndex(localQuiz.questions.length);
    setSelectedElement('question');
  };

  const handleDeleteQuestion = (index: number) => {
    if (localQuiz.questions.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "El quiz debe tener al menos una pregunta.",
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
    
    if (question.type === 'SINGLE_CHOICE') {
      question.options = question.options?.map(opt => ({
        ...opt,
        isCorrect: opt.id === optionId
      })) || [];
    } else if (question.type === 'MULTIPLE_CHOICE') {
      question.options = question.options?.map(opt => 
        opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      ) || [];
    } else {
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
          title: "Falta el título",
          description: "Por favor añade un título al quiz.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      // Basic question validation
      const emptyQuestions = localQuiz.questions.filter(q => !q.text || q.text.trim() === '');
      if (emptyQuestions.length > 0) {
        toast({
            title: "Preguntas incompletas",
            description: `Hay ${emptyQuestions.length} pregunta(s) sin texto.`,
            variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      await onSave(localQuiz);
      
      toast({
        title: "✅ Guardado",
        description: "El quiz se ha actualizado correctamente.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] w-screen h-screen p-0 overflow-hidden rounded-none border-none">
        <div className="h-full flex flex-col bg-background">
          {/* Top Bar */}
          <div className="shrink-0 h-16 border-b border-border bg-background px-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="flex flex-col">
                <input
                  value={localQuiz.title}
                  onChange={(e) => handleQuizUpdate({ title: e.target.value })}
                  className="font-bold text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground focus:ring-0 p-0"
                  placeholder="Título del Quiz"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                   <Badge variant={localQuiz.published ? "default" : "secondary"} className="h-5 px-1.5 font-normal text-[10px]">
                      {localQuiz.published ? "Publicado" : "Borrador"}
                   </Badge>
                   <span>•</span>
                   <span>{localQuiz.questions.length} preguntas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedElement('quiz')}
                className={cn("gap-2 hidden sm:flex", selectedElement === 'quiz' && "bg-muted")}
              >
                <Settings2 className="h-4 w-4" />
                Configuración
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 min-w-[120px]"
              >
                {isSaving ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </div>
          
          {/* Main Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Questions List */}
            <div className="w-80 border-r border-border flex flex-col bg-muted/10 shrink-0">
               <QuestionList
                  questions={localQuiz.questions}
                  activeIndex={activeQuestionIndex}
                  onSelect={(idx) => {
                    setActiveQuestionIndex(idx);
                    setSelectedElement('question');
                    setSelectedOptionId(null);
                  }}
                  onDelete={handleDeleteQuestion}
                  onAdd={handleAddQuestion}
                  onReorder={handleReorderQuestions}
                  onDuplicate={handleDuplicateQuestion}
                />
            </div>
            
            {/* Center: Canvas */}
            <div className="flex-1 bg-muted/20 relative flex flex-col min-w-0">
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
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <BrainCircuit className="h-12 w-12 mb-4 opacity-20" />
                    <p>Selecciona una pregunta para editarla</p>
                  </div>
                )}
            </div>
            
            {/* Right: Properties */}
            <div className="w-80 border-l border-border bg-background shrink-0">
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
      </DialogContent>
    </Dialog>
  );
}
