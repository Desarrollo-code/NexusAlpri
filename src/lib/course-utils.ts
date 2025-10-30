// src/lib/course-utils.ts
import type { Course as AppCourseType, CourseStatus } from '@/types';
import type { Course as PrismaCourse } from '@prisma/client';

// Define a more specific type for the input expected by the mapper
// This helps ensure the function is used correctly.
interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | '_count' | 'status'> {
  instructor?: { id: string; name: string | null; avatar?: string | null; } | null;
  _count?: {
    modules?: number;
    enrollments?: number;
    lessons?: number;
  };
  modules?: { _count?: { lessons: number } }[];
  status: CourseStatus;
  averageCompletion?: number;
}


export function mapApiCourseToAppCourse(apiCourse: ApiCourseForManage): AppCourseType {
  const totalLessons = apiCourse.modules?.reduce((acc, mod) => acc + (mod._count?.lessons || 0), 0) || apiCourse._count?.lessons || 0;
  
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description || '',
    category: apiCourse.category || undefined,
    instructor: apiCourse.instructor ? {
        id: apiCourse.instructor.id,
        name: apiCourse.instructor.name || 'N/A',
        avatar: apiCourse.instructor.avatar || null,
    } : {
        id: 'unknown',
        name: 'N/A',
        avatar: null,
    },
    instructorId: apiCourse.instructorId || undefined,
    imageUrl: apiCourse.imageUrl || undefined,
    modulesCount: apiCourse._count?.modules ?? 0,
    lessonsCount: totalLessons,
    enrollmentsCount: apiCourse._count?.enrollments ?? 0,
    averageCompletion: apiCourse.averageCompletion,
    status: apiCourse.status,
    modules: [], // Modules are typically not needed for card displays
    isEnrolled: undefined, // This is determined client-side
  };
}
