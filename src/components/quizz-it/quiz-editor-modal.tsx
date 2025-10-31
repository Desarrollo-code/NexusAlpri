
// src/components/quizz-it/quiz-editor-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { PlusCircle, Trash2, Pencil, Check, X, Image as ImageIcon, UploadCloud, Timer, LayoutTemplate, FlipVertical, CheckSquare, ImagePlay, BrainCircuit, Info, Eye } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AppQuiz, AppQuestion, FormFieldOption } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { UploadArea } from '../ui/upload-area';
import Image from 'next/image';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { QuizGameView } from './quiz-game-view';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription } from '../ui/alert';

const generateUniqueId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const optionShapes = [
    (props: any) => <path d="M12 2L2 22h20L12 2z" {...props} />,
    (props: any) => <rect x="3" y="3" width="18" height="18" rx="3" {...props} />,
    (props: any) => <circle cx="12" cy="12" r="10" {...props} />,
    (props: any) => <path d="M12 2.5l2.5 7.5h8l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h8l2.5-7.5z" {...props} />,
];
export const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

const templateOptions = [
    { value: 'default', label: 'Múltiple Elección', icon: CheckSquare, description: 'Clásico, con hasta 4 opciones de texto.' },
    { value: 'image', label: 'Pregunta con Imagen', icon: ImagePlay, description: 'Una imagen como foco principal y opciones de texto.' },
    { value: 'true_false', label: 'Verdadero / Falso', icon: BrainCircuit, description: 'Respuesta rápida de dos opciones predefinidas.' },
    { value: 'image_options', label: 'Respuestas con Imágenes', icon: LayoutTemplate, description: 'Usa imágenes como opciones de respuesta.' },
];


