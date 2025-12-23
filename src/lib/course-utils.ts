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
  };
  modules?: { id: string; lessons: { id: string }[] }[];
  status: CourseStatus;
  averageCompletion?: number;
  isMandatory: boolean;
  enrollments?: {
    id: string;
    user: { id: string; name: string | null; email: string; avatar: string | null };
    progress: { progressPercentage: number; completedLessons: any[] } | null;
  }[];
}


export function mapApiCourseToAppCourse(apiCourse: ApiCourseForManage): AppCourseType {
  // CORRECTED: Calculate total lessons by summing up the counts from each module.
  const totalLessons = Array.isArray(apiCourse.modules)
    ? apiCourse.modules.reduce((acc, mod) => acc + (mod?.lessons?.length || 0), 0)
    : 0;

  let computedAverageCompletion = apiCourse.averageCompletion;

  // If average completion is not provided by the API (e.g. standard view), we might calculate it if enrollments are present
  if (computedAverageCompletion === undefined && apiCourse.enrollments && apiCourse.enrollments.length > 0) {
    const validProgress = apiCourse.enrollments
      .map((e) => e.progress?.progressPercentage)
      .filter((p): p is number => p !== null && p !== undefined);

    if (validProgress.length > 0) {
      computedAverageCompletion = validProgress.reduce((acc, curr) => acc + curr, 0) / validProgress.length;
    } else {
      computedAverageCompletion = 0;
    }
  }

  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description || '',
    category: apiCourse.category ?? null,
    // Ensure a fallback for the instructor object
    instructor: apiCourse.instructor ? {
      id: apiCourse.instructor.id,
      name: apiCourse.instructor.name || 'N/A',
      avatar: apiCourse.instructor.avatar ?? null,
    } : {
      id: 'unknown',
      name: 'N/A',
      avatar: null,
    },
    instructorId: apiCourse.instructorId || undefined,
    imageUrl: apiCourse.imageUrl ?? null,
    modulesCount: (Array.isArray(apiCourse.modules) ? apiCourse.modules.length : apiCourse._count?.modules) ?? 0,
    lessonsCount: totalLessons,
    enrollmentsCount: (Array.isArray(apiCourse.enrollments) ? apiCourse.enrollments.length : apiCourse._count?.enrollments) ?? 0,
    averageCompletion: computedAverageCompletion,
    status: apiCourse.status,
    modules: [], // Full module data is not needed for card views.
    isEnrolled: undefined, // Determined client-side based on context.
    isMandatory: apiCourse.isMandatory || false,
    prerequisite: (apiCourse as any).prerequisite,
    prerequisiteCompleted: (apiCourse as any).prerequisiteCompleted,
    certificateTemplateId: apiCourse.certificateTemplateId
  };
}
