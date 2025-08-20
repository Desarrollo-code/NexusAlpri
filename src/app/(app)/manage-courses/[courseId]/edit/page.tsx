// En /home/user/studio/src/app/(app)/manage-courses/[courseId]/edit/page.tsx

'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, PlusCircle, Trash2, UploadCloud, GripVertical, Loader2, AlertTriangle, ShieldAlert, ImagePlus, XCircle, Zap, CircleOff, Paperclip, ChevronRight, Calendar as CalendarIcon, Replace, Pencil, Eye, MoreVertical, Archive, Crop, Copy, FilePlus2, ChevronDown, BookOpenText, Video, FileText, Lightbulb, File as FileGenericIcon, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, ChangeEvent, useCallback, useMemo } from 'react';
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, LessonType as AppLessonType, CourseStatus, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption, ContentBlock } from '@/types';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import type { Course as PrismaCourse, Module as PrismaModule, Lesson as PrismaLesson, Question as PrismaQuestion, AnswerOption as PrismaAnswerOption, LessonTemplate, TemplateBlock } from '@prisma/client';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from '@hello-pangea/dnd';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm, useFieldArray, Controller, FormProvider, useFormContext, useWatch } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QuizViewer } from '@/components/quiz-viewer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageCropper } from '@/components/image-cropper';
import { useTitle } from '@/contexts/title-context';
import { QuizAnalyticsView } from '@/components/analytics/quiz-analytics-view';


// === TIPOS E INTERFACES ===
interface ApiTemplate extends LessonTemplate {
  templateBlocks: TemplateBlock[];
  creator: { name: string | null } | null;
}

interface QuizViewerProps {
    quizData: AppQuiz | undefined | null;
    onClose: () => void;
}

interface LocalInstructor {
    id: string;
    name: string;
}

interface PrismaQuizWithQuestions extends AppQuiz {
    questions: (PrismaQuestion & {
        options: PrismaAnswerOption[];
    })[];
}

interface EditableContentBlock extends Omit<ContentBlock, 'quiz' | 'order'> {
  quiz?: AppQuiz | null;
  _toBeDeleted?: boolean;
  order: number | null;
}
interface EditableLesson extends Omit<AppLesson, 'contentBlocks' | 'order'> {
    contentBlocks: EditableContentBlock[];
    _toBeDeleted?: boolean;
    order: number | null;
    templateId?: string; // For applying templates
}
interface EditableModule extends Omit<AppModule, 'lessons' | 'order' | 'description'> {
    lessons: EditableLesson[];
    _toBeDeleted?: boolean;
    order: number | null;
    description: string;
}
interface EditableCourse extends Omit<AppCourse, 'modules' | 'instructor' | 'status' | 'publicationDate' | 'category' | 'instructorId' | 'imageUrl' | 'price'> {
    instructorId?: string | null;
    instructorName?: string | null;
    modules: EditableModule[];
    status: CourseStatus;
    publicationDate?: Date | null;
    category?: string | null;
    imageUrl?: string | null;
}

type ItemToDeleteDetails = {
    type: 'module' | 'lesson' | 'block';
    id: string;
    name: string;
    moduleIndex: number;
    lessonIndex: number;
    blockIndex?: number;
} | null;

const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

type FormModulesPath = `modules.${number}`;
type FormLessonsPath = `${FormModulesPath}.lessons.${number}`;
type FormBlocksPath = `${FormLessonsPath}.contentBlocks.${number}`;
type FormQuizPath = `${FormBlocksPath}.quiz`;
type FormQuestionsPath = `${FormQuizPath}.questions.${number}`;
type FormOptionsPath = `${FormQuestionsPath}.options.${number}`;

// === COMPONENTES AUXILIARES ===

