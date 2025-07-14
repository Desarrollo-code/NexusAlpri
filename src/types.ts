

import type { JsonValue, LessonTemplate, TemplateBlock } from "@prisma/client";

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
}

export interface PlatformSettings {
    platformName: string;
    allowPublicRegistration: boolean;
    enableEmailNotifications: boolean;
    emailWhitelist?: string; // Comma-separated list of emails
    require2faForAdmins: boolean;
    idleTimeoutMinutes: number;
    enableIdleTimeout: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumber: boolean;
    passwordRequireSpecialChar: boolean;
    resourceCategories: string[];
}

// --- NAVIGATION ---
export interface NavItem {
    label: string;
    href?: string;
    icon: React.ElementType;
    roles: UserRole[];
    disabled?: boolean;
    subItems?: NavSubItem[];
    tooltip?: any;
}

export interface NavSubItem extends Omit<NavItem, 'subItems'> {}


// --- COURSE CONTENT ---
export type LessonType = 'TEXT' | 'VIDEO' | 'QUIZ' | 'FILE';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE';

export interface AnswerOption {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback?: string;
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
}

export interface EnrolledCourse extends Course {
    enrolledAt: string;
    progressPercentage?: number;
}

export interface LessonCompletionRecord {
  lessonId: string;
  type: 'view' | 'quiz';
  score?: number; // Only for 'quiz' type
}

export interface CourseProgress {
    userId: string;
    courseId: string;
    completedLessonIds: LessonCompletionRecord[];
    progressPercentage: number;
}


// --- RESOURCES ---
export type ResourceType = 'FOLDER' | 'DOCUMENT' | 'GUIDE' | 'MANUAL' | 'POLICY' | 'VIDEO' | 'OTHER';

export interface EnterpriseResource {
    id: string;
    title: string;
    description?: string;
    type: ResourceType;
    category: string;
    tags: string[];
    url?: string;
    uploadDate: string;
    uploaderId?: string;
    uploaderName: string;
    hasPin: boolean;
    parentId: string | null;
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

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    description?: string | null;
    location?: string | null;
    audienceType?: EventAudienceType;
    attendees?: { id: string, name: string | null, email: string }[];
    color?: string;
    creatorId?: string;
}

// --- SECURITY ---
export type SecurityLogEvent = 
    | 'SUCCESSFUL_LOGIN'
    | 'FAILED_LOGIN_ATTEMPT' 
    | 'PASSWORD_CHANGE_SUCCESS'
    | 'TWO_FACTOR_ENABLED'
    | 'TWO_FACTOR_DISABLED'
    | 'USER_ROLE_CHANGED';

export interface SecurityLog {
    id: string;
    event: SecurityLogEvent;
    ipAddress: string;
    emailAttempt?: string | null;
    userId?: string | null;
    createdAt: string; // This will be an ISO string
    details?: string | null;
}

// --- ANALYTICS ---
export interface UsersByRole {
    role: UserRole;
    count: number;
}

export interface UserAnalyticsData {
    usersByRole: UsersByRole[];
    activeUsersLast7Days: number;
    newUsersLast30Days: { date: string; count: number }[];
}

export interface CourseAnalyticsData {
    averageCompletionRate: number;
    averageQuizScore: number;
    mostEnrolledCourses: { id: string, title: string, enrollments: number }[];
    coursesByCategory: { category: string, count: number }[];
}

export interface ProgressAnalyticsData {
    activeStudentsInCourses: number;
    averageCompletionTimeDays: number;
    dropoutRate: number;
}

// --- TEMPLATES ---
export type TemplateType = 'SYSTEM' | 'USER';
export { type LessonTemplate, type TemplateBlock };
