// src/lib/course-utils.ts
import type { Course as AppCourseType, CourseStatus } from '@/types';
import type { Course as PrismaCourse } from '@prisma/client';

// Define a more specific type for the input expected by the mapper
// This helps ensure the function is used correctly.
interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | 'status' | 'prerequisite' | 'isMandatory'> {
  instructor?: { id: string; name: string | null; avatar?: string | null; } | null;
  _count?: {
    modules?: number;
    enrollments?: number;
    lessons?: number; // Add lessons count here
  };
  modules?: { lessons: { id: string }[] }[]; // Ensure this structure is available
  status: CourseStatus;
  averageCompletion?: number;
  isMandatory: boolean;
}


export function mapApiCourseToAppCourse(apiCourse: ApiCourseForManage): AppCourseType {
  // CORRECTED: Calculate total lessons by summing up the counts from each module.
  const totalLessons = Array.isArray(apiCourse.modules)
    ? apiCourse.modules.reduce((acc, mod) => acc + (mod?.lessons?.length || 0), 0)
    : (apiCourse._count?.lessons || 0);
  
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description || '',
    category: apiCourse.category || undefined,
    // Ensure a fallback for the instructor object
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
    modules: [], // Full module data is not needed for card views.
    isEnrolled: undefined, // Determined client-side based on context.
    isMandatory: apiCourse.isMandatory || false,
    prerequisite: (apiCourse as any).prerequisite,
    prerequisiteCompleted: (apiCourse as any).prerequisiteCompleted,
    certificateTemplateId: apiCourse.certificateTemplateId
  };
}