function OptionsEditor({ moduleIndex, lessonIndex, blockIndex, questionIndex }: { moduleIndex: number; lessonIndex: number; blockIndex: number; questionIndex: number }) {
    const { control, register, watch, setValue, getValues } = useFormContext<EditableCourse>();

    const optionsPath = `modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.quiz.questions.${questionIndex}.options` as const;
    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: optionsPath,
        keyName: 'dndId'
    });

    const watchedOptions = watch(optionsPath);
    const correctOptionId = useMemo(() => watchedOptions?.find(opt => opt.isCorrect)?.id, [watchedOptions]);

    const handleCorrectOptionChange = (selectedOptionId: string) => {
        const currentOptions = getValues(optionsPath) || [];
        const newOptions = currentOptions.map(opt => ({
            ...opt,
            isCorrect: opt.id === selectedOptionId
        }));
        setValue(optionsPath, newOptions, { shouldDirty: true });
    };

    return (
        <div className="pl-4 mt-4 space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground">Opciones de Respuesta (selecciona la correcta)</Label>
            <RadioGroup
                value={correctOptionId}
                onValueChange={handleCorrectOptionChange}
                className="space-y-2"
            >
                {optionFields.map((option, oIndex) => (
                    <div key={option.dndId} className="flex items-start gap-2 p-3 border rounded-md bg-background">
                        <div className="pt-2">
                            <RadioGroupItem value={option.id} id={`is-correct-${option.dndId}`} />
                        </div>
                        <div className="flex-grow space-y-2">
                            <Input
                                {...register(`${optionsPath}.${oIndex}.text` as const)}
                                placeholder={`Texto de la opción ${oIndex + 1}`}
                                className="h-9"
                            />
                            <Textarea
                                {...register(`${optionsPath}.${oIndex}.feedback` as const)}
                                placeholder="Retroalimentación para esta opción (ej: ¡Correcto! Esta es la respuesta porque...)"
                                className="text-xs min-h-[60px]"
                            />
                        </div>
                        <Button variant="ghost" size="icon" type="button" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeOption(oIndex)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </RadioGroup>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendOption({ id: `temp-o-${Date.now()}`, text: '', feedback: '', isCorrect: optionFields.length === 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Opción
            </Button>
            <p className="text-xs text-muted-foreground">La primera opción que añadas será marcada como correcta por defecto. Puedes cambiarla en cualquier momento.</p>
        </div>
    );
}
OptionsEditor.displayName = 'OptionsEditor';

function QuizEditorDialog({ moduleIndex, lessonIndex, blockIndex, onClose, setPreviewQuizDetails, setAnalyticsQuizId }: {
    moduleIndex: number;
    lessonIndex: number;
    blockIndex: number;
    onClose: () => void;
    setPreviewQuizDetails: (details: { moduleIndex: number; lessonIndex: number, blockIndex: number } | null) => void;
    setAnalyticsQuizId: (quizId: string | null) => void;
}) {
    const { control, register, watch, setValue, getValues } = useFormContext<EditableCourse>();
    const { toast } = useToast();

    const lessonTitle = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.title` as `${FormLessonsPath}.title`);
    const quizPath = `modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.quiz`;

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion, move: moveQuestion } = useFieldArray({
        control,
        name: `${quizPath}.questions` as `${FormQuizPath}.questions`,
        keyName: 'dndId'
    });

    const onQuestionDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        moveQuestion(result.source.index, result.destination.index);
    }

    const currentQuizData = watch(`${quizPath}` as `${FormQuizPath}`);


    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col">
                <DialogHeader className="p-6">
                    <DialogTitle>Editor de Quiz: {lessonTitle}</DialogTitle>
                    <DialogDescription>Añade, edita y reordena las preguntas. Los cambios se guardan al presionar "Guardar Cambios" en la página principal.</DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-4 px-6">
                    <div>
                        <Label htmlFor="quiz-title">Título del Quiz</Label>
                        <Input id="quiz-title" {...register(`${quizPath}.title` as `${FormQuizPath}.title`)} placeholder="Título general del quiz" />
                    </div>
                    <div>
                        <Label htmlFor="quiz-desc">Descripción del Quiz</Label>
                        <Textarea id="quiz-desc" {...register(`${quizPath}.description` as `${FormQuizPath}.description`)} placeholder="Instrucciones o descripción breve" />
                    </div>
                </div>
                <Separator className="my-4" />
                <div className="flex-grow overflow-hidden px-2">
                    <ScrollArea className="h-full px-4">
                        <DragDropContext onDragEnd={onQuestionDragEnd}>
                            <Droppable droppableId="quiz-questions">
                                {(provided: DroppableProvided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                        {questionFields.map((question, qIndex) => (
                                            <Draggable key={question.dndId} draggableId={question.dndId} index={qIndex}>
                                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                    >
                                                        <Card className="bg-muted/30">
                                                            <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
                                                                <div className="flex items-center gap-2">
                                                                    <div {...provided.dragHandleProps} className="cursor-grab p-1"><GripVertical className="h-5 w-5 text-muted-foreground" /></div>
                                                                    <h4 className="font-semibold">Pregunta {qIndex + 1}</h4>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeQuestion(qIndex)} type="button">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </CardHeader>
                                                            <CardContent className="p-4 pt-0">
                                                                <Label htmlFor={`question-text-${question.dndId}`}>Texto de la Pregunta</Label>
                                                                <Textarea id={`question-text-${question.dndId}`} {...register(`${quizPath}.questions.${qIndex}.text` as `${FormQuestionsPath}.text`)} placeholder="Escribe aquí el enunciado de la pregunta..." />
                                                                <OptionsEditor moduleIndex={moduleIndex} lessonIndex={lessonIndex} blockIndex={blockIndex} questionIndex={qIndex} />
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                        {questionFields.length === 0 && <p className="text-center text-muted-foreground py-8">No hay preguntas. ¡Añade la primera para empezar!</p>}
                    </ScrollArea>
                </div>
                <DialogFooter className="border-t pt-4 flex justify-between w-full">
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => appendQuestion({ id: `temp-q-${Date.now()}`, text: '', type: 'MULTIPLE_CHOICE', order: questionFields.length, options: [{ id: `temp-o-${Date.now()}`, text: '', feedback: '', isCorrect: true }] })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Pregunta
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setPreviewQuizDetails({ moduleIndex, lessonIndex, blockIndex })}
                            disabled={!currentQuizData?.questions || currentQuizData.questions.length === 0}
                        >
                            <Eye className="mr-2 h-4 w-4" /> Previsualizar
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setAnalyticsQuizId(currentQuizData?.id || null)}
                            disabled={!currentQuizData?.id}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" /> Analíticas
                        </Button>
                    </div>
                    <Button onClick={onClose} type="button">Cerrar Editor</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
QuizEditorDialog.displayName = 'QuizEditorDialog';

const getBlockTypeIcon = (type: AppLessonType) => {
    switch (type) {
        case 'TEXT': return <FileText className="h-4 w-4 text-blue-500" />;
        case 'VIDEO': return <Video className="h-4 w-4 text-red-500" />;
        case 'FILE': return <FileGenericIcon className="h-4 w-4 text-green-500" />;
        case 'QUIZ': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
        default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
};

const ContentBlockList = React.memo(({ moduleIndex, lessonIndex, setItemToDeleteDetails, isSaving, openQuizEditor, appendBlock }: {
    moduleIndex: number;
    lessonIndex: number;
    setItemToDeleteDetails: React.Dispatch<React.SetStateAction<ItemToDeleteDetails>>;
    isSaving: boolean;
    openQuizEditor: (moduleIndex: number, lessonIndex: number, blockIndex: number) => void;
    appendBlock: (moduleIndex: number, lessonIndex: number, newBlock: EditableContentBlock) => void;
}) => {
    const { control, getValues, watch } = useFormContext<EditableCourse>();
    const { fields, move } = useFieldArray({
        control,
        name: `modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks` as const,
        keyName: 'dndId'
    });

    const onBlockDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        move(result.source.index, result.destination.index);
    }
    
    return (
        <div className="space-y-4 pt-4 border-t mt-4">
            <DragDropContext onDragEnd={onBlockDragEnd}>
                <Droppable droppableId={`blocks-${moduleIndex}-${lessonIndex}`} type={`BLOCKS-${moduleIndex}-${lessonIndex}`}>
                    {(provided: DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {fields.map((blockItem, blockIndex) => {
                                const block = getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}` as const);
                                if (!block || block._toBeDeleted) return null;
                                return (
                                    <ContentBlockItem
                                        key={blockItem.dndId}
                                        moduleIndex={moduleIndex}
                                        lessonIndex={lessonIndex}
                                        blockIndex={blockIndex}
                                        dndId={blockItem.dndId}
                                        isSaving={isSaving}
                                        setItemToDeleteDetails={setItemToDeleteDetails}
                                        openQuizEditor={openQuizEditor}
                                    />
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendBlock(moduleIndex, lessonIndex, {
                    id: `new-block-${Date.now()}`,
                    type: 'TEXT',
                    content: '',
                    order: (fields || []).length,
                })}
                disabled={isSaving}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Bloque
            </Button>
        </div>
    );
});
ContentBlockList.displayName = 'ContentBlockList';

const ContentBlockItem = React.memo(({ moduleIndex, lessonIndex, blockIndex, dndId, isSaving, setItemToDeleteDetails, openQuizEditor }: {
    moduleIndex: number;
    lessonIndex: number;
    blockIndex: number;
    dndId: string;
    isSaving: boolean;
    setItemToDeleteDetails: React.Dispatch<React.SetStateAction<ItemToDeleteDetails>>;
    openQuizEditor: (moduleIndex: number, lessonIndex: number, blockIndex: number) => void;
}) => {
    const { control, getValues, register, watch } = useFormContext<EditableCourse>();
    const block = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}` as const);

    return (
        <Draggable key={dndId} draggableId={dndId} index={blockIndex}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`p-3 rounded-md border flex gap-3 items-start ${snapshot.isDragging ? 'shadow-md bg-muted' : 'bg-muted/30'}`}
                >
                    <div {...provided.dragHandleProps} className="cursor-grab pt-1.5"><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
                    <div className="flex-grow space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 font-medium text-sm">
                                {getBlockTypeIcon(block?.type)}
                                {block?.type === 'TEXT' ? "Texto / Enlace" : block?.type === 'VIDEO' ? "Video" : block?.type === 'FILE' ? "Archivo" : "Quiz"}
                            </div>
                            <div className="flex items-center gap-1">
                                <Controller
                                    control={control}
                                    name={`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.type` as const}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TEXT">Texto</SelectItem>
                                                <SelectItem value="VIDEO">Video</SelectItem>
                                                <SelectItem value="FILE">Archivo</SelectItem>
                                                <SelectItem value="QUIZ">Quiz</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Button variant="ghost" size="icon" type="button" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                    const blockValues = getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}`);
                                    if (blockValues) {
                                        setItemToDeleteDetails({ type: 'block', id: blockValues.id, name: `bloque de tipo ${blockValues.type}`, moduleIndex, lessonIndex, blockIndex });
                                    }
                                }} disabled={isSaving}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                        </div>
                        <BlockSpecificInput moduleIndex={moduleIndex} lessonIndex={lessonIndex} blockIndex={blockIndex} openQuizEditor={() => openQuizEditor(moduleIndex, lessonIndex, blockIndex)} />
                    </div>
                </div>
            )}
        </Draggable>
    );
});
ContentBlockItem.displayName = 'ContentBlockItem';

