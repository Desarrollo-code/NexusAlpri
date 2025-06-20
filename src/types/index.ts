
import type { LucideIcon } from 'lucide-react';

export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Lesson {
  id: string;
  title: string;
  contentType: 'video' | 'document' | 'link' | 'quiz';
  contentUrl?: string; // For video, document URL, external link
  // quizQuestions?: QuizQuestion[]; // Future: for quiz content
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  thumbnailUrl?: string;
  dataAiHint?: string;
  modules: Module[];
}

export interface EnterpriseResource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'documento' | 'guía' | 'manual' | 'política';
  fileUrl: string;
  tags?: string[];
  icon?: LucideIcon;
  dataAiHint?: string;
  thumbnailUrl?: string;
}

export interface Announcement {
  id:string;
  title: string;
  content: string;
  author: string;
  date: string;
  targetRoles?: UserRole[];
}
