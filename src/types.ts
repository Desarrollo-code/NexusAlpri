// src/types.ts
import type { Prisma } from '@prisma/client';

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
}

export interface Quiz {
    id: string;
    title: string;
    description?: string;
    maxAttempts?: number | null;
    questions: Question[];
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

export interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  instructor: {
      id: string;
      name: string;
      avatar: string | null;
  };
  instructorId?: string;
  imageUrl?: string;
  modulesCount: number;
  lessonsCount?: number;
  modules: Module[];
  status: CourseStatus;
  isEnrolled?: boolean;
  enrollmentsCount?: number;
  averageCompletion?: number;
  publicationDate?: Date | null;
}


export interface EnrolledCourse extends Course {
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


// --- RESOURCES ---
export type ResourceType = 'FOLDER' | 'DOCUMENT' | 'GUIDE' | 'MANUAL' | 'POLICY' | 'VIDEO' | 'EXTERNAL_LINK' | 'OTHER';

export interface EnterpriseResource {
    id: string;
    title: string;
    type: ResourceType;
    description?: string | null;
    url?: string | null;
    uploadDate: string;
    uploaderId: string;
    uploaderName?: string;
    category?: string | null;
    tags: string[];
    ispublic: boolean;
    hasPin: boolean;
    sharedWith: Pick<User, 'id' | 'name' | 'avatar'>[];
    parentId?: string | null;
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

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: { id: string; name: string | null; avatar?: string | null; } | null;
    audience: UserRole[] | 'ALL';
    priority?: 'Normal' | 'Urgente';
    isPinned: boolean;
    attachments: { id: string; name: string; url: string; type: string; size: number }[];
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
}

// --- CALENDAR ---
export type EventAudienceType = 'ALL' | UserRole | 'SPECIFIC';

export interface Attachment {
    name: string;
    url: string;
    type: string;
    size: number;
}

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
}

// --- SECURITY ---
export type SecurityLogEvent = 
    | 'SUCCESSFUL_LOGIN'
    | 'FAILED_LOGIN_ATTEMPT' 
    | 'PASSWORD_CHANGE_SUCCESS'
    | 'TWO_FACTOR_ENABLED'
    | 'TWO_FACTOR_DISABLED'
    | 'USER_ROLE_CHANGED';

export type SecurityLog = Prisma.SecurityLogGetPayload<{
    include: { user: { select: { id: true, name: true, avatar: true } } }
}>;


export type SecurityStats = {
    successfulLogins24h: number;
    failedLogins24h: number;
    roleChanges24h: number;
    criticalEvents24h: number;
    loginsLast7Days: { date: string; count: number }[];
}

// --- ANALYTICS ---
export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
    recentLogins: number;
    newEnrollmentsLast7Days: number;
    userRegistrationTrend: { date: string, count: number }[];
}

// --- TEMPLATES ---
export type TemplateType = 'SYSTEM' | 'USER';
export { type LessonTemplate, type TemplateBlock };

// --- FORMS ---
export type FormFieldType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface FormFieldOption {
  id: string;
  text: string;
  isCorrect: boolean;
  points: number;
}

export type FormField = Omit<PrismaFormField, 'options'> & {
  options: FormFieldOption[];
};

export type AppForm = PrismaForm & {
    fields: FormField[];
    _count: {
        responses: number;
    };
    creator?: {
        name: string | null;
    } | null;
    sharedWith?: Pick<User, 'id' | 'name' | 'avatar'>[];
};