const BlockSpecificInput = React.memo(({ moduleIndex, lessonIndex, blockIndex, openQuizEditor }: { moduleIndex: number, lessonIndex: number, blockIndex: number, openQuizEditor: () => void; }) => {
    const { control, setValue, watch, register, getValues } = useFormContext<EditableCourse>();
    const { toast } = useToast();

    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const blockType = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.type` as const);
    const blockContent = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.content`) as string | undefined;

    const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            setProgress(0);
            setError(null);
            const formData = new FormData();
            formData.append('file', file);
            try {
                const result: { url: string } = await uploadWithProgress('/api/upload/lesson-file', formData, setProgress);
                setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.content`, result.url, { shouldValidate: true, shouldDirty: true });
                toast({ title: "Archivo Subido", description: `${file.name} se ha subido correctamente.` });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "No se pudo subir el archivo.";
                setError(errorMessage);
                toast({ title: "Error de Subida", description: errorMessage, variant: "destructive" });
            } finally {
                setIsUploading(false);
            }
        }
        if (e.target) e.target.value = '';
    };

    const removeFile = () => {
        setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.content`, '', { shouldDirty: true });
        setError(null);
    };

    const isSaving = false;

    switch (blockType) {
        case 'VIDEO': return (<><div className="mt-2 space-y-1"><Input {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.content` as const)} placeholder="https://youtube.com/watch?v=..." className="h-8 text-xs" disabled={isSaving || isUploading} /></div></>);
        case 'TEXT': return (<><div className="mt-2 space-y-1"><Textarea {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.content` as const)} placeholder="Escribe aquí el contenido o pega un enlace https://..." className="min-h-[80px] text-xs" disabled={isSaving || isUploading} /></div></>);
        case 'QUIZ': {
            return (<div className="mt-2 space-y-2">
                <Button type="button" variant="secondary" className="w-full" onClick={openQuizEditor}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Configurar Quiz
                </Button>
                <Input {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}.content`)} type="hidden" value="" />
            </div>);
        }
        case 'FILE': {
            const hasExistingFile = typeof blockContent === 'string' && !!blockContent;
            return (<>
                <div className="mt-2 space-y-2">
                    {isUploading ? (
                        <div className="space-y-1">
                            <Progress value={progress} className="w-full h-1.5" />
                            <p className="text-xs text-muted-foreground text-center">Subiendo... {progress}%</p>
                        </div>
                    ) : error ? (
                        <div className="p-2 border rounded-md bg-destructive/10 border-destructive/20 text-xs text-destructive">
                            <p>Error: {error}</p>
                            <Button variant="link" size="sm" type="button" className="p-0 h-auto text-xs" onClick={removeFile}>Intentar de nuevo</Button>
                        </div>
                    ) : hasExistingFile ? (
                        <div className="p-2 border rounded-md bg-muted/50 text-xs space-y-2">
                            <p className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> Archivo actual: <a href={blockContent} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{blockContent.split('/').pop()}</a></p>
                            <Button variant="outline" size="sm" className="h-7 text-xs w-full" type="button" onClick={removeFile} disabled={isSaving}><Replace className="mr-1 h-3 w-3" />Reemplazar archivo</Button>
                        </div>
                    ) : (
                        <Input
                            type="file"
                            onChange={handleFileSelected}
                            className="h-8 text-xs file:text-xs"
                            disabled={isSaving || isUploading}
                        />
                    )}
                </div>
            </>);
        }
        default: return null;
    }
});
BlockSpecificInput.displayName = 'BlockSpecificInput';

const LessonList = ({ moduleIndex }: { moduleIndex: number }) => {
    const { control, getValues, setValue } = useFormContext<EditableCourse>();
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: `modules.${moduleIndex}.lessons`,
        keyName: 'dndId'
    });
    const isSaving = useWatch({ control, name: 'status' }) === 'PUBLISHED'; // Example condition, adapt as needed

    const appendBlock = (mIndex: number, lIndex: number, newBlock: EditableContentBlock) => {
        const currentBlocks = getValues(`modules.${mIndex}.lessons.${lIndex}.contentBlocks`) || [];
        setValue(`modules.${mIndex}.lessons.${lIndex}.contentBlocks`, [...currentBlocks, newBlock], { shouldDirty: true });
    };

    const setItemToDeleteDetails = useState<ItemToDeleteDetails>(null)[1];

    const onLessonDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        move(result.source.index, result.destination.index);
    }
    
    return (
      <DragDropContext onDragEnd={onLessonDragEnd}>
        <Droppable droppableId={`lessons-of-module-${moduleIndex}`} type={`LESSONS-${moduleIndex}`}>
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {fields.map((lessonItem, lessonIndex) => {
                         const lesson = getValues(`modules.${moduleIndex}.lessons.${lessonIndex}`);
                         if (lesson._toBeDeleted) return null;
                        return (
                            <LessonItem
                                key={lessonItem.dndId}
                                dndId={lessonItem.dndId}
                                moduleIndex={moduleIndex}
                                lessonIndex={lessonIndex}
                                isSaving={isSaving}
                                setItemToDeleteDetails={setItemToDeleteDetails}
                                appendBlock={appendBlock}
                            />
                        )
                    })}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
      </DragDropContext>
    );
};


const LessonItem = React.memo(({ moduleIndex, lessonIndex, dndId, isSaving, setItemToDeleteDetails, appendBlock }: {
    moduleIndex: number;
    lessonIndex: number;
    dndId: string;
    isSaving: boolean;
    setItemToDeleteDetails: React.Dispatch<React.SetStateAction<ItemToDeleteDetails>>;
    appendBlock: (moduleIndex: number, lessonIndex: number, newBlock: EditableContentBlock) => void;
}) => {
    const { getValues, register, watch, setValue } = useFormContext<EditableCourse>();
    const [quizEditorDetails, setQuizEditorDetails] = useState<{ moduleIndex: number; lessonIndex: number, blockIndex: number } | null>(null);
    const [previewQuizDetails, setPreviewQuizDetails] = useState<{ moduleIndex: number; lessonIndex: number, blockIndex: number } | null>(null);
    const [analyticsQuizId, setAnalyticsQuizId] = useState<string | null>(null);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    const openQuizEditor = useCallback((mIndex: number, lIndex: number, bIndex: number) => setQuizEditorDetails({ moduleIndex: mIndex, lessonIndex: lIndex, blockIndex: bIndex }), []);

    const course = watch();
    const isCreatorPreview = user?.role === 'ADMINISTRATOR' || user?.id === course.instructorId;

    const handleSaveAsTemplate = async () => {
        if (!templateName.trim()) {
            toast({ title: "Error", description: "El nombre de la plantilla es obligatorio.", variant: "destructive" });
            return;
        }
        setIsSavingTemplate(true);
        const lessonToSave = getValues(`modules.${moduleIndex}.lessons.${lessonIndex}`);
        try {
            const payload = {
                name: templateName,
                description: templateDescription,
                lessonId: lessonToSave.id
            };
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error((await response.json()).message);
            toast({ title: "Plantilla Guardada", description: "La lección ha sido guardada como una nueva plantilla." });
            setShowSaveTemplateModal(false);
        } catch (error) {
            toast({ title: "Error al guardar plantilla", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsSavingTemplate(false);
        }
    };

    return (
        <Draggable key={dndId} draggableId={dndId} index={lessonIndex}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                 <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`p-3 rounded-md border bg-card text-card-foreground shadow-sm ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                 >
                    <div className="flex w-full items-start gap-3">
                        <div {...provided.dragHandleProps} className="cursor-grab pt-1"><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="flex-grow space-y-2">
                             <div className="flex-grow mr-2 w-full">
                                <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-between w-full text-left">
                                  <div className="flex items-center gap-2">
                                     <BookOpenText className="h-4 w-4 text-primary" />
                                     <Input {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.title` as const)} className="text-sm font-medium h-9 w-full border-none p-0 focus-visible:ring-0" placeholder="Título de la lección" disabled={isSaving} onClick={(e) => e.stopPropagation()} />
                                  </div>
                                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                                </button>
                            </div>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => { setTemplateName(getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.title`)); setShowSaveTemplateModal(true); }}>
                                    <Copy className="mr-2 h-4 w-4" /> Guardar como Plantilla
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSaving) return;
                                        const lessonValues = getValues(`modules.${moduleIndex}.lessons.${lessonIndex}`);
                                        if (lessonValues) {
                                            setItemToDeleteDetails({ type: 'lesson', id: lessonValues.id, name: lessonValues.title, moduleIndex, lessonIndex });
                                        }
                                    }}
                                    disabled={isSaving}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Lección
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {isExpanded && (
                         <ContentBlockList
                            moduleIndex={moduleIndex}
                            lessonIndex={lessonIndex}
                            setItemToDeleteDetails={setItemToDeleteDetails}
                            isSaving={isSaving}
                            openQuizEditor={openQuizEditor}
                            appendBlock={appendBlock}
                        />
                    )}
                    {quizEditorDetails?.lessonIndex === lessonIndex && (
                        <QuizEditorDialog
                            {...quizEditorDetails}
                            onClose={() => setQuizEditorDetails(null)}
                            setPreviewQuizDetails={setPreviewQuizDetails}
                            setAnalyticsQuizId={setAnalyticsQuizId}
                        />
                    )}
                    {previewQuizDetails?.lessonIndex === lessonIndex && (
                        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && setPreviewQuizDetails(null)}>
                          <DialogContent className="max-w-3xl">
                             <DialogHeader>
                                <DialogTitle>Vista Previa del Quiz</DialogTitle>
                                <DialogDescription>
                                    Así es como los estudiantes verán este quiz.
                                </DialogDescription>
                             </DialogHeader>
                            <QuizViewer
                                quiz={watch(`modules.${previewQuizDetails.moduleIndex}.lessons.${previewQuizDetails.lessonIndex}.contentBlocks.${previewQuizDetails.blockIndex}.quiz`)}
                                lessonId={watch(`modules.${previewQuizDetails.moduleIndex}.lessons.${previewQuizDetails.lessonIndex}.id`)}
                                isCreatorPreview={true}
                            />
                          </DialogContent>
                        </Dialog>
                    )}
                    {analyticsQuizId && (
                        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && setAnalyticsQuizId(null)}>
                            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>Analíticas del Quiz</DialogTitle>
                                    <DialogDescription>Rendimiento detallado de los estudiantes en este quiz.</DialogDescription>
                                </DialogHeader>
                                <div className="flex-grow overflow-hidden">
                                   <QuizAnalyticsView quizId={analyticsQuizId} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                     <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Guardar Lección como Plantilla</DialogTitle>
                                <DialogDescription>Guarda la estructura de esta lección para reutilizarla en el futuro.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                                    <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} required disabled={isSavingTemplate} />
                                </div>
                                <div>
                                    <Label htmlFor="template-description">Descripción (Opcional)</Label>
                                    <Textarea id="template-description" value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} disabled={isSavingTemplate} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)} disabled={isSavingTemplate}>Cancelar</Button>
                                <Button onClick={handleSaveAsTemplate} disabled={isSavingTemplate}>
                                    {isSavingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Plantilla
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                 </div>
            )}
        </Draggable>
    );
});
LessonItem.displayName = 'LessonItem';

