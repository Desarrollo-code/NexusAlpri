// src/types.ts
import type { LessonTemplate, TemplateBlock, Prisma, Achievement, Form, FormField as PrismaFormField, FormFieldType, FormStatus } from "@prisma/client";

// --- USER & AUTH ---
export type UserRole = 'ADMINISTRATOR' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: UserRole;
  isTwoFactorEnabled?: boolean;
  registeredDate?: string | Date;
  theme?: string | null;
  xp?: number | null; // Added for gamification
}

export interface PlatformSettings {
    platformName: string;
    allowPublicRegistration: boolean;
    enableEmailNotifications: boolean;
    require2faForAdmins: boolean;
    idleTimeoutMinutes: number;
    enableIdleTimeout: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumber: boolean;
    passwordRequireSpecialChar: boolean;
    resourceCategories: string[];
    // New theme properties
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColorLight?: string;
    primaryColorDark?: string;
    backgroundColorDark?: string;
    fontHeadline?: string;
    fontBody?: string;
    logoUrl?: string | null;
    watermarkUrl?: string | null;
    landingImageUrl?: string | null;
    authImageUrl?: string | null;
    aboutImageUrl?: string | null;
    benefitsImageUrl?: string | null;
}

// --- NAVIGATION ---
export interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
    path?: string;
    badge?: string;
    color?: string; // Propiedad opcional para el color del ícono
    children?: NavItem[];
}


// --- COURSE CONTENT ---
export type LessonType = 'TEXT' | 'VIDEO' | 'QUIZ' | 'FILE';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE';

export interface AnswerOption {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback?: string | null;
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
  instructor: string;
  instructorId?: string;
  imageUrl?: string;
  category?: string;
  modulesCount: number;
  status: CourseStatus;
  modules: Module[];
  isEnrolled?: boolean;
  publicationDate?: Date | string | null;
  enrollmentsCount?: number;
}

export interface EnrolledCourse extends Course {
    enrolledAt: string;
    progressPercentage?: number;
}

export type LessonCompletionRecord = {
    lessonId: string;
    type: 'view' | 'quiz';
    score?: number | null;
};

export interface CourseProgress {
    userId: string;
    courseId: string;
    completedLessons: LessonCompletionRecord[];
    progressPercentage: number;
}

export interface UserNote {
    id: string;
    userId: string;
    lessonId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}


// --- RESOURCES ---
export type ResourceType = 'FOLDER' | 'DOCUMENT' | 'GUIDE' | 'MANUAL' | 'POLICY' | 'VIDEO' | 'EXTERNAL_LINK' | 'OTHER';

export interface EnterpriseResource {
    id: string;
    title: string;
    description?: string | null;
    type: ResourceType;
    category: string | null;
    tags: string[];
    url?: string | null;
    uploadDate: string;
    uploaderId?: string | null;
    uploaderName: string;
    hasPin: boolean;
    parentId: string | null;
    ispublic: boolean;
    sharedWith?: Pick<User, 'id' | 'name' | 'avatar'>[];
}

// --- ANNOUNCEMENTS ---
export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: { id: string, name: string | null } | null;
    audience: UserRole[] | 'ALL' | string;
    priority?: 'Normal' | 'Urgente';
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
    attendees: { id: string, name: string | null, email: string }[];
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
}> & {
    userAgent: string | null;
    city: string | null;
    country: string | null;
};


// --- ANALYTICS ---
type CourseInfo = {
    id: string;
    title: string;
    imageUrl: string | null;
    value: number;
};

type UserInfo = {
    id: string;
    name: string | null;
    avatar: string | null;
    value: number;
};

export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
    recentLogins: number;
    newUsersLast7Days: number;
    userRegistrationTrend: { date: string, count: number }[];
    courseActivity: { date: string, newCourses: number, publishedCourses: number, newEnrollments: number }[];
    averageCompletionRate: number;
    topCoursesByEnrollment: CourseInfo[];
    topCoursesByCompletion: CourseInfo[];
    lowestCoursesByCompletion: CourseInfo[];
    topStudentsByEnrollment: UserInfo[];
    topStudentsByCompletion: UserInfo[];
    topInstructorsByCourses: UserInfo[];
}

// --- TEMPLATES ---
export type TemplateType = 'SYSTEM' | 'USER';
export { type LessonTemplate, type TemplateBlock };

// --- GAMIFICATION ---
export type UserAchievement = Prisma.UserAchievementGetPayload<{
    include: {
        achievement: true;
    }
}>;

// --- FORMS ---
// Extend the Prisma FormField to include a potential points property in its options
// This is done by intersecting with a new type for options
type FormFieldOption = {
  id: string;
  text: string;
  isCorrect: boolean;
  points?: number; // Optional points per option
};

export interface FormField extends Omit<PrismaFormField, 'options'> {
  options: FormFieldOption[];
}

export type AppForm = Form & {
    fields: FormField[];
    _count: {
        responses: number;
    };
    creator?: {
        name: string | null;
    } | null;
};

export { type FormStatus, type FormFieldType };