export function QuizEditorModal({ isOpen, onClose, quiz, onSave }: { isOpen: boolean, onClose: () => void, quiz: AppQuiz, onSave: (updatedQuiz: AppQuiz) => void }) {
    const { toast } = useToast();
    const [localQuiz, setLocalQuiz] = useState<AppQuiz>(quiz);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    // States for image option uploads
    const [isOptionUploading, setIsOptionUploading] = useState<Record<string, boolean>>({});
    const [optionUploadProgress, setOptionUploadProgress] = useState<Record<string, number>>({});


    useEffect(() => {
        setLocalQuiz(JSON.parse(JSON.stringify(quiz)));
        setActiveQuestionIndex(0);
    }, [quiz, isOpen]);

    const handleQuizMetaChange = (field: keyof AppQuiz, value: any) => {
        setLocalQuiz(prev => ({...prev, [field]: value}));
    };
    
    const handleTemplateChange = (value: string) => {
        handleQuizMetaChange('template', value);
        if (value === 'true_false') {
            const newQuestions = [...localQuiz.questions];
            const currentQuestion = newQuestions[activeQuestionIndex];
            currentQuestion.options = [
                { id: generateUniqueId('opt'), text: 'Verdadero', isCorrect: true, points: 10 },
                { id: generateUniqueId('opt'), text: 'Falso', isCorrect: false, points: 0 }
            ];
            setLocalQuiz(prev => ({...prev, questions: newQuestions}));
        }
    }

    const handleQuestionChange = (field: 'text' | 'imageUrl', value: string | null) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex][field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (oIndex: number, field: 'text' | 'imageUrl', value: string) => {
        const newQuestions = [...localQuiz.questions];
        (newQuestions[activeQuestionIndex].options[oIndex] as any)[field] = value;
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSetCorrect = (optionId: string) => {
        const newQuestions = [...localQuiz.questions];
        newQuestions[activeQuestionIndex].options = newQuestions[activeQuestionIndex].options.map(opt => ({
            ...opt,
            isCorrect: opt.id === optionId
        }));
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };
    
    const addQuestion = () => {
        const newQuestion: AppQuestion = {
            id: generateUniqueId('question'),
            text: 'Nueva Pregunta',
            order: localQuiz.questions.length,
            type: 'SINGLE_CHOICE',
            imageUrl: null,
            options: [
                { id: generateUniqueId('option'), text: '', imageUrl: null, isCorrect: true, points: 10 },
                { id: generateUniqueId('option'), text: '', imageUrl: null, isCorrect: false, points: 0 }
            ]
        };
        setLocalQuiz(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
        setActiveQuestionIndex(localQuiz.questions.length);
    };
    
    const addOption = () => {
        const newQuestions = [...localQuiz.questions];
        const currentOptions = newQuestions[activeQuestionIndex].options;
        if (currentOptions.length < 4) {
            currentOptions.push({ id: generateUniqueId('option'), text: '', imageUrl: null, isCorrect: false, points: 0 });
            setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
        }
    };
    
    const deleteOption = (optionIndex: number) => {
        const newQuestions = [...localQuiz.questions];
        const currentOptions = newQuestions[activeQuestionIndex].options;
        if (currentOptions.length > 1) {
            currentOptions.splice(optionIndex, 1);
            if (!currentOptions.some(opt => opt.isCorrect) && currentOptions.length > 0) {
                currentOptions[0].isCorrect = true;
            }
            setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
        }
    };

    const deleteQuestion = (indexToDelete: number) => {
         if (localQuiz.questions.length <= 1) return;
         setLocalQuiz(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== indexToDelete) }));
         setActiveQuestionIndex(prev => Math.max(0, prev - 1));
    };

    const handleImageUpload = async (file: File | null, type: 'question' | 'option', optionIndex?: number) => {
        if (!file) return;

        if (type === 'question') {
            setIsUploading(true);
            setUploadProgress(0);
        } else if (optionIndex !== undefined) {
             setIsOptionUploading(prev => ({ ...prev, [optionIndex]: true }));
             setOptionUploadProgress(prev => ({ ...prev, [optionIndex]: 0 }));
        }
        
        try {
            const result = await uploadWithProgress('/api/upload/lesson-file', file, (progress) => {
                if (type === 'question') setUploadProgress(progress);
                else if (optionIndex !== undefined) setOptionUploadProgress(prev => ({ ...prev, [optionIndex]: progress }));
            });
            
            if (type === 'question') handleQuestionChange('imageUrl', result.url);
            else if (optionIndex !== undefined) handleOptionChange(optionIndex, 'imageUrl', result.url);
            
            toast({ title: 'Imagen subida' });
        } catch (err) {
            toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
        } finally {
            if (type === 'question') setIsUploading(false);
            else if (optionIndex !== undefined) setIsOptionUploading(prev => ({ ...prev, [optionIndex]: false }));
        }
    };

    const handleSaveChanges = () => { onSave(localQuiz); };

    if (!localQuiz || !localQuiz.questions) return null;
    const activeQuestion = localQuiz.questions[activeQuestionIndex];

    const quizPreviewForm = { ...localQuiz, fields: localQuiz.questions.map(q => ({ ...q, label: q.text })) };
    
    const isImageOptionsTemplate = localQuiz.template === 'image_options';

    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary"/>Editor de Quiz Interactivo</DialogTitle>
                </DialogHeader>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0">
                    <div className="md:col-span-1 border-r flex flex-col">
                         <div className="p-2 space-y-2">
                             <Button onClick={addQuestion} className="w-full" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Pregunta</Button>
                         </div>
                         <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                            {localQuiz.questions.map((q, index) => (
                                <button key={q.id} onClick={() => setActiveQuestionIndex(index)} className={cn("w-full text-left p-2 rounded-md border flex gap-2", activeQuestionIndex === index ? "bg-primary/10 border-primary" : "hover:bg-muted")}>
                                    <span className="font-bold text-primary">{index + 1}.</span>
                                    <span className="truncate flex-grow">{q.text || "Pregunta sin título"}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={(e) => {e.stopPropagation(); deleteQuestion(index)}}><Trash2 className="h-4 w-4"/></Button>
                                </button>
                            ))}
                            </div>
                         </ScrollArea>
                    </div>
                    <div className="md:col-span-2 flex flex-col">
                        {activeQuestion ? (
                            <div className="flex-1 flex flex-col p-4 gap-4 min-h-0">
                                <Textarea value={activeQuestion.text} onChange={(e) => handleQuestionChange('text', e.target.value)} placeholder="Escribe tu pregunta aquí..." className="text-xl text-center font-bold h-auto resize-none bg-background flex-shrink-0" rows={2}/>
                                <ScrollArea className="flex-grow">
                                <div className="space-y-4 pr-2">
                                     <div className="w-full">
                                        {isUploading ? (
                                            <div className="w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary"/><p className="text-sm text-muted-foreground">Subiendo...</p><Progress value={uploadProgress} className="w-full h-1.5"/>
                                            </div>
                                        ) : activeQuestion.imageUrl ? (
                                            <div className="relative w-40 h-24 rounded-lg overflow-hidden border p-1 bg-background">
                                                <Image src={activeQuestion.imageUrl} alt="preview" fill className="object-contain" />
                                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleQuestionChange('imageUrl', null)}><X className="h-4 w-4"/></Button>
                                            </div>
                                        ) : (
                                            <UploadArea onFileSelect={(file) => handleImageUpload(file, 'question')} inputId={`img-upload-${activeQuestion.id}`} />
                                        )}
                                    </div>
                                    
                                     <div className={cn("grid gap-2", isImageOptionsTemplate ? "grid-cols-2" : "grid-cols-1")}>
                                        {activeQuestion.options.slice(0, 4).map((opt, index) => {
                                            const optionIsUploading = isOptionUploading[index];
                                            const optionProgress = optionUploadProgress[index] || 0;
                                            return (
                                                <div key={opt.id} className={cn("flex items-center gap-2 p-2 rounded-md shadow-sm border", opt.isCorrect ? 'ring-2 ring-offset-2 ring-offset-background ring-green-500' : '')}>
                                                    {isImageOptionsTemplate ? (
                                                        <div className="flex-grow space-y-2">
                                                             {isOptionUploading ? (
                                                                <div className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg bg-muted/50 p-2"><Loader2 className="h-6 w-6 animate-spin text-primary"/><p className="text-sm text-muted-foreground">Subiendo...</p><Progress value={optionProgress} className="w-full h-1.5"/></div>
                                                            ) : opt.imageUrl ? (
                                                                 <div className="relative w-full h-24 rounded-lg overflow-hidden border p-1 bg-background">
                                                                     <Image src={opt.imageUrl} alt={`Opción ${index+1}`} fill className="object-cover" />
                                                                     <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleOptionChange(index, 'imageUrl', '')}><X className="h-4 w-4"/></Button>
                                                                </div>
                                                            ) : (
                                                                <UploadArea onFileSelect={(file) => handleImageUpload(file, 'option', index)} inputId={`opt-img-upload-${opt.id}`} />
                                                            )}
                                                            <div className="flex items-center justify-center">
                                                               <Button variant="ghost" size="sm" onClick={() => handleSetCorrect(opt.id)}>
                                                                    <Check className={cn("h-5 w-5", opt.isCorrect ? 'text-green-500' : 'text-muted-foreground')}/> <span className="ml-1 text-xs">Correcta</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Input value={opt.text} onChange={(e) => handleOptionChange(index, 'text', e.target.value)} placeholder={`Opción ${index + 1}`} />
                                                    )}
                                                     {!isImageOptionsTemplate && <Button variant="ghost" size="icon" onClick={() => handleSetCorrect(opt.id)}><Check className={cn("h-6 w-6", opt.isCorrect ? 'text-green-500' : 'text-muted-foreground')}/></Button>}
                                                     {localQuiz.questions[activeQuestionIndex].options.length > 1 && <Button variant="ghost" size="icon" onClick={() => deleteOption(index)} className="text-destructive/70 hover:text-destructive"><X className="h-4 w-4"/></Button>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {localQuiz.questions[activeQuestionIndex].options.length < 4 && !isImageOptionsTemplate && (
                                        <Button variant="outline" size="sm" onClick={addOption} className="mt-2 self-start">+ Añadir opción</Button>
                                    )}
                                </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground"><p>Selecciona una pregunta para editarla.</p></div>
                        )}
                    </div>
                </div>
                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={() => setIsPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />Previsualizar</Button>
                    <div className="flex-grow"/>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Guardar Cambios del Quiz</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl p-0">
                <div className="bg-gradient-to-br from-background via-muted to-background p-8 rounded-lg">
                    <QuizGameView form={quizPreviewForm} isEditorPreview={true} activeQuestionIndex={activeQuestionIndex}/>
                </div>
            </DialogContent>
        </Dialog>
      </>
    );
}
```
  <change>
    <file>src/types.ts</file>
    <content><![CDATA[
// src/types.ts
import type { Prisma, User as PrismaUser } from '@prisma/client';

// --- USER & AUTH ---
export type UserRole = 'ADMINISTRATOR' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  isTwoFactorEnabled?: boolean;
  registeredDate?: string | Date;
  theme?: string | null;
  xp?: number | null;
  isActive?: boolean;
}

export interface PlatformSettings {
    platformName: string;
    allowPublicRegistration: boolean;
    enableEmailNotifications: boolean;
    emailWhitelist: string;
    require2faForAdmins: boolean;
    idleTimeoutMinutes: number;
    enableIdleTimeout: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumber: boolean;
    passwordRequireSpecialChar: boolean;
    resourceCategories: string[];
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColorLight?: string;
    fontHeadline?: string;
    fontBody?: string;
    primaryColorDark?: string;
    backgroundColorDark?: string;
    logoUrl?: string | null;
    watermarkUrl?: string | null;
    landingImageUrl?: string | null;
    authImageUrl?: string | null;
    aboutImageUrl?: string | null;
    benefitsImageUrl?: string | null;
    announcementsImageUrl?: string | null;
    publicPagesBgUrl?: string | null;
    securityMascotUrl?: string | null;
    emptyStateCoursesUrl?: string | null;
    emptyStateMyCoursesUrl?: string | null;
    emptyStateFormsUrl?: string | null;
    emptyStateMyNotesUrl?: string | null;
    emptyStateResourcesUrl?: string | null;
    emptyStateCertificatesUrl?: string | null;
    emptyStateMotivationsUrl?: string | null;
    emptyStateUsersUrl?: string | null;
    emptyStateLeaderboardUrl?: string | null;
}

// --- NAVIGATION ---
export interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
    path?: string;
    badge?: string;
    color?: string;
    children?: NavItem[];
}


// --- COURSE CONTENT ---
export type LessonType = 'TEXT' | 'VIDEO' | 'QUIZ' | 'FILE';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE';

export interface AnswerOption {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback?: string | null;
    points: number;
}

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    order: number;
    options: AnswerOption[];
    imageUrl?: string | null;
}

export interface Quiz {
    id: string;
    title: string;
    description?: string;
    maxAttempts?: number | null;
    questions: Question[];
    template?: string | null;
    timerStyle?: string | null;
}

export interface ContentBlock {
  id: string;
  type: LessonType;
  content?: string;
  order: number;
  quiz?: Quiz;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  contentBlocks: ContentBlock[];
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export type CoursePrerequisiteInfo = {
  id: string;
  title: string;
} | null;

export interface Course extends Omit<Prisma.CourseGetPayload<{}>, 'instructor' | 'prerequisite' | 'isMandatory'> {
  instructor: {
      id: string;
      name: string;
      avatar: string | null;
  };
  modulesCount: number;
  lessonsCount?: number;
  modules: Module[];
  isEnrolled?: boolean;
  enrollmentsCount?: number;
  averageCompletion?: number;
  publicationDate?: Date | null;
  prerequisite: CoursePrerequisiteInfo;
  userProgress?: {
      completedAt: Date | null;
  }[] | null;
  prerequisiteCompleted?: boolean;
  isMandatory: boolean;
}


export interface EnrolledCourse extends Course {
    enrollmentId: string;
    enrolledAt: string;
    progressPercentage?: number;
}

export type LessonCompletionRecord = {
    lessonId: string;
    type: 'view' | 'quiz' | 'video';
    score?: number | null;
};

export interface CourseProgress {
    userId: string;
    courseId: string;
    completedLessons: LessonCompletionRecord[];
    progressPercentage: number;
    completedAt?: Date | null;
    id: string;
}

export interface UserNote {
    id: string;
    userId: string;
    lessonId: string;
    content: string;
    color: string;
    createdAt: string;
    updatedAt: string;
}

export type CourseAssignment = Prisma.CourseAssignmentGetPayload<{}>;


// --- RESOURCES ---
export type ResourceType = 'FOLDER' | 'DOCUMENT' | 'GUIDE' | 'MANUAL' | 'POLICY' | 'VIDEO' | 'EXTERNAL_LINK' | 'OTHER' | 'DOCUMENTO_EDITABLE';
export type ResourceStatus = 'ACTIVE' | 'ARCHIVED';

export interface EnterpriseResource extends Omit<Prisma.EnterpriseResourceGetPayload<{}>, 'tags' | 'status'> {
    tags: string[];
    uploaderName: string;
    hasPin: boolean;
    status: ResourceStatus;
    uploader?: { id: string, name: string | null, avatar: string | null } | null;
    sharedWith?: Pick<User, 'id' | 'name' | 'avatar'>[];
}


// --- ANNOUNCEMENTS ---
export interface Reaction {
    userId: string;
    reaction: string;
    user: {
      id: string;
      name: string | null;
      avatar?: string | null;
    };
}

export interface Attachment {
    id?: string;
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: { id: string; name: string | null; avatar?: string | null; role?: string } | null;
    audience: UserRole[] | 'ALL' | string;
    priority?: 'Normal' | 'Urgente';
    isPinned: boolean;
    attachments: Attachment[];
    reads: { id: string; name: string | null; avatar?: string | null; }[];
    reactions: Reaction[];
    _count: {
      reads: number;
      reactions: number;
    };
}

// --- NOTIFICATIONS ---
export interface Notification {
    id: string;
    userId: string;
    title: string;
    description?: string;
    date: string; // ISO string from DB
    link?: string;
    read: boolean;
    isMotivational?: boolean;
    motivationalMessageId?: string | null;
    interactiveEventId?: string | null;
    interactiveEventOccurrence?: Date | string | null;
}

// --- CALENDAR ---
export type EventAudienceType = 'ALL' | UserRole | 'SPECIFIC';

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    description?: string | null;
    location?: string | null;
    audienceType: EventAudienceType;
    attendees: Pick<User, 'id' | 'name' | 'email'>[];
    color: string;
    creatorId: string;
    creator?: { id: string, name: string | null };
    videoConferenceLink?: string | null;
    attachments: Attachment[];
    recurrence: Prisma.RecurrenceType;
    recurrenceEndDate?: string | null;
    parentId?: string | null;
    isInteractive: boolean;
}

// --- SECURITY ---
export type SecurityLogEvent = 
    | 'SUCCESSFUL_LOGIN'
    | 'FAILED_LOGIN_ATTEMPT' 
    | 'PASSWORD_CHANGE_SUCCESS'
    | 'TWO_FACTOR_ENABLED'
    | 'TWO_FACTOR_DISABLED'
    | 'USER_ROLE_CHANGED'
    | 'COURSE_CREATED'
    | 'COURSE_UPDATED'
    | 'COURSE_DELETED'
    | 'USER_SUSPENDED';

export type SecurityLog = Prisma.SecurityLogGetPayload<{
    include: { user: { select: { id: true, name: true, avatar: true, email: true } } }
}> & {
    userAgent: string | null;
    city: string | null;
    country: string | null;
    lat?: number | null;
    lng?: number | null;
};

export type SecurityStats = {
    successfulLogins: number;
    failedLogins: number;
    roleChanges: number;
    courseModifications: number;
    browsers: { name: string, count: number }[];
    os: { name: string, count: number }[];
    topIps: { ip: string, count: number, country: string }[];
    topCountries: { name: string, count: number }[];
    securityScore: number;
    twoFactorAdoptionRate: number;
    atRiskUsers: { userId: string, name: string | null, email: string, avatar: string | null, failedAttempts: number }[];
};


// --- ANALYTICS ---
type TrendData = { date: string, count: number };
export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
    averageCompletionRate: number;
    userRegistrationTrend: TrendData[];
    contentActivityTrend: { date: string, newCourses: number, newEnrollments: number }[];
    enrollmentTrend: TrendData[];
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
    topCoursesByEnrollment: any[];
    topCoursesByCompletion: any[];
    lowestCoursesByCompletion: any[];
    topStudentsByEnrollment: any[];
    topStudentsByCompletion: any[];
    topInstructorsByCourses: any[];
}

// --- TEMPLATES ---
export type TemplateType = 'SYSTEM' | 'USER';
export { type LessonTemplate, type TemplateBlock, type CertificateTemplate } from '@prisma/client';

// --- GAMIFICATION ---
export type UserAchievement = Prisma.UserAchievementGetPayload<{
    include: {
        achievement: true;
    }
}>;
export { type AchievementSlug } from '@prisma/client';

// --- MOTIVATIONAL MESSAGES ---
export type MotivationalMessage = Prisma.MotivationalMessageGetPayload<{}>;
export { type MotivationalMessageTriggerType } from '@prisma/client';


// --- FORMS ---
export interface FormFieldOption {
  id: string;
  text: string;
  isCorrect: boolean;
  points: number;
  imageUrl?: string | null;
}

export type FormField = Omit<Prisma.FormFieldGetPayload<{}>, 'options'> & {
  options: FormFieldOption[];
};

export type AppForm = Prisma.FormGetPayload<{}> & {
    fields: FormField[];
    _count: {
        responses: number;
    };
    creator?: {
        name: string | null;
    } | null;
    sharedWith?: Pick<User, 'id' | 'name' | 'avatar'>[];
    template?: string | null;
    timerStyle?: string | null;
};

// --- PROCESSES ---
export type Process = Prisma.ProcessGetPayload<{
    include: {
        children: true,
        users: true
    }
}>;

// --- MESSAGES / CHAT ---
export interface Conversation {
    id: string;
    participants: Participant[];
    messages: Message[];
    updatedAt: string;
    isGroup: boolean;
}
export interface Participant extends Pick<User, 'id' | 'name' | 'avatar'> {}
export interface Message {
    id: string;
    content: string | null;
    createdAt: string;
    authorId: string;
    author: Participant;
    attachments: Attachment[];
    conversationId: string;
}


export { type FormStatus, type FormFieldType, type AnnouncementAttachment, type RecurrenceType, type ChatAttachment } from '@prisma/client';