const ModuleItem = ({ moduleIndex, provided }: { moduleIndex: number, provided: DraggableProvided }) => {
    const { control, getValues, register } = useFormContext<EditableCourse>();
    const { fields: lessonFields, append, remove, move } = useFieldArray({
        control,
        name: `modules.${moduleIndex}.lessons`
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState<ApiTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [itemToDeleteDetails, setItemToDeleteDetails] = useState<ItemToDeleteDetails | null>(null);
    const { toast } = useToast();
    
    const appendLesson = (lessonData: Partial<EditableLesson>) => {
        append({
            id: `new-lesson-${Date.now()}`,
            title: 'Nueva Lección',
            contentBlocks: [],
            order: lessonFields.length,
            ...lessonData,
        });
    };

    const appendBlock = (lessonIndex: number, newBlock: EditableContentBlock) => {
        const currentBlocks = getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks`) || [];
        setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks`, [...currentBlocks, newBlock], { shouldDirty: true });
    };

    const fetchTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const res = await fetch('/api/templates');
            if (!res.ok) throw new Error("Failed to fetch templates");
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsLoadingTemplates(false);
        }
    };
    
    const handleOpenTemplateModal = () => {
        fetchTemplates();
        setShowTemplateModal(true);
    };

    const handleSelectTemplate = (templateId: string) => {
        const selectedTemplate = templates.find(t => t.id === templateId);
        if (!selectedTemplate) return;

        appendLesson({
            title: selectedTemplate.name,
            templateId: selectedTemplate.id,
        });
        setShowTemplateModal(false);
        toast({ title: "Plantilla Aplicada", description: "Se ha creado una nueva lección con la estructura de la plantilla." });
    };


    const onLessonDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        move(result.source.index, result.destination.index);
    }
    
    const module = getValues(`modules.${moduleIndex}`);

    return (
        <div ref={provided.innerRef} {...provided.draggableProps}>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={module.id} className="rounded-md border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center p-4 font-semibold">
                        <div {...provided.dragHandleProps} className="cursor-grab p-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                            <div className="flex-grow">
                                <Input {...register(`modules.${moduleIndex}.title`)} placeholder="Título del Módulo" className="text-base font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0" disabled={isSaving} onClick={(e) => e.stopPropagation()} />
                            </div>
                        </AccordionTrigger>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={e => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                                <DropdownMenuItem onSelect={() => appendLesson({})}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Lección
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleOpenTemplateModal}>
                                    <FilePlus2 className="mr-2 h-4 w-4" /> Añadir desde Plantilla
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10"
                                    onSelect={() => setItemToDeleteDetails({ type: 'module', id: module.id, name: module.title, moduleIndex, lessonIndex: -1 })}
                                    disabled={isSaving}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Módulo
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <AccordionContent className="p-4 border-t bg-muted/20">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm">Lecciones:</h4>
                             <DragDropContext onDragEnd={onLessonDragEnd}>
                                <Droppable droppableId={`lessons-of-module-${moduleIndex}`} type={`LESSONS-${moduleIndex}`}>
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                            {(lessonFields || []).map((lessonItem, lessonIndex) => {
                                                const lesson = getValues(`modules.${moduleIndex}.lessons.${lessonIndex}`);
                                                if (lesson._toBeDeleted) return null;
                                                return (
                                                  <Draggable key={lessonItem.id} draggableId={lessonItem.id} index={lessonIndex}>
                                                    {(provided) => (
                                                      <div ref={provided.innerRef} {...provided.draggableProps}>
                                                          <LessonItem
                                                              key={lessonItem.id}
                                                              dndId={lessonItem.id}
                                                              moduleIndex={moduleIndex}
                                                              lessonIndex={lessonIndex}
                                                              isSaving={isSaving}
                                                              setItemToDeleteDetails={setItemToDeleteDetails}
                                                              appendBlock={appendBlock}
                                                          />
                                                      </div>
                                                    )}
                                                  </Draggable>
                                                )
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
             <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Plantilla de Lección</DialogTitle>
                        <DialogDescription>Elige una plantilla para crear una nueva lección con una estructura predefinida.</DialogDescription>
                    </DialogHeader>
                    {isLoadingTemplates ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <ScrollArea className="max-h-[60vh] mt-4">
                            <div className="space-y-2 pr-4">
                                {templates.length > 0 ? templates.map(template => (
                                    <button key={template.id} onClick={() => handleSelectTemplate(template.id)} className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors">
                                        <h4 className="font-semibold">{template.name}</h4>
                                        <p className="text-sm text-muted-foreground">{template.description || 'Sin descripción'}</p>
                                        <p className="text-xs text-muted-foreground mt-2">Creador: {template.creator?.name || 'Sistema'} | Bloques: {template.templateBlocks.length}</p>
                                    </button>
                                )) : <p className="text-center text-muted-foreground">No hay plantillas disponibles.</p>}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};


// === COMPONENTE PRINCIPAL DE LA PÁGINA (EditCoursePage) ===
export default function EditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, settings, isLoading: isAuthLoading } = useAuth();
    const { setPageTitle } = useTitle();

    const courseId = (params?.courseId as string) || '';
    const isNewCourse = courseId === 'new';

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDeleteDetails, setItemToDeleteDetails] = useState<ItemToDeleteDetails | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    
    // State for templates
    const [showTemplateModal, setShowTemplateModal] = useState<number | null>(null); // moduleIndex
    const [templates, setTemplates] = useState<ApiTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    // React Hook Form methods
    const methods = useForm<EditableCourse>({
        defaultValues: {
            title: '',
            description: '',
            imageUrl: null,
            status: 'DRAFT',
            category: '',
            publicationDate: null,
            modules: [],
            instructorId: user?.id || null,
            instructorName: user?.name || null,
        } as Partial<EditableCourse>,
        mode: 'onChange'
    });

    const { control, handleSubmit, reset, watch, formState: { errors, dirtyFields, isDirty }, setValue } = methods;

    const {
        fields: moduleFields,
        append: appendModule,
        remove: removeModule,
        move: moveModule
    } = useFieldArray({
        control,
        name: 'modules',
        keyName: 'dndId'
    });
    
    const watchedCourseStatus = watch('status');
    const watchedPublicationDate = watch('publicationDate');


    // === FUNCIONES DE CARGA Y GUARDADO ===

    const fetchCourseData = useCallback(async () => {
        if (isNewCourse) {
            setPageTitle('Crear Nuevo Curso');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    toast({
                        title: "Curso no encontrado",
                        description: "El curso que intentas editar no existe.",
                        variant: "destructive",
                    });
                    router.push('/manage-courses');
                    return;
                }
                throw new Error(`Error fetching course: ${res.statusText}`);
            }
            const data: AppCourse & { instructor?: LocalInstructor | null } = await res.json();
            
            setPageTitle(`Editando: ${data.title}`);

            // Transformar la fecha de string a Date si existe
            const transformedData: EditableCourse = {
                ...data,
                publicationDate: data.publicationDate ? new Date(data.publicationDate) : null,
                instructorId: data.instructorId || user?.id || null,
                instructorName: data.instructor?.name || user?.name || null,
                modules: data.modules.map(module => ({
                    ...module,
                    description: '',
                    lessons: module.lessons?.map(lesson => ({
                        ...lesson,
                        order: lesson.order !== undefined ? lesson.order : null,
                        contentBlocks: lesson.contentBlocks?.map(block => ({
                          ...block,
                          order: block.order !== undefined ? block.order : null,
                          quiz: block.quiz || null,
                        })) || [],
                    })) || [],
                    order: module.order !== undefined ? module.order : null
                })),
            };
            reset(transformedData);
        } catch (error) {
            console.error('Error cargando el curso:', error);
            toast({
                title: "Error de Carga",
                description: "No se pudo cargar la información del curso.",
                variant: "destructive",
            });
            router.push('/manage-courses');
        } finally {
            setIsLoading(false);
        }
    }, [courseId, isNewCourse, reset, router, toast, user, setPageTitle]);

    useEffect(() => {
        if (!isAuthLoading && user?.id) {
            fetchCourseData();
        }
    }, [isAuthLoading, user, fetchCourseData]);

    const fetchTemplates = useCallback(async () => {
        setIsLoadingTemplates(true);
        try {
            const res = await fetch('/api/templates');
            if (!res.ok) throw new Error("Failed to fetch templates");
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsLoadingTemplates(false);
        }
    }, [toast]);
    
    const handleOpenTemplateModal = (moduleIndex: number) => {
        fetchTemplates();
        setShowTemplateModal(moduleIndex);
    };

    const onSubmit = useCallback(async (data: EditableCourse) => {
        setIsSaving(true);
        try {
            const payload = {
                ...data,
                modules: data.modules
                    .filter(mod => !mod._toBeDeleted)
                    .map((mod, moduleIndex) => ({
                        ...mod,
                        order: moduleIndex,
                        lessons: (mod.lessons || [])
                            .filter(lesson => !lesson._toBeDeleted)
                            .map((lesson, lessonIndex) => ({
                                ...lesson,
                                order: lessonIndex,
                                contentBlocks: (lesson.contentBlocks || [])
                                  .filter(block => !block._toBeDeleted)
                                  .map((block, blockIndex) => ({
                                      ...block,
                                      order: blockIndex,
                                      quiz: block.type === 'QUIZ' ? block.quiz : undefined,
                                  }))
                            }))
                    }))
            };
            
            if (isNewCourse) {
                // Handle new course creation
                const res = await fetch('/api/courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error((await res.json()).message || 'Error al crear el curso.');
                const newCourse = await res.json();
                
                toast({ title: "Curso Creado", description: "La información del curso se ha guardado correctamente." });
                router.push(`/manage-courses/${newCourse.id}/edit`);
            } else {
                // Handle course update
                const res = await fetch(`/api/courses/${courseId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error((await res.json()).message || 'Error al guardar el curso.');
                
                const result = await res.json();
                reset(result); // Reset form with data from backend to ensure sync
                toast({ title: "Curso Guardado", description: "La información del curso se ha actualizado correctamente." });
                 setPageTitle(`Editando: ${result.title}`);
            }

        } catch (error: any) {
            console.error('Error al guardar el curso:', error);
            toast({
                title: "Error al Guardar",
                description: error.message || "No se pudo guardar la información del curso.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }, [isNewCourse, courseId, router, toast, reset, setPageTitle]);


    const handleChangeCourseStatus = useCallback(async (newStatus: CourseStatus) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al cambiar el estado del curso.');
            }
            toast({ title: "Estado Actualizado", description: `El curso ahora está en estado: ${newStatus}` });
            reset({ ...methods.getValues(), status: newStatus });
        } catch (error: any) {
            console.error('Error al cambiar el estado del curso:', error);
            toast({
                title: "Error de Estado",
                description: error.message || "No se pudo cambiar el estado del curso.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }, [courseId, toast, reset, methods]);

    const handleDeleteCourse = useCallback(async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al eliminar el curso.');
            }
            toast({ title: "Curso Eliminado", description: "El curso ha sido eliminado permanentemente." });
            router.push('/manage-courses');
        } catch (error: any) {
            console.error('Error al eliminar el curso:', error);
            toast({
                title: "Error de Eliminación",
                description: error.message || "No se pudo eliminar el curso.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    }, [courseId, toast, router]);


    // === MANEJO DE IMAGEN PRINCIPAL ===

    const handleCourseImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setImageToCrop(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleCropComplete = (croppedFileUrl: string) => {
        methods.setValue('imageUrl', croppedFileUrl, { shouldDirty: true });
        setImageToCrop(null);
    };

    const removeCourseImage = () => {
        methods.setValue('imageUrl', null, { shouldDirty: true });
        toast({ title: "Imagen Eliminada", description: "La imagen del curso ha sido eliminada." });
    };


    // === MANEJO DE DRAG & DROP ===

    const handleDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        if (type === 'MODULE') {
            moveModule(source.index, destination.index);
        } else if (type.startsWith('LESSONS-')) {
            const moduleIndex = parseInt(source.droppableId.replace('lessons-', ''));
            const currentLessons = methods.getValues(`modules.${moduleIndex}.lessons`);
            const reorderedLessons = reorder(currentLessons, source.index, destination.index);
            methods.setValue(`modules.${moduleIndex}.lessons`, reorderedLessons, { shouldDirty: true });
        }
    };


    // === MANEJO DE MÓDULOS Y LECCIONES ===

    const handleAddModule = () => {
        appendModule({
            id: `new-module-${Date.now()}`,
            title: '',
            description: '',
            lessons: [],
            order: moduleFields.length,
        });
    };

    const confirmDeleteItemAction = useCallback(() => {
        if (!itemToDeleteDetails) return;
        const { type, moduleIndex, lessonIndex, blockIndex } = itemToDeleteDetails;

        if (type === 'module') {
            setValue(`modules.${moduleIndex}._toBeDeleted`, true, { shouldDirty: true });
        } else if (type === 'lesson' && lessonIndex !== undefined) {
            setValue(`modules.${moduleIndex}.lessons.${lessonIndex}._toBeDeleted`, true, { shouldDirty: true });
        } else if (type === 'block' && lessonIndex !== undefined && blockIndex !== undefined) {
            setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.contentBlocks.${blockIndex}._toBeDeleted`, true, { shouldDirty: true });
        }

        toast({
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} marcado para eliminación`,
            description: `Se eliminará al guardar los cambios del curso.`,
            variant: "default",
        });

        setItemToDeleteDetails(null);
    }, [itemToDeleteDetails, setValue, toast]);


    // === Renderizado ===
    if (isLoading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isNewCourse && !isAuthLoading && user?.role !== 'ADMINISTRATOR' && user?.id !== methods.getValues('instructorId')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-4">
                <ShieldAlert className="h-20 w-20 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
                <p className="text-muted-foreground mb-4">No tienes permiso para editar este curso.</p>
                <Link href="/manage-courses" className={buttonVariants({ variant: "outline" })}>
                    Volver a mis cursos
                </Link>
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-24">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-20 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" type="button" size="sm">
                            <Link href="/manage-courses">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">{isNewCourse ? 'Crear Nuevo Curso' : 'Editar Curso'}</h1>
                            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        {!isNewCourse && (
                             <Button asChild variant="secondary" type="button" disabled={isSaving}>
                                <Link href={`/courses/${courseId}`} target="_blank">
                                    <Eye className="mr-2 h-4 w-4" /> Vista Previa
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                                <CardDescription>Detalles básicos y descripción del curso.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Título del Curso</Label>
                                    <Input id="title" {...methods.register('title', { required: 'El título es obligatorio' })} placeholder="Título atractivo y descriptivo" disabled={isSaving} />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="description">Descripción del Curso</Label>
                                    <Textarea id="description" {...methods.register('description', { required: 'La descripción es obligatoria' })} placeholder="Describe el contenido, objetivos y a quién va dirigido el curso." rows={6} disabled={isSaving} />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle>Contenido del Curso</CardTitle>
                                    <CardDescription>Arrastra los módulos y lecciones para reordenarlos.</CardDescription>
                                </div>
                                <Button type="button" onClick={handleAddModule} disabled={isSaving} className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Módulo
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="modules" type="MODULE">
                                        {(provided: DroppableProvided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                                {moduleFields.filter(mod => !(methods.getValues(`modules.${moduleFields.indexOf(mod)}._toBeDeleted` as const))).map((moduleItem, moduleIndex) => {
                                                    const module = methods.getValues(`modules.${moduleIndex}` as const);
                                                    if (module && module._toBeDeleted) return null;
                                                    return (
                                                        <Draggable key={moduleItem.dndId} draggableId={moduleItem.dndId} index={moduleIndex}>
                                                          {(provided, snapshot) => (
                                                              <ModuleItem moduleIndex={moduleIndex} provided={provided} />
                                                          )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                                {moduleFields.filter(mod => !(methods.getValues(`modules.${moduleFields.indexOf(mod)}._toBeDeleted` as const))).length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">No hay módulos. ¡Añade el primero para empezar!</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                         <Card>
                            <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="category">Categoría</Label>
                                    <Controller
                                        control={control}
                                        name="category"
                                        rules={{ required: 'La categoría es obligatoria' }}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || ''}
                                                disabled={isSaving}
                                            >
                                                <SelectTrigger id="category">
                                                    <SelectValue placeholder="Selecciona una categoría" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(settings?.resourceCategories || []).sort().map(cat => (
                                                        <SelectItem key={cat} value={cat}>
                                                            {cat}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="status">Estado del Curso</Label>
                                    <Controller control={control} name="status" render={({ field }) => (
                                        <Select onValueChange={(value: CourseStatus) => { field.onChange(value); if (value === 'PUBLISHED' && !watchedPublicationDate) { methods.setValue('publicationDate', new Date(), { shouldDirty: true }); } }} value={field.value} disabled={isSaving}>
                                            <SelectTrigger id="status"><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DRAFT">Borrador</SelectItem>
                                                <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                                <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                                <SelectItem value="SCHEDULED">Programado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}/>
                                </div>
                                {watchedCourseStatus === 'PUBLISHED' && (
                                    <div>
                                        <Label htmlFor="publicationDate">Fecha de Publicación</Label>
                                        <Controller control={control} name="publicationDate" render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSaving}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}</Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus locale={es}/></PopoverContent>
                                            </Popover>
                                        )}/>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Imagen del Curso</CardTitle>
                                <CardDescription>Sube una imagen representativa.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {methods.watch('imageUrl') ? (
                                    <div className="relative aspect-video rounded-md overflow-hidden border w-full">
                                        <Image src={methods.watch('imageUrl') || '/placeholder-image.jpg'} alt="Imagen del Curso" fill className="object-cover" onError={() => methods.setValue('imageUrl', null)} data-ai-hint="online course" />
                                        <div className="absolute top-2 right-2 z-10 flex gap-1">
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="icon" 
                                                className="rounded-full h-8 w-8" 
                                                onClick={() => document.getElementById('image-upload')?.click()}
                                                disabled={isSaving}>
                                                <Replace className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                size="icon" 
                                                className="rounded-full h-8 w-8" 
                                                onClick={removeCourseImage} 
                                                disabled={isSaving}>
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors">
                                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">Haz clic para subir una imagen</span>
                                    </Label>
                                )}
                                <Input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleCourseImageFileChange} disabled={isSaving} />
                                {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 md:left-[var(--sidebar-width)] group-data-[state=collapsed]/sidebar-wrapper:md:left-[var(--sidebar-width-icon)] right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-20">
                    <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row justify-end gap-2">
                        {!isNewCourse && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" type="button" disabled={isSaving} className="w-full sm:w-auto">
                                        Más Acciones
                                        <MoreVertical className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Otras Acciones</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {watchedCourseStatus !== 'DRAFT' && (
                                        <DropdownMenuItem
                                            onClick={() => handleChangeCourseStatus('DRAFT')}
                                            disabled={isSaving}
                                        >
                                            <CircleOff className="mr-2 h-4 w-4" /> Marcar como Borrador
                                        </DropdownMenuItem>
                                    )}
                                    {watchedCourseStatus !== 'ARCHIVED' && (
                                        <DropdownMenuItem
                                            onClick={() => handleChangeCourseStatus('ARCHIVED')}
                                            disabled={isSaving}
                                        >
                                            <Archive className="mr-2 h-4 w-4" /> Archivar Curso
                                        </DropdownMenuItem>
                                    )}
                                     <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        disabled={isSaving}
                                        className="text-destructive focus:bg-destructive/10"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Curso
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <Button type="submit" disabled={isSaving || !isDirty} className="w-full sm:w-auto">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             <Save className="mr-2 h-4 w-4" />
                             { isNewCourse ? "Crear Curso" : "Guardar Cambios"}
                        </Button>
                    </div>
                </div>


                {/* Dialogs and Modals */}
                 <Dialog open={showTemplateModal !== null} onOpenChange={() => setShowTemplateModal(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Seleccionar Plantilla de Lección</DialogTitle>
                            <DialogDescription>Elige una plantilla para crear una nueva lección con una estructura predefinida.</DialogDescription>
                        </DialogHeader>
                        {isLoadingTemplates ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <ScrollArea className="max-h-[60vh] mt-4">
                                <div className="space-y-2 pr-4">
                                    {templates.length > 0 ? templates.map(template => (
                                        <button key={template.id} onClick={() => {
                                            const targetModuleIndex = showTemplateModal;
                                            if (targetModuleIndex !== null) {
                                               const lessonCount = methods.getValues(`modules.${targetModuleIndex}.lessons`)?.length || 0;
                                               const newLesson = {
                                                  id: `new-lesson-${Date.now()}`,
                                                  title: template.name,
                                                  contentBlocks: [],
                                                  order: lessonCount,
                                                  templateId: template.id
                                               };
                                               const currentLessons = methods.getValues(`modules.${targetModuleIndex}.lessons`);
                                               methods.setValue(`modules.${targetModuleIndex}.lessons`, [...currentLessons, newLesson], { shouldDirty: true });
                                               setShowTemplateModal(null);
                                               toast({ title: "Plantilla Aplicada", description: "Se ha creado una nueva lección con la estructura de la plantilla." });
                                            }
                                        }} className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors">
                                            <h4 className="font-semibold">{template.name}</h4>
                                            <p className="text-sm text-muted-foreground">{template.description || 'Sin descripción'}</p>
                                            <p className="text-xs text-muted-foreground mt-2">Creador: {template.creator?.name || 'Sistema'} | Bloques: {template.templateBlocks.length}</p>
                                        </button>
                                    )) : <p className="text-center text-muted-foreground">No hay plantillas disponibles.</p>}
                                </div>
                            </ScrollArea>
                        )}
                    </DialogContent>
                </Dialog>
                <AlertDialog open={itemToDeleteDetails !== null} onOpenChange={setItemToDeleteDetails as any}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                            <AlertDialogDescription>¿Estás seguro de que quieres eliminar {itemToDeleteDetails?.type} "<strong>{itemToDeleteDetails?.name}</strong>"? Se eliminará al guardar los cambios del curso.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <AlertDialogCancel onClick={() => setItemToDeleteDetails(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDeleteItemAction} className={buttonVariants({ variant: "destructive" })}>
                                <Trash2 className="mr-2 h-4 w-4" /> Sí, eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el curso "<strong>{methods.getValues('title' as 'title')}</strong>" y todos sus datos (módulos, lecciones, inscripciones, progreso).</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCourse} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>{isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Sí, eliminar permanentemente</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onClose={() => setImageToCrop(null)}
                    uploadUrl="/api/upload/course-image"
                />
            </form>
        </FormProvider>
    );
}
